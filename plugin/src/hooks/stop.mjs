// Stop hook 入口：agent 结束一轮时跑。
// 进度落地：默认 no-op（避免每轮都写、噪声大）；OMW_HOOK_PERSIST=1 时追加一行会话标记到 .workbuddy/memory/YYYY-MM-DD.md。
import { runHook, emitStopOutput } from '../lib/hook-io.mjs';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function todayLog() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return path.join(os.homedir(), '.workbuddy', 'memory', `${y}-${m}-${day}.md`);
}

function handle(input) {
  const sessionId = input?.session_id || '';
  if (process.env.OMW_HOOK_PERSIST === '1' && sessionId) {
    try {
      const log = todayLog();
      fs.mkdirSync(path.dirname(log), { recursive: true });
      const ts = new Date().toISOString().slice(11, 19);
      const line = `- [omw-hook stop] session ${sessionId} @ ${ts}\n`;
      fs.appendFileSync(log, line);
    } catch {
      // 落地失败不影响停止流程。
    }
  }
  emitStopOutput();
}

runHook(handle, () => emitStopOutput());
