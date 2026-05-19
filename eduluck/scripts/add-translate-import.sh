#!/usr/bin/env bash
# translateError() 사용하는 파일에 import 자동 추가
set -e
cd "$(dirname "$0")/.."
FILES=$(grep -rl "translateError(" app/ 2>/dev/null)
for f in $FILES; do
  if grep -q "translateError" "$f" && ! grep -q "from '@/lib/errors/translate'" "$f"; then
    # 첫 번째 import 줄 다음에 삽입
    awk 'NR==1 && /^import/ {print; print "import { translateError } from '\''@/lib/errors/translate'\'';"; next} 1' "$f" > "$f.tmp"
    mv "$f.tmp" "$f"
    echo "✓ added import: $f"
  fi
done
