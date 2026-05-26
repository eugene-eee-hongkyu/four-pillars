// 임시 진단 스크립트 — sessionId의 interpretations row 조회
// 사용: npx tsx scripts/check-row.ts <sessionId>

import { getSupabaseServer } from '../lib/supabase/server';

async function main() {
  const sessionId = process.argv[2];
  if (!sessionId) {
    console.error('usage: npx tsx scripts/check-row.ts <sessionId>');
    process.exit(1);
  }

  const sb = getSupabaseServer();
  const { data, error } = await sb
    .from('interpretations')
    .select('id, kind, prompt_version, llm_model, share_token, body_text, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }

  console.log(`\n=== sessionId ${sessionId} interpretations ===`);
  console.log(`총 ${data?.length ?? 0} rows\n`);
  for (const row of data ?? []) {
    console.log({
      id: row.id,
      kind: row.kind,
      prompt_version: row.prompt_version,
      llm_model: row.llm_model,
      share_token: row.share_token,
      body_chars: row.body_text?.length ?? 0,
      created_at: row.created_at,
    });
  }

  const { data: allKinds } = await sb
    .from('interpretations')
    .select('kind')
    .order('created_at', { ascending: false })
    .limit(200);
  const kindCounts: Record<string, number> = {};
  for (const r of allKinds ?? []) {
    kindCounts[r.kind] = (kindCounts[r.kind] ?? 0) + 1;
  }
  console.log('\n=== interpretations.kind 분포 (최근 200 rows) ===');
  console.log(kindCounts);
}

main().catch((e) => { console.error(e); process.exit(1); });
