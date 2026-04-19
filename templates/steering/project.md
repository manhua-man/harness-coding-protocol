# 项目规则索引

分层规则索引：always / file-match / manual

---

## always（始终生效）

- `CLAUDE.md` - 主入口、核心原则
- `AGENTS.md` - 工具路由

---

## file-match（文件匹配时生效）

| 文件 | 规则 |
|------|------|
| `*.rs` | Rust 规范 |
| `*.py` | Python 规范 |
| `*.ts` / `*.tsx` | TypeScript 规范 |
| `.cursor/rules/*.mdc` | Cursor 会话规则 |

---

## manual（按需阅读）

| 文件 | 用途 |
|------|------|
| `steering/architecture.md` | 架构设计 |
| `steering/commands.md` | 命令表 |
| `steering/decision.md` | 决策原则 |
| `steering/workflows.md` | 可选工作流 |
| `steering/karpathy-examples.md` | Simplicity / Clarity / Surgical Changes / Testability / Explicit Deps |
| `docs/` | 详细文档 |

---

## 快速导航

```
项目根/
├── CLAUDE.md          # 必读入口
├── AGENTS.md          # 工具路由
├── .kiro/
│   └── steering/      # 规则目录
└── docs/              # 详细文档
```
