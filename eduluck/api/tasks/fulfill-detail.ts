// POST /api/tasks/fulfill-detail — 특정 주문의 상세 리포트(메일2) 생성·발송.
// confirm 직후 트리거 / 수동 재발송에서 호출. 상태 가드 + 잠금은 processOrderDetail 이 처리.
// maxDuration 300 (deep 14섹션 LLM 생성) — vercel.json 참조.
//
// 보호: INTERNAL_TASK_KEY env 설정 시 x-internal-key 헤더 일치 요구(미설정이면 통과).
// 주문 id 는 비추측(랜덤) + 처리 idempotent(잠금·detail_fulfilled) 라 남용 위험 낮음.

import { getSupabaseServer } from '../../lib/supabase/server';
import { processOrderDetail } from '../../lib/payments/fulfill-detail';

export async function POST(request: Request) {
  const requiredKey = process.env.INTERNAL_TASK_KEY;
  if (requiredKey && request.headers.get('x-internal-key') !== requiredKey) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { orderId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }
  if (!body.orderId) return Response.json({ error: 'missing orderId' }, { status: 400 });

  const sb = getSupabaseServer();
  const result = await processOrderDetail(sb, body.orderId);
  const ok = result.status === 'done' || result.status === 'skipped' || result.status === 'in_progress';
  return Response.json(result, { status: ok ? 200 : result.status === 'failed' ? 500 : 400 });
}
