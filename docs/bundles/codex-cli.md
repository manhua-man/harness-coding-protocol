# Codex CLI Bundle

目标环境：Codex 风格的 CLI 或桌面编码代理。

**支持的 Run Contract：** 1.0（见 `../run-contract.md`）。

**Onboarding：** 从 Git 安装 harness-coding-protocol 插件，然后在 IDE 里跑 **`/harness-init`**（不是 `npm install`）。

本 bundle 的权威列表、必要映射、Bundle Rule 继承自 `./README.md`。下面只列环境特定的差异。

## Phase Capability Matrix

| 阶段           | 覆盖    | 说明                                                                |
| -------------- | ------- | ------------------------------------------------------------------- |
| Grounding      | Full    | 在可用时使用快速搜索与定向阅读。                                    |
| Planning       | Full    | 计划与风险匹配；用户要求执行时即开干。                              |
| Implementation | Full    | 作用域清晰的 patch 编辑；保留无关改动。                             |
| Verification   | Partial | 拥有 shell 访问时跑项目原生检查；被跳过的检查必须点名。             |
| Reporting      | Full    | 简洁结果，含变更文件与验证状态。                                    |

## Tool Capability Matrix

| 能力         | 支持    | 说明                                                                  |
| ------------ | ------- | --------------------------------------------------------------------- |
| 文件读       | Yes     | 在可用时使用快速搜索与定向阅读。                                      |
| 文件写       | Yes     | 已纳入版控的源代码与文档优先 patch 编辑。                             |
| Shell 命令   | Partial | 受沙箱、审批与本地 shell 健康度限制。                                 |
| 浏览器自动化 | Partial | 仅在配置了浏览器工具或 skill 时可用。                                 |
| 网络访问     | Partial | 必要且被允许时用于核查最新事实。                                      |
| 测试/构建    | Partial | 当环境支持执行命令时跑项目原生检查。                                  |
| 用户确认     | Yes     | 破坏性、敏感、外部可见或高风险动作前必须确认。                        |
| 后台作业     | Partial | 仅使用受支持的自动化或长任务机制。                                    |

## 降级行为

- shell 损坏或不可用：仅在安全前提下做文件级编辑，并报告基于命令的验证未运行。
- 文件枚举受限：避免删除未知文件；通过创建权威文档约束未来清理。
- 无浏览：不得断言外部包或产品的最新事实。
