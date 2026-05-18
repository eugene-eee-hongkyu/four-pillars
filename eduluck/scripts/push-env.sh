#!/usr/bin/env bash
# .env.local의 키들을 Vercel preview + production 환경에 push
# 실행: bash scripts/push-env.sh
set -e
cd "$(dirname "$0")/.."
for env in preview production; do
  while IFS='=' read -r key value; do
    if [[ ! $key =~ ^# ]] && [[ -n $value ]] && [[ -n $key ]]; then
      printf "%s" "$value" | vercel env add "$key" "$env" --force 2>&1 | tail -1
    fi
  done < .env.local
done
