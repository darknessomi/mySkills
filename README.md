# mySkills

个人 Cursor / Codex Agent Skills 开源合集。每个 skill 是一个独立目录，包含 `SKILL.md` 及可选脚本。

## 安装

将整个仓库克隆或复制到 skills 目录：

```bash
git clone https://github.com/darknessomi/mySkills.git
cp -r mySkills/* ~/.cursor/skills/
# 或 Codex:
cp -r mySkills/* ~/.codex/skills/
```

也可只复制需要的 skill 子目录，例如 `~/.cursor/skills/commit-it/`。

## Skills 一览

| Skill | 说明 | 触发场景 |
|-------|------|----------|
| [commit-it](commit-it/) | 按 Angular Conventional Commit 规范生成中文 commit message | 提交代码、写 commit message |
| [feishu-doc-mcp](feishu-doc-mcp/) | 调用飞书文档 MCP 读写云文档 | 用户提供飞书文档 URL、搜索/创建/更新文档 |
| [figma-miniprogram-assets](figma-miniprogram-assets/) | 从 Figma 下载微信小程序图片资源并导出 3x PNG | Figma 切图、图标下载、设计稿还原、替换 `.png` |
| [read-yapi-url](read-yapi-url/) | 同步 YApi 项目数据到本地并提取 API 文档 | 用户提供 YApi URL、同步/读取接口文档 |
| [zeplin-page-from-design](zeplin-page-from-design/) | 基于 Zeplin 设计稿分步还原页面 | Zeplin 设计稿、截图驱动 UI 实现 |

## 环境变量

### read-yapi-url

每个 YApi 项目需单独配置 token：

```bash
export YAPI_PROJECT_TOKEN_123="your_yapi_project_token"
```

Token 获取路径：`https://{yapi_host}/project/{project_id}/setting` → token 配置。

YApi host 从用户提供的 URL 解析，首次 sync 后写入 `yapi/config.json` 的 `yapi_host` 字段，后续 refresh 无需再传 URL。

### feishu-doc-mcp / zeplin-page-from-design / figma-miniprogram-assets

需在 Cursor 中配置对应 MCP server。Skill 中的 `user-feishu-mcp`、`user-zeplin` 等为示例名称，请替换为你本地 MCP 配置中的 server 名。

`figma-miniprogram-assets` 使用 Figma MCP 的 `get_design_context` 获取 asset URL，本地需安装 `rsvg-convert`（`brew install librsvg`）用于 SVG 转 3x PNG。

## 前置依赖

| Skill | 依赖 |
|-------|------|
| read-yapi-url | Node.js 18+、全局安装 `sm2tsservice`（`npm i -g sm2tsservice`） |
| feishu-doc-mcp | 飞书文档 MCP server |
| figma-miniprogram-assets | Figma MCP server、`rsvg-convert`（推荐）、macOS `sips` |
| zeplin-page-from-design | Zeplin MCP server |
| commit-it | 无 |

## read-yapi-url 快速示例

```bash
# 验证 URL（host 任意）
node read-yapi-url/scripts/verify_yapi_url.js \
  "https://yapi.example.com/project/123/interface/api/456"

# 运行单元测试
node --test read-yapi-url/scripts/__test__/*.test.js
```

YApi URL 格式：

- 单接口：`https://{host}/project/{project_id}/interface/api/{api_id}`
- 分类：`https://{host}/project/{project_id}/interface/api/cat_{category_id}`

## License

[MIT](LICENSE)
