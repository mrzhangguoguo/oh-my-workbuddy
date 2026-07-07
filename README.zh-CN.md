# oh my workbuddy (omw)

> 🇺🇸 [English](README.md)

一个面向 [WorkBuddy](https://www.codebuddy.cn/) 的 **oh-my-codex (OMX) 风格**技能包。

让你的 WorkBuddy 更强：一套精选的工作流技能、基于清单（catalog）的启用/禁用系统、双作用域安装（用户级 / 项目级），并且**零运行时依赖**。没有 Rust，没有 tmux —— WorkBuddy 内置的 **Skill** 工具与 **Agent** 编排能力，替代了 OMX 的 hook 注入与 Rust 模块。

---

## 为什么做这个

`oh-my-codex` 通过提供 Markdown 技能、Agent 提示词，以及一个把技能接入 Codex 的 `setup` CLI，让 OpenAI Codex CLI 更好用。WorkBuddy 本就具备同样的底层原语 —— 即 **Skill**（`SKILL.md` + frontmatter），外加用户级（`~/.workbuddy/skills`）与项目级（`.workbuddy/skills`）两种作用域。因此，「WorkBuddy 版的 OMX」本质上就是：**保留内容，替换接线方式。**

| oh-my-codex | oh my workbuddy |
|---|---|
| `skills/<name>/SKILL.md` | `skills/<name>/SKILL.md`（一致） |
| `~/.codex/skills` / `./.codex/skills` | `~/.workbuddy/skills` / `./.workbuddy/skills` |
| `src/catalog/manifest.json` + `schema.ts` | `catalog/manifest.json` + `lib/manifest.js` |
| `omx setup` 移动文件并注册 Codex hook | `omw setup` 把技能复制到目标作用域 |
| `codex-native-hook.mjs` 运行时注入 | `AGENTS.md` 引导契约 + Skill 工具加载 |
| HUD 预设 `minimal/focused/full` | `profile: minimal/focused/full` |

完整的 OMX 架构拆解见 [`docs/architecture-analysis.md`](docs/architecture-analysis.md)，映射设计见 [`docs/design.md`](docs/design.md)。

---

## 安装

```bash
git clone https://github.com/mrzhangguoguo/oh-my-workbuddy.git
cd oh-my-workbuddy
chmod +x omw
cp omw.config.example.json omw.config.json   # 然后按需修改 scope/profile
./omw setup                                   # 安装已启用的技能
```

`omw setup` 会把 `catalog/manifest.json` 中每个 `active` 技能（扣除 `skills.disabled` 中的项）复制到目标作用域：

- `scope: "user"` → `~/.workbuddy/skills/<name>/`（**所有**项目可用）
- `scope: "project"` → `./.workbuddy/skills/<name>/`（在你的项目根目录运行）

安装完成后，这些技能即可在 WorkBuddy 中通过 **Skill** 工具加载（`skill: <name>`），与其他已装技能完全一致。

> **注意：** 安装到 `scope: "user"` 只会在 `~/.workbuddy/skills` 下**新增**目录，你已有的技能（例如官方 `obsidian` 技能）不会被改动。

---

## 命令

```bash
./omw setup [--with-guidance]   # 安装已启用技能（可选写入 AGENTS.md）
./omw doctor                    # 校验已安装集合是否与清单一致
./omw list                      # 列出全部清单技能及其安装状态
./omw enable  <name>            # 从禁用集合中移除某个技能
./omw disable <name>            # 把某个技能加入禁用集合
./omw info                      # 显示 scope / profile / 数量
```

---

## 内置技能

这是 **oh-my-codex 全部 46 个技能的一比一重写版**（权威清单见
[`catalog/manifest.json`](catalog/manifest.json)）。每个技能都是对 OMX 原版的**移植**：
把 OMX 的运行时约定（`$macro` 宏调用、`omx` CLI、`.omx/` 状态目录）替换为
WorkBuddy 的习惯用法（Skill 工具、Agent 工具、任务清单、`.workbuddy/memory`）。
翻译规范见 [`docs/PORTING_GUIDE.md`](docs/PORTING_GUIDE.md)。

`omw setup` 默认安装 **30 个 `active`** 技能；**16 个 `deprecated`** 兼容性垫片
（如 `swarm` → `team`、`tdd` → 活动工作流、`review` → `code-review`）已在清单中登记，
但按设计**不安装**。

### 按分类列出的 active 技能（30 个）

| 分类 | 技能 |
|---|---|
| 规划 planning (8) | `autopilot` · `deep-interview` · `design` · `pipeline` · `plan` · `prometheus-strict` · `ralplan` · `ultragoal` |
| 执行 execution (7) | `ai-slop-cleaner` · `git-master` · `performance-goal` · `ralph` · `team` · `ultrawork` · `worker` |
| 研究 research (4) | `analyze` · `autoresearch` · `autoresearch-goal` · `best-practice-research` |
| 工具 utility (5) | `ask` · `cancel` · `configure-notifications` · `skill` · `wiki` |
| 审查 review (2) | `code-review` · `ultraqa` |
| 基础设施 infra (2) | `doctor` · `omx-setup` |
| 构建 build (1) | `visual-ralph` |
| 显示 display (1) | `hud` |

### 已废弃的兼容性垫片（已登记，不安装 — 16 个）

`ask-claude` · `ask-gemini` · `build-fix` · `deepsearch` · `ecomode` ·
`frontend-ui-ux` · `help` · `note` · `ralph-init` · `review` · `security-review` ·
`swarm` · `tdd` · `trace` · `visual-verdict` · `web-clone`

### 角色提示词

OMX 的 `prompts/` 以聚焦模式参考文档的形式放在 `agents/` 下：
`executor.md`、`architect.md`、`reviewer.md`。

---

## 项目结构

```
oh-my-workbuddy/
├── omw                      # 启动器（零依赖 Node，对标 OMX 的 bin.omx）
├── catalog/manifest.json    # 技能/agent 清单（唯一事实来源）
├── lib/                     # 核心框架（纯 Node ESM）
│   ├── manifest.js          # 清单加载 + 分类校验
│   ├── config.js            # 配置解析（scope/profile/enabled/disabled）
│   ├── install.js           # 安装分发到用户/项目作用域
│   └── cli.js               # 命令入口
├── skills/                  # 46 个移植技能（每个 = SKILL.md + frontmatter）
├── agents/                  # 3 个角色提示词（executor/architect/reviewer）
├── AGENTS.md                # 顶层编排契约
├── omw.config.example.json  # 配置系统样例
├── validate_frontmatter.js  # 贡献者工具：校验所有 SKILL.md 的 frontmatter
├── docs/                    # architecture-analysis / design / PORTING_GUIDE
└── README.md · README.zh-CN.md · LICENSE
```

---

## 配置

`omw.config.json`（从 `omw.config.example.json` 复制）：

```json
{
  "schemaVersion": 1,
  "scope": "user",
  "profile": "focused",
  "skills": {
    "enabled":  ["*"],
    "disabled": []
  },
  "guidance": {
    "injectAgentsMd": true
  }
}
```

- `scope`：`"user"`（全局 `~/.workbuddy/skills`）或 `"project"`（`./.workbuddy/skills`）。
- `profile`：`minimal` / `focused` / `full`（HUD 风格的引导提示）。
- `skills.enabled`：`"*"` 表示全部，或显式列出名称。
- `skills.disabled`：即便在启用集中也要跳过的名称。
- `guidance.injectAgentsMd`：在 `setup --with-guidance` 时把顶层 `AGENTS.md` 契约写入目标作用域。

---

## 扩展

1. 新增 `skills/<name>/SKILL.md`，带 `name` 与 `description` frontmatter。
2. 在 `catalog/manifest.json` 的 `skills[]` 中登记：`category`、`status`、`core`。
3. 运行 `./omw setup --force`。

无需构建步骤。框架是 `lib/` 下的纯 Node ESM（清单校验、配置解析、安装分发），
是对 OMX 的 `schema.ts` / `setup.ts` / `index.ts` 的忠实、零依赖移植。

---

## 开发

```bash
npm install            # 安装校验器所需的 js-yaml
npm run validate       # 检查所有 SKILL.md 的 frontmatter 能否解析
./omw doctor           # 检查已安装集合 == 清单
```

---

## 许可证

[MIT](LICENSE) © 2026 oh-my-workbuddy contributors.
