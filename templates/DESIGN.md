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

# DESIGN.md (Design · 设)

> This file is **Design (设)**: it answers "what should this product, interface, or developer experience look and feel like?"  
> Engineering facts: `AGENTS.md`; collaboration protocol: `CLAUDE.md`; local rules: `steering/`.

`.od/` (when using Open Design local tools) is a runtime directory for SQLite, sessions, previews, and temp artifacts — **not committed to Git**. Visual, interaction, or experience conclusions that should persist go in this file; product assets go in `assets/` or project-convention directories.

If the project has no graphical UI, this file can still record design principles for CLI, API, doc sites, plugins, or developer experience. Do not put verifiable engineering facts, commands, ports, or module inventories here.

---

## 1. Design Intent

<!-- 2-4 sentences on product tone, target users, core experience, and non-goals. -->

- **Audience:** ...
- **Primary experience:** ...
- **Design adjectives:** ...
- **Not this:** ...

## 2. Color

<!-- Record color semantics, not just values. Values should match CSS / Tailwind / design tokens. -->

| Role | Token | Usage |
| --- | --- | --- |
| Background | `bg` | Full-page base |
| Surface | `surface` / `surface_raised` | Panels, tool areas, list containers |
| Text | `text` / `muted` | Body copy, secondary information |
| Accent | `accent` | Primary actions, links, focus |
| Success | `success` | Success, recovery, positive states |
| Warning | `warning` | Warnings, pending, risk hints |
| Danger | `danger` | Delete, failure, destructive actions |

Rules:

- Large backgrounds should serve content, not replace real state with abstract decoration.
- Semantic colors stay few and stable; explain purpose before adding new colors.
- Contrast beats atmosphere, especially for tables, forms, buttons, and errors.

## 3. Typography

<!-- Font stacks, density, heading style, code/numeric typography rules. -->

- UI text: system sans.
- Code, paths, IDs, slugs, hashes: mono.
- Headings: short, factual, matched to container size.
- Dense operational surfaces should favor scanability over hero-scale type.

## 4. Spacing & Layout

<!-- First screen, primary nav, panel relationships, responsive strategy, fixed-format elements. -->

- First screen: ...
- Primary navigation: ...
- Main work surface: ...
- Responsive behavior: ...
- Fixed-format elements that need stable dimensions: ...

Rules:

- Do not nest cards within cards across page sections.
- Hover, selected, loading, disabled states must not cause layout shift.
- On mobile, prioritize text overflow, button squeeze, and unobstructed primary actions.

## 5. Components

<!-- Existing or preferred component language in the project. -->

| Component | Usage | Notes |
| --- | --- | --- |
| Primary action | Key advance, save, confirm | High contrast; not text-only emphasis |
| Secondary action | Back, cancel, light toggle | Low visual weight |
| Data table / list | Scannable information sets | Stable column width, sort, empty states |
| Dialog / sheet | Blocking confirm or local edit | Clear close path |
| Toast / inline feedback | Success, failure, save state | Short copy; state next step |

States to define: default, hover, active, focus, disabled, loading, empty, error.

## 6. Interaction & Motion

<!-- Motion for feedback, transitions, and state change only — not filler. -->

Recommended:

- Short opacity, transform, and color transitions.
- Clear feedback for saves, errors, completed actions, and state changes.
- Route or panel transitions that do not block reading or input.

Avoid:

- Decorative motion unrelated to product state.
- Continuous animation behind dense reading surfaces.
- Motion that shifts layout or hides controls.

## 7. Content & Voice

<!-- UI copy style, language choice, errors, empty states. -->

- UI copy should be short and action-oriented.
- Error messages should say what failed and what the user can do next.
- Empty states should name the missing content, not explain the product.
- Do not put design rationale or feature marketing copy inside operational UI.

## 8. Assets & Brand

<!-- Brand identity, image/icon/illustration/video/audio usage boundaries. -->

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
| --- | --- | --- |
| YYYY-MM-DD | Initial design entry | Based on existing product, UI, brand, or DX evidence. |
