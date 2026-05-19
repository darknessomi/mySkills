const test = require('node:test');
const assert = require('node:assert/strict');
const {
  applyIgnoreRules,
  isCategoryIgnored,
  isApiIgnored,
  getIgnoreStats
} = require('../yapi_ignore');

const categories = [
  {
    _id: 100,
    name: '公共分类',
    list: [
      { _id: 1, catid: 100, title: 'health' },
      { _id: 2, catid: 100, title: 'test' }
    ]
  },
  {
    name: '对话',
    list: [
      { _id: 3, catid: 200, title: 'chat-a' },
      { _id: 4, catid: 200, title: 'chat-b' }
    ]
  }
];

test('applyIgnoreRules removes ignored category bucket', () => {
  const filtered = applyIgnoreRules(categories, { categories: [100], apis: [] });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, '对话');
});

test('applyIgnoreRules removes apis by catid and api id', () => {
  const filtered = applyIgnoreRules(categories, { categories: [200], apis: [2] });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].name, '公共分类');
  assert.equal(filtered[0].list.length, 1);
  assert.equal(filtered[0].list[0]._id, 1);
});

test('applyIgnoreRules removes single api', () => {
  const filtered = applyIgnoreRules(categories, { categories: [], apis: [3] });
  assert.equal(filtered[1].list.length, 1);
  assert.equal(filtered[1].list[0]._id, 4);
});

test('isCategoryIgnored and isApiIgnored', () => {
  const ignore = { categories: [200], apis: [1] };
  assert.equal(isCategoryIgnored(200, ignore), true);
  assert.equal(isApiIgnored({ _id: 1, catid: 100 }, ignore), true);
  assert.equal(isApiIgnored({ _id: 4, catid: 200 }, ignore), true);
});

test('getIgnoreStats counts removals', () => {
  const filtered = applyIgnoreRules(categories, { categories: [100], apis: [] });
  const stats = getIgnoreStats(categories, filtered, { categories: [100], apis: [] });
  assert.equal(stats.removed_categories, 1);
  assert.equal(stats.removed_apis, 2);
});
