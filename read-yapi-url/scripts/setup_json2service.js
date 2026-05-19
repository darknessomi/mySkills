#!/usr/bin/env node

/**
 * Create or update per-project json2service config under yapi/{project_id}/
 * Usage: node setup_json2service.js <project_id> [host]
 * Returns: JSON with config path and content
 */

const fs = require('fs');
const path = require('path');
const { ensureProjectDirs, setProjectHost } = require('./yapi_paths');

const projectId = process.argv[2];
const host = process.argv[3];

if (!projectId) {
  console.error(JSON.stringify({
    error: 'Missing project ID',
    message: 'Usage: node setup_json2service.js <project_id> [host]'
  }));
  process.exit(1);
}

const cwd = process.cwd();
if (host) {
  setProjectHost(cwd, projectId, host);
}
const paths = ensureProjectDirs(cwd, projectId);

const config = {
  url: 'swagger.json',
  remoteUrl: 'export.json',
  type: 'yapi',
  swaggerParser: {}
};

const configPath = path.join(cwd, paths.json2service_file);
const existed = fs.existsSync(configPath);

fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');

console.log(JSON.stringify({
  success: true,
  project_id: String(projectId),
  yapi_host: host || null,
  config_path: configPath,
  project_dir: paths.project_dir,
  export_file: paths.export_file,
  swagger_file: paths.swagger_file,
  created: !existed,
  updated: existed,
  config
}, null, 2));
