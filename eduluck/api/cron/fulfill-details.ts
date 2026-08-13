// GET /api/cron/fulfill-details — Vercel Cron. 상세 미발송 주문 스윕(백스톱·재시도).
// 매 실행 1건 처리(deep 14섹션 생성이 무거워 시간 예산 보호). ensureDeepSections 는 resumable.
// maxDuration 300 — vercel.json 참조.
//
// 보호: CRON_SECRET env 설정 시 Vercel 이 Authorization: Bearer <CRON_SECRET> 자동 첨부.
//       미설정이면 통과(개발/초기). 남용 위험은 idempotent 처리로 완화.

import { getSupabaseServer } from '../../lib/supabase/server';
import { processOrderDetail } from '../../lib/payments/fulfill-detail';

const LOCK_MS = 15 * 60 * 1000;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = getSupabaseServer();
  const lockCutoff = new Date(Date.now() - LOCK_MS).toISOString();

  const { data: pending, error } = await sb
    .from('payment_orders')
    .select('id, detail_started_at')
    .eq('status', 'paid')
    .eq('detail_fulfilled', false)
    .or(`detail_started_at.is.null,detail_started_at.lt.${lockCutoff}`)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!pending || pending.length === 0) {
    return Response.json({ processed: 0 });
  }

  const result = await processOrderDetail(sb, pending[0].id);
  return Response.json({ processed: 1, orderId: pending[0].id, result });
}
