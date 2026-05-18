#!/usr/bin/env bash
# eduluck/app/api/*+api.ts (Expo Router 형식) → eduluck/api/*.ts (Vercel Functions 형식)
# build:web 실행 시 자동 호출.
# Eugene이 app/api/ 코드 수정하면 build 시 api/로 자동 sync.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC="$ROOT/app/api"
DST="$ROOT/api"
mkdir -p "$DST"
for f in "$SRC"/*+api.ts; do
  [[ -e "$f" ]] || continue
  name=$(basename "$f" "+api.ts")
  sed 's|@/lib/|../lib/|g' "$f" > "$DST/${name}.ts"
done
echo "[sync-api-to-vercel] $(ls "$DST" | wc -l) files synced to api/"
