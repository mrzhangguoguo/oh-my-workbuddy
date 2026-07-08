#!/usr/bin/env bash
# oh-my-workbuddy one-line installer (skill pack + hook plugin).
#
# Remote one-liner:
#   curl -fsSL https://raw.githubusercontent.com/mrzhangguoguo/oh-my-workbuddy/main/install.sh | bash
#
# Local:
#   bash install.sh
#
# Env:
#   OMW_INSTALL_DIR    install dir (default ~/.workbuddy/oh-my-workbuddy)
#   OMW_SKIP_SKILLS=1  skip skill pack install
#   OMW_SKIP_HOOKS=1   skip hook plugin install
set -euo pipefail

REPO="mrzhangguoguo/oh-my-workbuddy"
BRANCH="main"
DEST="${OMW_INSTALL_DIR:-$HOME/.workbuddy/oh-my-workbuddy}"
URL="https://github.com/${REPO}.git"

echo "-> oh-my-workbuddy installer"

command -v git  >/dev/null 2>&1 || { echo "FAIL: git required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "FAIL: node (>=20) required"; exit 1; }

# 1) get source (clone or update)
if [ -d "$DEST/.git" ]; then
  echo "  - exists $DEST, updating..."
  git -C "$DEST" fetch --quiet origin "$BRANCH"
  git -C "$DEST" reset --hard "origin/$BRANCH" --quiet
else
  echo "  - clone -> $DEST"
  git clone --depth 1 --branch "$BRANCH" "$URL" "$DEST" --quiet
fi

# 2) install skill pack (46 skills -> ~/.workbuddy/skills)
if [ "${OMW_SKIP_SKILLS:-0}" != "1" ]; then
  echo "-> install skill pack (omw setup)"
  ( cd "$DEST" && ./omw setup )
fi

# 3) install hook plugin (routing + guardrail, registered into WorkBuddy plugin system)
if [ "${OMW_SKIP_HOOKS:-0}" != "1" ]; then
  echo "-> install hook plugin"
  bash "$DEST/plugin/install.sh"
fi

echo ""
echo "OK: oh-my-workbuddy installed."
echo "  - skill pack (46): in ~/.workbuddy/skills"
echo "  - hook plugin (routing + guardrail): registered and enabled"
echo ""
echo "  Restart WorkBuddy to activate hooks."
echo "  Update: re-run this script (idempotent)."
echo "  Uninstall hooks: bash $DEST/plugin/uninstall.sh"
echo "  Verify:         cd $DEST && ./omw doctor"
