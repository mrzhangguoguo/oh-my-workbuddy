// UserPromptSubmit hook 入口：用户提交 prompt 时跑。
// Integrates OMC's skill-activation-prompt routing (MIT, CodeBuddy Team) into
// our WorkBuddy plugin hook framework. Routes across all our active skills.
import { runHook, emitUserPromptOutput } from '../lib/hook-io.mjs';
import { suggestSkills } from '../lib/skill-rules.mjs';

function handle(input) {
  const prompt = typeof input?.prompt === 'string' ? input.prompt
    : (typeof input?.text === 'string' ? input.text
    : (input?.data?.prompt || ''));
  const sessionId = input?.session_id || '';

  const suggestions = suggestSkills(prompt);
  const parts = [];
  if (suggestions.length) {
    const lines = suggestions.map((s) =>
      `  • ${s.skill} [${s.priority}/${s.enforcement}] — ${s.reason}`);
    parts.push('[oh-my-workbuddy route] prompt 命中以下 skill，回复前应通过 Skill 工具加载：\n' + lines.join('\n'));
  }
  // triage / session / prompt-guidance-contract: TODO (P3-c/d)

  emitUserPromptOutput({ context: parts.join('\n'), sessionId });
}

runHook(handle, () => emitUserPromptOutput({}));
