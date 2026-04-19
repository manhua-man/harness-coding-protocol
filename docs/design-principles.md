# 设计原则

Harness Coding Protocol v2 的目标不是继续堆更多理念，而是把 AI 协作规则做成**可安装、可解释、可校验**的仓库入口层。

## 1. 真值最少化

仓库对外只暴露三类规范真值：

- 根级 `AGENTS.md`：项目事实
- 根级 `CLAUDE.md`：协作协议
- 根级 `steering/`：局部覆盖

这样做的目的是减少“同一条规则在三个地方各写一遍”的漂移。

## 2. 工具适配隔离

`.cursor/rules/`、`.kiro/steering/` 等工具目录不再承担真值职责，只承担**兼容镜像**职责。  
规范文档始终指向根级真值，工具私有路径通过 `templates/adapters/` 和安装脚本生成。

## 3. 安装闭环优先于理念扩展

v2 优先解决：

- 文档与仓库结构一致
- macOS / Linux / Windows 都能安装
- 已有项目可安全应用模板
- 安装结果可以被自动校验

在此基础上，Karpathy 原则与 RIPER-5 作为方法论被保留，但不再主导 README 的前半部分。

## 4. 冲突顺序显式化

所有工具与文档统一遵循以下优先级：

1. User instruction
2. Repository root `AGENTS.md`
3. Repository root `CLAUDE.md`
4. Matching `steering/*.md`
5. Tool adapter files

这样可以让人类、AI 和 IDE 对“到底听谁的”有一致认知。

## 5. 示例优先于空模板堆积

模板告诉用户“应该写什么”，示例告诉用户“写完长什么样”。  
因此 v2 把 `examples/` 提升到仓库顶层，明确分成：

- `examples/minimal/`：最小可用
- `examples/complete/`：完整范式

## 6. 校验优先于口头约定

任何写进 README、模板和脚本的路径，都应该可以被脚本验证。  
`scripts/validate-template.mjs` 的存在，是为了把“减少漂移”从理念变成可执行约束。
