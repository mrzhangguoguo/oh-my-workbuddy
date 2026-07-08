#!/usr/bin/env bash
# install.sh — 把 oh-my-workbuddy 插件装成本地 marketplace 并启用。
# 用法：bash plugin/install.sh
# 幂等：重复运行安全。回滚：bash plugin/uninstall.sh
set -euo pipefail

SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # plugin/
MARKET_ID="oh-my-workbuddy"
PLUGIN_ID="oh-my-workbuddy-hooks"
WB_ROOT="${HOME}/.workbuddy"
MP_ROOT="${WB_ROOT}/plugins/marketplaces/${MARKET_ID}"
PLUGIN_DST="${MP_ROOT}/plugins/${PLUGIN_ID}"
SETTINGS="${WB_ROOT}/settings.json"
KNOWN="${WB_ROOT}/plugins/known_marketplaces.json"

echo "→ 安装 ${PLUGIN_ID} 到本地 marketplace ${MARKET_ID}"

# 1) 复制插件目录到 marketplace（rsync 优先，退回 cp -R）
mkdir -p "${MP_ROOT}/plugins"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete --exclude node_modules --exclude .DS_Store "${SRC_DIR}/" "${PLUGIN_DST}/"
else
  rm -rf "${PLUGIN_DST}"
  cp -R "${SRC_DIR}" "${PLUGIN_DST}"
fi
echo "  ✓ 插件已复制到 ${PLUGIN_DST}"

# 2) marketplace 根放一份 marketplace.json + .codebuddy-plugin（marketplace 自描述）
cp "${SRC_DIR}/marketplace.json" "${MP_ROOT}/marketplace.json"
mkdir -p "${MP_ROOT}/.codebuddy-plugin"
cat > "${MP_ROOT}/.codebuddy-plugin/plugin.json" <<EOF
{ "name": "${MARKET_ID}", "description": "oh-my-workbuddy local marketplace", "version": "0.3.0" }
EOF

# 3) 注册到 known_marketplaces.json（幂等）
MP_ROOT_VAL="${MP_ROOT}" KNOWN_VAL="${KNOWN}" node -e '
const fs = require("fs");
const p = process.env.KNOWN_VAL;
const mp = process.env.MP_ROOT_VAL;
let m = {};
try { m = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
m["oh-my-workbuddy"] = {
  type: "directory",
  source: { source: "directory", path: mp },
  installLocation: mp,
  autoUpdate: false,
  isBuiltIn: false,
  description: "oh-my-workbuddy local marketplace",
  lastUpdated: new Date().toISOString(),
  manifest: JSON.parse(fs.readFileSync(mp + "/marketplace.json", "utf8"))
};
fs.writeFileSync(p, JSON.stringify(m, null, 2) + "\n");
console.log("  ✓ marketplace 已注册到 known_marketplaces.json");
'

# 4) 启用插件到 settings.json（幂等，先备份）
SETTINGS_VAL="${SETTINGS}" node -e '
const fs = require("fs");
const p = process.env.SETTINGS_VAL;
let s = {};
try { s = JSON.parse(fs.readFileSync(p, "utf8")); } catch {}
fs.writeFileSync(p + ".omw-bak", JSON.stringify(s, null, 2));
s.enabledPlugins = s.enabledPlugins || {};
s.enabledPlugins["oh-my-workbuddy-hooks@oh-my-workbuddy"] = true;
fs.writeFileSync(p, JSON.stringify(s, null, 2) + "\n");
console.log("  ✓ 已启用 oh-my-workbuddy-hooks@oh-my-workbuddy（settings.json 备份 .omw-bak）");
'

echo ""
echo "✅ 安装完成。重启 WorkBuddy 以加载 hook。"
echo "   - 路由 hook（UserPromptSubmit）：覆盖 30 个 active skill"
echo "   - Bash 破坏性操作护栏（PreToolUse）：拦截 rm -rf 个人目录"
echo "   - Stop 进度落地：默认关；export OMW_HOOK_PERSIST=1 开启"
echo "   卸载：bash plugin/uninstall.sh"
