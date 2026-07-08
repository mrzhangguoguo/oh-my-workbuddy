// Catalog drift guard: ensure skills/ dirs <-> manifest skills <-> agents/*.md stay consistent.
// This is P2-light from docs/PARITY_ROADMAP.md. Full generation (from frontmatter) is deferred
// because frontmatter does not yet carry category/status/core — those remain manifest-authoritative.
// Run: npm run verify-catalog   (also a CI gate in .github/workflows/validate.yml)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadManifest } from '../lib/manifest.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(ROOT, 'skills');
const AGENTS_DIR = path.join(ROOT, 'agents');

const manifest = loadManifest();
const regSkills = new Set(manifest.skills.map((s) => s.name));
const regAgents = new Set(manifest.agents.map((a) => a.name));

const skillDirs = fs.existsSync(SKILLS_DIR)
  ? fs.readdirSync(SKILLS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name).sort()
  : [];
const skillDirSet = new Set(skillDirs);

const agentFiles = fs.existsSync(AGENTS_DIR)
  ? fs.readdirSync(AGENTS_DIR, { withFileTypes: true }).filter((d) => d.isFile() && d.name.endsWith('.md')).map((d) => d.name.replace(/\.md$/, '')).sort()
  : [];
const agentFileSet = new Set(agentFiles);

const problems = [];

// skills: dir registered but no entry
for (const d of skillDirs) if (!regSkills.has(d)) problems.push(`skill dir '${d}' exists but is NOT registered in manifest.skills`);
// skills: entry registered but no dir
for (const s of manifest.skills) if (!skillDirSet.has(s.name)) problems.push(`manifest skill '${s.name}' has no skills/ directory`);

// agents: file exists but not registered
for (const a of agentFiles) if (!regAgents.has(a)) problems.push(`agents/${a}.md exists but is NOT registered in manifest.agents`);
// agents: registered but no file
for (const a of manifest.agents) if (!agentFileSet.has(a.name)) problems.push(`manifest agent '${a.name}' has no agents/*.md file`);

// manifest duplicates (loadManifest already rejects duplicates, but keep a belt-and-braces count)
const dupSkills = manifest.skills.filter((s, i, arr) => arr.findIndex((x) => x.name === s.name) !== i);
for (const d of dupSkills) problems.push(`duplicate skill in manifest: '${d.name}'`);

if (problems.length) {
  console.error(`✗ Catalog drift detected (${problems.length} problem(s)):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`✓ Catalog consistent: ${manifest.skills.length} skills (dirs match), ${manifest.agents.length} agents (files match).`);
