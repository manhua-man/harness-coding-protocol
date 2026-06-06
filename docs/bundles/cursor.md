# Cursor Bundle

目标环境：Cursor 或 Cursor 风格的 IDE 代理。

**支持的 Run Contract：** 1.0（见 `../run-contract.md`）。

**Onboarding：** 从 Git 安装 harness-coding-protocol 插件，然后在 IDE 里跑 **`/harness-init`**（不是 `npm install`）。

本 bundle 的权威列表、必要映射、Bundle Rule 继承自 `./README.md`。下面只列环境特定的差异。

## Phase Capability Matrix

| 阶段           | 覆盖    | 说明                                                                            |
| -------------- | ------- | ------------------------------------------------------------------------------- |
| Grounding      | Full    | 编辑前用 IDE 搜索、打开的文件与诊断信息打底。                                   |
| Planning       | Full    | 范围较广时计划对用户可见。                                                      |
| Implementation | Full    | 走 IDE 原生精准编辑；避免无关文件抖动。                                         |
| Verification   | Partial | 诊断始终可用；测试/构建依赖集成终端访问能力。                                   |
| Reporting      | Full    | 说明改了什么、验证了什么。                                                      |

## Tool Capability Matrix

| 能力         | 支持    | 说明                                                              |
| ------------ | ------- | ----------------------------------------------------------------- |
| 文件读       | Yes     | 编辑前检视相关文件与项目结构。                                    |
| 文件写       | Yes     | 优先 IDE 原生精准编辑。                                           |
| Shell 命令   | Partial | 仅在可用且合适时使用集成终端。                                    |
| 浏览器自动化 | Partial | 通常需要额外配置；IDE 代理本身不假设拥有此能力。                  |
| 网络访问     | Partial | 取决于当前环境与用户权限。                                        |
| 测试/构建    | Partial | 终端可用时跑项目原生命令。                                        |
| 用户确认     | Yes     | 在破坏性、敏感或外部可见动作前停下。                              |
| 后台作业     | Partial | 取决于 IDE 与扩展支持。                                           |

## 降级行为

- 无终端访问：用编辑器诊断与人工 review，并报告命令检查被跳过。
- 无浏览器访问：不得宣称交互式 UI 验证。
- IDE 建议与 run contract 冲突时：以 run contract 为准。
