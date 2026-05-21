---
name: read-yapi-url
description: Sync full YApi project data to the current project via token, then
  extract requested API documentation from local files for git-managed updates.
  Use when the user asks to read, fetch, sync, or get YApi API documentation, or
  provides YApi URLs like "https://yapi.example.com/project/{id}/interface/api/{api_id}"
  or "https://yapi.example.com/project/{id}/interface/api/cat_{cat_id}".
  Supports both single API URLs and category URLs. Supports multiple YApi projects
  in one repo under yapi/{project_id}/. Host is parsed from the URL automatically.
---
# Read YApi URL

Sync full YApi project data into the current workspace, then extract requested API documentation from local files.

This workflow keeps YApi data in the project directory so it can be versioned with git and refreshed on demand.

## Multiple YApi Projects

One frontend repo may depend on multiple YApi projects. Each YApi `project_id` gets its own directory:

```
yapi/
  config.json              # registered YApi project IDs
  123/
    export.json            # raw export-full data
  456/
    export.json
```

Legacy root files are still read as fallback when migrating:

- `yapi-export-{project_id}.json`
- `yapi/export-{project_id}.json`

Tokens remain per YApi project: `YAPI_PROJECT_TOKEN_{project_id}`.

## YApi Host Configuration

Each registered project stores its YApi host in `yapi/config.json` as `yapi_host`. The host is parsed from the user's URL on first sync and persisted for later refresh/sync without URLs.

```json
{
  "version": 1,
  "data_dir": "yapi",
  "projects": [
    {
      "project_id": "123",
      "yapi_host": "yapi.example.com",
      "ignore": {
        "categories": [100],
        "apis": [789]
      }
    }
  ]
}
```

Rules:

- `yapi_host`: hostname only (no `https://`), e.g. `yapi.example.com`
- Written automatically when syncing with a URL or passing `host` to `sync_yapi_full.js`
- Read by `sync_yapi_full.js` and `get_project_token.js` when `host` is omitted
- Safe to commit to git (unlike tokens)

If `yapi_host` is missing and the user asks to refresh without a URL, ask for a YApi URL or the host value.

## Ignore Categories and APIs

Per YApi project, configure ignored categories or interfaces in `yapi/config.json`:

```json
{
  "version": 1,
  "data_dir": "yapi",
  "projects": [
    {
      "project_id": "123",
      "yapi_host": "yapi.example.com",
      "ignore": {
        "categories": [100],
        "apis": [789]
      }
    }
  ]
}
```

Rules:

- `ignore.categories`: YApi 分类 ID（`catid`，或分类节点的 `_id`）。命中后整组分类或该 `catid` 下的接口都会被排除
- `ignore.apis`: 接口 `_id`，只排除指定接口

Applied when:

- `sync_yapi_full.js` writes `export.json` (filtered)
- `extract_yapi_api.js` / `extract_yapi_cate.js` read local export (filtered again for legacy unfiltered files)

Manage via CLI:

```bash
node scripts/manage_yapi_ignore.js 123 list
node scripts/manage_yapi_ignore.js 123 add-category 100
node scripts/manage_yapi_ignore.js 123 add-api 789
node scripts/manage_yapi_ignore.js 123 remove-category 100
node scripts/manage_yapi_ignore.js 123 remove-api 789
```

After changing ignore rules, re-run `sync_yapi_full.js` for that project so `export.json` stays consistent.

## Prerequisites

- Do not commit project tokens to git; read tokens from `YAPI_PROJECT_TOKEN_{project_id}`
- YApi host is parsed from user-provided URLs and saved to `yapi/config.json` as `yapi_host`

## Workflow

When the user invokes this skill with YApi URLs, follow these steps in the current project directory.

**Script execution**: run all scripts from this skill's `scripts/` directory using paths relative to the skill root (e.g. `node scripts/verify_yapi_url.js`). The agent should resolve the skill directory from the installed skill location.

### 0. Locate Scripts Directory (mandatory)

All script commands use paths relative to this skill directory:

```bash
node scripts/<script_name>.js ...
```

Do not hardcode absolute paths. If the skill is installed at `~/.cursor/skills/read-yapi-url/`, scripts live in `~/.cursor/skills/read-yapi-url/scripts/`.

### 1. Parse and Validate URLs

For each URL provided:

1. Run `node scripts/verify_yapi_url.js <url>` to validate the URL format
2. If validation fails, show the error message to the user and stop
3. Valid URL patterns (host is arbitrary):
   - Single API: `https://{host}/project/{project_id}/interface/api/{api_id}`
   - Category: `https://{host}/project/{project_id}/interface/api/cat_{category_id}`

### 2. Extract Project IDs and Hosts

For each valid URL:

1. Run `node scripts/get_project_id.js <url>` to extract `project_id` and `host`
2. Collect unique `(project_id, host)` pairs from the URLs

### 3. Retrieve Project Tokens

For each unique project ID:

1. Run `node scripts/get_project_token.js <project_id> [host]`
   - If `host` was parsed from a URL in step 2, pass it here
   - If omitted, reads `yapi_host` from `yapi/config.json` (requires prior sync)
2. If token is not found:
   - Show the error message with instructions to the user
   - Guide user to visit `https://{host}/project/{project_id}/setting`
   - Instruct to select "token 配置" tab and copy the token
   - Suggest adding to shell config: `export YAPI_PROJECT_TOKEN_{project_id}="token_here"`
   - Ask user to provide the token or set the environment variable
   - Wait for user response before proceeding

### 4. Sync Full YApi Data to Project

For each unique `(project_id, host)` pair:

1. Run `node scripts/sync_yapi_full.js <project_id> <token> [host]`
   - Pass `host` from step 2 on first sync; omit on later refresh if already in config
2. This will:
   - Register the project in `yapi/config.json` if needed
   - Save `yapi_host` to `yapi/config.json`
   - Fetch full project data from `https://{host}/api/open/plugin/export-full`
   - Save filtered export to `yapi/{project_id}/export.json`
3. If sync fails because of invalid token, ask the user to verify the token and retry
4. Tell the user which local files were created or updated and that they can commit them with git

Optional: `node scripts/yapi_paths.js <project_id>` to inspect resolved paths and `yapi_host`.

### 5. Extract Requested API Documentation

For each URL, after sync completes for its project:

1. Determine URL type:
   - API URL: `node scripts/extract_yapi_api.js <url>`
   - Category URL: `node scripts/extract_yapi_cate.js <url>`
2. Export file is resolved automatically from the URL's `project_id` via `yapi_paths.js`
3. Collect all extracted responses

Category extraction supports both export formats:

- Category node has `_id`
- export-full format: category node has no `_id`, APIs use `catid`

If extraction fails because the interface is missing locally, re-run step 4 to refresh the export file.

### 6. Present Results

1. Summarize synced local files per YApi project:
   - `yapi/{project_id}/export.json`
   - `yapi/config.json`
2. Display extracted API JSON for the requested URLs
3. Mention that re-running the skill refreshes local YApi data from the remote platform

## Usage Examples

Example 1 - Single API URL:

```
/read-yapi-url for https://yapi.example.com/project/123/interface/api/456
```

Example 2 - Category URL:

```
/read-yapi-url for https://yapi.example.com/project/123/interface/api/cat_200
```

Example 3 - Refresh project data only (host from config):

```
/read-yapi-url sync project 123
```

When the user only asks to refresh/sync without specific URLs:

1. Read `yapi_host` from `yapi/config.json` via `node scripts/yapi_paths.js <project_id>`
2. If missing, ask for a YApi URL or host
3. Run steps 3-4, then skip extraction

## Scripts Reference

All scripts accept command-line arguments and output JSON to stdout (success) or stderr (errors).

### yapi_url.js

Shared URL parsing module. Extracts `host`, `project_id`, `api_id`, `cat_id` from any valid YApi URL.

### yapi_paths.js

Resolves per-project paths and maintains `yapi/config.json` (including `yapi_host`).

- Input: `<project_id>`
- Output: `project_dir`, `export_file`, `resolved_export_file`, `yapi_host`, `registered_projects`

### yapi_ignore.js

Ignore rule parsing and filtering (`applyIgnoreRules`, `getProjectIgnore`).

### manage_yapi_ignore.js

Add/remove/list ignore rules in `yapi/config.json`.

- Input: `<project_id> <list|add-category|remove-category|add-api|remove-api> [ids...]`

### yapi_export_utils.js

Shared helpers for loading export files and finding categories/APIs.

### verify_yapi_url.js

Validates YApi URL format for any host.

### get_project_id.js

Extracts `project_id` and `host` from YApi URL.

### get_project_token.js

Retrieves project token from environment variable `YAPI_PROJECT_TOKEN_{project_id}`.

- Input: `<project_id> [host]`
- Falls back to `yapi_host` in config when host is omitted

### sync_yapi_full.js

Fetches full YApi export with token and writes it to the current project.

- Input: `<project_id> <token> [host] [output_file]`
- Reads `yapi_host` from config when `host` is omitted
- Writes `yapi_host` to config on every successful sync
- Default output: `yapi/{project_id}/export.json`
- API endpoint: `https://{host}/api/open/plugin/export-full?type=json&pid={project_id}&status=all&token={token}`

### extract_yapi_api.js

Extracts one API from local raw export by API URL.

- Input: `<url> [export_file]`
- Output: YApi-compatible `{ errcode, errmsg, data }`

### extract_yapi_cate.js

Extracts one category API list from local raw export by category URL.

- Input: `<url> [export_file]`
- Output: YApi-compatible `{ errcode, errmsg, data: { count, total, list } }`

## Error Handling

- **Missing YApi host**: Check `yapi/config.json` or ask user for URL/host
- **Invalid URL format**: Show correct patterns and stop
- **Missing token**: Guide user to get token and wait for input
- **Invalid token**: Request correct token and wait for input
- **Missing export file**: Run sync first
- **Missing interface in local export**: Re-sync project data, then retry extraction
- **Network errors**: Display error message to user

## Notes

- Skill scripts use Node.js built-in modules only
- Tokens should live in environment variables, not in committed config files
- Local raw export is the source of truth for extracting specific APIs
- Multiple URLs from the same YApi project share one sync step and one export file
- URLs from different YApi projects sync into separate `yapi/{project_id}/` directories
- Host is parsed from URLs and persisted as `yapi_host` in `yapi/config.json`
- Refresh/sync without URLs uses stored `yapi_host`; tokens always come from environment variables
- Do not generate `swagger.json`; this skill only syncs `export.json`
