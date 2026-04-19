# v1 到 v2 迁移指南

v2 是一次直接升级，不保留 v1 兼容入口。

## 目录迁移

| v1 | v2 |
|----|----|
| `templates/AGENTS.md` | `templates/root/AGENTS.md` |
| `templates/CLAUDE.md` | `templates/root/CLAUDE.md` |
| `templates/rules/` | `templates/adapters/cursor/rules/` |
| `templates/examples/` | `examples/` |
| `templates/workflow/` | 已移除 |

## 规范路径变化

v1 中容易混淆的点是：文档写 `steering/`，但脚本把规则复制到 `.kiro/steering/`。  
v2 明确规定：

- 规范真值路径永远是根级 `steering/`
- `.kiro/steering/` 和 `.cursor/rules/` 只在用户显式启用 adapter 时生成

## 安装命令变化

### v1

```bash
bash scripts/apply-template.sh /path/to/project
```

### v2

```bash
bash scripts/apply-template.sh /path/to/project --with-cursor --with-kiro --example complete
```

Windows:

```powershell
powershell -File scripts/apply-template.ps1 C:\path\to\project --with-cursor --with-kiro --example complete
```

## 覆盖策略

v2 引入统一的文件处理策略：

- `--skip-existing`：跳过已有文件
- `--overwrite`：覆盖已有文件
- `--backup`：覆盖前先备份已有文件

默认策略是 `--skip-existing`。

## 校验命令

v2 新增：

```bash
node scripts/validate-template.mjs /path/to/project
```

它会检查：

- 根级 `AGENTS.md` / `CLAUDE.md` / `steering/`
- `README.md`、`CLAUDE.md`、`AGENTS.md` 中的仓库相对路径引用
- adapter 所需模板是否齐备

## 发布元数据说明

v2 保留两个元数据文件，但职责更清晰：

- 根级 `plugin.json`：仓库分发与打包元数据
- `.claude-plugin/plugin.json`：Claude Code 插件描述文件
