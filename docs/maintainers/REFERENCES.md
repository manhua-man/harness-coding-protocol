# External References

Maintainer bibliography for agent entry docs (`AGENTS.md`, `CLAUDE.md`, skills, steering).  
Not shipped to target repos. Not plugin user documentation.

| Date added | Source | URL |
| --- | --- | --- |
| 2026-09 | Eric Provencher — *Rethinking skills and prompts for GPT-6 Astra* | https://x.com/pvncher/status/2095991462416490862 |
| 2026-09 | OpenAI — *Using GPT-6 Astra* (prompting best practices) | https://developers.openai.com/api/docs/guides/latest-model?model=gpt-6-astra |
| 2026-09 | 逸尘 — 入口文档冲突审计提示词 | https://x.com/gengdaJ/status/2096078342332227939 |

---

## Provencher — Rethinking skills and prompts for GPT-6 Astra

**Context:** Coding agents improved quickly; instructions accumulated to steer weaker models may now hurt stronger ones. Applies to Skills, `AGENTS.md`, and task prompts alike.

**Skills**

- Too many skills bloat context; Codex may truncate descriptions, making routing worse.
- Descriptions that are too long or too eager (“pick me”) cause wrong skill loads and contradictions.
- Good skill description: **as short as possible**, clear **when** to use — not “anything touching a database.”
- **Progressive disclosure:** root `SKILL.md` is a router; workflows and scripts live deeper. Do not force-read irrelevant detail up front.
- Avoid elaborate step-by-step recipes; models handle nuance better now.
- Repo skills may be used by **different models**; rules that helped one model may over-constrain another.

**AGENTS.md**

- `AGENTS.md` applies on **every** task in the repo — revisit each line: does a typo fix still need it?
- Requiring a full doc stack or repo map before every edit is excessive.
- Pointing to docs can still help when **contextual**; keep human docs updated.
- Old “please run tests / verify your work” nudges may cause **unnecessary testing** on capable models.
- Astra can be **more tentative** about how far to take work; permission for safe local workflows helps (e.g. disposable fixtures, rerun affected tests without per-step approval).

**Decision boundaries & persistence**

- Strong “ask first” language written for reckless older models may block work you would approve.
- Define **completion** up front: implement → verify → fix failures, if that is the scope.
- Stopping for review after first implementation pulls the model toward earlier exit — only require that when you actually need it.
- Good opportunity to **audit and delete** stale instructions.

---

## OpenAI — Using GPT-6 Astra (prompting best practices)

**Instruction following**

- Astra is **more sensitive** to instructions in skills and entry files such as `AGENTS.md`. **Audit** those files for behavior-shaping text.
- User instructions should **take precedence** over skill guidelines when they conflict.
- If a skill causes pause, incomplete work, or unwanted confirmation, the model should **name the skill file and quote the instruction**.

**Initiative and follow-through**

- Astra may ask clarifying questions where older models guessed; can feel like stopping early.
- Prompt for **action bias** when the user’s wording implies authorization (“can you…”, “help me…”).
- Do reversible / read-only / already-authorized work **before** asking for approval on concrete outcomes.
- Approval should often be the **last step** (e.g. deploy after the change is built and reviewable).

**Testing and verification**

- Astra tends to be thorough; small tasks may get broader tests than needed.
- Calibrate: run tests **appropriate to the change**; broaden only when failures or risk justify it.
- Do not write tests for trivial reversible changes “because the doc says always test.”

**Other notes (harness-agnostic)**

- Personality: tends toward lists/tables/markdown — specify prose style if you care.
- Subagent delegation: may delegate less than desired unless prompted; tune only if your harness supports it.
- Writing: optional prompts in the doc reduce slop phrases and contrastive “X not Y” framing.

---

## 逸尘 — 入口文档冲突审计提示词

**Use when:** New model generation, or agents feel “怂”、反复确认、做到一半就停。Open a **new session** at the target repo root.

**审计提示词（原文摘录）**

```text
审阅我的 AGENTS.md 文件和Skill，寻找不清晰的、冲突的或重叠的指令，这些指令可能会让你不必要地停止、要求多余的确认，或者让工作不完整。

特别注意关于自主性、澄清、批准和任务完成的规则。将有意设置的保障措施与那些意外地让常规工作需要确认的措辞区分开来。

对于每个问题，引用相关的指令，识别文件，解释它们如何可能影响你的行为，并提出具体的编辑建议。

保留明确的批准要求，并指出任何提议的变更会扩展你的权限。优先考虑那些会带来最大实际差异的变更。在更改任何文件之前，提出供审阅的编辑建议。
```

**Report each finding with**

1. Exact quote + file path  
2. Likely behavioral effect  
3. Label: **intentional safeguard** (keep) vs **accidental friction** (narrow or remove)  
4. Minimal edit proposal; flag any change that **expands** agent permissions  

**Do not treat as friction:** production deploy, payments, migrations, auth/session, destructive ops, domain skills with legal/safety boundaries.

---

## Cross-source themes (for maintainers)

These three sources agree on several points without needing a separate implementation doc:

| Theme | Rough consensus |
| --- | --- |
| Subtract stale always-on rules | Re-audit after model upgrades; deletion is as important as addition |
| Task-scoped reading | Do not require full entry-doc pre-read before small reversible edits |
| Skills | Fewer, shorter descriptions; router roots; no overlapping triggers |
| Approval | Intentional gates for high-risk work; avoid blanket “always ask” |
| Completion | Say what “done” means; avoid stopping at plan or first pass |
| Testing | Proportional to risk, not blanket full suite |
| Conflicts | Same topic should not live in AGENTS, CLAUDE, always-steering, and skills |

Implementation lives in `templates/`, `ai-ide/skills/`, and target-repo edits — not in this file.

---

## Community practice (no single URL)

Observed when teams slim entry docs after a model generation shift:

- **Always-on budget** — Treat every line in root `AGENTS.md` / `CLAUDE.md` and `always` steering as paid on every task; delete or narrow before adding.
- **Skill description diet** — Descriptions often shrink from thousands of characters to a few hundred without losing routing quality; recipe steps move downstream.
- **One owner per topic** — Same rule in AGENTS, CLAUDE, always-steering, and skills is worse than one good owner plus links.
- **Subtract-first maintenance** — `/revise-ai-docs` and steward audits should merge, narrow, or delete before adding new bullets.
- **Gate tiering** — Mandatory fail-closed vs user-invoked production ops vs on-demand audits; never flatten all review skills into a pre-commit checklist in `AGENTS.md` or `CLAUDE.md`.

This is maintainer context only; do not copy environment-specific toolchains (chat ops, browser automation, single-file mega-AGENTS) into harness molds.
