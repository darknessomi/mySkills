const test = require('node:test');
const assert = require('node:assert/strict');
const { findCategoryById, findApiById } = require('../yapi_export_utils');

const categories = [
  {
    name: '对话',
    list: [
      { _id: 1, catid: 200, title: 'A', method: 'GET', path: '/a' },
      { _id: 2, catid: 200, title: 'B', method: 'POST', path: '/b' }
    ]
  },
  {
    _id: 300,
    name: '旧格式分类',
    list: [
      { _id: 3, catid: 300, title: 'C', method: 'GET', path: '/c' }
    ]
  }
];

test('findCategoryById matches export-full catid without category _id', () => {
  const result = findCategoryById(categories, 200);
  assert.equal(result.list.length, 2);
  assert.equal(result.category.name, '对话');
});

test('findCategoryById matches legacy category _id', () => {
  const result = findCategoryById(categories, 300);
  assert.equal(result.list.length, 1);
  assert.equal(result.list[0]._id, 3);
});

test('findApiById finds api across categories', () => {
  const api = findApiById(categories, 2);
  assert.equal(api.title, 'B');
});
