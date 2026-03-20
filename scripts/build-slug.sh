#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# build-slug.sh — Builds MetalSlugClone (Unity 2018.3.8f1) to WebGL
#
# Prerequisites:
#   - Unity 2018.3.8f1 installed on this machine
#   - A valid Unity license (Personal or Plus)
#   - The MetalSlugClone source cloned to _tmp_slug2/ (or SLUG_SRC below)
#
# Usage:
#   bash scripts/build-slug.sh
#
# Output:
#   public/games/slug-unity/ (WebGL build, served by NEOARCADE)
#
# After running this script, rebuild the Docker image:
#   docker compose build
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SLUG_SRC="${SLUG_SRC:-_tmp_slug2}"
OUT_DIR="$(pwd)/public/games/slug-unity"
UNITY_VERSION="2018.3.8f1"

# Detect Unity installation path
if [[ "$(uname -s)" == "Darwin" ]]; then
  UNITY_PATH="/Applications/Unity/Hub/Editor/${UNITY_VERSION}/Unity.app/Contents/MacOS/Unity"
elif [[ "$(uname -s)" == "Linux" ]]; then
  UNITY_PATH="/opt/unity/editors/${UNITY_VERSION}/Editor/Unity"
else
  echo "ERROR: Unsupported OS. Run this on macOS or Linux (or WSL)."
  exit 1
fi

if [[ ! -f "$UNITY_PATH" ]]; then
  echo "ERROR: Unity ${UNITY_VERSION} not found at: $UNITY_PATH"
  echo "Install it from https://unity.com/releases/editor/archive"
  exit 1
fi

if [[ ! -d "$SLUG_SRC" ]]; then
  echo "Cloning MetalSlugClone..."
  git clone --depth=1 https://github.com/giacoballoccu/MetalSlugClone.git "$SLUG_SRC"
fi

mkdir -p "$OUT_DIR"

echo "Building Unity WebGL → $OUT_DIR ..."
"$UNITY_PATH" \
  -batchmode \
  -quit \
  -projectPath "$(pwd)/${SLUG_SRC}" \
  -buildTarget WebGL \
  -executeMethod "BuildScript.BuildWebGL" \
  -customBuildPath "$OUT_DIR" \
  -logFile - \
  2>&1

echo ""
echo "✓ WebGL build complete: $OUT_DIR"
echo ""
echo "Next steps:"
echo "  1. Add NEOARCADE joystick bridge to $OUT_DIR/index.html"
echo "     python scripts/inject-bridge-slug.py $OUT_DIR/index.html"
echo "  2. Update GameScreen.tsx slug entry src to /games/slug-unity/index.html"
echo "  3. Rebuild Docker image:  docker compose build"
