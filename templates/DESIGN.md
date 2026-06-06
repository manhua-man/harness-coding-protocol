---
name: "<project-name>"
version: 1
od:
  schema: design-system-v1
  categories:
    - "<product-category>"
tokens:
  color:
    bg: "#ffffff"
    surface: "#f7f8fa"
    surface_raised: "#ffffff"
    border: "rgba(15, 23, 42, 0.12)"
    text: "#0f172a"
    muted: "#64748b"
    accent: "#2563eb"
    success: "#16a34a"
    warning: "#d97706"
    danger: "#dc2626"
  typography:
    sans: "ui-sans-serif, system-ui, \"Segoe UI\", \"PingFang SC\", \"Microsoft YaHei\", sans-serif"
    mono: "ui-monospace, \"Cascadia Code\", \"SF Mono\", Consolas, monospace"
  radius:
    small: "6px"
    medium: "8px"
    large: "12px"
  motion:
    fast: "150ms ease"
    medium: "220ms ease"
---

# DESIGN.md（设 · Design）

> 本文件是**设（Design）**：回答“这个产品、界面或开发者体验应该是什么样”。  
> 工程事实见 `AGENTS.md`；协作协议见 `CLAUDE.md`；局部规则见 `steering/`。

`.od/`（如果使用 Open Design 本地工具）是运行态目录，只保存 SQLite、会话、预览和临时产物，**不提交 Git**。需要沉淀的视觉、交互或体验结论写回本文件；需要进入产品的资源放入 `assets/` 或项目约定目录。

如果项目没有图形 UI，也可以用本文件记录 CLI、API、文档站、插件或开发者体验的设计原则。不要把可核对的工程事实、命令、端口或模块清单写进这里。

---

## 1. Design Intent

<!-- 用 2-4 句话说明产品气质、目标用户、核心体验与非目标。 -->

- **Audience:** ...
- **Primary experience:** ...
- **Design adjectives:** ...
- **Not this:** ...

## 2. Color

<!-- 记录颜色语义，而不只是色值。色值应与 CSS / Tailwind / design tokens 保持一致。 -->

| Role | Token | Usage |
|------|-------|-------|
| Background | `bg` | 全页基底 |
| Surface | `surface` / `surface_raised` | 面板、工具区、列表容器 |
| Text | `text` / `muted` | 正文、辅助信息 |
| Accent | `accent` | 主要操作、链接、focus |
| Success | `success` | 成功、恢复、正向状态 |
| Warning | `warning` | 警告、待处理、风险提示 |
| Danger | `danger` | 删除、失败、破坏性操作 |

Rules:

- 大面积背景要服务内容，不用抽象装饰替代真实状态。
- 语义色保持少而稳定；新增颜色先说明用途。
- 对比度优先于氛围，尤其是表格、表单、按钮和错误信息。

## 3. Typography

<!-- 记录字体栈、字号密度、标题风格和代码/数字排版规则。 -->

- UI text: system sans.
- Code, paths, IDs, slugs, hashes: mono.
- Headings: short, factual, matched to container size.
- Dense operational surfaces should favor scanability over hero-scale type.

## 4. Spacing & Layout

<!-- 说明第一屏、主要导航、面板关系、响应式策略和固定格式元素。 -->

- First screen: ...
- Primary navigation: ...
- Main work surface: ...
- Responsive behavior: ...
- Fixed-format elements that need stable dimensions: ...

Rules:

- 页面区块不要层层套卡片。
- hover、selected、loading、disabled 状态不能导致布局跳动。
- 移动端优先保证文字不溢出、按钮不挤压、关键操作不被遮挡。

## 5. Components

<!-- 列出项目已有或应优先复用的组件语言。 -->

| Component | Usage | Notes |
|-----------|-------|-------|
| Primary action | 关键推进、保存、确认 | 高对比，不只靠文字强调 |
| Secondary action | 返回、取消、轻量切换 | 低视觉权重 |
| Data table / list | 可扫读的信息集合 | 列宽、排序、空状态稳定 |
| Dialog / sheet | 阻断式确认或局部编辑 | 有明确关闭路径 |
| Toast / inline feedback | 成功、失败、保存状态 | 短句，指出下一步 |

States to define: default, hover, active, focus, disabled, loading, empty, error.

## 6. Interaction & Motion

<!-- 动效只用于反馈、转场和状态变化，不用于填空。 -->

Recommended:

- Short opacity, transform, and color transitions.
- Clear feedback for saves, errors, completed actions, and state changes.
- Route or panel transitions that do not block reading or input.

Avoid:

- Decorative motion unrelated to product state.
- Continuous animation behind dense reading surfaces.
- Motion that shifts layout or hides controls.

## 7. Content & Voice

<!-- 记录 UI 文案风格、语言选择、错误信息和空状态原则。 -->

- UI copy should be short and action-oriented.
- Error messages should say what failed and what the user can do next.
- Empty states should name the missing content, not explain the product.
- Do not put design rationale or feature marketing copy inside operational UI.

## 8. Assets & Brand

<!-- 记录品牌识别、图片/图标/插画/视频/音频资源的使用边界。 -->

- Brand signals: ...
- Primary visual assets: ...
- Icon style: ...
- Asset source of truth: ...
- Licensing or attribution notes: ...

## 9. Accessibility & Responsiveness

- Keyboard navigation covers all interactive controls.
- Focus states are visible and consistent.
- Text and controls meet contrast requirements for their context.
- Touch targets are large enough on mobile.
- Layout supports narrow, regular desktop, and wide desktop viewports.

## 10. Anti-patterns

Do not do:

- Add a landing-page hero when the product needs a usable work surface.
- Use decorative gradients, orbs, bokeh, or glass effects without product meaning.
- Compress long text into buttons, cards, table cells, or grid tiles.
- Add a new route or modal without checking existing surfaces first.
- Create placeholder UI without tokens, states, or real content behavior.
- Commit `.od/` runtime data.

## 11. Validation Checklist

Before shipping a visible change:

- The implementation follows the tokens and component rules above.
- Text fits in all supported viewports.
- Empty, loading, error, disabled, and success states are covered where relevant.
- Visual hierarchy matches the primary user workflow.
- Screenshots or browser checks were captured for material UI changes.

## Change Log

| Date | Change | Notes |
|------|--------|-------|
| YYYY-MM-DD | Initial design entry | Based on existing product, UI, brand, or DX evidence. |
