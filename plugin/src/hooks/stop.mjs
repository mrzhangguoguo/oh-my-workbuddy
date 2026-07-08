// Stop hook 入口：agent 结束一轮时跑。
// port of OMX: session 落地 + document-refresh。
import { runHook, emitStopOutput } from '../lib/hook-io.mjs';

function handle(input) {
  const sessionId = input?.session_id || '';
  // ① 落地进度到 .workbuddy/memory/YYYY-MM-DD.md（TODO, P3-d）
  // ② document-refresh（TODO, P3-f）：检测文档变更触发刷新
  // ③ session 清理（TODO）
  emitStopOutput();
}

runHook(handle, () => emitStopOutput());
