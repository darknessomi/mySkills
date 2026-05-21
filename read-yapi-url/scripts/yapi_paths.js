#!/usr/bin/env node

/**
 * Resolve per-YApi-project file paths (supports multiple YApi projects in one repo).
 * Usage: node yapi_paths.js <project_id>
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = 'yapi/config.json';
const DEFAULT_DATA_DIR = 'yapi';

function readConfig(cwd) {
  const configPath = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return { version: 1, data_dir: DEFAULT_DATA_DIR, projects: [] };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return {
      version: raw.version || 1,
      data_dir: raw.data_dir || DEFAULT_DATA_DIR,
      projects: Array.isArray(raw.projects) ? raw.projects : []
    };
  } catch {
    return { version: 1, data_dir: DEFAULT_DATA_DIR, projects: [] };
  }
}

function writeConfig(cwd, config) {
  const configPath = path.join(cwd, CONFIG_FILE);
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
  return configPath;
}

function getProjectEntry(cwd, projectId) {
  const config = readConfig(cwd);
  const id = String(projectId);
  return config.projects.find((p) => String(p.project_id) === id) || null;
}

function getProjectHost(cwd, projectId) {
  const entry = getProjectEntry(cwd, projectId);
  return entry && entry.yapi_host ? entry.yapi_host : null;
}

function setProjectHost(cwd, projectId, host) {
  if (!host) {
    throw new Error('yapi_host is required');
  }

  const config = readConfig(cwd);
  const id = String(projectId);
  let entry = config.projects.find((p) => String(p.project_id) === id);

  if (!entry) {
    entry = { project_id: id };
    config.projects.push(entry);
    config.projects.sort((a, b) => String(a.project_id).localeCompare(String(b.project_id)));
  }

  entry.yapi_host = host;
  writeConfig(cwd, config);
  return host;
}

function registerProject(cwd, projectId, options = {}) {
  const config = readConfig(cwd);
  const id = String(projectId);
  let entry = config.projects.find((p) => String(p.project_id) === id);

  if (!entry) {
    entry = { project_id: id };
    config.projects.push(entry);
    config.projects.sort((a, b) => String(a.project_id).localeCompare(String(b.project_id)));
  }

  if (options.host) {
    entry.yapi_host = options.host;
  }

  writeConfig(cwd, config);
  return config;
}

function getProjectPaths(cwd, projectId) {
  const id = String(projectId);
  const config = readConfig(cwd);
  const dataDir = config.data_dir || DEFAULT_DATA_DIR;
  const projectDir = path.join(dataDir, id);

  const paths = {
    project_id: id,
    data_dir: dataDir,
    project_dir: projectDir,
    export_file: path.join(projectDir, 'export.json'),
    config_file: CONFIG_FILE
  };

  const legacyCandidates = [
    path.join(dataDir, `export-${id}.json`),
    path.join(cwd, `yapi-export-${id}.json`)
  ];

  paths.export_candidates = [paths.export_file, ...legacyCandidates];
  paths.resolved_export_file = paths.export_candidates.find((file) => fs.existsSync(path.join(cwd, file))) || paths.export_file;

  return paths;
}

function ensureProjectDirs(cwd, projectId) {
  const paths = getProjectPaths(cwd, projectId);
  const absProjectDir = path.join(cwd, paths.project_dir);
  if (!fs.existsSync(absProjectDir)) {
    fs.mkdirSync(absProjectDir, { recursive: true });
  }
  registerProject(cwd, projectId);
  return paths;
}

if (require.main === module) {
  const projectId = process.argv[2];
  if (!projectId) {
    console.error(JSON.stringify({
      error: 'Missing project ID',
      message: 'Usage: node yapi_paths.js <project_id>'
    }));
    process.exit(1);
  }

  const cwd = process.cwd();
  const paths = getProjectPaths(cwd, projectId);
  console.log(JSON.stringify({
    ...paths,
    yapi_host: getProjectHost(cwd, projectId),
    export_path: path.join(cwd, paths.resolved_export_file),
    project_dir_abs: path.join(cwd, paths.project_dir),
    registered_projects: readConfig(cwd).projects.map((p) => p.project_id)
  }, null, 2));
}

module.exports = {
  CONFIG_FILE,
  readConfig,
  writeConfig,
  getProjectEntry,
  getProjectHost,
  setProjectHost,
  registerProject,
  getProjectPaths,
  ensureProjectDirs
};
