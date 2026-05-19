#!/usr/bin/env node

/**
 * Manage ignore rules in yapi/config.json
 * Usage:
 *   node manage_yapi_ignore.js <project_id> list
 *   node manage_yapi_ignore.js <project_id> add-category <cat_id>...
 *   node manage_yapi_ignore.js <project_id> remove-category <cat_id>...
 *   node manage_yapi_ignore.js <project_id> add-api <api_id>...
 *   node manage_yapi_ignore.js <project_id> remove-api <api_id>...
 */

const {
  getProjectIgnore,
  addIgnoreIds,
  removeIgnoreIds,
  normalizeIgnore
} = require('./yapi_ignore');
const { registerProject } = require('./yapi_paths');

const projectId = process.argv[2];
const command = process.argv[3];
const ids = process.argv.slice(4).map((id) => Number(id)).filter((id) => !Number.isNaN(id));

if (!projectId || !command) {
  console.error(JSON.stringify({
    error: 'Missing arguments',
    message: 'Usage: node manage_yapi_ignore.js <project_id> <list|add-category|remove-category|add-api|remove-api> [ids...]'
  }));
  process.exit(1);
}

const cwd = process.cwd();
registerProject(cwd, projectId);

if (command === 'list') {
  console.log(JSON.stringify({
    success: true,
    project_id: String(projectId),
    ignore: getProjectIgnore(cwd, projectId)
  }, null, 2));
  process.exit(0);
}

const needsIds = ['add-category', 'remove-category', 'add-api', 'remove-api'];
if (needsIds.includes(command) && ids.length === 0) {
  console.error(JSON.stringify({
    error: 'Missing IDs',
    message: `Command "${command}" requires at least one numeric ID`
  }));
  process.exit(1);
}

let ignore;
switch (command) {
  case 'add-category':
    ignore = addIgnoreIds(cwd, projectId, 'category', ids);
    break;
  case 'remove-category':
    ignore = removeIgnoreIds(cwd, projectId, 'category', ids);
    break;
  case 'add-api':
    ignore = addIgnoreIds(cwd, projectId, 'api', ids);
    break;
  case 'remove-api':
    ignore = removeIgnoreIds(cwd, projectId, 'api', ids);
    break;
  default:
    console.error(JSON.stringify({
      error: 'Unknown command',
      command,
      message: 'Supported: list, add-category, remove-category, add-api, remove-api'
    }));
    process.exit(1);
}

console.log(JSON.stringify({
  success: true,
  project_id: String(projectId),
  command,
  ids,
  ignore: normalizeIgnore(ignore)
}, null, 2));
