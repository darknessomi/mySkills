#!/usr/bin/env node

/**
 * Check sm2tsservice is installed globally
 * Usage: node ensure_sm2tsservice.js
 * Returns: JSON with install status
 */

const { execSync } = require('child_process');

function getGlobalVersion() {
  try {
    const output = execSync('sm2tsservice --version', {
      stdio: 'pipe',
      encoding: 'utf8'
    }).trim();
    return output || null;
  } catch {
    return null;
  }
}

const version = getGlobalVersion();

if (version) {
  console.log(JSON.stringify({
    success: true,
    installed: true,
    scope: 'global',
    version
  }, null, 2));
  process.exit(0);
}

console.error(JSON.stringify({
  error: 'sm2tsservice not found',
  message: 'sm2tsservice must be installed globally before using this skill.',
  install_command: 'npm i -g sm2tsservice',
  note: 'Requires sm2tsservice 3.2.0 or above for json2service.json with local remoteUrl support.'
}));
process.exit(1);
