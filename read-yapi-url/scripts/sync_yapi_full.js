#!/usr/bin/env node

/**
 * Fetch full YApi export to project directory (per YApi project under yapi/{id}/)
 * Usage: node sync_yapi_full.js <project_id> <token> [host] [output_file]
 * Returns: JSON with sync result
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { ensureProjectDirs, readConfig, getProjectHost, setProjectHost } = require('./yapi_paths');
const { getProjectIgnore, applyIgnoreRules, getIgnoreStats } = require('./yapi_ignore');

const projectId = process.argv[2];
const token = process.argv[3];

if (!projectId || !token) {
  console.error(JSON.stringify({
    error: 'Missing arguments',
    message: 'Usage: node sync_yapi_full.js <project_id> <token> [host] [output_file]'
  }));
  process.exit(1);
}

const cwd = process.cwd();
const host = process.argv[4] || getProjectHost(cwd, projectId);
const outputFile = process.argv[5];

if (!host) {
  console.error(JSON.stringify({
    error: 'Missing YApi host',
    project_id: projectId,
    message:
      'No yapi_host in yapi/config.json and no host argument provided.\n' +
      'Provide a YApi URL first (host is saved to config), pass host explicitly, or set projects[].yapi_host in yapi/config.json.'
  }));
  process.exit(1);
}
setProjectHost(cwd, projectId, host);

const paths = ensureProjectDirs(cwd, projectId);
const resolvedOutputFile = outputFile || paths.export_file;
const outputPath = path.resolve(cwd, resolvedOutputFile);
const projectDirAbs = path.dirname(outputPath);
const swaggerPath = path.join(projectDirAbs, 'swagger.json');
const json2servicePath = path.join(projectDirAbs, 'json2service.json');

function fetchExport() {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://${host}/api/open/plugin/export-full?type=json&pid=${projectId}&status=all&token=${token}`;

    https.get(apiUrl, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);

          if (parsed.errcode && parsed.errcode !== 0) {
            reject(new Error(parsed.errmsg || `YApi export failed with errcode ${parsed.errcode}`));
            return;
          }

          const categories = Array.isArray(parsed) ? parsed : parsed.data;
          if (!Array.isArray(categories)) {
            reject(new Error('Unexpected YApi export format: expected category array'));
            return;
          }

          resolve(categories);
        } catch (e) {
          reject(new Error(`Failed to parse YApi export response: ${e.message}`));
        }
      });
    }).on('error', (err) => {
      reject(new Error(`Network error: ${err.message}`));
    });
  });
}

function runSm2tsservice() {
  if (!fs.existsSync(json2servicePath)) {
    return { ran: false, reason: 'json2service.json not found in project dir' };
  }

  try {
    execSync('sm2tsservice --quiet', {
      cwd: projectDirAbs,
      stdio: 'pipe',
      env: { ...process.env, PATH: process.env.PATH }
    });
    return { ran: true, cwd: projectDirAbs };
  } catch (e) {
    const stderr = e.stderr ? e.stderr.toString() : e.message;
    const reason = stderr.trim() || 'sm2tsservice failed';
    if (/not found|ENOENT/i.test(reason)) {
      return {
        ran: false,
        reason: 'sm2tsservice not found globally. Run: npm i -g sm2tsservice'
      };
    }
    return { ran: false, reason };
  }
}

(async () => {
  try {
    const rawCategories = await fetchExport();
    const ignore = getProjectIgnore(cwd, projectId);
    const categories = applyIgnoreRules(rawCategories, ignore);
    const ignoreStats = getIgnoreStats(rawCategories, categories, ignore);

    if (!fs.existsSync(projectDirAbs)) {
      fs.mkdirSync(projectDirAbs, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(categories, null, 2), 'utf8');

    const sm2Result = runSm2tsservice();
    const config = readConfig(cwd);

    console.log(JSON.stringify({
      success: true,
      project_id: projectId,
      host,
      project_dir: paths.project_dir,
      export_file: resolvedOutputFile,
      export_path: outputPath,
      swagger_file: path.relative(cwd, swaggerPath),
      json2service_file: path.relative(cwd, json2servicePath),
      interface_count: ignoreStats.interface_count,
      category_count: ignoreStats.category_count,
      ignore: ignoreStats,
      sm2tsservice: sm2Result,
      swagger_exists: fs.existsSync(swaggerPath),
      registered_projects: config.projects.map((p) => p.project_id)
    }, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(JSON.stringify({
      error: 'Sync failed',
      project_id: projectId,
      host,
      message: e.message
    }));
    process.exit(1);
  }
})();
