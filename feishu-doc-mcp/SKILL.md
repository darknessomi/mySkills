---
name: feishu-doc-mcp
description: Call Feishu document MCP tools to fetch, search, create, update
  Feishu docs, or manage comments. Use when the user provides Feishu wiki/doc
  URLs (*.feishu.cn), asks to read/create/update Feishu docs, fetch API
  docs from Feishu, search Feishu content, or view/add document comments.
---
# 调用飞书文档 MCP

通过 `call_mcp_tool` 调用飞书文档 MCP，需指定 `server: "user-feishu-mcp"`（按本地 MCP 配置替换）。

## 调用方式

```json
{
  "server": "user-feishu-mcp",
  "toolName": "<工具名>",
  "arguments": { ... }
}
```

**调用前**：先读取工具 schema 确认参数（`mcps/user-feishu-mcp/tools/<tool-name>.json`）。

## 工具一览

| 操作 | 工具 |
|------|------|
| 搜索云文档 | `search-doc` |
| 查看云文档 | `fetch-doc` |
| 创建云文档 | `create-doc` |
| 更新云文档 | `update-doc` |
| 获取知识空间节点下的云文档列表 | `list-docs` |
| 查看全文评论与划词评论 | `get-comments` |
| 添加全文评论 | `add-comments` |
| 获取文件/图片/画板 Base64 | `fetch-file` |
| 搜索用户（@ 他人前需调用） | `search-user` |
| 获取用户信息 | `get-user` |

## 常用场景

### 1. 读取飞书文档

用户提供 `https://your-org.feishu.cn/wiki/xxx` 或 `https://xxx.feishu.cn/doc/xxx`：

```
call_mcp_tool: server=user-feishu-mcp, toolName=fetch-doc, arguments={ doc_id: "完整URL或文档ID" }
```

`doc_id` 支持 URL 自动解析，无需手动提取 ID。

### 2. 搜索文档

```
call_mcp_tool: server=user-feishu-mcp, toolName=search-doc
arguments: { query: "关键词", filters: { sort_rule: "EDIT_TIME", create_time_relative: "last_7_days" } }
```

**注意**：`owners` 需 open_id，需先 `search-user` 或 `get-user` 获取；时间跨度 ≤ 3 个月。

### 3. 创建文档

```
call_mcp_tool: server=user-feishu-mcp, toolName=create-doc
arguments: { title: "标题", markdown: "## 内容\n\n...", wiki_node: "可选" }
```

`wiki_node` / `wiki_space` / `folder_token` 三选一。

### 4. 更新文档

```
call_mcp_tool: server=user-feishu-mcp, toolName=update-doc
arguments: { doc_id: "文档ID或URL", mode: "append", markdown: "追加内容" }
```

`mode` 可选：`overwrite`、`append`、`replace_range`、`replace_all`、`insert_before`、`insert_after`、`delete_range`。

定位用 `selection_by_title`（如 `## 章节名`）或 `selection_with_ellipsis`（如 `开头...结尾`）。

### 5. 查看评论

```
call_mcp_tool: server=user-feishu-mcp, toolName=get-comments
arguments: { doc_id: "文档ID或URL", comment_type: "all|whole|segment" }
```

`comment_type`：`all` 全部，`whole` 全文评论，`segment` 划词评论。

### 6. 添加全文评论

```
call_mcp_tool: server=user-feishu-mcp, toolName=add-comments
arguments: { doc_id: "文档ID或URL", elements: [{type:"text",text:"..."},{type:"mention",open_id:"ou_xxx"},{type:"link",url:"..."}] }
```

仅支持 text、mention、link。@ 用户需先 `search-user` 获取 open_id。

## 注意事项

- **fetch-doc**：`doc_id` 必填，支持 URL，不能传文章标题
- **search-doc**：需 owners 时需先获取 open_id；时间跨度 ≤ 3 个月
- **create-doc**：正文不要重复 title；`<image>`、`<file>` 仅支持 url，不支持 token
- **update-doc**：优先局部更新（append/replace_range），慎用 overwrite
- **get-comments**：`doc_id` 必填；`comment_type` 可选 all/whole/segment
- **add-comments**：仅支持 text、mention、link；@ 用户需先 search-user 获取 open_id

## 参考

工具 schema 位于 `mcps/user-feishu-mcp/tools/*.json`，内含各工具的参数说明、Hard Rules 和调用示例。
