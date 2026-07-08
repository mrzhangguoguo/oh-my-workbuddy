// Skill routing: port of OMC hooks/skill-activation-prompt.js matchSkill logic,
// adapted to our hook-io contract. Matches a prompt against skill-rules.json
// (keywords = substring, intentPatterns = regex, both case-insensitive).
// Source: oh-my-codebuddy (MIT, CodeBuddy Team) — adapted.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RULES_PATH = path.resolve(__dirname, '..', '..', 'data', 'skill-rules.json');

export function loadRules() {
  try {
    return JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
  } catch {
    return { skills: {} };
  }
}

// 命中返回 reason 字符串；未命中返回 null。
export function matchSkill(prompt, rule, skillName) {
  const triggers = (rule && rule.promptTriggers) || {};
  const keywords = [...(triggers.keywords || []), skillName].filter(Boolean);
  const patterns = triggers.intentPatterns || [];
  const promptLower = prompt.toLowerCase();

  const keyword = keywords.find((k) => promptLower.includes(String(k).toLowerCase()));
  if (keyword) return `命中关键词 "${keyword}"`;

  for (const pattern of patterns) {
    try {
      if (new RegExp(pattern, 'i').test(prompt)) return `命中模式 /${pattern}/`;
    } catch {
      continue;
    }
  }
  return null;
}

// 返回 [{skill, enforcement, priority, reason}]。
export function suggestSkills(prompt, rules = loadRules()) {
  if (!prompt || !prompt.trim()) return [];
  const out = [];
  for (const [name, rule] of Object.entries(rules.skills || {})) {
    const reason = matchSkill(prompt, rule, name);
    if (reason) out.push({ skill: name, enforcement: rule.enforcement || 'suggest', priority: rule.priority || 'normal', reason });
  }
  // high 优先排前
  return out.sort((a, b) => (a.priority === 'high' ? -1 : 0) - (b.priority === 'high' ? -1 : 0));
}
