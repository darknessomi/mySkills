#!/usr/bin/env node

/**
 * Fetch category API list from YApi (legacy direct-fetch)
 * Usage: node read_yapi_cate_url.js <url> <token>
 * Returns: Raw JSON response from YApi API
 */

const https = require('https');
const { parseYapiUrl } = require('./yapi_url');

const url = process.argv[2];
const token = process.argv[3];

if (!url || !token) {
  console.error('Error: URL and token are required');
  console.error('Usage: node read_yapi_cate_url.js <url> <token>');
  process.exit(1);
}

const parsed = parseYapiUrl(url);
if (!parsed || parsed.type !== 'category') {
  console.error(JSON.stringify({
    error: 'Invalid category URL format',
    url: url
  }));
  process.exit(1);
}

const apiUrl = `https://${parsed.host}/api/interface/list_cat?token=${token}&catid=${parsed.cat_id}`;

https.get(apiUrl, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.errcode !== 0) {
        console.error(JSON.stringify({
          error: 'YApi API error',
          errcode: response.errcode,
          errmsg: response.errmsg,
          cat_id: parsed.cat_id,
          host: parsed.host,
          message: response.errmsg === 'token is not valid'
            ? 'Invalid token. Please verify your token is correct.'
            : response.errmsg
        }));
        process.exit(1);
      }

      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } catch (e) {
      console.error(JSON.stringify({
        error: 'Failed to parse response',
        message: e.message,
        raw_data: data
      }));
      process.exit(1);
    }
  });
}).on('error', (err) => {
  console.error(JSON.stringify({
    error: 'Network error',
    message: err.message
  }));
  process.exit(1);
});
