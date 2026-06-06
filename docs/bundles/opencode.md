# OpenCode Bundle

目标环境：OpenCode 或 OpenCode 风格的编码代理。

**支持的 Run Contract：** 1.0（见 `../run-contract.md`）。

**Onboarding：** 从 Git 安装 harness-coding-protocol 插件，然后在 IDE 里跑 **`/harness-init`**（不是 `npm install`）。

本 bundle 的权威列表、必要映射、Bundle Rule 继承自 `./README.md`。下面只列环境特定的差异。

## Phase Capability Matrix

| 阶段           | 覆盖    | 说明                                                          |
| -------------- | ------- | ------------------------------------------------------------- |
| Grounding      | Full    | 编辑前核查仓库。                                              |
| Planning       | Full    | 复杂工作走与风险匹配的计划。                                  |
| Implementation | Full    | 作用域明确、风格一致的编辑。                                  |
| Verification   | Partial | 允许时跑项目原生检查；否则报告验证缺口。                      |
| Reporting      | Full    | 收尾给出变更文件、验证、风险。                                |

## Tool Capability Matrix

| 能力         | 支持    | 说明                                                          |
| ------------ | ------- | ------------------------------------------------------------- |
| 文件读       | Yes     | 编辑前核查仓库。                                              |
| 文件写       | Yes     | 用精准编辑，避免无关重写。                                    |
| Shell 命令   | Partial | 取决于沙箱、权限与本地命令健康度。                            |
| 浏览器自动化 | Partial | 默认不假设。                                                  |
| 网络访问     | Partial | 取决于环境配置。                                              |
| 测试/构建    | Partial | 在可能时跑项目原生检查。                                      |
| 用户确认     | Yes     | 在破坏性、敏感或外部可见动作前停下。                          |
| 后台作业     | Partial | 取决于代理支持。                                              |

## 降级行为

- 命令执行不可用：仅做静态检视并报告验证损失。
- 浏览器工具不可用：不得宣称 UI 运行时验证。
- 环境无法保留无关用户改动：在编辑前停下。
