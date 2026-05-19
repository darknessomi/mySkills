const fs = require('fs');
const path = require('path');
const { getProjectIgnore, applyIgnoreRules } = require('./yapi_ignore');
const { parseYapiUrl } = require('./yapi_url');

function loadCategories(exportPath) {
  const raw = fs.readFileSync(exportPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && Array.isArray(parsed.data)) {
    return parsed.data;
  }

  throw new Error('Expected an array of YApi categories');
}

function filterApisByCatId(list, catId) {
  return (list || []).filter((item) => Number(item.catid) === catId);
}

function findCategoryById(categories, catId) {
  const byMetaId = categories.find((cat) => Number(cat._id) === catId);
  if (byMetaId) {
    const list = filterApisByCatId(byMetaId.list, catId);
    const fallbackList = list.length > 0 ? list : (byMetaId.list || []);
    return {
      category: {
        _id: catId,
        name: byMetaId.name,
        desc: byMetaId.desc
      },
      list: fallbackList
    };
  }

  for (const cat of categories) {
    const matched = filterApisByCatId(cat.list, catId);
    if (matched.length > 0) {
      return {
        category: {
          _id: catId,
          name: cat.name,
          desc: cat.desc
        },
        list: matched
      };
    }
  }

  return null;
}

function findApiById(categories, apiId) {
  for (const category of categories) {
    const list = category.list || [];
    const api = list.find((item) => Number(item._id) === apiId);
    if (api) {
      return api;
    }
  }
  return null;
}

function resolveExportPath(cwd, exportFile) {
  const exportPath = path.isAbsolute(exportFile)
    ? exportFile
    : path.resolve(cwd, exportFile);

  if (!fs.existsSync(exportPath)) {
    throw new Error(`Export file not found: ${exportFile}`);
  }

  return exportPath;
}

function getProjectIdFromUrl(url) {
  const parsed = parseYapiUrl(url);
  return parsed ? parsed.project_id : null;
}

function loadCategoriesForProject(cwd, exportPath, projectId) {
  const categories = loadCategories(exportPath);
  if (!projectId) {
    return { categories, ignore: { categories: [], apis: [] } };
  }
  const ignore = getProjectIgnore(cwd, projectId);
  return {
    categories: applyIgnoreRules(categories, ignore),
    ignore
  };
}

module.exports = {
  loadCategories,
  loadCategoriesForProject,
  findCategoryById,
  findApiById,
  resolveExportPath,
  getProjectIdFromUrl
};
