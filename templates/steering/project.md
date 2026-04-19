# Project Steering

> 这是 `steering/` 的索引示例，用来说明哪些规则适合放在局部覆盖层，而不是根级真值层。

## 何时放进 steering

- 只对某个技术栈或子目录生效的规则
- 项目局部上下文、临时约束、专题实践
- 不值得进入根级 `AGENTS.md` / `CLAUDE.md` 的补充说明

## 不该放进 steering 的内容

- 仓库总体结构、端口、命令等事实
- 全局冲突优先级
- 所有工具都必须遵守的核心协议

## 推荐文件

| Topic | File |
|-------|------|
| Shared coding examples | `steering/karpathy-examples.md` |
| Frontend guidance | `steering/frontend.md` |
| Backend guidance | `steering/backend.md` |
| Testing expectations | `steering/testing.md` |

## Quick Navigation

```text
project-root/
├── AGENTS.md
├── CLAUDE.md
├── steering/
├── .cursor/          # optional mirror output
└── .kiro/            # optional mirror output
```
