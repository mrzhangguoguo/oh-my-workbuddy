// Hook I/O 底座：解析 stdin、发射标准 hookSpecificOutput、fail-safe 放行。
// 所有 hook 入口都应通过这里读写，保证：异常绝不阻塞用户（→ allow + 空 context）。
import { readFileSync } from 'node:fs';

// 读 stdin（同步，hook 进程生命周期内）。失败返回 null。
export function readStdin() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    return null;
  }
}

// 发射 UserPromptSubmit 输出：注入 context（系统提示/路由提示）。
// context 字符串会被 WorkBuddy 注入到本轮上下文。
export function emitUserPromptOutput({ context = '', sessionId = '' } = {}) {
  const out = { hookSpecificOutput: { hookEventName: 'UserPromptSubmit' } };
  if (context) out.hookSpecificOutput.context = context;
  if (sessionId) out.hookSpecificOutput.sessionId = sessionId;
  process.stdout.write(JSON.stringify(out));
}

// 发射 PreToolUse 输出：改写工具入参（shallow-merge）+ 放行/拒绝。
// 注意：updatedInput 是 shallow merge 顶层键，注入嵌套字段必须先 spread 原值。
export function emitPreToolUseOutput({ decision = 'allow', updatedInput = null, reason = '' } = {}) {
  const out = { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision } };
  if (updatedInput) out.hookSpecificOutput.updatedInput = updatedInput;
  if (reason) out.hookSpecificOutput.permissionDecisionReason = reason;
  process.stdout.write(JSON.stringify(out));
}

// 发射 Stop 输出：仅副作用（落地进度），无特殊输出。
export function emitStopOutput() {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'Stop' } }));
}

// fail-safe 包装：handler 抛异常时静默放行，绝不阻塞用户。
export function runHook(handler, fallback) {
  let input = readStdin();
  try {
    handler(input);
  } catch (e) {
    if (process.env.OMW_HOOK_DEBUG) process.stderr.write(`[omw-hook] ${e?.message || e}\n`);
    (fallback || (() => process.stdout.write('{}')))();
  }
}
