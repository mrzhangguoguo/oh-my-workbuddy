// 单元测试：lib/install.js 的 sync（增量/幂等/prune/断链容错）。
// 运行：npm test （node --test）。
// 用注入的 manifest/config/target/skillsDir 完全隔离，不触碰真实全局安装。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { sync } from '../install.js';

// 搭一个临时 source + 合成 manifest/config。
function setup() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'omw-sync-'));
  const skillsDir = path.join(tmp, 'skills');
  const target = path.join(tmp, 'installed');
  fs.mkdirSync(path.join(skillsDir, 'foo'), { recursive: true });
  fs.writeFileSync(path.join(skillsDir, 'foo', 'SKILL.md'), '---\nname: foo\n---\n# foo\nbody v1\n');
  fs.mkdirSync(path.join(skillsDir, 'foo', 'refs'), { recursive: true });
  fs.writeFileSync(path.join(skillsDir, 'foo', 'refs', 'a.md'), 'ref-a\n');
  const manifest = { skills: [{ name: 'foo', status: 'active' }] };
  const config = { enabled: ['*'], disabled: new Set() };
  return { tmp, skillsDir, target, manifest, config };
}

test('sync 首次复制全部文件', () => {
  const { skillsDir, target, manifest, config } = setup();
  const r = sync({ skillsDir, target, manifest, config });
  assert.equal(r.copied, 2);
  assert.ok(fs.existsSync(path.join(target, 'foo', 'SKILL.md')));
  assert.ok(fs.existsSync(path.join(target, 'foo', 'refs', 'a.md')));
  assert.deepEqual(r.changed, ['foo']);
});

test('sync 第二次幂等（无变更）', () => {
  const { skillsDir, target, manifest, config } = setup();
  sync({ skillsDir, target, manifest, config });
  const r2 = sync({ skillsDir, target, manifest, config });
  assert.equal(r2.copied, 0);
  assert.equal(r2.removed, 0);
  assert.deepEqual(r2.changed, []);
});

test('sync 检测到内容变更并增量复制', () => {
  const { skillsDir, target, manifest, config } = setup();
  sync({ skillsDir, target, manifest, config });
  fs.writeFileSync(path.join(skillsDir, 'foo', 'SKILL.md'), '---\nname: foo\n---\n# foo\nbody v2\n');
  const r = sync({ skillsDir, target, manifest, config });
  assert.equal(r.copied, 1);
  assert.deepEqual(r.changed, ['foo']);
  assert.match(fs.readFileSync(path.join(target, 'foo', 'SKILL.md'), 'utf8'), /body v2/);
});

test('sync --prune 删除源已移除的文件', () => {
  const { skillsDir, target, manifest, config } = setup();
  sync({ skillsDir, target, manifest, config });
  fs.rmSync(path.join(skillsDir, 'foo', 'refs', 'a.md'));
  const r = sync({ skillsDir, target, manifest, config, prune: true });
  assert.ok(r.removed >= 1);
  assert.ok(!fs.existsSync(path.join(target, 'foo', 'refs', 'a.md')));
});

test('sync 不开 prune 时保留目标端多余文件', () => {
  const { skillsDir, target, manifest, config } = setup();
  sync({ skillsDir, target, manifest, config });
  fs.rmSync(path.join(skillsDir, 'foo', 'refs', 'a.md'));
  const r = sync({ skillsDir, target, manifest, config, prune: false });
  assert.equal(r.removed, 0);
  assert.ok(fs.existsSync(path.join(target, 'foo', 'refs', 'a.md')));
});

test('sync 容忍源端断链符号链接（不崩溃，其余文件仍复制）', () => {
  const { skillsDir, target, manifest, config } = setup();
  // 造一个断链：指向不存在的 target。
  fs.symlinkSync(path.join(skillsDir, 'foo', 'nope.md'), path.join(skillsDir, 'foo', 'broken.md'));
  // 不应抛异常。
  const r = sync({ skillsDir, target, manifest, config });
  // 断链被 lstat 判为 symlink → 按"保留符号链接"语义复制（与 setup(cpSync) 一致）。
  assert.ok(r.copied >= 2);
  // 实体文件仍在目标端。
  assert.ok(fs.existsSync(path.join(target, 'foo', 'SKILL.md')));
});

test('sync 跳过源缺失的 skill（manifest 有、目录无）', () => {
  const { skillsDir, target, manifest, config } = setup();
  manifest.skills.push({ name: 'ghost', status: 'active' }); // 登记了但没目录
  const r = sync({ skillsDir, target, manifest, config });
  assert.equal(r.copied, 2); // 只复制了 foo
  assert.ok(!fs.existsSync(path.join(target, 'ghost')));
});
