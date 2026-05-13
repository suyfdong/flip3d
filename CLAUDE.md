@AGENTS.md

# Flip3D — Developer Context

3D file converter / viewer / repair tools。**100% 客户端处理**（three.js + WASM），免费、无登录、无上传。错位 convert3d.org 主对标，差异化在 **3D 打印兼容性 + 工程参考表 + iframe 嵌入**。

---

## 必读约束（不要违反）

1. **`dev` 命令必须保留 `--webpack`** —— Next.js 16 Turbopack 有 bug。修改 `package.json` scripts 时不要去掉这个 flag。
2. **客户端处理优先** —— 任何文件处理都在浏览器跑（three.js / WASM）。**不要**写文件上传服务器的逻辑。
3. **短 URL**：转换页用 `/step-to-stl`（< 30 字符），不要 `/convert/file/step/to/stl` 长 URL。
4. **不做"什么是 X"科普内容** —— AI Overviews 会抢答（参考 CADExchanger -70% 案例）。工具操作型内容才做。
5. **不做机器翻译多语言** —— 第一年只英文。30K+ traffic 后再考虑扩。
6. **`<html>` 上保留 `suppressHydrationWarning`** —— 兼容沉浸式翻译等浏览器扩展。

---

## 架构

```
app/
├── layout.tsx          根布局 + 全局 SEO metadata
├── page.tsx            首页（Dropzone + Quick Tools + Why + How + Formats）
├── globals.css         Tailwind v4 入口
└── (未来)
    ├── step-to-stl/    # 单格式转换 landing
    ├── view/           # 通用 3D viewer
    ├── tools/          # 差异化工具（bambu-3mf-to-prusa / gcode-simulator / stl-repair）
    ├── reference/      # 工程参考表（抗 AI Overviews 内容）
    └── embed/          # iframe 嵌入码生成器（反链战术）

components/             # 复用 UI 组件
├── Dropzone.tsx        # 拖拽上传，接受 12 格式
└── StlViewer.tsx       # three.js STL 渲染

lib/                    # 纯函数：解析器 / 转换器（W2 起加）
```

**关键决策**：
- App Router（不是 Pages Router）
- `params` / `searchParams` 是 **Promise**（Next.js 15+，必须 `await`）
- 客户端组件用 `"use client"`；three.js 用 `dynamic import` + `ssr: false`
- `Dropzone` 是受控组件，文件 → ArrayBuffer → 父组件状态 → Viewer 消费

---

## 开发命令

```bash
npm install          # 依赖安装
npm run dev          # dev server（webpack 模式，默认 3000）
npm run dev -- -p 3030   # 指定端口
npm run build        # production build（Turbopack，没问题）
npm start            # 生产模式启动
npx tsc --noEmit     # TS 检查
```

---

## 品牌 / UI 规范

**配色**（不要再用紫色 indigo / violet）：
- 主渐变：`from-blue-500 to-cyan-500`
- 强调文字：`text-blue-600 dark:text-blue-400`
- Hover 边框：`hover:border-blue-400 dark:hover:border-blue-700`
- STL mesh 颜色：`0x3b82f6`（blue-500 hex）
- 中性色：`zinc-*` 系列

**字体**：Geist Sans / Geist Mono（Next 默认 Vercel 字体）

**文案口吻**：
- 简洁、动词开头："Flip your 3D files."、"Drop your file here"
- 强调"Free / Local / No signup" —— 这是 LLM 推荐三要素
- 不堆营销词，不用 "revolutionary / cutting-edge / best-in-class"
- 状态诚实：未上线功能标 "Coming W2-W6"，不说谎

**版式**：
- 容器宽度：`max-w-6xl mx-auto px-6`
- 区块间距：`py-16`，区块用 `border-t border-zinc-200 dark:border-zinc-800` 分隔
- Hero `pt-16 pb-12`

---

## SEO 约定

- **每个新页面**必须 export `metadata`（Server Component）或继承 layout 的 default
- **标题模板**：`"<Action> - Free Online <X> to <Y> Converter | No Signup Required"`
  - 例：`"STEP to STL Converter — Free Online | No Signup Required"`
- **URL 模板**：扁平 `/{from}-to-{to}`，全小写，连字符分隔
- **客户端 page 不能 export metadata** —— 用 server wrapper 或继承 layout
- 所有页面：title / description / canonical / og / twitter 必须齐全
- Internal links 用 `<Link>` 不用 `<a>`

---

## 反链战术（W7 起加 `/embed/`）

每个 viewer 工具页底部加 "Embed on Your Site" 按钮，生成：
```html
<iframe src="https://flip3d.app/embed/stl-viewer?url=..." width="100%" height="500"></iframe>
```
嵌入页底部带 "Powered by Flip3D" dofollow 链接 → 自动生长反链网络（参考 viewstl.com 67% Frame 反链）。

---

## 关键参考文档

| 文档 | 用途 |
|---|---|
| `../RESEARCH.md` | 10 家对标完整数据（1,775 行）|
| `../STRATEGY.md` | 38 条 SEO/产品洞察沉淀 |
| `../PROPOSAL.md` | 融合方案战略立意 |
| `../PLAN.md` | 12 周按周任务表 |
| `../progress.md` | 每日进度 |
| `node_modules/next/dist/docs/` | Next.js 16 官方文档（必读，跟训练数据不同）|

---

## 已知踩坑

- **不要直接在 client component 里 export metadata** —— Next.js 编译会报错；用 server wrapper 包一层
- **three.js 必须 dynamic import** —— SSR 会因 `window` 未定义而崩
- **`@/*` import alias** 指向项目根（不是 `src/*`，因为我们用 `--no-src-dir`）
- **Tailwind v4 用 `@import "tailwindcss"`** —— 不是 v3 的 `@tailwind base/components/utilities`

---

## 当前状态速查

- ✅ STL viewer 跑通（拖拽 → 预览 → 统计）
- ✅ SEO 基础完整
- ⏳ 还没接 Cloudflare Pages 部署
- ⏳ 还没做 STL → 其他格式转换（W1 剩余任务）
- ⏳ 4 个差异化爆款（Bambu 3MF / G-code / Repair / iframe）还没做

更新进度时改 `../progress.md`。
