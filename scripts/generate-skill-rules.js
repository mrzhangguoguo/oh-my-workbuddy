// Generate plugin/data/skill-rules.json from skills/*/SKILL.md frontmatter.
// Routing table for the UserPromptSubmit hook (port of OMC skill-activation-prompt,
// adapted to cover all 46 of our skills instead of OMC's ~5).
//   node scripts/generate-skill-rules.js          # regenerate
//   node scripts/generate-skill-rules.js --check   # fail if committed rules drifted
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const RULES_PATH = path.join(ROOT, 'plugin', 'data', 'skill-rules.json');
const check = process.argv.includes('--check');

function parseFrontmatter(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  return yaml.load(m[1]);
}

const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name).sort();

const skills = {};
for (const dir of dirs) {
  const fm = parseFrontmatter(path.join(SKILLS_DIR, dir, 'SKILL.md'));
  if (!fm || fm.status === 'deprecated') continue; // skip deprecated shims (no routing)
  const triggers = Array.isArray(fm.triggers) ? fm.triggers : [];
  // keywords: skill name + triggers (deduped, lowercase for matching)
  const keywords = [...new Set([dir, ...triggers])].map((k) => k).filter(Boolean);
  skills[dir] = {
    type: fm.category || 'utility',
    enforcement: 'suggest',
    priority: fm.core === true ? 'high' : 'normal',
    promptTriggers: { keywords, intentPatterns: [] },
  };
}

const generated = { skills, _source: 'generated from skills/*/SKILL.md frontmatter triggers' };
const json = JSON.stringify(generated, null, 2) + '\n';

if (check) {
  const committed = fs.existsSync(RULES_PATH) ? fs.readFileSync(RULES_PATH, 'utf8') : '';
  if (committed !== json) {
    console.error('✗ plugin/data/skill-rules.json is out of sync with frontmatter triggers.');
    console.error('  Run `npm run generate-skill-rules` and commit the result.');
    process.exit(1);
  }
  console.log(`✓ skill-rules in sync: ${Object.keys(skills).length} active skills routed.`);
} else {
  fs.mkdirSync(path.dirname(RULES_PATH), { recursive: true });
  fs.writeFileSync(RULES_PATH, json);
  console.log(`✓ generated plugin/data/skill-rules.json: ${Object.keys(skills).length} active skills routed.`);
}
