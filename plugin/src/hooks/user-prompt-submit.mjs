// UserPromptSubmit hook 入口：用户提交 prompt 时跑。
// port of OMX: keyword-detector + triage + session + prompt-guidance-contract。
import { runHook, emitUserPromptOutput } from '../lib/hook-io.mjs';
import { routeByKeyword } from '../lib/keyword-router.mjs';

function handle(input) {
  const prompt = typeof input?.prompt === 'string' ? input.prompt : '';
  const sessionId = input?.session_id || '';
  const parts = [];

  // ① keyword-router：命中 → 注入"应调用 X skill"
  const hit = routeByKeyword(prompt);
  if (hit) {
    parts.push(`[oh-my-workbuddy route] prompt 匹配 skill "${hit}"；在回复前应通过 Skill 工具加载该 skill。`);
  }

  // ② triage（TODO, P3-c）：估任务规模→注入分流策略
  // ③ session（TODO, P3-d）：mint/读 session sidecar
  // ④ prompt-guidance-contract（TODO）：读 AGENTS.md / .workbuddy/memory 注入项目约定

  emitUserPromptOutput({ context: parts.join('\n'), sessionId });
}

runHook(handle, () => emitUserPromptOutput({}));
