// PreToolUse hook 入口：工具调用前跑（matcher: Agent / DeferExecuteTool）。
// port of OMX: agents-overlay + explore-routing + code-simplifier。
import { runHook, emitPreToolUseOutput } from '../lib/hook-io.mjs';

function handle(input) {
  const toolName = input?.tool_name || '';
  const toolInput = input?.tool_input || {};

  // ① agents-overlay（TODO, P3-e）：对 Agent 工具注入 subagent_type/model 偏好
  //    需测：updatedInput 对 Agent 工具是否生效（shallow-merge 陷阱，须先 spread 原值）
  // ② explore-routing（TODO, P3-e）：路由探索请求到 Explore subagent
  // ③ code-simplifier（TODO）：对 Write/Edit 注入简化提示

  // 默认放行，不改入参。
  emitPreToolUseOutput({ decision: 'allow' });
}

runHook(handle, () => emitPreToolUseOutput({ decision: 'allow' }));
