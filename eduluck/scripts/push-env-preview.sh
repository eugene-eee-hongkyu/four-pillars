#!/usr/bin/env bash
# preview 환경에만 추가 (production은 이미 set됨)
set -e
cd "$(dirname "$0")/.."
while IFS='=' read -r key value; do
  if [[ ! $key =~ ^# ]] && [[ -n $value ]] && [[ -n $key ]]; then
    printf "%s" "$value" | vercel env add "$key" preview 2>&1 | tail -1
  fi
done < .env.local
