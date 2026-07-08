# P3 — Hook 适配层：方案与工程框架

> 目标：把 oh-my-codex 的 22 个确定性 hook 翻译成 WorkBuddy 插件 hook，让 oh-my-workbuddy 从"skill 库"升级成"会自动路由/分流的 skill 库"。
> 状态：设计 + 骨架（未实现）。实现待 P3 执行。

## 1. 关键发现：WorkBuddy 有确定性 hook 系统

通过逆向内置 `weixinpay` 插件，确认 WorkBuddy 支持**确定性、代码型 hook**（不是靠模型自己判断的"软路由"）：

### 1.1 Hook 注册：插件 `hooks/hooks.json`
```json
{
  "hooks": {
    "UserPromptSubmit": [
      { "hooks": [ { "type": "command", "command": "\"${CODEBUDDY_PLUGIN_ROOT}/bin/run-node\" \"${CODEBUDDY_PLUGIN_ROOT}/dist/hook-xxx.mjs\"" } ] }
    ],
    "PreToolUse": [
      { "matcher": "DeferExecuteTool", "hooks": [ { "type": "command", "command": "..." } ] }
    ]
  }
}
```

### 1.2 确认的 hook 事件（3 个，Claude Code 模型）
| 事件 | 触发点 | 能力 |
|---|---|---|
| `UserPromptSubmit` | 用户提交 prompt 时 | 注入上下文/路由提示、mint session、分流 |
| `PreToolUse` | 工具调用前（带 `matcher` 匹配工具名） | 改写工具入参 `updatedInput`、`permissionDecision: allow/deny` |
| `Stop` | agent 结束一轮时 | 落地进度、清理 session |

> 未在 app 资源里见到 `PostToolUse`/`SubagentStop`/`Notification`/`SessionStart` 等，但 Claude Code 模型通常支持——标为"待验证"。

### 1.3 Hook 契约（stdin → stdout）
- **输入**：hook 进程 stdin 收到 JSON（含 `session_id`、`tool_name`、`tool_input` 等）。
- **输出**：stdout 吐 JSON：
  ```json
  { "hookSpecificOutput": {
      "hookEventName": "PreToolUse",
      "permissionDecision": "allow",
      "updatedInput": { /* shallow-merge 进工具入参 */ }
  } }
  ```
- `UserPromptSubmit` 可注入系统提示/上下文；`PreToolUse` 的 `updatedInput` 被 **shallow-merge** 进工具入参。
- **关键约束**：shallow merge 会整体替换顶层键，注入嵌套字段必须先 spread 原值。

### 1.4 插件打包
- `.codebuddy-plugin/plugin.json`：`name/version/description/author/keywords/category`。
- 经 `~/.workbuddy/settings.json` 的 `enabledPlugins` 启用，key 格式 `<name>@<source>`（builtin 源是 `workbuddy-builtin`）。
- **本地/用户插件的加载路径未完全确认**（仅 builtin 在 app 资源内）——标为开放问题，实现前需验证。

## 2. OMX 22 个 hook → WorkBuddy 映射

| OMX hook | OMX 作用 | WorkBuddy 映射 | 可行性 |
|---|---|---|---|
| `keyword-detector` | 关键词→skill 路由 | `UserPromptSubmit`：扫 prompt 关键词→注入"应触发 X skill"提示 | ✅ 直接可做 |
| `keyword-registry` | 关键词注册表 | hook 配置/数据文件 | ✅ |
| `triage-state` / `triage-heuristic` / `triage-config` | 任务分流（大小/类型/复杂度） | `UserPromptSubmit`：判定任务规模→注入分流策略 | ✅ |
| `task-size-detector` | 估任务大小 | `UserPromptSubmit`：启发式估规模 | ✅ |
| `codebase-map` | 预扫代码库建图 | `UserPromptSubmit`：调 `Explore` subagent 预扫或注入现有图 | ⚠️ 需控制成本（每 prompt 跑会慢） |
| `session` | 会话状态 | `UserPromptSubmit` mint + `Stop` 落地 | ✅ |
| `prompt-guidance-contract` | 注入项目约定 | `UserPromptSubmit`：读 `AGENTS.md`/`.workbuddy/memory` 注入 | ✅ |
| `agents-overlay` | 动态叠加 agent 配置 | `PreToolUse`(matcher=Agent)：注入 agent 参数 | ⚠️ 需测 updatedInput 对 Agent 工具是否生效 |
| `explore-routing` | 路由探索请求 | `PreToolUse`(matcher=Explore/Agent)：注入 subagent_type | ✅ |
| `deep-interview-config-instruction` | 注入 interview 配置 | `UserPromptSubmit`：检测 interview 上下文 | ✅ |
| `document-refresh` | 文档刷新 | `Stop`：检测文档变更触发刷新 | ✅ |
| `extensibility/*`（plugin runtime: loader/dispatcher/sdk/events） | 插件运行时 | WorkBuddy 已有插件系统，**不需要自建** | ❌ 不追 |
| `code-simplifier` | 代码简化 hook | `PreToolUse`(matcher=Write/Edit)：注入简化提示 | ✅ |

**小结**：22 个里，~14 个可直译成 `UserPromptSubmit`/`PreToolUse`/`Stop` hook；`extensibility/*` 子系统（6 个）不用追（WorkBuddy 已有插件运行时）；`codebase-map` 需控制成本。

## 3. 能做 / 不能做

### ✅ 能做
- **确定性关键词路由**：`UserPromptSubmit` 扫 prompt → 注入"应调用 X skill"的强制提示（比纯靠模型读 triggers 更确定）。
- **任务分流**：估规模/类型 → 注入"小任务直接做 / 大任务走 plan"等策略。
- **会话与进度落地**：`UserPromptSubmit` mint + `Stop` 落地到 `.workbuddy/memory`。
- **项目约定注入**：读 `AGENTS.md`/memory 注入上下文。
- **工具入参改写/拦截**：`PreToolUse` 改 Agent/Explore/Write 的入参或 deny。

### ❌ 不能做 / 不该追
- **tmux 多路复用相关**：无 tmux，架构不同。
- **Codex 专属**（`~/.codex/config.toml`、`~/.codex/hooks/*.sh`）：不存在。
- **explore-harness**（Rust）：WorkBuddy 有原生 Explore subagent，更强。
- **每 prompt 全量扫代码库**：太慢，必须降级为"按需/缓存"。

## 4. 架构

```
oh-my-workbuddy/
├── skills/              # 已有：skill 层（46）
├── plugin/              # 新增：hook 适配层（WorkBuddy 插件）
│   ├── .codebuddy-plugin/plugin.json
│   ├── hooks/hooks.json              # 注册 3 个事件
│   ├── src/
│   │   ├── lib/
│   │   │   ├── hook-io.mjs           # stdin 解析 + stdout 发射 + fail-safe（真实可复用）
│   │   │   ├── keyword-router.mjs    # 关键词→skill 映射（port keyword-detector）
│   │   │   ├── triage.mjs            # 任务分流启发式
│   │   │   └── session.mjs           # session mint/读写
│   │   └── hooks/
│   │       ├── user-prompt-submit.mjs  # UserPromptSubmit 入口
│   │       ├── pre-tool-use.mjs        # PreToolUse 入口（matcher 路由）
│   │       └── stop.mjs                # Stop 入口
│   ├── dist/            # 编译产物（.mjs，可直接 node 跑）
│   ├── tests/           # hook 单测（喂 stdin JSON，断言 stdout）
│   └── README.md
└── lib/, catalog/, ...  # 已有
```

### 数据流
1. 用户提交 prompt → `UserPromptSubmit` hook 跑 `user-prompt-submit.mjs`：
   - 解析 stdin（含 prompt 文本 + session_id）
   - `keyword-router` 命中 → 生成 `{"hookSpecificOutput":{..., "context": {"应调用 X skill"}}}` 注入
   - `triage` 估规模 → 注入分流提示
   - `session.mjs` mint/读 session
   - fail-safe：任何异常都吐 `permissionDecision: allow` + 空 context，绝不阻塞用户
2. 模型（受注入提示影响）调用 Agent/Explore → `PreToolUse` hook 跑 `pre-tool-use.mjs`：
   - matcher 路由到对应处理
   - `agents-overlay` 注入 agent 参数 / `explore-routing` 注入 subagent_type
3. agent 一轮结束 → `Stop` hook 跑 `stop.mjs`：落地进度到 `.workbuddy/memory`、清理 session。

## 5. 工程框架（已建骨架）

`plugin/` 下已建可运行骨架：
- `hook-io.mjs`：**真实实现**——读 stdin、解析 JSON、发射标准 `hookSpecificOutput`、异常时 fail-safe 放行。这是所有 hook 的共用底座。
- 3 个 hook 入口：接收事件、调 lib、发输出，逻辑用 TODO 标注对应 OMX hook。
- `hooks.json`：注册 3 事件（command 指向 dist/）。
- `plugin.json`：插件清单。

实现时只需填充 lib 里的真实逻辑（keyword-router 的关键词表、triage 的启发式、session 的存储格式），骨架的 I/O 契约已就绪。

## 6. 分阶段实施

| 阶段 | 内容 | 验收 |
|---|---|---|
| P3-a | 验证本地插件加载路径（ builtin 之外能否装用户插件） | 一个空插件能被 settings 启用并触发 hook |
| P3-b | `UserPromptSubmit` + keyword-router（最高价值：确定性路由） | 输入"分析下这个仓库"→ hook 注入"应调用 analyze skill" |
| P3-c | `triage` + `task-size-detector`（分流） | 大任务注入 plan 策略 |
| P3-d | `Stop` + session 落地（进度持久化） | 一轮结束自动写 memory |
| P3-e | `PreToolUse` 的 agents-overlay / explore-routing | Agent 调用被注入参数 |
| P3-f | `codebase-map`（按需/缓存版） | 缓存命中时不重扫 |

**优先 P3-a**：如果本地插件装不上，整个 P3 都做不动——这是分水岭的"分水岭"，必须先验证。

## 7. 风险与开放问题

1. **本地插件加载路径未确认**（最高风险）：仅验证了 builtin 插件在 app 资源内。用户插件能否从 `~/.workbuddy/plugins/` 或 marketplace 装？——P3-a 先解决。
2. **性能**：hook 在**每个 prompt/工具调用**跑，必须 <100ms 且 fail-safe。keyword-router 用预编译正则表；codebase-map 必须缓存。
3. **fail-safe 是硬要求**：hook 崩溃绝不能阻塞用户——`hook-io.mjs` 已保证（异常→放行）。
4. **shallow-merge 陷阱**：`updatedInput` 顶层替换，注入嵌套字段必须先 spread 原值（weixinpay 踩过）。
5. **事件覆盖**：仅确认 3 事件；`PostToolUse`/`SubagentStop` 等待验证。
6. **与模型路由的边界**：hook 注入是"强提示"，最终还是模型决定——不能假设 100% 路由命中，但比纯靠模型读 triggers 确定性高很多。

## 8. 一句话结论
WorkBuddy 的 hook 系统**足以承载 OMX 的 hook 适配层**——确定性路由、分流、进度落地都能做；分水岭是"本地插件能否加载"（P3-a），先验这个再实现。骨架已就绪，逻辑待填。
