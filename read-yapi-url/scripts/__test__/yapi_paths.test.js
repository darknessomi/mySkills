const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  readConfig,
  getProjectHost,
  setProjectHost,
  registerProject
} = require('../yapi_paths');

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yapi-paths-'));
  try {
    fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('setProjectHost persists host to yapi/config.json', () => {
  withTempDir((dir) => {
    setProjectHost(dir, '123', 'yapi.example.com');
    assert.equal(getProjectHost(dir, '123'), 'yapi.example.com');

    const config = readConfig(dir);
    assert.equal(config.projects.length, 1);
    assert.equal(config.projects[0].project_id, '123');
    assert.equal(config.projects[0].yapi_host, 'yapi.example.com');
  });
});

test('registerProject can set host when registering', () => {
  withTempDir((dir) => {
    registerProject(dir, '456', { host: 'yapi.internal.corp' });
    assert.equal(getProjectHost(dir, '456'), 'yapi.internal.corp');
  });
});

test('setProjectHost updates existing project entry', () => {
  withTempDir((dir) => {
    registerProject(dir, '123');
    setProjectHost(dir, '123', 'yapi.old.com');
    setProjectHost(dir, '123', 'yapi.new.com');

    const config = readConfig(dir);
    assert.equal(config.projects.length, 1);
    assert.equal(config.projects[0].yapi_host, 'yapi.new.com');
  });
});

test('getProjectHost returns null when host not configured', () => {
  withTempDir((dir) => {
    registerProject(dir, '789');
    assert.equal(getProjectHost(dir, '789'), null);
  });
});
