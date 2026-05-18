// Supabase 서버 사이드 클라이언트 — service_role_key 사용, RLS bypass.
// ⚠️ 이 모듈은 절대 app/(flow)/* 또는 components/*에서 import 금지.
//    Expo Router API route (app/api/*+api.ts) 또는 lib/ 안 server-only 함수에서만 사용.
//    B-1 v2 §9 멈춤 트리거 #10 forcing.

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _server: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (_server) return _server;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Supabase 서버 환경변수 미설정 (SUPABASE_SERVICE_ROLE_KEY). eduluck/.env.local 확인',
    );
  }

  _server = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return _server;
}
