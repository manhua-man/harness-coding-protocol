# Claude Code Bundle

目标环境：Claude Code 风格的仓库代理。

**支持的 Run Contract：** 1.0（见 `../run-contract.md`）。

**Onboarding：** 从 Git 安装 harness-coding-protocol 插件，然后在 IDE 里跑 **`/harness-init`**（不是 `npm install`）。

本 bundle 的权威列表、必要映射、Bundle Rule 继承自 `./README.md`。下面只列环境特定的差异。

## Phase Capability Matrix

| 阶段           | 覆盖    | 说明                                                                       |
| -------------- | ------- | -------------------------------------------------------------------------- |
| Grounding      | Full    | 编辑前进行定向阅读与项目搜索。                                             |
| Planning       | Full    | 高风险或大范围工作给出用户可见的简洁计划。                                 |
| Implementation | Full    | 使用 patch 风格编辑；保留无关用户改动。                                    |
| Verification   | Partial | 沙箱允许时跑项目原生测试/构建；否则报告缺口。                              |
| Reporting      | Full    | 总结变更文件、验证情况、残留风险。                                         |

## Tool Capability Matrix

| 能力         | 支持    | 说明                                                                |
| ------------ | ------- | ------------------------------------------------------------------- |
| 文件读       | Yes     | 编辑前做定向仓库检视。                                              |
| 文件写       | Yes     | 优先 patch 风格编辑，保留无关用户改动。                             |
| Shell 命令   | Partial | 当可用时使用项目原生命令，遵守沙箱与审批限制。                      |
| 浏览器自动化 | Partial | 仅当 harness 暴露了浏览器工具时可用。                               |
| 网络访问     | Partial | 仅在浏览能力可用且确有需要时核查外部事实。                          |
| 测试/构建    | Partial | 项目暴露相应入口时跑聚焦检查。                                      |
| 用户确认     | Yes     | 在破坏性、敏感或外部可见动作前停下。                                |
| 后台作业     | Partial | 仅使用 harness 支持的后台或自动化机制。                             |

## 降级行为

- 无 shell 访问：仅做文件检视，并报告测试未运行。
- 无浏览器访问：不得宣称运行时 UI 行为已验证。
- 无确认通道：在风险动作前停下。
