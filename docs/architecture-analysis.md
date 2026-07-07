# oh-my-codex (OMX) 架构完整分析

> 分析样本：`Yeachan-Heo/oh-my-codex` @ v0.19.0（Rust + TypeScript）
> 分析目的：为复刻「oh my workbuddy」提供设计依据
> 样本已克隆至：`oh-my-codex/`（本仓库同级目录）

---

## 1. 一句话定位

**oh-my-codex 是给 OpenAI Codex CLI 的「内容增强层 + 编排 CLI」。**

它的本质不是自研运行时，而是：

- **内容层（声明式、可移植）**：`skills/*.md`、`prompts/*.md`、`templates/AGENTS.md` 全是纯 Markdown 文件，由一份集中式清单（`src/catalog/manifest.json`）做元数据登记。
- **CLI 层（命令式、Codex 原生）**：`omx` 命令负责把上述内容**搬运并接线**进 Codex 的原生目录（`~/.codex/{skills,prompts,agents}`、`config.toml`、`hooks.json`），注册一个 Codex 原生 hook 做运行时注入，并提供 `team`/`ralph`/`ultragoal`/`autoresearch` 等编排子命令（重活由 6 个 Rust crate 承担）。

关键心智模型：**「智能」在 Markdown 与 Codex 自身；omx 只负责装配、注入与多 agent 编排。**

---

## 2. 目录结构总览

```
oh-my-codex/
├── skills/            # 46 个 skill 目录，每个 = SKILL.md（少数含 references/）
├── prompts/           # 34 个 agent 角色系统提示（被 /prompts:<name> 调用）
├── .agents/           # 仅 marketplace 注册文件（非 agent 定义本体）
├── plugins/
│   └── oh-my-codex/   # Codex 官方 plugin 格式（.codex-plugin/plugin.json）
│       ├── skills/    # 根 skills/ 的镜像子集（34 个）
│       ├── hooks/     # codex-native-hook.mjs（生命周期注入）
│       ├── .mcp.json  # MCP server 声明
│       └── .app.json
├── src/               # TS 源码：cli / catalog / agents / hud
│   ├── catalog/       # manifest.json + schema.ts（清单 SSOT + 校验）
│   ├── cli/           # setup.ts / uninstall.ts / plugin-marketplace.ts
│   └── agents/        # definitions.ts（AgentDefinition）+ native-config.ts
├── crates/            # 6 个 Rust crate：omx-mux / omx-runtime / omx-runtime-core
│                       #   / omx-sparkshell / omx-explore / omx-api
├── templates/         # 发货模板：AGENTS.md、catalog-manifest.json、model-instructions/
├── missions/          # autoresearch 评测任务包（非通用脚手架）
├── playground/        # 运行示例/演示（非扩展脚手架）
├── docs/              # 文档（getting-started / agents / skills / hooks-extension ...）
├── .gjc/              # 运行时状态/账本（ultragoal 工作流产物，非主题/模板）
├── package.json       # bin.omx = dist/cli/omx.js；scripts 含 setup/doctor/sync:plugin
└── README.md          # 产品定位、安装、推荐默认流
```

---

## 3. 插件架构（plugins/）

采用 **Codex 官方 plugin 格式**，入口为 `plugins/oh-my-codex/.codex-plugin/plugin.json`：

```json
{
  "name": "oh-my-codex",
  "version": "0.19.0",
  "skills": "./skills/",
  "mcpServers": "./.mcp.json",
  "apps": "./.app.json",
  "hooks": "./hooks/hooks.json",
  "interface": { "displayName": "oh-my-codex", "category": "Developer Tools" }
}
```

一个插件聚合 **skills + hooks + mcpServers + apps** 四类资源。

- **启用/禁用**：通过本地 marketplace 注册（`.agents/plugins/marketplace.json`，source=local，policy=AVAILABLE）。`src/cli/plugin-marketplace.ts` 在 setup 时把插件注册与启用状态写入 `~/.codex/config.toml`，同时控制 MCP server 开关。
- **两种交付模式**：
  - `legacy`：把 skill 直接装进 `~/.codex/skills`；
  - `plugin`：依赖 Codex 插件发现机制，`package.json` 的 `sync:plugin` / `verify:plugin-bundle` 维护 `plugins/oh-my-codex/skills`（根 `skills/` 的镜像，由 `src/catalog/skill-mirror.ts` 校验同步）。
- **生命周期 = Codex 原生 hook**：`hooks/hooks.json` 在 7 个 Codex 事件（`SessionStart`、`PreToolUse`、`PostToolUse`、`UserPromptSubmit`、`PreCompact`、`PostCompact`、`Stop`）挂同一命令：`node "${PLUGIN_ROOT}/hooks/codex-native-hook.mjs"`。hook 脚本在每次事件把 OMX 上下文（skill/keyword 路由、`$name` 工作流注入、AGENTS.md 引导）注入会话。
- **插件与 skill 关系**：插件内 `skills/` 是镜像子集（34 个），SSOT 在 `docs/plugin-bundle-ssot.md`，保证不与根 `skills/` 漂移。

---

## 4. 主题系统

**结论：omx 没有独立主题系统。**

全仓 grep `theme` 仅命中语义层面的「设计/视觉主题」（`skills/design`、`skills/visual-ralph`）与个别测试文档，不存在类似 oh-my-zsh 的 `themes/` 目录或 theme 加载器。

「外观/主题」概念由两部分承担：

- **HUD preset**：`skills/hud/SKILL.md` 提供 `--preset=minimal|focused|full` 切换状态栏密度（`omx hud --preset=full`）。
- **Prompt/HUD 文案**：位于 `prompts/*` 与 `src/hud/`，非可插拔 theme 框架。

> 复刻含义：在 WorkBuddy 侧不需要新建 theme 子系统，把「主题」统一映射到 prompt/输出风格层即可（本项目的 `profile: minimal|focused|full` 即对标 HUD preset）。

---

## 5. 配置机制

**两层作用域（与 oh-my-zsh 的 user/zshrc 概念一致）：**

- `user`：`~/.codex/{skills,prompts,agents,config.toml,hooks.json}`
- `project`：`./.codex/{skills,prompts,agents,config.toml,hooks.json}`

由 `omx setup --scope <user|project>` 决定（`src/cli/setup.ts` 的 `promptForSetupScope`）。

**用户如何启用/配置：**

- 安装：`npm install -g oh-my-codex` → `postinstall` 触发 `dist/scripts/postinstall.js` → `omx setup` 写入 Codex `config.toml`（marketplace 注册 + `developer_instructions` 引导词）+ 注册 hook + 搬运 skills/prompts/agents + 生成 `AGENTS.md` + 写 `.gitignore` 条目 + 持久化偏好（`src/cli/setup-preferences.ts`）。
- 卸载：`omx uninstall`。
- 校验：`omx doctor`。

**配置文件落点：**

- Codex 配置：`~/.codex/config.toml`；Codex hook：`~/.codex/hooks.json`
- OMX 状态：`~/.omx/`（gitignored）
- 用户级 skill：`~/.codex/skills/<name>/SKILL.md`；项目级：`./.codex/skills/<name>/SKILL.md`

**`package.json` 关键命令：** `setup` / `doctor` / `sync:plugin` / `verify:plugin-bundle` / `verify:native-agents` / `prompt:inventory` / `generate-catalog-docs` / `build:*` / `smoke:packed-install`。

---

## 6. 自动加载逻辑（核心）

**真实机制不是「OMX 自己扫描 skills」，而是 setup 把 Markdown 文件搬到 Codex 原生目录，由 Codex 自己发现。**

入口链：

1. `package.json` `bin.omx = dist/cli/omx.js`；`src/cli/omx.ts` 是 launcher，记住启动上下文后动态 `import('dist/cli/index.js')` 调用 `main()`。
2. `src/cli/index.ts` 是 dispatcher，注册 `setup/uninstall/hud/team/ralph/ultragoal/...` 等子命令。

加载器 / 索引 / 注册表（SSOT）：

- `src/catalog/manifest.json`（仓库内）+ `templates/catalog-manifest.json`（发货用）= 技能/agent 清单元数据。
- `src/catalog/reader.ts` 的 `readCatalogManifest()` 解析并 `validateCatalogManifest()`（强制 6 个 core skill：`ralplan/team/ralph/ultrawork/ultragoal/autopilot`）。
- `src/catalog/generated/public-catalog.json` = 生成产物（含 counts：`skillCount:50, promptCount:34, activeSkillCount:28, activeAgentCount:20`）。
- setup 时 `getSetupInstallableSkillNames()` 据 manifest 的 `status` 计算可安装技能集合（仅 `active`/`internal` 安装）。

bootstrap / 自动加载：

- `resolveScopeDirectories()`（`setup.ts:715`）按 `user`/`project` 解析到 `~/.codex/...` 或 `./.codex/...`。
- `ensurePluginMarketplaceRegistration()`（`setup.ts:1741`）+ hook 注册（`applyPluginModeHooksConfig` `setup.ts:1828`）把 `codex-native-hook.mjs` 挂到 Codex 生命周期；该 hook 在**每次会话事件**把 OMX 上下文/路由注入，实现「自动加载」。

**要点**：omx 的「自动加载」= 安装期一次性搬运 + Codex 原生发现 + hook 运行时注入。没有任何运行时热扫描目录的逻辑。

---

## 7. 扩展接口（第三方如何新增）

**新增 skill（最轻量）：**

- 直接放 Markdown：用户级 `~/.codex/skills/<name>/SKILL.md` 或项目级 `./.codex/skills/<name>/SKILL.md`，带 `name`+`description` frontmatter 即被 Codex 发现（`CONTRIBUTING.md` "Adding a new skill"）。
- 仓库内开发：在 `skills/<name>/SKILL.md` 新增 → 改 `src/catalog/manifest.json` 登记元数据（`status/category/core`）→ `omx setup --force` 安装 → 用 `$<name>` 调用。
- 元技能 `/skill add`（`skills/skill/SKILL.md`）提供交互式向导 + 4 套内置模板（Error Solution / Workflow / Code Pattern / Integration），自动生成合规 frontmatter。

**新增 agent/prompt：**

- `prompts/<role>.md`（frontmatter `description`+`argument-hint`）→ `omx setup --force` → `/prompts:<role>`。
- 原生 agent：在 `src/agents/definitions.ts` 增加 `AgentDefinition` 条目（含 tier/posture/tools），由 `generateAgentToml()` 生成 TOML。

**新增插件：** 在 `plugins/oh-my-codex/` 下扩展 `skills/`、`hooks/`、`*.mcp.json`、`*.app.json`，并在 `.codex-plugin/plugin.json` 登记；用 `sync:plugin` 同步镜像。

**Scaffolds / 模板目录说明：**

- `templates/` = 发货模板（`AGENTS.md` + `catalog-manifest.json` + `model-instructions/`），不是用户 scaffold。
- `missions/` = autoresearch 评测用例，非通用脚手架。
- `playground/` = 运行示例，非扩展脚手架。
- 真正的「扩展约定文档」在 `CONTRIBUTING.md` + `docs/prompt-guidance-contract.md` + `docs/plugin-bundle-ssot.md` + `docs/hooks-extension.md`。

---

## 8. 核心设计模式总结

| 维度 | omx 实现 | 本质 |
|---|---|---|
| 内容声明 | `skills/*.md` + `prompts/*.md` + `templates/AGENTS.md` | 纯 Markdown |
| 清单 SSOT | `src/catalog/manifest.json` + `schema.ts` 校验 | 集中式元数据 |
| 装配/接线 | `omx setup` 搬运到 `~/.codex/*` + 注册 hook | 一次性安装 |
| 运行时注入 | `codex-native-hook.mjs` 在 7 个事件注入 | Codex 原生 hook |
| 编排 | `team`/`ralph`/`ultragoal` + 6 个 Rust crate | 多 agent + tmux |
| 主题 | HUD preset（minimal/focused/full） | 无 theme 框架 |
| 扩展 | frontmatter 约定 + manifest 登记 + scaffold 向导 | 文件即扩展 |

**映射到 WorkBuddy skill 体系（直接可复用）：**

| omx | WorkBuddy | 复刻度 |
|---|---|---|
| `skills/<name>/SKILL.md`（name/description/triggers/argument-hint） | 带 frontmatter 的 `SKILL.md` | **直接对齐** |
| 用户级 `~/.codex/skills` / 项目级 `./.codex/skills` | 用户级 `~/.workbuddy/skills` / 项目级 `.workbuddy/skills` | **直接对齐** |
| `parseSkillFrontmatter()`（强制 name+description） | Skill 工具加载器 | **直接对齐** |
| `src/catalog/manifest.json` + `schema.ts` | 集中 manifest 做分类/启用/别名 | 可借鉴 |
| `$skillname` / `/prompts:<role>` | Skill 工具显式加载 | 调用约定不同，triggers 思路一致 |
| Codex 原生 hook 注入 | WorkBuddy hook / 系统引导 | **需替换**为 Skill 工具加载 + 系统 prompt |
| Rust crate（tmux/运行时） | — | 仅多 agent 编排需要，单 skill 可忽略 |

**结论：** WorkBuddy 复刻时，**skill 格式、frontmatter 字段、双层作用域、集中 manifest 做启用/分类**四点可直接套用 WorkBuddy 现有 `SKILL.md` + `~/.workbuddy/skills` + `.workbuddy/skills` 体系；而 omx 的「setup 搬运 + Codex hook 注入 + Rust 多 agent 编排」属 Codex 特有机理，在 WorkBuddy 侧应改为「Skill 工具加载 + 系统引导注入 + 可选多 agent 编排」，无需引入 Rust。
