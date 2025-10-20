#!/usr/bin/env node

/**
 * 🏗️ PROJECT MANIFEST GENERATOR - V5.2
 *
 * Converts human-readable planning files (plan.md, tasks.md) into machine-readable
 * project-manifest.json for agent orchestration.
 *
 * Philosophy:
 * - .md files = "Flight plan" (human guidance)
 * - .json manifest = "Order book" (machine execution)
 *
 * Usage:
 *   node scripts/generate-manifest.js [project-path]
 *
 * Output:
 *   project-manifest.json (source of truth for agents)
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const DEFAULT_PROJECT_PATH = process.cwd();
const MANIFEST_VERSION = '5.2.0';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse plan.md to extract tech stack and file structure
 */
function parsePlan(planContent) {
  const techStack = [];
  const fileStructure = {};

  // Extract tech stack (common patterns)
  const techPatterns = [
    /Next\.js\s+(\d+\.\d+)?/gi,
    /React\s+(\d+)?/gi,
    /TypeScript/gi,
    /Supabase/gi,
    /PostgreSQL/gi,
    /Tailwind\s+CSS/gi,
    /Prisma/gi,
    /tRPC/gi,
    /shadcn\/ui/gi,
    /Playwright/gi,
    /Vitest/gi
  ];

  techPatterns.forEach(pattern => {
    const matches = planContent.match(pattern);
    if (matches) {
      techStack.push(...matches.map(m => m.trim()));
    }
  });

  // Extract file structure (from "File Structure" section)
  const fileStructureMatch = planContent.match(/## File Structure\s+([\s\S]*?)(?=\n##|$)/i);
  if (fileStructureMatch) {
    const structureText = fileStructureMatch[1];
    const lines = structureText.split('\n').filter(l => l.trim());

    lines.forEach(line => {
      const match = line.match(/^[\s-]*([a-zA-Z0-9_-]+\/)/);
      if (match) {
        const dir = match[1];
        if (!fileStructure[dir]) {
          fileStructure[dir] = [];
        }
      }
    });
  }

  return { techStack: [...new Set(techStack)], fileStructure };
}

/**
 * Parse tasks.md to extract task list
 */
function parseTasks(tasksContent) {
  const tasks = [];
  const lines = tasksContent.split('\n');

  let currentPhase = null;
  let taskCounter = 0;

  lines.forEach(line => {
    // Detect phase headers
    const phaseMatch = line.match(/^###?\s+Phase\s+(\d+):\s+(.+)/i);
    if (phaseMatch) {
      currentPhase = {
        number: parseInt(phaseMatch[1]),
        name: phaseMatch[2].trim()
      };
      return;
    }

    // Detect tasks (checkbox format)
    const taskMatch = line.match(/^-\s+\[([ x])\]\s+(T\d{3,4}):?\s*(.+)/i);
    if (taskMatch) {
      const [, checked, id, description] = taskMatch;
      taskCounter++;

      tasks.push({
        id: id.toUpperCase(),
        description: description.trim(),
        status: checked === 'x' ? 'completed' : 'pending',
        phase: currentPhase ? currentPhase.number : null,
        phaseName: currentPhase ? currentPhase.name : null,
        checkpoint: taskCounter % 10 === 0 ? taskCounter : null,
        order: taskCounter
      });
    }
  });

  return tasks;
}

/**
 * Extract project metadata from constitution.md or spec.md
 */
function extractMetadata(constitutionContent, specContent) {
  const metadata = {
    projectName: 'Unknown Project',
    description: '',
    timeline: null,
    principles: []
  };

  // Extract project name from constitution
  const nameMatch = constitutionContent.match(/^#\s+(.+?)(?:\s+Constitution)?$/m);
  if (nameMatch) {
    metadata.projectName = nameMatch[1].trim();
  }

  // Extract description from spec
  const descMatch = specContent.match(/##\s+Project\s+Overview\s+([\s\S]*?)(?=\n##|$)/i);
  if (descMatch) {
    metadata.description = descMatch[1].trim().split('\n')[0].substring(0, 200);
  }

  // Extract timeline
  const timelineMatch = specContent.match(/Timeline:\s*(\d+\s+\w+)/i);
  if (timelineMatch) {
    metadata.timeline = timelineMatch[1];
  }

  return metadata;
}

// ============================================
// MAIN FUNCTION
// ============================================

function generateManifest(projectPath = DEFAULT_PROJECT_PATH) {
  console.log('🏗️  Generating project-manifest.json...\n');

  // Define file paths
  const specsPath = path.join(projectPath, 'specs/001-mvp');
  const memoryPath = path.join(projectPath, '.specify/memory');

  const planPath = path.join(specsPath, 'plan.md');
  const tasksPath = path.join(specsPath, 'tasks.md');
  const constitutionPath = path.join(memoryPath, 'constitution.md');
  const specPath = path.join(specsPath, 'spec.md');

  // Check required files exist
  const requiredFiles = [
    { path: planPath, name: 'plan.md' },
    { path: tasksPath, name: 'tasks.md' }
  ];

  const missingFiles = requiredFiles.filter(f => !fs.existsSync(f.path));
  if (missingFiles.length > 0) {
    console.error('❌ Missing required files:');
    missingFiles.forEach(f => console.error(`   - ${f.name}`));
    process.exit(1);
  }

  // Read files
  const planContent = fs.readFileSync(planPath, 'utf-8');
  const tasksContent = fs.readFileSync(tasksPath, 'utf-8');
  const constitutionContent = fs.existsSync(constitutionPath)
    ? fs.readFileSync(constitutionPath, 'utf-8')
    : '';
  const specContent = fs.existsSync(specPath)
    ? fs.readFileSync(specPath, 'utf-8')
    : '';

  // Parse content
  console.log('📖 Parsing plan.md...');
  const { techStack, fileStructure } = parsePlan(planContent);

  console.log('📋 Parsing tasks.md...');
  const tasks = parseTasks(tasksContent);

  console.log('🔍 Extracting metadata...');
  const metadata = extractMetadata(constitutionContent, specContent);

  // Generate manifest
  const manifest = {
    version: MANIFEST_VERSION,
    generatedAt: new Date().toISOString(),
    projectName: metadata.projectName,
    description: metadata.description,
    timeline: metadata.timeline,
    techStack,
    fileStructure,
    tasks,
    checkpoints: tasks.filter(t => t.checkpoint !== null).map(t => ({
      taskId: t.id,
      taskNumber: t.checkpoint,
      phase: t.phase,
      validationRequired: true
    })),
    statistics: {
      totalTasks: tasks.length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      checkpointCount: tasks.filter(t => t.checkpoint !== null).length,
      phases: [...new Set(tasks.map(t => t.phase).filter(Boolean))].length
    }
  };

  // Write manifest
  const manifestPath = path.join(projectPath, 'project-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log('\n✅ Manifest generated successfully!\n');
  console.log('📊 Statistics:');
  console.log(`   - Total tasks: ${manifest.statistics.totalTasks}`);
  console.log(`   - Completed: ${manifest.statistics.completedTasks}`);
  console.log(`   - Pending: ${manifest.statistics.pendingTasks}`);
  console.log(`   - Checkpoints: ${manifest.statistics.checkpointCount}`);
  console.log(`   - Phases: ${manifest.statistics.phases}`);
  console.log(`   - Tech stack: ${techStack.length} technologies`);
  console.log(`\n📄 Output: ${manifestPath}\n`);

  return manifest;
}

// ============================================
// CLI EXECUTION
// ============================================

if (require.main === module) {
  const projectPath = process.argv[2] || DEFAULT_PROJECT_PATH;

  try {
    generateManifest(projectPath);
  } catch (error) {
    console.error('❌ Error generating manifest:');
    console.error(error.message);
    process.exit(1);
  }
}

module.exports = { generateManifest };
