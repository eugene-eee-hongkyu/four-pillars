// POST /api/payments/order — 결제 전 주문(pending) 생성. 비회원 가능.
// body: { sessionId, childSubjectId, email, childNickname? }
// response: { orderId, amount, orderName }
//
// 금액은 서버 상수(PDF_REPORT.price)로 고정 — 클라이언트 값 신뢰 ✗.

import { getSupabaseServer } from '../../lib/supabase/server';
import { PDF_REPORT } from '../../lib/legal/pricing';

interface Body {
  sessionId?: string;
  childSubjectId?: string;
  email?: string;
  childNickname?: string;
  /** 결제 화면의 필수 동의(다운로드·열람 후 환불 제한 + 이용기간 1년). true 여야 주문 생성. */
  agreedRefundPolicy?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const email = (body.email ?? '').trim();
  if (!body.sessionId || !body.childSubjectId) {
    return Response.json({ error: 'missing sessionId/childSubjectId' }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return Response.json({ error: '올바른 이메일을 입력해주세요.' }, { status: 400 });
  }
  // 환불 제한·이용기간 동의는 서버에서도 강제 — 화면 우회로 동의 없는 결제가 생기지 않게.
  if (body.agreedRefundPolicy !== true) {
    return Response.json({ error: '환불 정책 및 다운로드 이용기간 안내에 동의해주세요.' }, { status: 400 });
  }

  const sb = getSupabaseServer();

  // IDOR 차단 — child subject 가 요청 session 소유인지 검증
  const { data: child } = await sb
    .from('subjects')
    .select('id, session_id, nickname')
    .eq('id', body.childSubjectId)
    .single();
  if (!child || child.session_id !== body.sessionId) {
    return Response.json({ error: 'forbidden' }, { status: 403 });
  }

  const orderId = `order_${globalThis.crypto.randomUUID().replace(/-/g, '')}`;
  const nickname = (body.childNickname ?? child.nickname ?? '아이').slice(0, 40);

  const { error } = await sb.from('payment_orders').insert({
    id: orderId,
    session_id: body.sessionId,
    child_subject_id: body.childSubjectId,
    email,
    child_nickname: nickname,
    amount: PDF_REPORT.price,
    order_name: PDF_REPORT.name,
    status: 'pending',
    refund_policy_agreed_at: new Date().toISOString(), // 동의 증거(분쟁 대응)
  });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ orderId, amount: PDF_REPORT.price, orderName: PDF_REPORT.name });
}
