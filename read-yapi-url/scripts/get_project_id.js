#!/usr/bin/env node

/**
 * Extract project ID and host from YApi URL
 * Usage: node get_project_id.js <url>
 * Returns: JSON with project_id and host
 */

const { parseYapiUrl } = require('./yapi_url');

const url = process.argv[2];

if (!url) {
  console.error('Error: URL is required');
  console.error('Usage: node get_project_id.js <url>');
  process.exit(1);
}

const parsed = parseYapiUrl(url);

if (parsed) {
  console.log(JSON.stringify({
    project_id: parsed.project_id,
    host: parsed.host,
    url: parsed.url
  }));
  process.exit(0);
}

console.error(JSON.stringify({
  error: 'Could not extract project ID from URL',
  url: url
}));
process.exit(1);
