// PreToolUse hook 入口：工具调用前跑。
// Bash matcher  → destructive-op guardrail（deny rm -rf 个人目录）
// Agent matcher  → passthrough allow（模型自选 subagent_type；不覆盖）
// DeferExecuteTool → 解包内层 tool，分发
import { runHook, emitPreToolUseOutput } from '../lib/hook-io.mjs';
import { evaluateBashCommand } from '../lib/guardrail.mjs';

function handle(input) {
  const toolName = input?.tool_name || '';
  const toolInput = input?.tool_input || {};

  // DeferExecuteTool 包装层：解出内层工具名再分发。
  let effectiveTool = toolName;
  let effectiveInput = toolInput;
  if (toolName === 'DeferExecuteTool' && toolInput?.toolName) {
    effectiveTool = toolInput.toolName;
    effectiveInput = toolInput.params || {};
  }

  // Bash 护栏：拦截针对受保护路径的递归删除。
  if (effectiveTool === 'Bash') {
    const reason = evaluateBashCommand(effectiveInput.command);
    if (reason) {
      emitPreToolUseOutput({ decision: 'deny', reason });
      return;
    }
  }

  // Agent / 其余：默认放行（agents-overlay / explore-routing 暂不覆盖，
  // WorkBuddy 原生 subagent 选择已足够；预留 updatedInput 钩子位）。
  emitPreToolUseOutput({ decision: 'allow' });
}

runHook(handle, () => emitPreToolUseOutput({ decision: 'allow' }));
