const test = require('node:test');
const assert = require('node:assert/strict');
const { parseYapiUrl, validateYapiUrl } = require('../yapi_url');

test('parseYapiUrl parses API URL with arbitrary host', () => {
  const parsed = parseYapiUrl('https://yapi.example.com/project/123/interface/api/456');
  assert.equal(parsed.type, 'api');
  assert.equal(parsed.host, 'yapi.example.com');
  assert.equal(parsed.project_id, '123');
  assert.equal(parsed.api_id, '456');
});

test('parseYapiUrl parses category URL with arbitrary host', () => {
  const parsed = parseYapiUrl('https://yapi.internal.corp/project/789/interface/api/cat_100');
  assert.equal(parsed.type, 'category');
  assert.equal(parsed.host, 'yapi.internal.corp');
  assert.equal(parsed.project_id, '789');
  assert.equal(parsed.cat_id, '100');
});

test('parseYapiUrl returns null for invalid URL', () => {
  assert.equal(parseYapiUrl('https://example.com/not-yapi'), null);
});

test('validateYapiUrl returns error for invalid URL', () => {
  const result = validateYapiUrl('https://example.com/bad');
  assert.equal(result.valid, false);
  assert.match(result.message, /Invalid YApi URL format|Valid URL patterns/);
});
