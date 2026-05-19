#!/usr/bin/env node

/**
 * Get project token from environment variable
 * Usage: node get_project_token.js <project_id> [host]
 * Returns: JSON with token or error
 *
 * When host is omitted, reads yapi_host from yapi/config.json for the project.
 */

const { getProjectSettingUrl } = require('./yapi_url');
const { getProjectHost } = require('./yapi_paths');

const projectId = process.argv[2];
const hostArg = process.argv[3];
const cwd = process.cwd();
const host = hostArg || getProjectHost(cwd, projectId);

if (!projectId) {
  console.error('Error: Project ID is required');
  console.error('Usage: node get_project_token.js <project_id> [host]');
  process.exit(1);
}

if (!host) {
  console.error(JSON.stringify({
    error: 'Missing YApi host',
    project_id: projectId,
    message:
      'No yapi_host in yapi/config.json and no host argument provided.\n' +
      'Pass host explicitly, or sync once with a YApi URL so host is saved to config.'
  }));
  process.exit(1);
}

const envVarName = `YAPI_PROJECT_TOKEN_${projectId}`;
const token = process.env[envVarName];
const settingUrl = getProjectSettingUrl(host, projectId);

if (token) {
  console.log(JSON.stringify({
    project_id: projectId,
    host,
    token: token,
    env_var: envVarName,
    host_source: hostArg ? 'argument' : 'config'
  }));
  process.exit(0);
}

console.error(JSON.stringify({
  error: 'Token not found',
  project_id: projectId,
  host,
  env_var: envVarName,
  message: `Environment variable ${envVarName} is not set.\n` +
           `Please set it in your shell configuration (e.g., .zshrc):\n` +
           `  export ${envVarName}="your_token_here"\n` +
           `\nTo get your token:\n` +
           `  1. Visit ${settingUrl}\n` +
           `  2. Select the "token 配置" tab\n` +
           `  3. Copy the token\n` +
           `  4. Add the export command to your shell configuration\n` +
           `  5. Reload your shell or run: source ~/.zshrc`
}));
process.exit(1);
