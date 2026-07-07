// lib/manifest.js
// 读取并校验技能/agent 清单。逻辑直接移植自 oh-my-codex 的 src/catalog/schema.ts。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const MANIFEST_PATH = path.join(ROOT, 'catalog', 'manifest.json');
export const SKILLS_DIR = path.join(ROOT, 'skills');

// 9 类，与 docs/PORTING_GUIDE.md §7 的分类法一致（移植自 OMX 的更细分类）。
const SKILL_CATEGORIES = new Set([
  'execution', 'planning', 'shortcut', 'utility',
  'research', 'review', 'build', 'infra', 'display'
]);
const AGENT_CATEGORIES = new Set(['build', 'review', 'domain', 'product', 'coordination']);
const ENTRY_STATUSES = new Set(['active', 'alias', 'merged', 'deprecated', 'internal']);
const REQUIRED_CORE_SKILLS = new Set(['deep-interview', 'plan', 'ultragoal', 'team']);

function reqStr(e, f, ctx) {
  if (typeof e[f] !== 'string' || !e[f].trim()) throw new Error(`manifest_invalid:${ctx}.${f}`);
}

export function validateManifest(input) {
  if (typeof input !== 'object' || input === null) throw new Error('manifest_invalid:root');
  if (typeof input.schemaVersion !== 'number') throw new Error('manifest_invalid:schemaVersion');
  if (typeof input.catalogVersion !== 'string' || !input.catalogVersion.trim())
    throw new Error('manifest_invalid:catalogVersion');
  if (!Array.isArray(input.skills)) throw new Error('manifest_invalid:skills');
  if (!Array.isArray(input.agents)) throw new Error('manifest_invalid:agents');

  const seen = new Set();
  const skills = input.skills.map((e, i) => {
    reqStr(e, 'name', `skills[${i}]`);
    reqStr(e, 'category', `skills[${i}]`);
    reqStr(e, 'status', `skills[${i}]`);
    if (!SKILL_CATEGORIES.has(e.category)) throw new Error(`manifest_invalid:skills[${i}].category`);
    if (!ENTRY_STATUSES.has(e.status)) throw new Error(`manifest_invalid:skills[${i}].status`);
    const name = e.name.trim();
    if (seen.has(name)) throw new Error(`manifest_invalid:duplicate_skill:${name}`);
    seen.add(name);
    return {
      name,
      category: e.category,
      status: e.status,
      core: e.core === true,
      canonical: typeof e.canonical === 'string' && e.canonical ? e.canonical : undefined,
    };
  });

  const seenA = new Set();
  const agents = input.agents.map((e, i) => {
    reqStr(e, 'name', `agents[${i}]`);
    reqStr(e, 'category', `agents[${i}]`);
    reqStr(e, 'status', `agents[${i}]`);
    if (!AGENT_CATEGORIES.has(e.category)) throw new Error(`manifest_invalid:agents[${i}].category`);
    if (!ENTRY_STATUSES.has(e.status)) throw new Error(`manifest_invalid:agents[${i}].status`);
    const name = e.name.trim();
    if (seenA.has(name)) throw new Error(`manifest_invalid:duplicate_agent:${name}`);
    seenA.add(name);
    return {
      name,
      category: e.category,
      status: e.status,
      canonical: typeof e.canonical === 'string' && e.canonical ? e.canonical : undefined,
    };
  });

  for (const c of REQUIRED_CORE_SKILLS) {
    const s = skills.find((x) => x.name === c);
    if (!s || s.status !== 'active') throw new Error(`manifest_invalid:missing_core_skill:${c}`);
  }

  return { schemaVersion: input.schemaVersion, catalogVersion: input.catalogVersion, skills, agents };
}

export function loadManifest(p = MANIFEST_PATH) {
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  return validateManifest(raw);
}
