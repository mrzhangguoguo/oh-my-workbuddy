// lib/cli.js
// 命令分派器。结构对标 OMX 的 src/cli/index.ts（setup/doctor/list/...）。
import fs from 'node:fs';
import { loadManifest } from './manifest.js';
import { loadConfig, CONFIG_PATH, EXAMPLE_CONFIG_PATH, ensureWritableConfig, loadConfigRaw } from './config.js';
import { install, resolveTargetDir, computeInstallSet, listInstalled, sync } from './install.js';

const USAGE = `
oh my workbuddy (omw) — catalog-driven skill installer for WorkBuddy

Usage:
  omw setup [--with-guidance] [--force]   安装清单中启用集合到目标作用域
  omw doctor                              校验已安装 skill 与清单一致性
  omw list                                列出清单中所有 skill 及状态
  omw enable <name>                       启用某个 skill（从 disabled 移除）
  omw disable <name>                      禁用某个 skill（加入 disabled）
  omw info                                打印版本/作用域/profile/已安装数
  omw sync [--prune]                      把 skills/ 变动增量同步到已安装作用域（默认保留多余文件）
  omw help                                显示本帮助

作用域（来自 omw.config.json 的 scope）：
  user    -> ~/.workbuddy/skills
  project -> ./.workbuddy/skills（当前目录）
`;

function help() {
  console.log(USAGE);
}

function setup(args) {
  const withGuidance = args.includes('--with-guidance');
  const r = install({ withGuidance });
  const ok = r.results.filter((x) => x.ok).length;
  const fail = r.results.filter((x) => !x.ok);
  console.log(`✓ Installed ${ok} skill(s) to ${r.target}`);
  if (fail.length) {
    console.log(`✗ Skipped ${fail.length}: ${fail.map((f) => `${f.name}(${f.reason})`).join(', ')}`);
  }
  if (withGuidance) console.log('✓ AGENTS.md guidance written (scope: ' + r.config.scope + ')');
}

function doctor() {
  const config = loadConfig();
  const target = resolveTargetDir(config);
  const manifest = loadManifest();
  const set = computeInstallSet(manifest, config);
  const installed = new Set(listInstalled(target));
  const missing = set.filter((s) => !installed.has(s.name)).map((s) => s.name);
  const extra = [...installed].filter((n) => !set.find((s) => s.name === n));
  console.log(`Scope: ${config.scope}  (${target})`);
  console.log(`Expected: ${set.length}  Installed dirs: ${installed.size}`);
  if (missing.length) console.log(`✗ Missing: ${missing.join(', ')}`);
  else console.log('✓ All enabled skills installed');
  if (extra.length) console.log(`• Extra (not in enabled set): ${extra.join(', ')}`);
}

function list() {
  const manifest = loadManifest();
  const config = loadConfig();
  const target = resolveTargetDir(config);
  const installed = new Set(listInstalled(target));
  console.log('Skills (catalog):');
  for (const s of manifest.skills) {
    const mark = installed.has(s.name) ? ' [installed]' : '';
    const core = s.core ? ' core' : '';
    console.log(`  - ${s.name}  (${s.category}/${s.status}${core})${mark}`);
  }
  console.log('Agents (catalog):');
  for (const a of manifest.agents) {
    console.log(`  - ${a.name}  (${a.category}/${a.status})`);
  }
}

function setDisabled(name, disabled) {
  ensureWritableConfig();
  const raw = loadConfigRaw();
  raw.skills = raw.skills || {};
  raw.skills.disabled = Array.isArray(raw.skills.disabled) ? raw.skills.disabled : [];
  const set = new Set(raw.skills.disabled);
  if (disabled) set.add(name);
  else set.delete(name);
  raw.skills.disabled = [...set];
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(raw, null, 2) + '\n');
}

function enable(args) {
  const name = args[0];
  if (!name) return help();
  setDisabled(name, false);
  console.log(`✓ Enabled: ${name} (will install on next 'omw setup')`);
}

function disable(args) {
  const name = args[0];
  if (!name) return help();
  setDisabled(name, true);
  console.log(`✓ Disabled: ${name}`);
}

function info() {
  const config = loadConfig();
  const manifest = loadManifest();
  const target = resolveTargetDir(config);
  const installed = listInstalled(target).length;
  console.log(`omw catalogVersion: ${manifest.catalogVersion}`);
  console.log(`scope: ${config.scope}`);
  console.log(`profile: ${config.profile}`);
  console.log(`target: ${target}`);
  console.log(`skills in catalog: ${manifest.skills.length} (active: ${manifest.skills.filter((s) => s.status === 'active').length})`);
  console.log(`installed: ${installed}`);
}

function syncCmd(args) {
  const prune = args.includes('--prune');
  const r = sync({ prune });
  console.log(`✓ Synced to ${r.target}  (copied ${r.copied}, removed ${r.removed}${prune ? '' : ', prune off'})`);
  if (r.changed.length) console.log(`  Changed skills: ${r.changed.join(', ')}`);
  else console.log('  Already up to date');
}

const CMDS = { setup, doctor, list, enable, disable, info, sync: syncCmd, help };
const [cmd, ...rest] = process.argv.slice(2);
(CMDS[cmd] || help)(rest);
