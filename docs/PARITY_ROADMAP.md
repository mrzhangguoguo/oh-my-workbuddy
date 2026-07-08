# 追平 OMX 整个工程基座：可行性与路线图

> 结论先行：**不要照搬 OMX 的 323K 行 TS + 14K 行 Rust**。那套工程基座的存在前提是"Codex CLI 是裸的、缺运行时"，所以 OMX 要自建多路复用/hook/mode/agent runtime。WorkBuddy 作为宿主平台，这些原生就有。"追平"的正确定义是：**让 skill 层质量持平 + 补三类真差距**，而非复制运行时。

## 1. OMX 工程基座拆解（按规模）

| 层 | 规模 | 内容 |
|---|---|---|
| `skills/` | 7,398 行 MD | 46 个 skill（**已追平**） |
| `src/` | **323,053 行 TS** | cli / catalog / hooks / modes / agents / mcp / hud / notifications / auth / leader / adapt / imagegen / document-refresh / goal-workflows / compat / exec |
| `crates/` | 14,151 行 Rust | omx-mux（tmux 多路复用）/ omx-runtime / omx-runtime-core / omx-explore（代码库探索）/ omx-sparkshell / omx-api |
| `plugins/oh-my-codex` | hooks + skills | Codex 插件壳 |
| `packages/vscode-extension` | VSCode 扩展 | IDE 集成 |
| `prompts/` | 37 文件 | prompt 库 |
| `templates/` | 4 文件 | skill/agent 脚手架 |
| `geobench/` + `missions/` | 1 + 27 | 基准测试集 |
| 工程化 | — | biome lint / tsc / dist-workspace / postinstall / RELEASE_PROTOCOL / 大量 `__tests__` |

## 2. 三分类映射：不追 / 已原生覆盖 / 该追

### ❌ 不追（架构不同或 WorkBuddy 原生更强）

| OMX 组件 | 为什么不追 |
|---|---|
| `omx-mux`（tmux 多路复用） | WorkBuddy 用 `TeamCreate` + `Agent` 并行，无 tmux 概念，架构根本不同 |
| `omx-runtime` / `omx-runtime-core` | WorkBuddy 宿主本身即运行时 |
| `omx-explore`（Rust 探索 harness） | WorkBuddy 有 `Explore`/`Plan` subagent + Glob/Grep/Read，原生更强 |
| `omx-sparkshell` / `omx-api` | 交互 shell / API 层，WorkBuddy 模型无此需求 |
| `src/auth` | 宿主管 auth |
| `src/modes` 运行时（autopilot/ralph/ultrawork 的"模式引擎"） | WorkBuddy 用 skill + Task 工具 + `.workbuddy/memory` 表达"模式"，不需要独立 mode runtime |
| `src/leader` | = `TeamCreate` 的 leader 角色 |
| `src/mcp` | WorkBuddy **是** MCP 宿主（大量 connector），反向更强 |
| `src/imagegen` | WorkBuddy 有 `ImageGen`/`VideoGen` 工具 |
| `packages/vscode-extension` | WorkBuddy 是桌面 App，非 VSCode 插件模型 |

### ✅ 已原生覆盖（只需把 skill 接上，无需自建）

| OMX 组件 | WorkBuddy 原生 | 状态 |
|---|---|---|
| `src/hud`（状态显示） | 内置 HUD | `hud` skill 已包装 |
| `src/notifications` | configure-notifications + webhook | skill 已覆盖 |
| `src/agents`（原生 agent） | `Agent` 工具 + 专家系统 + `TeamCreate` | `agents/` 已有 3 个 md |
| `src/catalog`（清单） | 我们的 `catalog/manifest.json` + `lib/manifest.js` | 简版已有，见该追① |
| `src/cli`（命令分派） | WorkBuddy Skill 工具 + 专家入口 | 宿主提供 |

### ⚠️ 该追（真差距，按优先级）

#### ① 工程治理（小，已有半成品）
- `templates/` 脚手架（OMX 4 文件）——我们缺，新 skill 无起手模板
- `CONTRIBUTING.md` / `CHANGELOG.md`——我们缺
- `.github` CI（OMX 有 biome lint + 测试）——我们只有 `validate_frontmatter.js`
- `src/**/__tests__` 测试套件——我们 `lib/` 0 测试（sync 逻辑非平凡）

#### ② catalog 生成化（中，技术差距）
- OMX 的 `catalog/generated/public-catalog.json` 是**从 `src/catalog/reader.ts` + `schema.ts` 扫 skills/ 自动生成**的
- 我们的 `catalog/manifest.json` 是**手维护**的 46 条数组——易漂移
- 追平方式：写 `scripts/generate-catalog.js`，从 `skills/*/SKILL.md` 的 frontmatter 自动生成 manifest，`validate_frontmatter.js` 升级为双向校验（frontmatter ↔ manifest 一致）

#### ③ hook 适配层（大，唯一真有技术含量的差距）
- OMX `src/hooks/` 有 22 个 hook：`keyword-detector`（关键词触发 skill）、`triage-state`/`triage-heuristic`（任务分流）、`codebase-map`（代码库地图）、`explore-routing`、`task-size-detector`、`session`、`agents-overlay`、`prompt-guidance-contract`，外加一整套 `extensibility/` plugin runtime（events/dispatcher/loader/sdk）
- WorkBuddy 有 hook 概念（`user-prompt-submit-hook` 等），但能力面比 OMX 窄
- 追平方式：先评估 WorkBuddy hook 的真实能力边界，再把 OMX hook 的"关键词→skill 路由""任务分流""代码库预扫描"翻译成 WorkBuddy 可用的触发规则或前置 skill。这是唯一需要写**实质代码**而非文档的差距

## 3. 分阶段路线图

| 阶段 | 内容 | 工作量 | ROI |
|---|---|---|---|
| **P0 已完成** | skills 1:1（46 个，frontmatter，omw installer，sync） | — | — |
| **P1 工程治理** | CONTRIBUTING/CHANGELOG/templates + .github CI + `lib/` 单元测试 + biome/eslint | 1–2 天 | 高 |
| **P2 catalog 生成化** | `generate-catalog.js` + 双向校验，淘汰手维护 manifest | 2–3 天 | 高（防漂移） |
| **P3 hook 适配层** | 评估 WorkBuddy hook 能力 → 移植 keyword-detector/triage/codebase-map | 1–2 周 | 中（取决于宿主 hook 开放度） |
| **P4 prompts/agents 增强（可选）** | 移植 37 prompts 作 references；agents/ 补 selection policy | 2–3 天 | 中 |
| **P5 质量基准（可选）** | geobench/missions 式 skill 质量回归集 | 3–5 天 | 低-中 |

## 4. 明确建议

1. **别追 runtime/mux/explore/auth/leader/modes**——这些是 OMX 给裸 Codex 补的腿，WorkBuddy 长着这些腿。照搬 = 重复造宿主已有的轮子，ROI 为负。
2. **先做 P1 + P2**（工程治理 + catalog 生成化）——这是"开源项目该有的样子"，投入小、防漂移、立竿见影。
3. **P3 hook 适配层是分水岭**——先探 WorkBuddy hook 开放到什么程度。如果宿主 hook 足够开放，OMX 的 keyword-detector/triage 能翻译过来，oh-my-workbuddy 就能从"skill 库"升级成"会自动路由的 skill 库"；如果宿主 hook 很封闭，P3 做不动，那就止步 P2，接受"靠 skill 触发词路由"的现状。
4. **永远不要把"行数追平 OMX"当目标**——323K 行里大半是 WorkBuddy 不需要的。对齐的标尺应是"skill 层质量 + 工程治理 + 自动化程度"，不是 LOC。

## 5. 一句话定位

> **oh-my-codex** = skill 层 + 自建运行时（因 Codex CLI 裸）。
> **oh-my-workbuddy** = skill 层 + 薄安装器，运行时靠宿主。
> 所以"追平"= 让 skill 层和工程治理到位，运行时靠宿主，不复制 OMX 的 98%。
