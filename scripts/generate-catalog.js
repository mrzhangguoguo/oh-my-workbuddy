// Generate catalog/manifest.json from frontmatter (single source of truth).
//   node scripts/generate-catalog.js          # regenerate manifest.json in place
//   node scripts/generate-catalog.js --check  # fail (exit 1) if committed manifest drifted
//
// Sources:
//   catalog/meta.json                 -> schemaVersion, catalogVersion, port
//   skills/<name>/SKILL.md frontmatter -> name, category, status, core, description, canonical
//   agents/<name>.md frontmatter       -> category, status (name = filename)
//
// This is P2-full from docs/PARITY_ROADMAP.md. Replaces the hand-maintained manifest:
// edit frontmatter, run `npm run generate-catalog`, commit manifest.json.
// CI runs `npm run verify-catalog` (= --check) to reject drift.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { validateManifest } from '../lib/manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const AGENTS_DIR = path.join(ROOT, 'agents');
const META_PATH = path.join(ROOT, 'catalog', 'meta.json');
const MANIFEST_PATH = path.join(ROOT, 'catalog', 'manifest.json');

const check = process.argv.includes('--check');

function parseFrontmatter(filePath) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const m = txt.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter fence in ${filePath}`);
  return yaml.load(m[1]);
}

const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));

// --- skills ---
const skillDirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory()).map((d) => d.name).sort();
const skills = skillDirs.map((dir) => {
  const fm = parseFrontmatter(path.join(SKILLS_DIR, dir, 'SKILL.md'));
  if (fm.name !== dir) throw new Error(`skill dir '${dir}': frontmatter name '${fm.name}' != dir`);
  const entry = {
    name: fm.name,
    category: fm.category,
    status: fm.status,
    core: fm.core === true,
    description: fm.description,
  };
  if (typeof fm.canonical === 'string' && fm.canonical) entry.canonical = fm.canonical;
  return entry;
});

// --- agents ---
const agentFiles = fs.existsSync(AGENTS_DIR)
  ? fs.readdirSync(AGENTS_DIR, { withFileTypes: true })
      .filter((d) => d.isFile() && d.name.endsWith('.md')).map((d) => d.name).sort()
  : [];
const agents = agentFiles.map((file) => {
  const name = file.replace(/\.md$/, '');
  const fm = parseFrontmatter(path.join(AGENTS_DIR, file));
  return { name, category: fm.category, status: fm.status };
});

const generated = {
  schemaVersion: meta.schemaVersion,
  catalogVersion: meta.catalogVersion,
  port: meta.port,
  skills,
  agents,
};

// Validate against the schema (catches bad category/status/duplicates/missing core skills).
validateManifest(generated);

const generatedJson = JSON.stringify(generated, null, 2) + '\n';

if (check) {
  const committed = fs.existsSync(MANIFEST_PATH)
    ? fs.readFileSync(MANIFEST_PATH, 'utf8')
    : '';
  if (committed !== generatedJson) {
    console.error('✗ catalog/manifest.json is out of sync with frontmatter.');
    console.error('  Run `npm run generate-catalog` and commit the result.');
    process.exit(1);
  }
  console.log(`✓ manifest in sync: ${skills.length} skills, ${agents.length} agents (generated from frontmatter).`);
} else {
  fs.writeFileSync(MANIFEST_PATH, generatedJson);
  console.log(`✓ generated catalog/manifest.json: ${skills.length} skills, ${agents.length} agents.`);
}
