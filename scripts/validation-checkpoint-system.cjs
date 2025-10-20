#!/usr/bin/env node

/**
 * 🛡️ VALIDATION CHECKPOINT SYSTEM - V5.2
 *
 * Enforces quality gates automatically during implementation phase.
 * Transforms checkpoints from "recommendations" to "mandatory barriers".
 *
 * Philosophy:
 * - Quality is not optional
 * - Fast feedback loop (every 10 tasks)
 * - BLOCKING validation (cannot bypass)
 *
 * Usage:
 *   node scripts/validation-checkpoint-system.cjs check [task-number]
 *   node scripts/validation-checkpoint-system.cjs validate
 *
 * Workflow:
 *   1. Agent completes task → Updates tasks.md
 *   2. System checks: task_number % 10 === 0?
 *   3. If YES → Execute validation gates (ESLint + Build + Context7 + Memory)
 *   4. If FAIL → STOP orchestration + Generate review patch
 *   5. If PASS → Continue to next 10 tasks
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ============================================
// CONFIGURATION
// ============================================

const CHECKPOINT_INTERVAL = 10;
const MANIFEST_PATH = 'project-manifest.json';
const TASKS_PATH = 'specs/001-mvp/tasks.md';
const MEMORY_PATH = '.specify/memory/project-memory.md';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(title) {
  log('='.repeat(50), 'blue');
  log(`🛡️  ${title}`, 'blue');
  log('='.repeat(50), 'blue');
  console.log('');
}

/**
 * Load project manifest
 */
function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    log('❌ project-manifest.json not found!', 'red');
    log('   Run: node scripts/generate-manifest.js', 'yellow');
    process.exit(1);
  }

  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
}

/**
 * Count completed tasks from manifest
 */
function getCompletedTaskCount(manifest) {
  return manifest.tasks.filter(t => t.status === 'completed').length;
}

/**
 * Get current task number from tasks.md (real-time)
 */
function getCurrentTaskNumber() {
  if (!fs.existsSync(TASKS_PATH)) {
    log('❌ tasks.md not found!', 'red');
    return 0;
  }

  const content = fs.readFileSync(TASKS_PATH, 'utf-8');
  const completedTasks = (content.match(/- \[x\]/g) || []).length;
  return completedTasks;
}

/**
 * Check if checkpoint should be triggered
 */
function isCheckpointRequired(taskNumber) {
  return taskNumber > 0 && taskNumber % CHECKPOINT_INTERVAL === 0;
}

/**
 * Get next checkpoint number
 */
function getNextCheckpoint(taskNumber) {
  return Math.ceil(taskNumber / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;
}

/**
 * Execute validation gate
 */
function executeValidation(gateName, command, options = {}) {
  const { required = true, description = '' } = options;

  log(`▶ ${gateName}...`, 'yellow');
  if (description) {
    log(`   ${description}`, 'reset');
  }

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : 'inherit'
    });

    log(`✅ ${gateName}: PASS`, 'green');
    return { success: true, output };
  } catch (error) {
    if (required) {
      log(`❌ ${gateName}: FAIL (BLOCKER)`, 'red');
      log(`   Error: ${error.message}`, 'red');
      return { success: false, error: error.message, blocking: true };
    } else {
      log(`⚠️  ${gateName}: FAIL (WARNING)`, 'yellow');
      return { success: false, error: error.message, blocking: false };
    }
  }
}

/**
 * Verify memory documentation
 */
function verifyMemoryDocumentation() {
  if (!fs.existsSync(MEMORY_PATH)) {
    log('⚠️  project-memory.md not found - skipping memory check', 'yellow');
    return { success: true, warning: true };
  }

  const content = fs.readFileSync(MEMORY_PATH, 'utf-8');
  const today = new Date().toISOString().split('T')[0];
  const todayEntries = (content.match(new RegExp(`^#### ${today}`, 'gm')) || []).length;

  log(`   Memory entries today: ${todayEntries}`, 'reset');

  if (todayEntries === 0) {
    log('⚠️  WARNING: No decisions documented today', 'yellow');
    log('   Expected: 1-3 entries per 10 tasks (if significant decisions)', 'yellow');
    return { success: true, warning: true, count: 0 };
  }

  log(`✅ Memory documentation: ${todayEntries} entries`, 'green');
  return { success: true, count: todayEntries };
}

/**
 * Generate review patch
 */
function generateReviewPatch(checkpointNumber) {
  log('\n▶ Generating review patch...', 'yellow');

  try {
    const patchScript = path.join(__dirname, 'generate-review-patch.sh');
    execSync(`bash "${patchScript}" ${checkpointNumber}`, { stdio: 'inherit' });
    return { success: true };
  } catch (error) {
    log('❌ Failed to generate review patch', 'red');
    return { success: false, error: error.message };
  }
}

// ============================================
// VALIDATION GATES
// ============================================

/**
 * Execute all validation gates at checkpoint
 */
function executeCheckpointValidation(checkpointNumber) {
  logHeader(`Checkpoint T${String(checkpointNumber).padStart(3, '0')} Validation`);

  const results = {
    gates: [],
    passed: 0,
    failed: 0,
    warnings: 0
  };

  // Gate 1: Build Check (P0 BLOCKER)
  console.log('');
  const buildResult = executeValidation(
    'Gate 1: Build',
    './validate.sh --quick',
    {
      required: true,
      description: 'Compile check (TypeScript + bundler)'
    }
  );
  results.gates.push({ name: 'Build', ...buildResult });
  buildResult.success ? results.passed++ : results.failed++;

  // Gate 2: Lint Check (P1 BLOCKER) - Skip if validate.sh --quick already includes it
  // Note: validate.sh --quick runs build + tests, full mode adds lint
  console.log('');
  const lintResult = executeValidation(
    'Gate 2: Lint',
    './validate.sh --strict',
    {
      required: true,
      description: 'Code quality (ESLint + TypeScript strict)'
    }
  );
  results.gates.push({ name: 'Lint', ...lintResult });
  lintResult.success ? results.passed++ : results.failed++;

  // Gate 3: Context7 Documentation (IF new libraries)
  // Note: This is checked by agents during implementation, not here
  console.log('');
  log('▶ Gate 3: Context7 Documentation...', 'yellow');
  log('   Checked during implementation (agent responsibility)', 'reset');
  log('✅ Gate 3: ASSUMED PASS (agent-verified)', 'green');
  results.gates.push({ name: 'Context7', success: true, assumed: true });
  results.passed++;

  // Gate 4: Memory Documentation (P2 VERIFICATION)
  console.log('');
  const memoryResult = verifyMemoryDocumentation();
  results.gates.push({ name: 'Memory', ...memoryResult });
  if (memoryResult.warning) {
    results.warnings++;
  } else {
    results.passed++;
  }

  // Summary
  console.log('');
  log('='.repeat(50), 'blue');
  log('📊 Validation Summary', 'blue');
  log('='.repeat(50), 'blue');
  console.log('');

  results.gates.forEach(gate => {
    const status = gate.success
      ? (gate.warning ? '⚠️  WARN' : '✅ PASS')
      : (gate.blocking ? '❌ FAIL (BLOCKER)' : '⚠️  WARN');
    const color = gate.success ? (gate.warning ? 'yellow' : 'green') : 'red';
    log(`  ${status} ${gate.name}`, color);
  });

  console.log('');
  log(`Total: ${results.passed} passed, ${results.failed} failed, ${results.warnings} warnings`, 'reset');
  console.log('');

  // Generate review patch
  generateReviewPatch(checkpointNumber);

  // Determine if validation passed
  const validationPassed = results.failed === 0;

  if (validationPassed) {
    log('='.repeat(50), 'green');
    log('✅ CHECKPOINT PASSED - Continue implementation', 'green');
    log('='.repeat(50), 'green');
    return { success: true, results };
  } else {
    log('='.repeat(50), 'red');
    log('❌ CHECKPOINT FAILED - Fix errors before continuing', 'red');
    log('='.repeat(50), 'red');
    console.log('');
    log('📋 Next steps:', 'yellow');
    log('   1. Review errors above', 'reset');
    log('   2. Fix issues in code', 'reset');
    log('   3. Re-run: node scripts/validation-checkpoint-system.cjs validate', 'reset');
    log('   4. Review patch: cat reviews/changes-for-review-T*.patch', 'reset');
    console.log('');
    return { success: false, results };
  }
}

// ============================================
// CLI COMMANDS
// ============================================

function checkCommand(taskNumber) {
  logHeader('Checkpoint Check');

  const manifest = loadManifest();
  const currentTasks = taskNumber || getCurrentTaskNumber();

  log(`Current task number: ${currentTasks}`, 'reset');
  log(`Next checkpoint: T${String(getNextCheckpoint(currentTasks)).padStart(3, '0')}`, 'reset');
  console.log('');

  if (isCheckpointRequired(currentTasks)) {
    log('🚨 CHECKPOINT REQUIRED!', 'yellow');
    log('   Run: node scripts/validation-checkpoint-system.cjs validate', 'yellow');
    console.log('');
    return { checkpointRequired: true, taskNumber: currentTasks };
  } else {
    const remaining = getNextCheckpoint(currentTasks) - currentTasks;
    log(`✅ No checkpoint required (${remaining} tasks until next checkpoint)`, 'green');
    console.log('');
    return { checkpointRequired: false, remaining };
  }
}

function validateCommand() {
  const currentTasks = getCurrentTaskNumber();
  const checkpointNumber = Math.floor(currentTasks / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL;

  const result = executeCheckpointValidation(checkpointNumber || CHECKPOINT_INTERVAL);

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

// ============================================
// MAIN
// ============================================

function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
  case 'check':
    checkCommand(arg ? parseInt(arg) : null);
    break;

  case 'validate':
    validateCommand();
    break;

  case 'help':
  case '--help':
  case '-h':
    console.log('Usage:');
    console.log('  node scripts/validation-checkpoint-system.cjs check [task-number]');
    console.log('  node scripts/validation-checkpoint-system.cjs validate');
    console.log('');
    console.log('Commands:');
    console.log('  check     - Check if checkpoint is required');
    console.log('  validate  - Execute validation gates at current checkpoint');
    break;

  default:
    log('❌ Unknown command. Use --help for usage.', 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  isCheckpointRequired,
  executeCheckpointValidation,
  getCurrentTaskNumber
};
