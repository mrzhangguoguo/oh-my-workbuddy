# oh-my-workbuddy 系统性审查报告

> 审查对象：`oh-my-workbuddy`（WorkBuddy 版 skill 包）
> 对标基线：`oh-my-codex`（OMX 原版，Rust+TS monorepo）
> 审查范围：功能完整性 / 代码质量 / 配置与构建流程 / 性能 / 兼容性 / 文档与注释
> 审查日期：2026-07-08

---

## 0. 总体结论

| 维度 | 评级 | 一句话 |
|---|---|---|
| 功能完整性 | **B** | 46 个 skill 名 1:1 对齐，但 3 个 active/core skill 实质内容明显缺失 |
| 代码质量 | **A-** | lib/ 结构清晰、边界处理好，但缺单元测试 |
| 配置与构建流程 | **B-** | .omw/.workbuddy 约定混用是最大隐患 |
| 性能表现 | **A-** | 零运行时、sync 增量，sha1 全读可优化 |
| 兼容性 | **B** | `skill` 与内置 SkillManage 同名冲突需处理 |
| 文档与注释 | **B** | 双语 README + PORTING_GUIDE 到位，缺 CONTRIBUTING/CHANGELOG/CI |

**无致命问题**——包可正常 setup/doctor/sync，46 skill 全部安装、frontmatter 全过。问题集中在"核心 skill 内容厚度不足"和"运行时目录约定不统一"。

### 做得好的地方（先肯定）
- ✅ 46 个 skill 名称集合与 OMX **完全一致**（0 缺失 / 0 多余）
- ✅ frontmatter 校验 **46/46 通过，0 问题**
- ✅ `agent_created: true` 覆盖 **46/46**（SkillManage 可管）
- ✅ **无真正的 OMX 专属原语泄漏**——grep 命中全是"WorkBuddy 无 tmux，改用 TeamCreate/Agent"的说明性文字，非未翻译指令
- ✅ 16 个 deprecated shim 采用"精简重定向"策略，正确（非偷工）
- ✅ `omw sync` 对断链/瞬时坏条目做了容错（lstat + 跳过告警，不中断整批）
- ✅ `.gitignore` 正确忽略 `omw.config.json` / `.omw/` / `.workbuddy/` / `node_modules`
- ✅ agents/ 有 3 个实体文件（executor/architect/reviewer），manifest 登记有据
- ✅ 双语 README + `docs/PORTING_GUIDE.md` + `validate_frontmatter.js` 齐

---

## 1. 问题清单（按优先级排序）

### P1-1 ｜ 严重 ｜ `ralph` 丢失 State Management / PRD Mode / Background Execution Rules
- **证据**：core skill，ours 111 行 vs OMX 294 行（37%）。OMX 有 `## State Management`、`## PRD Mode`、`## Background Execution Rules`、`## Scenario Examples` 四节，ours 全无。ours 只有 Use When / Steps / Tool Usage / Completion Audit。
- **影响**：`ralph` 是**持久化自循环** skill，没有 State Management 等于没有"循环如何落地、如何续跑、如何后台跑"的规格——这是该 skill 的核心。
- **优化方案**：把 OMX 的 State Management（state 文件 schema + 续跑规则）、Background Execution Rules 翻译成 WorkBuddy 原语（`.workbuddy/memory` + Task 工具），补 PRD Mode 可选章节与 2–3 个 Scenario Examples。
- **优先级**：🔴 高（core skill 实质缺失）

### P1-2 ｜ 严重 ｜ `cancel` 丢失模式自动检测与规范化 post-conditions
- **证据**：active skill，ours 61 行 vs OMX 399 行（15%）。OMX 有 `## Auto-Detection`、`## Normative Ralph cancellation post-conditions (MUST)`、`## Messages Reference`、`## What Gets Preserved`、`## Implementation Steps`（含 --force/--all、active teams、autopilot cleanup）。ours 只剩 What It Does / Usage / Force / Notes。
- **影响**：OMX 里 cancel 是"退出任何模式的标准方式"，含 mode-detection + state cleanup + force/staleness 兜底。ours 几乎只剩骨架，无法指导真正的模式退出。
- **优化方案**：补 Auto-Detection（WorkBuddy 侧映射：检测 `.workbuddy/tasks/` 活跃团队、`autopilot` state JSON）、规范化 post-conditions、What Gets Preserved。Tmux Team Cleanup 节正确砍掉（无 tmux）。
- **优先级**：🔴 高（active + 高频退出路径）

### P1-3 ｜ 严重 ｜ `.omw/` 与 `.workbuddy/` 运行时目录约定混用
- **证据**：17 个 skill 引用 `.omw/`（ultragoal/design/pipeline/autoresearch/ask/deep-interview/plan/prometheus-strict/ralph/wiki/visual-ralph/team/ralplan/worker/performance-goal/autopilot/autoresearch-goal），45 个引用 `.workbuddy/`。同一包内两套产物目录并存。
- **影响**：WorkBuddy 原生运行目录是 `.workbuddy/`（memory/teams/tasks/skills 全在此），`.omw/` 是 OMX 衍生约定，WorkBuddy 不会自动管理 `.omw/`。skill 产物分散到两个目录，既不一致也让 WorkBuddy 的记忆/清理机制覆盖不到 `.omw/`。
- **优化方案**：统一到 `.workbuddy/`。区分两类用途：① 状态/记忆 → `.workbuddy/memory/`；② skill 专属快照 → `.workbuddy/<skill>/` 或 `.workbuddy/omw/<skill>/`。全仓把 `.omw/` 替换为统一路径，并在 PORTING_GUIDE 写死约定。
- **优先级**：🔴 高（一致性 + 兼容性，影响 17 个 skill）

### P1-4 ｜ 严重 ｜ `ralplan` 丢失 Scenario Examples 与 Pre-Execution Gate 深度
- **证据**：core skill，ours 71 行 vs OMX 203 行（34%）。OMX 的 `## Pre-Execution Gate` 跨 ~94 行，ours 仅几行；OMX 有 `## Scenario Examples`，ours 无。
- **影响**：`ralplan` 是共识规划（Planner→Architect→Critic），Pre-Execution Gate 是其关键关卡，过薄会导致 gate 判据不可执行。
- **优化方案**：补 Pre-Execution Gate 完整判据树 + 2–3 个 Scenario Examples。`## GPT-5.5 Guidance Alignment` 是模型专属内容，可合理省略并注明。
- **优先级**：🔴 高（core skill）

### P2-1 ｜ 一般 ｜ `skill` 与 WorkBuddy 内置 SkillManage 同名冲突
- **证据**：端口 skill 名为 `skill`，与 WorkBuddy 系统内置的 `skill`（SkillManage，管 list/create/modify/delete）**完全同名**。
- **影响**：skill 发现会同时命中两者，可能造成路由歧义或内置版覆盖端口版；端口版大量内容（skill 模板示例）与内置 SkillManage 功能重叠。
- **优化方案**：二选一——① 把端口版重命名为 `skill-authoring`（专注 skill 创作模板/质量规范），让日常管理交给内置 SkillManage；② 或在 SKILL.md 顶部注明"与内置 skill 互补、内置优先"，并删去重叠的 subcommand 段。
- **优先级**：🟡 中

### P2-2 ｜ 一般 ｜ `deep-interview` Phase 2（Socratic 循环）显著变薄
- **证据**：core skill，ours 250 vs OMX 579（43%）。结构 6 阶段全在，但 Phase 2 OMX ~180 行 vs ours ~70 行。
- **影响**：该 skill 的核心是"数学化歧义门控"，Phase 2 过薄可能导致门控判据欠规格化。`## Suggested Config` 缺失（影响小）。
- **优化方案**：补 Phase 2 的歧义判定阈值与提问策略细节。
- **优先级**：🟡 中

### P2-3 ｜ 一般 ｜ `code-review` 丢失 Scenario Examples + External Model Consultation
- **证据**：core skill，ours 174 vs OMX 308（56%）。双车道 workflow 在，但缺 `## External Model Consultation`（ask-claude/gemini 委托）与 `## Scenario Examples`。`## State/HUD Phase Contract` 也缺。
- **优化方案**：补 External Model Consultation（WorkBuddy 侧用内置 `ask` skill 委托本地 advisor CLI）、2 个 Scenario Examples。GPT-5.5 Guidance 可省略。
- **优先级**：🟡 中

### P2-4 ｜ 一般 ｜ AGENTS.md 作为 guidance surface 与 WorkBuddy 原生体系错位
- **证据**：`omw-setup` / `doctor` / `install.js` 都围绕 `AGENTS.md`（Codex 约定）做 guidance 写入；WorkBuddy 原生用 `.workbuddy/`（MEMORY.md / memory 日志 / SOUL.md 等）。
- **影响**：setup --with-guidance 写出的 AGENTS.md 是否被 WorkBuddy 识别未确认；可能形成"两套 guidance 体系"。
- **优化方案**：确认 WorkBuddy 是否消费 AGENTS.md。若否，把 guidance 落点改为 `.workbuddy/AGENTS.md` 或与 SOUL.md/USER.md 体系对齐，至少在文档注明"AGENTS.md 为跨工具可移植约定"。
- **优先级**：🟡 中

### P2-5 ｜ 一般 ｜ `configure-notifications` 步骤全在但整体变薄
- **证据**：active，ours 110 vs OMX 287（38%）。Step 1–7 结构完整，tmux/session 检查正确砍掉。
- **影响**：低——结构在，仅细节偏少。
- **优化方案**：可选补 1 个端到端示例与 webhook 调试片段。
- **优先级**：🟡 低-中

### P2-6 ｜ 一般 ｜ lib/ 无单元测试
- **证据**：`install.js` 的 `sync` 非平凡（符号链接保留 / sha1 比对 / prune / 坏条目容错），仅靠手动 3 次跑验证，无自动化测试。OMX 有 biome lint + 多套 test。
- **优化方案**：用 `node --test` 加 sync 的增量/幂等/prune/断链 4 个用例；加 `omw doctor` 一致性快测。
- **优先级**：🟡 中

### P2-7 ｜ 一般 ｜ 缺 CONTRIBUTING.md / CHANGELOG.md
- **证据**：OMX 有两者，ours 无。
- **影响**：开源后社区贡献无指引、版本演进不可追溯。
- **优化方案**：补 CONTRIBUTING.md（含 `node validate_frontmatter.js` 前置校验流程）+ CHANGELOG.md（记 0.1.0 首发 + sync/加厚/清包）。
- **优先级**：🟡 中

### P2-8 ｜ 一般 ｜ sync 用 sha1 全文件读取，无 mtime/size 快路径
- **证据**：`sync` 对每个文件 `readFileSync` 算 sha1 比对。对大 references 目录每次全量读。
- **优化方案**：先比 `mtimeMs + size`，不一致再算 sha1（快路径命中即跳过读取）。
- **优先级**：🟡 低-中

### P3-1 ｜ 建议 ｜ `skill` 丢失大量模板示例（非阻塞）
- 126 vs 836（15%）。核心 subcommand 参考在，缺的是 Custom Logger / Error / Workflow 模板示例。补 templates/ 脚手架后可缓解。

### P3-2 ｜ 建议 ｜ package.json scripts 缺 `sync`
- 新增了 `omw sync` 命令，但 `package.json` 的 `scripts` 未登记（只有 setup/doctor/list/validate）。补 `"sync": "node lib/cli.js sync"`。

### P3-3 ｜ 建议 ｜ cli.js 未知命令静默走 help、exit 0
- 输入拼错的命令不报错也不给非零退出码。建议未知命令打印"unknown command"并 `process.exit(1)`。

### P3-4 ｜ 建议 ｜ 缺 templates/ 脚手架与 .github CI
- OMX 有 `templates/` 与 CI（lint+test）。建议加 `templates/skill-template/` 与一个 PR 时跑 `validate_frontmatter.js` 的 GitHub Action。

### P3-5 ｜ 建议 ｜ README 未含 `omw sync` 说明
- 新增命令没进双语 README 的使用段。补一节。

### P3-6 ｜ 建议 ｜ sync 的 prune 不清理空目录
- `walkFiles` 只列文件，prune 删文件后留下空目录。低影响，可加空目录清理。

---

## 2. 严重级别统计

| 级别 | 数量 | 编号 |
|---|---|---|
| 致命 | 0 | — |
| 严重 | 4 | P1-1 ~ P1-4 |
| 一般 | 8 | P2-1 ~ P2-8 |
| 建议 | 6 | P3-1 ~ P3-6 |

## 3. 建议处理顺序

1. **先做 P1-3（统一 .omw→.workbuddy）**——影响 17 个 skill，机械替换、收益大、风险低，做完其他加厚才有干净的产物落点。
2. **P1-1 / P1-2 / P1-4（加厚 ralph/cancel/ralplan）**——三个 core/active skill 补实质内容，参照 OMX 章节翻译成 WorkBuddy 原语。
3. **P2-1（skill 改名或注明）**——解决与内置 SkillManage 的潜在冲突。
4. **P2-7 + P3-4（CONTRIBUTING/CHANGELOG/CI/templates）**——开源治理补齐。
5. 其余 P2/P3 按需迭代。

## 4. 验证基线（审查时已跑通）
- `node validate_frontmatter.js` → 46 OK / 0 问题
- `./omw doctor` → All enabled skills installed
- `./omw sync` → 幂等 + 增量往返通过
- `omw.config.json` 未被 git 跟踪（.gitignore 正确）
