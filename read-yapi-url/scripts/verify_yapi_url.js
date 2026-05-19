#!/usr/bin/env node

/**
 * Verify YApi URL format
 * Usage: node verify_yapi_url.js <url>
 * Returns: 0 if valid, 1 if invalid with error message
 */

const { validateYapiUrl } = require('./yapi_url');

const url = process.argv[2];

if (!url) {
  console.error('Error: URL is required');
  console.error('Usage: node verify_yapi_url.js <url>');
  process.exit(1);
}

const result = validateYapiUrl(url);

if (result.valid) {
  console.log(JSON.stringify({
    valid: true,
    type: result.type,
    url: result.url,
    host: result.host,
    project_id: result.project_id
  }));
  process.exit(0);
}

console.error(JSON.stringify(result));
process.exit(1);
