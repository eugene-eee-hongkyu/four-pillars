import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// 서버 사이드 전용 — RLS 우회. API routes와 server actions에서만 사용.
export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
