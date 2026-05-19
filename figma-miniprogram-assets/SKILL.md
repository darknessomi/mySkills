---
name: figma-miniprogram-assets
description: 从 Figma 下载微信小程序本地图片资源，并确保导出 3x PNG。Use when implementing Figma designs, downloading Figma icons/images, replacing png assets, 设计稿还原, 下图片, 切图, Figma PNG, 3x 图片.
---
# Figma Miniprogram Assets

用于这个微信小程序项目里从 Figma 下载本地图片资源，尤其是图标类 PNG。

## 适用场景

当用户提到以下任一内容时，优先使用这个 Skill：

- Figma 设计稿里的图片、图标、切图
- 下载/替换/新增 `.png`
- `3x` 图片
- 设计稿还原里的本地资源
- Figma MCP 返回的 `asset` URL

## 核心原则

- 小程序本地图片优先落到对应组件或页面的 `images/` 目录。
- 设计稿标注尺寸按 CSS px 写样式，图片文件本身按 `3x` 导出。
- 不要把 Figma `get_design_context` 返回的 asset URL 直接按 `.png` 保存；它可能实际返回 SVG 文本。
- 下载后必须验证真实图片格式和像素尺寸，不要只看文件扩展名。
- MCP 对缩略图/截图的文字描述可能把透明底说成白底，以本地下载的 SVG / PNG 实测为准。

## 3x 导出流程

### 1. 先拿设计上下文

用 Figma MCP 的 `get_design_context` 获取节点结构和 asset URL。先按工具要求读取 MCP schema。

若用户给的是整屏画板链接，在返回结构里找到真实图标子节点（或对该子节点单独 `get_design_context`），避免把整张截图当图标导出。

记录每个图标对应的：

- Figma 子节点 ID
- 设计尺寸，例如 `48px` 或 `28px`
- asset URL
- 目标文件名

### 2. 判断 asset URL 类型

Figma asset URL 可能返回 SVG，即使目标文件名是 `.png`。不要直接 `curl URL -o xxx.png` 后结束。

用 `ReadFile` 打开下载结果：

- 如果能作为图片读取，继续检查尺寸。
- 如果内容以 `<svg` 开头，说明它不是 PNG，需要本地渲染成 PNG。

### 3. SVG 转 3x PNG（保留透明）

Figma 导出的图标 SVG 多为透明底；栅格化时应得到带 alpha 的 PNG，而不是白底块。

**优先**使用 Homebrew 的 `rsvg-convert`（librsvg），行为稳定且通常保留透明度：

```bash
mkdir -p "tmp/figma-assets-3x"
curl -fsSL "<asset-url>" -o "tmp/figma-assets-3x/icon.svg"
rsvg-convert -w 144 -h 144 "tmp/figma-assets-3x/icon.svg" -o "path/to/images/icon.png"
```

尺寸换算：

- 设计稿 `48px` 图标：导出 `144 × 144`
- 设计稿 `28px` 图标：导出 `84 × 84`
- 其它尺寸：导出尺寸 = 设计尺寸 × 3

可选：macOS 自带 `qlmanage` 也能把 SVG 打成 PNG，但在部分环境会极慢或卡住；仅当机器上验证可用时再作为主路径。

```bash
curl -fsSL "<asset-url>" -o "tmp/figma-assets-3x/icon.svg"
qlmanage -t -s 144 -o "tmp/figma-assets-3x" "tmp/figma-assets-3x/icon.svg" >/dev/null
cp "tmp/figma-assets-3x/icon.svg.png" "path/to/images/icon.png"
```

`qlmanage` 在沙箱里可能失败；失败时用 `Shell` 请求 `all` 权限重跑。

### 4. 不用 `get_screenshot` 放大图标

Figma MCP 的 `get_screenshot` 适合确认截图和导出真实 PNG，但 `maxDimension` 不会把小节点放大成 `3x`。例如 48px 图标传 `maxDimension: 144` 仍可能返回 `48 × 48`。

如果必须导出 3x，优先使用 SVG asset + 本地栅格化（`rsvg-convert` 或已验证可用的 `qlmanage`）。

### 5. 验证

导出后必须检查：

```bash
sips -g pixelWidth -g pixelHeight -g hasAlpha "path/to/images/icon.png"
```

图标类资源预期 `hasAlpha: yes`。若为 `no`，换栅格工具或检查是否误用了非 SVG 流程。

再用 `ReadFile` 读取图片，确认它能作为图片显示，不是 SVG 文本或损坏文件。

最后检查相关 `wxml` / `less` 诊断。

## 命名建议

- 语义化命名，不用 Figma 自动名。
- 同一组件里的状态图标按状态命名，例如：
  - `icn-input-keyboard.png`
  - `icn-input-voice.png`
  - `icn-add-file.png`（多状态若切图相同则只保留一张）
  - `icn-send-active.png`

## 不要做的事

- 不要把 SVG 内容保存成 `.png`。
- 不要把临时 Figma URL 写进小程序代码。
- 不要因为 `get_screenshot` 返回了 PNG 就默认它是 3x。
- 不要顺手改动无关图片、样式或 `package.json`。
- 临时目录用完后删除，例如 `rm -rf tmp/figma-assets-3x`。
