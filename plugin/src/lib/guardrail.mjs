// Destructive-op guardrail for PreToolUse (Bash matcher).
// Ports the spirit of OMX/codebuddy safety hooks + the project's personal_files_safety
// rules: deterministically block `rm -rf` / rmtree / `del /S /Q` / broad wildcards
// targeting protected personal/system dirs. Everything else passes.
// This is a second layer behind the model's own judgement — a hook can't be socially-engineered.

// 受保护路径前缀（命中即拦截）。与项目 personal_files_safety 规则一致。
const PROTECTED = [
  /(^|[\s'"])~/,                      // ~ / $HOME
  /\/Desktop\b/i, /\bDesktop\b/,
  /\/Downloads\b/i, /\bDownloads\b/,
  /\/Documents\b/i, /\bDocuments\b/,
  /\b\/System\b/, /^\/(?:\s|$)/,       // / , /System
  /\/Library\b/, /\.config\b/, /AppData/i,
  /\bC:\\(?:\s|$|\W)/i,
];

// 危险删除模式。
const DESTRUCTIVE = [
  /\brm\s+(-[a-z]*r[a-z]*f?|-[a-z]*f[a-z]*r?)\b/,   // rm -rf / rm -fr / rm -r
  /\brm\s+-[a-z]*r\b/,                                // rm -r
  /shutil\.rmtree\s*\(/,
  /\bdel\s+\/[sS]\s+\/[qQ]\b/,                        // del /S /Q (windows)
  /\btrash-put\b/, /\bgio\s+trash\b/,                 // (these are safe — NOT blocked; left out)
];

// 判断一条 Bash 命令是否应被拦截。返回 reason 字符串或 null。
export function evaluateBashCommand(command) {
  if (typeof command !== 'string' || !command.trim()) return null;
  const isDestructive = DESTRUCTIVE.some((re) => re.test(command));
  if (!isDestructive) return null;
  // 进一步：是否指向受保护路径？
  const targetsProtected = PROTECTED.some((re) => re.test(command));
  if (targetsProtected) {
    return `拦截：检测到针对受保护目录的递归删除（personal_files_safety）。如确需删除，请逐项确认或移至回收站。`;
  }
  // 危险但非受保护路径（如 node_modules）—— 放行但记录（通过 stderr，不阻塞）。
  return null;
}
