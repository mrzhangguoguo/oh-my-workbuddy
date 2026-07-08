#!/usr/bin/env bash
# uninstall.sh — 卸载 oh-my-workbuddy 插件（install.sh 的逆操作）。
set -euo pipefail

MARKET_ID="oh-my-workbuddy"
PLUGIN_ID="oh-my-workbuddy-hooks"
WB_ROOT="${HOME}/.workbuddy"
MP_ROOT="${WB_ROOT}/plugins/marketplaces/${MARKET_ID}"
KNOWN="${WB_ROOT}/plugins/known_marketplaces.json"
SETTINGS="${WB_ROOT}/settings.json"

echo "→ 卸载 ${PLUGIN_ID}"

# 1) 移除启用项（settings.json）
SETTINGS_VAL="${SETTINGS}" node -e '
const fs = require("fs");
const p = process.env.SETTINGS_VAL;
let s = {};
try { s = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
if (s.enabledPlugins) delete s.enabledPlugins["oh-my-workbuddy-hooks@oh-my-workbuddy"];
fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
console.log("  ✓ 已从 settings.json 移除启用项");
'

# 2) 移除 marketplace 注册
KNOWN_VAL="${KNOWN}" node -e '
const fs = require("fs");
const p = process.env.KNOWN_VAL;
let m = {};
try { m = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
if (m["oh-my-workbuddy"]) { delete m["oh-my-workbuddy"]; fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n"); console.log("  ✓ 已从 known_marketplaces.json 移除"); }
else console.log("  · marketplace 未注册，跳过");
'

# 3) 删除插件文件
if [ -d "${MP_ROOT}" ]; then
  rm -rf "${MP_ROOT}"
  echo "  ✓ 已删除 ${MP_ROOT}"
else
  echo "  · 目录不存在，跳过"
fi

echo ""
echo "✅ 卸载完成。重启 WorkBuddy 使变更生效。"
