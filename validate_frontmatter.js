// Validate that every bundled skill has parseable, well-formed frontmatter.
// Requires js-yaml: `npm install` (devDependency), then `npm run validate`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.join(__dirname, 'skills');

const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

let bad = 0, ok = 0;
const errors = [];
for (const name of dirs) {
  const fp = path.join(SKILLS_DIR, name, 'SKILL.md');
  if (!fs.existsSync(fp)) { errors.push(`${name}: missing SKILL.md`); bad++; continue; }
  const txt = fs.readFileSync(fp, 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) { errors.push(`${name}: no frontmatter fence`); bad++; continue; }
  let fm;
  try { fm = yaml.load(m[1]); }
  catch (e) { errors.push(`${name}: YAML parse error -> ${e.message}`); bad++; continue; }
  const missing = [];
  if (typeof fm.name !== 'string' || !fm.name.trim()) missing.push('name');
  if (typeof fm.description !== 'string' || !fm.description.trim()) missing.push('description');
  if (fm.agent_created !== true) missing.push('agent_created');
  if (typeof fm.category !== 'string' || !fm.category.trim()) missing.push('category');
  if (typeof fm.status !== 'string' || !fm.status.trim()) missing.push('status');
  if (missing.length) { errors.push(`${name}: missing/invalid [${missing.join(',')}]`); bad++; continue; }
  if (fm.name !== name) { errors.push(`${name}: frontmatter name "${fm.name}" != dir`); bad++; continue; }
  ok++;
}
console.log(`Parsed OK: ${ok}   Problems: ${bad}`);
if (errors.length) { console.log('\n--- ERRORS ---'); errors.forEach(e => console.log(' - ' + e)); process.exit(1); }
else console.log('All frontmatter valid.');
