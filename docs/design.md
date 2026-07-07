# oh my workbuddy — 设计文档

> 复刻对象：oh-my-codex（OMX）。本设计严格沿用其「内容层 + 装配 CLI + 集中清单」的核心模式，但把 Codex 特有机理替换为 WorkBuddy 原生能力。

## 设计原则（对齐 OMX）

1. **内容是 Markdown，智能在 WorkBuddy 自身**：每个 skill 就是一个 `SKILL.md`，由 WorkBuddy 的 Skill 工具加载，不写运行时。
2. **集中清单做启用/分类**：`catalog/manifest.json` 是 SSOT（schema 直接移植 OMX 的 `schema.ts`）。
3. **双层作用域**：`user` → `~/.workbuddy/skills`；`project` → `./.workbuddy/skills`。
4. **装配即安装**：`omw setup` 把启用集合从 `skills/` 复制到目标作用域（等价于 OMX 的 setup 搬运）。
5. **无主题框架**：用 `profile: minimal|focused|full` 对标 OMX 的 HUD preset。
6. **文件即扩展**：新增 skill = 新增 `skills/<name>/SKILL.md` + 在 manifest 登记。

## 目录结构

```
oh-my-workbuddy/
├── README.md                  # 产品说明、安装、用法
├── LICENSE                    # MIT
├── omw                        # 安装/管理 CLI 启动器（bash）
├── omw.config.example.json    # 配置模板（复制到 omw.config.json）
├── catalog/
│   └── manifest.json          # 技能/agent 清单（SSOT，校验逻辑移植 schema.ts）
├── lib/                       # 核心框架（Node/ESM，node 22 直接跑）
│   ├── manifest.js            # 读取 + 校验 manifest（对标 schema.ts）
│   ├── config.js              # 读取 + 解析 omw.config.json
│   ├── install.js             # 按 scope + 启用集安装 skills 到目标目录
│   └── cli.js                 # 命令：setup / doctor / list / enable / disable / info
├── skills/                    # 打包的示例 skills（对标 OMX skills/）
│   ├── deep-interview/
│   ├── plan/
│   ├── ultragoal/
│   ├── team/
│   ├── wiki/
│   ├── research/
│   ├── retro/
│   └── tdd/                   # deprecated 示例
├── agents/                    # 角色 prompt 模板（对标 OMX prompts/），作为 focus-mode 参考
│   ├── executor.md
│   ├── architect.md
│   └── reviewer.md
├── AGENTS.md                  # 顶层编排契约（对标 OMX templates/AGENTS.md）
└── docs/
    ├── architecture-analysis.md  # OMX 架构完整分析
    └── design.md                  # 本文
```

## 与 OMX 的逐项映射

| OMX | oh my workbuddy | 说明 |
|---|---|---|
| `skills/<name>/SKILL.md` | `skills/<name>/SKILL.md` | 同构；frontmatter 用 WorkBuddy 字段（name/description/triggers/agent_created） |
| `~/.codex/skills` / `./.codex/skills` | `~/.workbuddy/skills` / `./.workbuddy/skills` | 作用域直接对齐 |
| `src/catalog/manifest.json` + `schema.ts` | `catalog/manifest.json` + `lib/manifest.js` | 校验逻辑移植 |
| `omx setup` 搬运 + 注册 Codex hook | `omw setup` 复制 skills 到目标作用域 | 去掉 Codex hook，改为 Skill 工具加载 |
| `codex-native-hook.mjs` 运行时注入 | `AGENTS.md` 顶层引导 + Skill 工具显式加载 | 用引导文件替代 hook |
| HUD preset `minimal/focused/full` | `profile: minimal/focused/full` | 直接对齐 |
| `prompts/<role>.md` + `/prompts:<role>` | `agents/<role>.md` + focus-mode 说明 | 角色 prompt 作为参考模板 |
| 6 个 Rust crate（tmux/运行时） | （无） | WorkBuddy 多 agent 用内置 Agent 工具，无需 Rust |
| `$skillname` 调用 | Skill 工具加载 `skills/<name>` | 调用约定不同，triggers 思路一致 |

## 核心框架行为

- `omw setup`：读 manifest + config → 解析目标作用域 → 复制所有 `active` 且 `enabled` 的 skill 到目标目录 → 可选写入 `AGENTS.md`（`--with-guidance`）。
- `omw doctor`：校验目标目录已安装的 skill 与 manifest 是否一致（缺漏/多余/禁用项）。
- `omw list`：列出 manifest 中全部 skill 及其状态/是否安装。
- `omw enable <name>` / `omw disable <name>`：修改 `omw.config.json` 的启用集。
- `omw info`：打印版本、作用域、profile、已安装数量。

## 扩展方式（对标 OMX 扩展接口）

1. **新增 skill**：在 `skills/<name>/SKILL.md` 写内容（含 `name`+`description` frontmatter），在 `catalog/manifest.json` 的 `skills[]` 登记，跑 `omw setup --force`。
2. **新增 agent 角色**：在 `agents/<role>.md` 写角色 prompt，文档化其作为 focus-mode；如需固化为可加载 skill，包成 `skills/<role>/SKILL.md`。
3. **新增子命令**：扩展 `lib/cli.js`（本项目 CLI 以命令分派，结构对标 `src/cli/index.ts`）。

## 为什么不复刻 Rust / tmux 部分

OMX 的 Rust crate 解决的是「tmux 多 pane 并发 + Codex 桥接 + 输出裁剪」。WorkBuddy 已有内置的多 agent 编排能力（`team` skill / Agent 工具），单 agent skill 完全不需要运行时。因此 oh my workbuddy 的「核心框架」只需：清单校验 + 安装分派 + 配置解析，全部用 Node 即可，零编译、零依赖。
