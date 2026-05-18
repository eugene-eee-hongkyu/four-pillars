#!/usr/bin/env bash
# eduluck/app/api/*+api.ts → eduluck/api/*.ts (Vercel Functions 형식)
# import 경로의 @/lib/ → ../lib/ 변환 (Vercel functions는 tsconfig paths 제한적)
set -e
SRC="/Users/eugene/Downloads/coding/four-pillars/eduluck/app/api"
DST="/Users/eugene/Downloads/coding/four-pillars/eduluck/api"
mkdir -p "$DST"
for f in "$SRC"/*+api.ts; do
  name=$(basename "$f" "+api.ts")
  sed 's|@/lib/|../lib/|g' "$f" > "$DST/${name}.ts"
  echo "✓ $name"
done
ls "$DST"
