---
name: pipeline-quality-audit
description: >-
  Audit and improve a media/AI-generation pipeline's output quality using a
  layered methodology: code-level hard gates first (pre-flight checks,
  post-render dead-frame detection, delivery contracts), then prompt
  engineering, then asset utilization, then model/LoRA tuning. Use when
  generated output is bad (black frames, static shots, drift, style
  inconsistency), when a pipeline "succeeds" but produces garbage, or when
  planning quality improvements. Applies the methodology, not a preset stack.
---

# Pipeline Quality Audit (管线质量审计)

生成管线的核心问题不是"能不能跑"，而是"跑出来的东西能不能用"。本 skill 提供一套
分层排查方法论：**先代码刚性门禁，再 Prompt，再资产，最后模型微调**。

> 核心原则：**代码 > 文本**。LLM 有自我合理化倾向（把黑屏粉饰成"暗黑意境"，
> 把静止死图吹成"质感纯正"）。只有 `raise` 抛错拦得住，文本规范拦不住。

## 质量瓶颈分布（经验值）

```
输入质量（Prompt）      ~30%   文学化 vs 工业级指令
过程控制（管线门禁）    ~40%   无前置拦截 / 无后置检测 / 无资产锚点
模型能力（底层）        ~30%   Turbo 坍缩 / 无风格 LoRA / 参考图利用率
```

## 四层排查法（按顺序执行，每层做完再进下一层）

### 层 1：代码刚性门禁（最高优先级）

**1a. 前置静态拦截（Pre-flight）**
- 生成前检查输入是否满足物理约束，fail-closed（不合格抛异常，不浪费算力）
- 通用规则：
  - R1 主体存在：有没有可拍的东西（主体/场景至少一个明确描述）
  - R2 运动存在：镜头运动/主体动作/环境动态至少一个
  - R3 首帧约束：首帧不能是黑屏/空场（视频模型整体生成，首帧黑=全黑）
  - R4 风格一致：镜头风格 vs 项目风格锚（warn）
  - R5 介质偏好：声明通道 vs 实际可用（warn）
- 实现参考：`h3pipe/preflight.py`（R1-R5 + ManjuPreflightReport + fail-closed）

**1b. 后置废片检测（Post-render barrier）**
- 生成后、交付前检测废片，硬阻断（raise），绝不"exit 0 但产出垃圾"
- 黑帧检测：ffmpeg `blackdetect` 滤镜
  - `pix_th` = 像素亮度阈值（低于此值算黑，范围 0-1，默认 0.1）
  - `pic_th` = 画面黑像素占比阈值（超过此比例判定黑帧，默认 0.98）
  - 黑帧占比 > 30% → `raise DeadFrameError`
- **参数陷阱**：新版 ffmpeg 的 `pix_th` 是亮度阈值不是占比，`pic_th` 才是占比。
  搞反会误伤所有暗调视频（暗调 avg 亮度 0.08 会全被判黑）。
- 静态格豁免：`animation_level=static` 的镜头跳过运动检测（静态是设计意图）

**1c. 交付契约（Delivery contract）**
- 分辨率、fps、时长、音频轨存在性校验（`validate_delivery_contract`）
- 缺啥补啥，缺的检测项就是可能的"废片漏网"

### 层 2：Prompt 工程

**2a. 高能动词规范**
- 错误（文学化）：`0-2秒纯黑；第2秒钟响；最后1秒灰尘`
- 正确（工业级）：`俯冲穿透雷云，镜头推向王座巨神，战旗猎猎撕扯，暗金火光爆燃`
- 三要素：三维实体主体 + 明确物理动词 + 强摄像机轨迹

**2b. 提示词规则库（可沉淀为 schema 校验）**
- 禁止：时间轴语法（`0-2秒`）、抽象情绪词、伪代码、代码围栏
- 要求：`Motion Type + Amplitude + Speed` 句式、镜头结尾画面稳定描述
- 负向词正向转译（无 Negative Prompt 接口时）

**2c. 常见失败模式**
- 黑屏坍缩：首帧黑/空 + 低运动 → 整段 latent 坍缩
- 静止死图：无运镜无动作 → Turbo 偷懒成静态照片
- 风格漂移：镜头风格不统一 → 缺风格锚

### 层 3：资产利用

**3a. Anchor-First（锚点优先）**
- 有核心视觉资产（Key Art/原画）的镜头，自动用资产做 first_frame 锚点（FL2VA），
  别让模型从零瞎猜
- 检查：Prompt 镜头是否闲置了项目资产？

**3b. 资产完整性与一致性**
- 检查资产是否齐全（脚本验证），是否存在"一张图多份"（同 size 可疑）
- 资产图要锁定角色特征（脸/服装/道具），供 Ref2VA 引用

**3c. 参考图分层**
- Ref2VA 双图在"宏大场景+微小人物"时注意力不均（脸 5% 衣服 20% 背景 75%）
- 按镜头景别挑 2-4 层参考（身份/服装/表情），不超插槽上限

### 层 4：模型与微调（最高成本，最后做）

**4a. Turbo 坍缩规避**
- 蒸馏模型（8 步）先验压缩，缺剧烈运镜时易坍缩
- 关键镜头走 Base（22 步），普通镜头 Turbo
- 动作强度三档自适应（LOW/MEDIUM/HIGH → 步数/分辨率）

**4b. 风格 LoRA**
- 通用模型权重偏写实/通用，风格化需要 LoRA 压制先验
- 用项目资产 + 风格板训练专属 LoRA

**4c. 注意力优化**
- 参考图按主体拆分，避免信息冲突

## 排查流程（面对"质量差"时）

1. **先找废片证据**：拿实际产出跑黑帧/静止检测，确认"是不是真废"（不要凭感觉）
2. **定位层**：废片 → 层 1；能看但丑 → 层 2/3；都行但不像 → 层 4
3. **代码先于文本**：任何"应该拦截 X"的需求 → 先写代码抛错，再写文档
4. **验证清单**：
   - [ ] 黑帧检测能拦住已知废片（用历史废片验证）
   - [ ] 检测不误伤正常产出（用正常片验证）
   - [ ] 阈值保守（宁可漏拦不可误杀，除非明确）
   - [ ] 前置检查 fail-closed
   - [ ] 交付契约覆盖分辨率/fps/时长/音频

## 连贯性三前提（跨镜头一致性，2026-08-21 实战）

"镜头间连贯"不会因为管线支持 FL2VA 就自动成立。真实生成暴露：三个前提缺一不可，
任何一个不满足，所谓"连贯"都是假象。

**前提 1：统一画幅契约（aspect ratio）**
- 现象：shot_007 是 960x544（16:9），shot_008 是 736x736（1:1）——画幅不同，
  FL2VA 接力毫无意义（横图塞进方图，比例变形）。
- 根因：管线从不注入 aspect_ratio，模板默认各跑各的（不同模板默认画幅不同）。
- 修法：从 storyboard production.target_aspect_ratio 读取，注入 ResolutionSelector
  节点，全片强制同一画幅。**坑**：ResolutionSelector 的 COMBO 值要精确匹配模板
  选项（如 ComfyUI 0.33.0 是 `9:16 (Portrait Widescreen)`，不是 `9:16 (Portrait)`），
  用 MCP `validate_workflow` 验证，`unknown_enum_value` 一抓一个准。

**前提 2：FL2VA 首帧锁定（不是"参考后重画"）**
- 现象：FL2VA 把前一镜头 last_frame 当"参考"喂给下一镜头，模型自由发挥重画，
  画面只是"风格相似"，不是"画面延续"。
- 正确语义：下一镜头的首帧 = 前一镜头的末帧（像素级），模型在锁定首帧上续画。
- 验证：对比输入锚（shot_N 末帧）vs 输出首帧（shot_N+1）像素差——
  <5/255 才算真连贯（实测 3.6/255），>20/255 说明是"参考后重画"。

**前提 3：分辨率/时长契约**
- 除了画幅，分辨率（megapixels）和时长也要统一，否则首帧继承后画面比例对不上。
- 时长用 H3 的 17k+5 帧网格对齐（duration snap）。

**验证清单（连贯性专项）**
- [ ] 所有镜头输出分辨率一致（ffprobe/cv2 逐个查）
- [ ] FL2VA 接力镜头：输入锚 vs 输出首帧像素差 < 5/255
- [ ] aspect_ratio 值通过 MCP validate_workflow（无 unknown_enum_value）
- [ ] 参考图数量 ≤ 模板实际槽数（capabilities 要与真实模板对齐，不能拍脑袋写 9）

## 常见陷阱

1. **把文本规范当门禁**：SKILL.md 写"黑屏应拦截"≠ 代码 raise。LLM 会自我合理化绕过文本。
2. **参数语义搞反**：ffmpeg `pix_th`（亮度阈值）vs `pic_th`（占比）—— 搞反误伤所有暗调。
3. **误伤静态格**：运动检测不豁免静态镜头 = 杀光所有漫画 2.5D。
4. **阈值过严**：黑帧 30% 阈值是保守值；调太低会误伤暗黑风格（黑魂风 avg 亮度可低至 20/255）。
5. **先优化模型再修门禁**：顺序反了。先保证"不产出垃圾"，再追求"产出更好"。
6. **资产闲置**：有 Key Art 不用，让模型从零猜 = 浪费最高质量的信息。

## 落地产物建议

- 前置检查模块：`preflight.py`（规则 + 报告 + fail-closed）
- 后置检测模块：`postprocess.py` 里加 `detect_black_frames` + `assert_no_dead_frames`
- 质量路线图文档：QUALITY_ROADMAP.md（方向 × 优先级 × 依赖）
- 资产检查脚本：`check_assets.py`（齐全性 + 同图检测）

## 试炼案例

- 2026-08-21 minimax-h3-pipeline：5 秒纯黑视频被 approved.yaml 宣布成功（exit 0）——
  根因是无后置黑帧检测 + LLM 把黑屏粉饰成"暗黑意境"。
  修复：`assert_no_dead_frames`（blackdetect，99.3% 黑 → 拦；暗调正常片 0% → 放行）。
