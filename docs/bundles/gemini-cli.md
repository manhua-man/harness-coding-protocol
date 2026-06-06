# Gemini CLI Bundle

目标环境：Gemini CLI 或 Gemini 风格的终端编码代理。

**支持的 Run Contract：** 1.0（见 `../run-contract.md`）。

**Onboarding：** 从 Git 安装 harness-coding-protocol 插件，然后在 IDE 里跑 **`/harness-init`**（不是 `npm install`）。

本 bundle 的权威列表、必要映射、Bundle Rule 继承自 `./README.md`。下面只列环境特定的差异。

## Phase Capability Matrix

| 阶段           | 覆盖    | 说明                                                          |
| -------------- | ------- | ------------------------------------------------------------- |
| Grounding      | Full    | 计划前先看文件、配置与测试。                                  |
| Planning       | Full    | 大或高风险改动先说明思路。                                    |
| Implementation | Full    | 仅修改必要文件。                                              |
| Verification   | Partial | 测试/构建受 shell 权限制约；缺口必须报告。                    |
| Reporting      | Full    | 总结编辑、验证、残留风险。                                    |

## Tool Capability Matrix

| 能力         | 支持    | 说明                                                          |
| ------------ | ------- | ------------------------------------------------------------- |
| 文件读       | Yes     | 计划编辑前进行仓库检视。                                      |
| 文件写       | Yes     | 优先精准编辑，保留无关改动。                                  |
| Shell 命令   | Partial | 取决于 CLI 权限与本地环境。                                   |
| 浏览器自动化 | Partial | 不默认假设；需配置浏览器工具。                                |
| 网络访问     | Partial | 取决于运行时配置。                                            |
| 测试/构建    | Partial | 当 shell 执行可用时跑项目原生检查。                           |
| 用户确认     | Yes     | 风险动作前必须确认。                                          |
| 后台作业     | Partial | 取决于 CLI 支持。                                             |

## 降级行为

- shell 执行受限：不得宣称测试已通过。
- 无网络：仅依赖本地资料，并报告外部事实未核查。
- CLI 无法干净地请求确认：在需要确认的动作前停下。
