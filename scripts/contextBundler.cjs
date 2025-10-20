#!/usr/bin/env node

/**
 * Context Bundler - Automatic Session Logging for Context Bundles
 *
 * Purpose: Tracks agent tool calls (Read, Edit, Bash, etc.) for automatic bundle generation
 * Pattern: Dev Dan - Context Engineering ADV2 (Context Bundles)
 *
 * Usage:
 *   const bundler = require('./scripts/contextBundler.cjs');
 *   bundler.logRead('src/lib/auth.ts', 1, 250, 'Understanding auth flow');
 *   bundler.logEdit('src/lib/auth.ts', 'Added JWT validation');
 *   bundler.logBash('pnpm run build', 0, 'BUILD SUCCESSFUL');
 *   bundler.generateBundle('backend-specialist-auth');
 */

const fs = require('fs');
const path = require('path');

// Bundle directory
const BUNDLE_DIR = '.agents/context-bundles';
const SESSION_LOG = '.agents/session.log';

// Ensure directories exist
function ensureDirectories() {
  if (!fs.existsSync('.agents')) {
    fs.mkdirSync('.agents', { recursive: true });
  }
  if (!fs.existsSync(BUNDLE_DIR)) {
    fs.mkdirSync(BUNDLE_DIR, { recursive: true });
  }
}

// Initialize session
function initSession(agentType = 'main-session') {
  ensureDirectories();

  const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionData = {
    id: sessionId,
    agentType,
    startTime: new Date().toISOString(),
    filesRead: [],
    editsMode: [],
    commandsExecuted: [],
    mcpCalls: [],
    decisions: [],
    checkpoints: []
  };

  fs.writeFileSync(SESSION_LOG, JSON.stringify(sessionData, null, 2));

  return sessionId;
}

// Load current session
function loadSession() {
  if (!fs.existsSync(SESSION_LOG)) {
    return initSession();
  }

  try {
    const data = fs.readFileSync(SESSION_LOG, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to load session:', err.message);
    return initSession();
  }
}

// Save session
function saveSession(session) {
  fs.writeFileSync(SESSION_LOG, JSON.stringify(session, null, 2));
}

// Log file read
function logRead(filePath, startLine = null, endLine = null, purpose = '') {
  const session = loadSession();

  const entry = {
    timestamp: new Date().toISOString(),
    type: 'read',
    file: filePath,
    lines: startLine && endLine ? `${startLine}-${endLine}` : 'full',
    purpose
  };

  session.filesRead.push(entry);
  saveSession(session);
}

// Log file edit
function logEdit(filePath, description = '', linesChanged = 0) {
  const session = loadSession();

  const entry = {
    timestamp: new Date().toISOString(),
    type: 'edit',
    file: filePath,
    description,
    linesChanged
  };

  session.editsMode.push(entry);
  saveSession(session);
}

// Log bash command
function logBash(command, exitCode = 0, output = '') {
  const session = loadSession();

  const entry = {
    timestamp: new Date().toISOString(),
    type: 'bash',
    command,
    exitCode,
    output: output.substring(0, 200) // Truncate long outputs
  };

  session.commandsExecuted.push(entry);
  saveSession(session);
}

// Log MCP tool call
function logMCP(tool, params = {}, result = '') {
  const session = loadSession();

  const entry = {
    timestamp: new Date().toISOString(),
    type: 'mcp',
    tool,
    params,
    result: result.substring(0, 200)
  };

  session.mcpCalls.push(entry);
  saveSession(session);
}

// Log decision
function logDecision(title, choice, reason, tradeoffs = {}, alternatives = []) {
  const session = loadSession();

  const entry = {
    timestamp: new Date().toISOString(),
    type: 'decision',
    title,
    choice,
    reason,
    tradeoffs,
    alternatives
  };

  session.decisions.push(entry);
  saveSession(session);
}

// Log checkpoint
function logCheckpoint(gate, status, details = '') {
  const session = loadSession();

  const entry = {
    timestamp: new Date().toISOString(),
    type: 'checkpoint',
    gate,
    status,
    details
  };

  session.checkpoints.push(entry);
  saveSession(session);
}

// Generate bundle from session log
function generateBundle(bundleName = null) {
  const session = loadSession();

  if (!bundleName) {
    const timestamp = new Date().toISOString().split('T')[0] + '_' +
                      new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
    bundleName = `${timestamp}_${session.agentType}`;
  }

  const bundlePath = path.join(BUNDLE_DIR, `${bundleName}.md`);

  // Get git info
  let gitBranch = 'unknown';
  let gitCommit = 'unknown';

  try {
    gitBranch = require('child_process')
      .execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' })
      .trim();
    gitCommit = require('child_process')
      .execSync('git rev-parse --short HEAD', { encoding: 'utf-8' })
      .trim();
  } catch (err) {
    // Git not available, use defaults
  }

  // Calculate session duration
  const startTime = new Date(session.startTime);
  const endTime = new Date();
  const durationMs = endTime - startTime;
  const durationMin = Math.floor(durationMs / 60000);
  const durationHours = Math.floor(durationMin / 60);
  const durationMinRemainder = durationMin % 60;
  const durationStr = `${durationHours}h ${durationMinRemainder}m`;

  // Build bundle content
  let content = `# Context Bundle: ${bundleName}\n\n`;
  content += `**Created:** ${new Date().toISOString()}\n`;
  content += `**Agent:** ${session.agentType}\n`;
  content += `**Branch:** ${gitBranch}\n`;
  content += `**Commit:** ${gitCommit}\n`;
  content += `**Duration:** ${session.startTime.split('T')[1].substring(0, 8)} → ${endTime.toTimeString().split(' ')[0]} (${durationStr})\n\n`;
  content += `---\n\n`;

  // FILES READ section
  content += `## 📂 FILES READ (Chronological)\n\n`;
  if (session.filesRead.length === 0) {
    content += `- (none logged)\n\n`;
  } else {
    session.filesRead.forEach(entry => {
      const time = new Date(entry.timestamp).toTimeString().split(' ')[0];
      const lineInfo = entry.lines === 'full' ? '' : `:${entry.lines}`;
      const purpose = entry.purpose ? ` - ${entry.purpose}` : '';
      content += `- \`${entry.file}${lineInfo}\` - [${time}]${purpose}\n`;
    });
    content += `\n**Total Files Read:** ${session.filesRead.length}\n\n`;
  }

  // EDITS MADE section
  content += `## ✏️ EDITS MADE (Chronological)\n\n`;
  if (session.editsMode.length === 0) {
    content += `- (none logged)\n\n`;
  } else {
    session.editsMode.forEach(entry => {
      const time = new Date(entry.timestamp).toTimeString().split(' ')[0];
      const lines = entry.linesChanged > 0 ? ` (+${entry.linesChanged} lines)` : '';
      content += `### [${time}] - \`${entry.file}\`${lines}\n`;
      content += `**Change:** ${entry.description}\n\n`;
    });
    content += `**Total Edits:** ${session.editsMode.length} files\n\n`;
  }

  // COMMANDS EXECUTED section
  content += `## 🔧 COMMANDS EXECUTED (Chronological)\n\n`;
  if (session.commandsExecuted.length === 0) {
    content += `- (none logged)\n\n`;
  } else {
    session.commandsExecuted.forEach(entry => {
      const time = new Date(entry.timestamp).toTimeString().split(' ')[0];
      const status = entry.exitCode === 0 ? '✅' : '❌';
      const output = entry.output ? ` - ${entry.output}` : '';
      content += `- \`[${time}]\` - \`${entry.command}\` - ${status}${output}\n`;
    });
    content += `\n**Total Commands:** ${session.commandsExecuted.length}\n\n`;
  }

  // MCP TOOLS section
  content += `## 🔗 MCP TOOLS USED\n\n`;
  if (session.mcpCalls.length === 0) {
    content += `- (none logged)\n\n`;
  } else {
    session.mcpCalls.forEach(entry => {
      const time = new Date(entry.timestamp).toTimeString().split(' ')[0];
      const params = JSON.stringify(entry.params).substring(0, 50);
      content += `- \`[${time}]\` - \`${entry.tool}\` - ${params}\n`;
    });
    content += `\n`;
  }

  // KEY DECISIONS section
  content += `## 🎯 KEY DECISIONS\n\n`;
  if (session.decisions.length === 0) {
    content += `- (none logged)\n\n`;
  } else {
    session.decisions.forEach((entry, idx) => {
      content += `### Decision ${idx + 1}: ${entry.title}\n\n`;
      content += `**Choice:** ${entry.choice}\n\n`;
      content += `**Reason:** ${entry.reason}\n\n`;
      if (entry.tradeoffs.pros || entry.tradeoffs.cons) {
        content += `**Trade-offs:**\n`;
        if (entry.tradeoffs.pros) content += `- ✅ **Pros:** ${entry.tradeoffs.pros}\n`;
        if (entry.tradeoffs.cons) content += `- ❌ **Cons:** ${entry.tradeoffs.cons}\n`;
        content += `\n`;
      }
      if (entry.alternatives.length > 0) {
        content += `**Alternatives Considered:**\n`;
        entry.alternatives.forEach(alt => {
          content += `- ${alt}\n`;
        });
        content += `\n`;
      }
    });
  }

  // CHECKPOINTS section
  content += `## ✅ CHECKPOINTS PASSED\n\n`;
  if (session.checkpoints.length === 0) {
    content += `- (none logged)\n\n`;
  } else {
    session.checkpoints.forEach(entry => {
      const statusIcon = entry.status === 'pass' ? '✅' : entry.status === 'fail' ? '❌' : '⏳';
      const details = entry.details ? ` - ${entry.details}` : '';
      content += `- ${statusIcon} ${entry.gate}${details}\n`;
    });
    content += `\n`;
  }

  // SESSION METRICS section
  content += `## 📊 SESSION METRICS\n\n`;
  content += `- **Files Read:** ${session.filesRead.length}\n`;
  content += `- **Files Modified:** ${session.editsMode.length}\n`;
  content += `- **Commands Executed:** ${session.commandsExecuted.length}\n`;
  content += `- **Checkpoints Passed:** ${session.checkpoints.filter(c => c.status === 'pass').length} / ${session.checkpoints.length}\n`;
  content += `- **MCP Calls:** ${session.mcpCalls.length}\n`;
  content += `- **Duration:** ${durationStr}\n\n`;

  // RECOVERY section
  content += `## 🔄 RECOVERY INSTRUCTIONS\n\n`;
  content += `**To restore this session context:**\n\n`;
  content += `\`\`\`bash\n`;
  content += `/loadbundle ${bundlePath}\n`;
  content += `\`\`\`\n\n`;
  content += `**What will be recovered:**\n`;
  content += `- 60-70% of technical understanding\n`;
  content += `- Files read/modified (paths, not full contents)\n`;
  content += `- Commands executed (reproducible steps)\n`;
  content += `- Decisions made (WHY documented)\n\n`;
  content += `---\n\n`;
  content += `**Bundle Version:** 1.0\n`;
  content += `**Created by:** Context Bundler (Archon Orchestrator V6.1.3)\n`;
  content += `**Pattern Source:** Dev Dan - Context Engineering ADV2\n`;

  // Write bundle file
  fs.writeFileSync(bundlePath, content);

  return {
    path: bundlePath,
    size: fs.statSync(bundlePath).size,
    filesRead: session.filesRead.length,
    edits: session.editsMode.length,
    commands: session.commandsExecuted.length,
    decisions: session.decisions.length,
    checkpoints: session.checkpoints.length,
    duration: durationStr
  };
}

// Get session summary
function getSummary() {
  const session = loadSession();

  return {
    agentType: session.agentType,
    startTime: session.startTime,
    filesRead: session.filesRead.length,
    edits: session.editsMode.length,
    commands: session.commandsExecuted.length,
    mcpCalls: session.mcpCalls.length,
    decisions: session.decisions.length,
    checkpoints: session.checkpoints.length
  };
}

// CLI mode
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init') {
    const agentType = args[1] || 'main-session';
    const sessionId = initSession(agentType);
    console.log(`✅ Session initialized: ${sessionId}`);
    console.log(`Agent: ${agentType}`);
  } else if (command === 'generate') {
    const bundleName = args[1];
    const result = generateBundle(bundleName);
    console.log(`✅ Bundle generated: ${result.path}`);
    console.log(`Size: ${(result.size / 1024).toFixed(2)} KB`);
    console.log(`Files Read: ${result.filesRead}`);
    console.log(`Edits: ${result.edits}`);
    console.log(`Commands: ${result.commands}`);
    console.log(`Decisions: ${result.decisions}`);
    console.log(`Duration: ${result.duration}`);
  } else if (command === 'summary') {
    const summary = getSummary();
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log('Usage:');
    console.log('  node contextBundler.cjs init [agent-type]');
    console.log('  node contextBundler.cjs generate [bundle-name]');
    console.log('  node contextBundler.cjs summary');
  }
}

// Export functions
module.exports = {
  initSession,
  loadSession,
  saveSession,
  logRead,
  logEdit,
  logBash,
  logMCP,
  logDecision,
  logCheckpoint,
  generateBundle,
  getSummary
};
