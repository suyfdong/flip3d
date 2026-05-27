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
├── layout.tsx           根布局：<html><body>{children}</body></html> + GA + WebSite JSON-LD
├── (site)/              route group：带 SiteHeader/Footer 的所有正常页面
│   ├── layout.tsx       注入 chrome
│   ├── page.tsx         首页
│   ├── (converters)/    40 个 X-to-Y/page.tsx（复用 ConverterPage 模板）
│   ├── tools/           差异化工具：bambu-3mf-to-prusa, prusa-3mf-to-bambu,
│   │                                 gcode-simulator, stl-repair
│   ├── reference/       evergreen：stl-vs-obj-vs-3mf, bambu-vs-prusa, metal-gauge-chart
│   ├── embed/page.tsx   embed 主页（marketing + code generator）
│   └── about|privacy|terms/
├── embed/               chrome-less route：iframe target
│   ├── layout.tsx       极简 pass-through
│   └── stl-viewer/      接 ?url=&format=&theme= 实际嵌入页
├── opengraph-image.tsx  build-time 静态生成 1200×630 PNG
├── icon.tsx + apple-icon.tsx  品牌渐变 favicon
├── sitemap.ts + robots.ts     都 export const dynamic = "force-static"

components/   ConverterPage / BambuPrusaTool / GcodeSimulator / StlRepairTool /
              EmbedViewer / EmbedCodeGenerator / GcodeViewer / MeshViewer /
              SiteHeader / SiteFooter / Dropzone / JsonLd

lib/
├── converters/  formats.ts (Format enum + SOURCE_ONLY) · parse.ts · export.ts
│                stats.ts · step.ts (occt-import-js dynamic) · 3mf-writer.ts
│                3mf-sanitizer.ts · 3mf-sample.ts
├── repair/      analyze.ts · repair.ts
├── gcode/       parser.ts · stats.ts · sample.ts
├── schema.ts    JSON-LD 工厂（WebSite/SoftwareApplication/FAQPage/Breadcrumb）
├── embed-themes.ts  light/dark/paper/neon 主题色
├── analytics.ts     window.gtag 直接调用（不用 sendGAEvent）
└── seo.ts       SITE_URL + CONVERTER_ROUTES + REFERENCE/LEGAL/TOOL_ROUTES + buildConverterMetadata

public/
├── _headers           Cloudflare Pages：opengraph-image / icon / wasm 的 Content-Type
└── wasm/occt-import-js.wasm  7.3MB，lazy-load
```

**关键决策**：
- App Router；`params/searchParams` 是 **Promise**（Next.js 15+）必须 `await`
- 客户端组件 `"use client"`；three.js / WASM 用 `dynamic import` + `ssr: false`
- **Route group `(site)`** vs **`embed/`**：embed 是 chrome-less iframe target，logo/footer 不该出现
- **SiteHeader logo 用 `<a href="/">`** 不用 `<Link>`：full reload 强制释放 WebGL context，避免页面切换后旧 viewer 残留 GPU 资源造成卡顿
- **THREE.Object3D 必须 dispose**：所有持有 object state 的组件加 `useEffect(() => () => disposeObject(object), [object])`，否则切页累积内存爆炸
- **Dropzone** 是受控组件：文件 → ArrayBuffer → 父组件 state → Viewer 消费
- **MeshViewer props**：`object` + `compact?`（embed 模式去 border/min-h/stats）+ `theme?`（4 主题）
- **SOURCE_ONLY_FORMATS** = `{step, iges, fbx, dae}`：能 parse 不能 export；ConverterPage 自动隐藏 sample 按钮、reverse link 改指首页
- **JSON-LD** 用 `<JsonLd data={...}>` 组件注入到任何页面（client/server 都可）；root layout 已注入 WebSite schema，每页加自己的

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

## 已知踩坑（补充）

- **`output: "export"` 模式下 `app/sitemap.ts` / `robots.ts` / `opengraph-image.tsx` / `icon.tsx` 必须 export `const dynamic = "force-static"`**，否则 build 报错
- **Cloudflare Pages 对无扩展名文件（opengraph-image / icon）需要 `_headers` 强制 Content-Type**，否则浏览器/社交平台不认
- **GA 自定义事件不要用 `@next/third-parties` 的 `sendGAEvent`**，flaky；直接 `window.gtag('event', name, params)`
- **Next.js `<Link>` 在 static export + trailingSlash 下偶有客户端导航 stuck**：关键入口（logo）用 `<a>` 强制 reload 更可靠
- **occt-import-js 7.3 MB WASM**：lazy 通过 `dynamic import` 在 step.ts 加载，并通过 `locateFile` 指向 `/wasm/occt-import-js.wasm`
- **Satori (OG image) 多子节点 div 必须显式 `display: flex/none/contents`**，否则 build 报 "Expected explicit display"

## 当前状态速查（2026-05-27）

- ✅ 9 源格式 / 5 目标格式 / **40 个 converter landing**
- ✅ **Image→STL / Lithophane**（`/image-to-stl` `/png-to-stl` `/jpg-to-stl` `/lithophane-generator`）—— convert3d 没有、imagetostl 独占的 ~31K vol 缝隙。核心 `lib/heightmap/image-to-mesh.ts`（亮度→水密高度场实体，relief/lithophane 两模式）
- ✅ 4 差异化工具：Bambu↔Prusa 3MF · G-code Simulator · STL Repair · iframe Embed v2（4 主题）
- ✅ 3 reference · 3 legal · sitemap **57 URLs** · GA4 + GSC + 4 种 JSON-LD schema
- ✅ Cloudflare Pages auto-deploy（push main → 2-3 分钟生效）
- ⏳ W8 reference 表 × 4（drill-bit / thread-pitch / tolerance / bed-sizes）
- ⏳ STL Repair v2（manifold-3d 真补孔 + 自交修复）

### 转换页 SEO 富内容机制（2026-05-27 加）

- `ConverterPage` 有可选 `content` prop（`ConverterContent`：`lede / aboutTitle / about[] / faq[] / related[] / fromLabel`）。**默认转换页不传，保持精简**；头部大词页传入数据驱动内容 + 在 route 里注入 FAQPage/Breadcrumb JSON-LD。
- 已套用：`3mf-to-stl` · `obj-to-stl` · `step-to-stl` · `stl-to-obj`。内容词簇来自 Semrush（convert3d/imagetostl/fabconvert 三站 CSV 分析）。
- **扩展名别名页**：`fromLabel` 覆盖 + `lib/seo.ts` 的 `ALIAS_ROUTES` → 如 `/stp-to-stl`（解析为 step，但 H1/canonical 独立，吃 `stp to stl` 1600 vol）。`IMAGE_ROUTES` 同理收录图像页到 sitemap。
- ❌ **stl→step 已评估，不做**：mesh→B-rep 信息论上不可逆，只能输出 faceted「假」STEP，违背诚信红线。详见 `../progress.md` Day 6。

更新进度时改 `../progress.md`。
