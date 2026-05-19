#!/usr/bin/env node

/**
 * Extract single API from local YApi export file
 * Usage: node extract_yapi_api.js <url> [export_file]
 * Returns: YApi-compatible API response JSON
 */

const { getProjectPaths } = require('./yapi_paths');
const { getProjectIgnore, isApiIgnored } = require('./yapi_ignore');
const {
  findApiById,
  resolveExportPath,
  getProjectIdFromUrl,
  loadCategoriesForProject
} = require('./yapi_export_utils');

const url = process.argv[2];
let exportFile = process.argv[3];

if (!url) {
  console.error(JSON.stringify({
    error: 'Missing arguments',
    message: 'Usage: node extract_yapi_api.js <url> [export_file]'
  }));
  process.exit(1);
}

const match = url.match(/\/interface\/api\/(\d+)$/);
if (!match || !match[1]) {
  console.error(JSON.stringify({
    error: 'Invalid API URL format',
    url
  }));
  process.exit(1);
}

const apiId = Number(match[1]);
const projectId = getProjectIdFromUrl(url);
const cwd = process.cwd();

if (!exportFile && projectId) {
  const paths = getProjectPaths(cwd, projectId);
  exportFile = paths.resolved_export_file;
}

if (!exportFile) {
  console.error(JSON.stringify({
    error: 'Missing export file',
    message: 'Provide export_file or use a URL containing project ID'
  }));
  process.exit(1);
}

const ignore = projectId ? getProjectIgnore(cwd, projectId) : { categories: [], apis: [] };

let categories;
try {
  const exportPath = resolveExportPath(cwd, exportFile);
  const loaded = loadCategoriesForProject(cwd, exportPath, projectId);
  categories = loaded.categories;
} catch (e) {
  console.error(JSON.stringify({
    error: e.message.includes('not found') ? 'Export file not found' : 'Failed to read export file',
    api_id: apiId,
    project_id: projectId,
    export_file: exportFile,
    message: e.message.includes('not found')
      ? 'Run sync_yapi_full.js first to fetch YApi data into the project'
      : e.message
  }));
  process.exit(1);
}

const api = findApiById(categories, apiId);
if (!api) {
  const exportPath = resolveExportPath(cwd, exportFile);
  const raw = loadCategoriesForProject(cwd, exportPath, null).categories;
  const rawApi = findApiById(raw, apiId);
  if (rawApi && isApiIgnored(rawApi, ignore)) {
    console.error(JSON.stringify({
      error: 'API ignored',
      api_id: apiId,
      project_id: projectId,
      catid: rawApi.catid,
      ignore,
      message: `Interface ${apiId} is listed in yapi/config.json ignore rules`
    }));
    process.exit(1);
  }

  console.error(JSON.stringify({
    error: 'API not found',
    api_id: apiId,
    project_id: projectId,
    export_file: exportFile,
    message: `Interface ${apiId} not found in local export. Re-run sync_yapi_full.js to refresh.`
  }));
  process.exit(1);
}

console.log(JSON.stringify({
  errcode: 0,
  errmsg: '成功！',
  data: api
}, null, 2));
