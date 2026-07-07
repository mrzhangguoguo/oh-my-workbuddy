// lib/install.js
// 按作用域 + 启用集把 skills 安装到目标目录。对标 OMX 的 setup 搬运逻辑（去掉 Codex hook 部分）。
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ROOT, SKILLS_DIR, loadManifest } from './manifest.js';
import { loadConfig } from './config.js';

export function resolveTargetDir(config, projectRoot = process.cwd()) {
  return config.scope === 'user'
    ? path.join(os.homedir(), '.workbuddy', 'skills')
    : path.join(projectRoot, '.workbuddy', 'skills');
}

// 计算应当安装的 skill 集合：仅 active/internal，未被 disabled，且命中 enabled（支持 "*"）。
export function computeInstallSet(manifest, config) {
  const wildcard = Array.isArray(config.enabled) && config.enabled[0] === '*';
  return manifest.skills.filter((s) => {
    if (s.status !== 'active' && s.status !== 'internal') return false;
    if (config.disabled.has(s.name)) return false;
    if (wildcard) return true;
    return config.enabled.includes(s.name);
  });
}

export function install({ projectRoot = process.cwd(), withGuidance = false } = {}) {
  const manifest = loadManifest();
  const config = loadConfig();
  const target = resolveTargetDir(config, projectRoot);
  const set = computeInstallSet(manifest, config);

  fs.mkdirSync(target, { recursive: true });
  const results = [];
  for (const s of set) {
    const src = path.join(SKILLS_DIR, s.name);
    const dst = path.join(target, s.name);
    if (!fs.existsSync(src)) {
      results.push({ name: s.name, ok: false, reason: 'source missing' });
      continue;
    }
    fs.cpSync(src, dst, { recursive: true });
    results.push({ name: s.name, ok: true, dst });
  }

  if (withGuidance) {
    const ag = path.join(ROOT, 'AGENTS.md');
    const dst =
      config.scope === 'user'
        ? path.join(os.homedir(), '.workbuddy', 'AGENTS.md')
        : path.join(projectRoot, 'AGENTS.md');
    if (fs.existsSync(ag)) fs.copyFileSync(ag, dst);
  }

  return { target, results, config };
}

// 列出目标目录已安装的 skill 名。
export function listInstalled(target) {
  if (!fs.existsSync(target)) return [];
  return fs.readdirSync(target, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
}
