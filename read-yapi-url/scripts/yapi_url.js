const API_PATTERN = /^https:\/\/([^/]+)\/project\/(\d+)\/interface\/api\/(\d+)$/;
const CATE_PATTERN = /^https:\/\/([^/]+)\/project\/(\d+)\/interface\/api\/cat_(\d+)$/;

const EXAMPLE_HOST = 'yapi.example.com';

function parseYapiUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const apiMatch = url.match(API_PATTERN);
  if (apiMatch) {
    return {
      valid: true,
      type: 'api',
      url,
      host: apiMatch[1],
      project_id: apiMatch[2],
      api_id: apiMatch[3]
    };
  }

  const cateMatch = url.match(CATE_PATTERN);
  if (cateMatch) {
    return {
      valid: true,
      type: 'category',
      url,
      host: cateMatch[1],
      project_id: cateMatch[2],
      cat_id: cateMatch[3]
    };
  }

  return null;
}

function validateYapiUrl(url) {
  const parsed = parseYapiUrl(url);
  if (parsed) {
    return parsed;
  }

  return {
    valid: false,
    error: 'Invalid YApi URL format',
    message:
      'Valid URL patterns:\n' +
      `  - API URL: https://${EXAMPLE_HOST}/project/{project_id}/interface/api/{api_id}\n` +
      `  - Category URL: https://${EXAMPLE_HOST}/project/{project_id}/interface/api/cat_{category_id}\n` +
      '\nProvided URL: ' + url
  };
}

function getProjectSettingUrl(host, projectId) {
  return `https://${host}/project/${projectId}/setting`;
}

function formatUrlPatterns(host = EXAMPLE_HOST) {
  return {
    api: `https://${host}/project/{project_id}/interface/api/{api_id}`,
    category: `https://${host}/project/{project_id}/interface/api/cat_{category_id}`
  };
}

module.exports = {
  API_PATTERN,
  CATE_PATTERN,
  EXAMPLE_HOST,
  parseYapiUrl,
  validateYapiUrl,
  getProjectSettingUrl,
  formatUrlPatterns
};
