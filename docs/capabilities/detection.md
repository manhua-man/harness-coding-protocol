# Grounding 能力（C1 Grounding）

## 目的

`/harness-init` Phase 1。Agent 直接读取目标仓库证据，识别：

- 技术栈（Node、Python 等）
- 框架（React、NestJS 等）
- 已有 AI 工具痕迹（`.cursor`、`.claude` 等）
- 仓库形状（monorepo、单包、layered）
- 可发现的命令、manifest、配置与根级真值文件
- 可见体验面证据（UI、前端、游戏、文档站、插件界面、设计系统、组件库、视觉资源、CSS/theme tokens、DX 体验等）

Grounding 是**用户路径上的 agent-native 流程**。它不要求 Node.js、npm、npx、tsx 或目标项目具备某种技术栈。它给后续 Drafts 划下事实底线（Sanity_Floor）：Draft 中关于语言、框架、包管理器、仓库形状、AI 工具痕迹的描述必须由 Agent 读到的文件证据支持。

## 实现

- `.claude/skills/harness-init/SKILL.md` — 用户路径权威：Phase 1 由 Agent 读 repo 并形成内部 `Grounding_Summary`
- `templates/auto-detect/detector.ts`、`scripts/harness-detect.mjs` — 维护者 smoke / fixture 工具，非用户 onboarding 依赖

## 输出

- 用户路径：内存中的 `Grounding_Summary`，不落盘，不伪造成 `detection.json`
- 维护者脚本：仍可产生 `.harness/runs/<detect-run-id>/{detection.json, manifest.json}` 用于 smoke、fixture、回归检查

## Agent 使用方式

`/harness-init` 期间：

1. 列出并读取目标仓库中的 README、manifest、配置、现有 Root_Truth_Files、AI 工具痕迹和必要的目录结构。
2. 形成内部 `Grounding_Summary`：repo shape、stacks、frameworks、package managers、AI tool traces、design-surface evidence、existing root-truth files、evidence paths。
3. 在 Phase 3（Judge & Write）持续把 Draft 与 `Grounding_Summary` 和证据路径做 Sanity_Floor 自检。
4. 如果用户只要求查看 grounding，向用户解释读到了什么，然后停止。

## 不在范围内

- 要求用户安装 Node/npm/npx/tsx
- 要求目标项目具备 `package.json`
- Agent 自行合成或编辑 `detection.json`
- 推荐 MCP 服务器或 bundle（已弃用）
