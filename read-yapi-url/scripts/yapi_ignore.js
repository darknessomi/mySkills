const { readConfig, writeConfig } = require('./yapi_paths');

function normalizeIdSet(list) {
  return new Set(
    (list || [])
      .map((id) => Number(id))
      .filter((id) => !Number.isNaN(id))
  );
}

function normalizeIgnore(ignore = {}) {
  return {
    categories: [...normalizeIdSet(ignore.categories)],
    apis: [...normalizeIdSet(ignore.apis)]
  };
}

function getProjectEntry(cwd, projectId) {
  const config = readConfig(cwd);
  const id = String(projectId);
  return config.projects.find((p) => String(p.project_id) === id) || null;
}

function getProjectIgnore(cwd, projectId) {
  const entry = getProjectEntry(cwd, projectId);
  return normalizeIgnore(entry && entry.ignore);
}

function countApis(categories) {
  return categories.reduce((sum, cat) => sum + (cat.list ? cat.list.length : 0), 0);
}

function applyIgnoreRules(categories, ignore = {}) {
  const ignoreCats = normalizeIdSet(ignore.categories);
  const ignoreApis = normalizeIdSet(ignore.apis);
  const result = [];

  for (const cat of categories) {
    if (cat._id != null && ignoreCats.has(Number(cat._id))) {
      continue;
    }

    const list = (cat.list || []).filter((api) => {
      if (ignoreApis.has(Number(api._id))) {
        return false;
      }
      if (api.catid != null && ignoreCats.has(Number(api.catid))) {
        return false;
      }
      return true;
    });

    if (list.length === 0) {
      continue;
    }

    result.push({ ...cat, list });
  }

  return result;
}

function getIgnoreStats(before, after, ignore) {
  return {
    ignore: normalizeIgnore(ignore),
    removed_categories: before.length - after.length,
    removed_apis: countApis(before) - countApis(after),
    category_count: after.length,
    interface_count: countApis(after)
  };
}

function isCategoryIgnored(catId, ignore = {}) {
  return normalizeIdSet(ignore.categories).has(Number(catId));
}

function isApiIgnored(api, ignore = {}) {
  if (!api) {
    return false;
  }
  if (normalizeIdSet(ignore.apis).has(Number(api._id))) {
    return true;
  }
  if (api.catid != null && normalizeIdSet(ignore.categories).has(Number(api.catid))) {
    return true;
  }
  return false;
}

function ensureProjectEntry(cwd, projectId) {
  const config = readConfig(cwd);
  const id = String(projectId);
  let entry = config.projects.find((p) => String(p.project_id) === id);

  if (!entry) {
    entry = { project_id: id, ignore: { categories: [], apis: [] } };
    config.projects.push(entry);
    config.projects.sort((a, b) => String(a.project_id).localeCompare(String(b.project_id)));
  } else if (!entry.ignore) {
    entry.ignore = { categories: [], apis: [] };
  } else {
    entry.ignore = normalizeIgnore(entry.ignore);
  }

  writeConfig(cwd, config);
  return entry;
}

function addIgnoreIds(cwd, projectId, type, ids) {
  const entry = ensureProjectEntry(cwd, projectId);
  const key = type === 'api' ? 'apis' : 'categories';
  const set = normalizeIdSet(entry.ignore[key]);
  ids.forEach((id) => set.add(Number(id)));
  entry.ignore[key] = [...set];
  const config = readConfig(cwd);
  const target = config.projects.find((p) => String(p.project_id) === String(projectId));
  target.ignore = entry.ignore;
  writeConfig(cwd, config);
  return entry.ignore;
}

function removeIgnoreIds(cwd, projectId, type, ids) {
  const entry = ensureProjectEntry(cwd, projectId);
  const key = type === 'api' ? 'apis' : 'categories';
  const removeSet = normalizeIdSet(ids);
  entry.ignore[key] = entry.ignore[key].filter((id) => !removeSet.has(Number(id)));
  const config = readConfig(cwd);
  const target = config.projects.find((p) => String(p.project_id) === String(projectId));
  target.ignore = entry.ignore;
  writeConfig(cwd, config);
  return entry.ignore;
}

module.exports = {
  normalizeIgnore,
  getProjectIgnore,
  applyIgnoreRules,
  getIgnoreStats,
  isCategoryIgnored,
  isApiIgnored,
  addIgnoreIds,
  removeIgnoreIds,
  ensureProjectEntry
};
