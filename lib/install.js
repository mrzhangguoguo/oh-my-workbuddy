// lib/install.js
// 按作用域 + 启用集把 skills 安装到目标目录。对标 OMX 的 setup 搬运逻辑（去掉 Codex hook 部分）。
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { ROOT, SKILLS_DIR, loadManifest } from './manifest.js';
import { loadConfig } from './config.js';

function sha1File(p) {
  try {
    return crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex');
  } catch {
    return null;
  }
}

function walkFiles(dir, base = dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkFiles(abs, base));
    else out.push(path.relative(base, abs));
  }
  return out;
}

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

// 单向同步：把 skills/ 源树的变更增量复制到已安装作用域（仅复制/删除差异文件）。
// 默认保留目标端多余文件（安全）；传 prune=true 会删除源已移除的文件，保持镜像一致。
// manifest/config/target/skillsDir 均可注入，便于单元测试隔离（缺省回退到真实加载）。
export function sync({ projectRoot = process.cwd(), prune = false, manifest, config, target, skillsDir = SKILLS_DIR } = {}) {
  manifest = manifest || loadManifest();
  config = config || loadConfig();
  target = target || resolveTargetDir(config, projectRoot);
  const set = computeInstallSet(manifest, config);

  fs.mkdirSync(target, { recursive: true });
  const changed = [];
  let copied = 0;
  let removed = 0;

  for (const s of set) {
    const src = path.join(skillsDir, s.name);
    const dst = path.join(target, s.name);
    if (!fs.existsSync(src)) continue; // 源缺失（如 deprecated 未含目录）跳过
    fs.mkdirSync(dst, { recursive: true });

    const srcFiles = new Set(walkFiles(src));
    let thisCopied = 0;
    for (const rel of srcFiles) {
      const sp = path.join(src, rel);
      const dp = path.join(dst, rel);

      // 源不可访问（瞬时坏条目/断链 target 缺失）直接跳过，不中断整批。
      let isLink = false;
      try { isLink = fs.lstatSync(sp).isSymbolicLink(); } catch { continue; }

      // 仅复制有差异的文件：符号链接比对 readlink，普通文件比对 sha1。
      let need = true;
      try {
        const dStat = fs.lstatSync(dp);
        if (isLink) {
          need = !dStat.isSymbolicLink() || fs.readlinkSync(sp) !== fs.readlinkSync(dp);
        } else if (dStat.isSymbolicLink()) {
          need = true; // 目标端是链接但源不是，需覆盖
        } else {
          need = sha1File(sp) !== sha1File(dp);
        }
      } catch {
        need = true; // 目标端缺失
      }
      if (!need) continue;

      try {
        if (isLink) {
          // 与 setup(cpSync) 一致：保留符号链接本身而非跟随内容。
          fs.rmSync(dp, { force: true });
          fs.symlinkSync(fs.readlinkSync(sp), dp);
        } else {
          fs.mkdirSync(path.dirname(dp), { recursive: true });
          fs.copyFileSync(sp, dp);
        }
        thisCopied++;
      } catch (e) {
        console.warn(`  ! skip ${s.name}/${rel}: ${e.message}`);
      }
    }

    let thisRemoved = 0;
    if (prune) {
      for (const rel of walkFiles(dst)) {
        if (!srcFiles.has(rel)) {
          fs.rmSync(path.join(dst, rel), { force: true });
          thisRemoved++;
        }
      }
    }

    if (thisCopied > 0 || thisRemoved > 0) changed.push(s.name);
    copied += thisCopied;
    removed += thisRemoved;
  }

  return { target, changed, copied, removed, prune };
}
