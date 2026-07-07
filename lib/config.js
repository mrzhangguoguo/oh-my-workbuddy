// lib/config.js
// 读取并解析 omw.config.json（对标 OMX 的作用域/启用集/偏好持久化）。
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './manifest.js';

export const CONFIG_PATH = path.join(ROOT, 'omw.config.json');
export const EXAMPLE_CONFIG_PATH = path.join(ROOT, 'omw.config.example.json');

const PROFILES = new Set(['minimal', 'focused', 'full']);

export function loadConfigRaw() {
  const p = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH : EXAMPLE_CONFIG_PATH;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function resolveConfig(raw) {
  const scope = raw.scope === 'project' ? 'project' : 'user';
  const profile = PROFILES.has(raw.profile) ? raw.profile : 'full';
  const enabled = Array.isArray(raw.skills?.enabled) ? raw.skills.enabled : ['*'];
  const disabled = new Set(Array.isArray(raw.skills?.disabled) ? raw.skills.disabled : []);
  const injectAgentsMd = raw.guidance?.injectAgentsMd === true;
  return { scope, profile, enabled, disabled, injectAgentsMd, raw };
}

export function loadConfig() {
  return resolveConfig(loadConfigRaw());
}

// 确保存在可写的 omw.config.json（首次从 example 复制）。
export function ensureWritableConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.copyFileSync(EXAMPLE_CONFIG_PATH, CONFIG_PATH);
  }
  return CONFIG_PATH;
}
