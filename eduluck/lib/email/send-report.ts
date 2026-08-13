// 정밀 학운 PDF 리포트 이메일 발송 — Resend. 서버에서만 호출.
// 발신: Resend 에 이미 인증(Verified)된 도메인 aiusage.z21labs.world 사용(회신 없는 no-reply).
//
// 2단계 발송:
//   메일1(요약, 결제 즉시): sendReportEmail — 14영역 요약 PDF + '상세는 오늘 중 별도 발송' 안내
//   메일2(상세, 백그라운드): sendDetailReportEmail — 14영역 심화 상세 PDF

import { Resend } from 'resend';

const FROM = 'eduluck 정밀 학운 <noreply@aiusage.z21labs.world>';
const CONTACT = '문의: info@z21labs.xyz · eduluck (luck.z21labs.world)';

export interface SendReportInput {
  to: string;
  nickname: string;
  pdf: Buffer;
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY 미설정');
  return new Resend(apiKey);
}

/** 메일1 — 요약 리포트(결제 즉시). 실패 시 throw. */
export async function sendReportEmail({ to, nickname, pdf }: SendReportInput): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: [to],
    subject: `${nickname}의 정밀 학운 리포트 (요약본)`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#2B2B2B;line-height:1.7;max-width:560px;margin:0 auto">
        <h2 style="color:#B45309;margin-bottom:8px">${nickname}의 정밀 학운 리포트가 도착했어요</h2>
        <p>결제해 주셔서 감사합니다. 자녀의 만세력을 기반으로 한 학운 진단 <b>요약본(14개 영역)</b>을 PDF로 먼저 보내드려요.</p>
        <p style="background:#FBF3E6;border-radius:6px;padding:12px 14px;color:#7C4A03"><b>📖 14개 영역을 하나하나 깊이 풀어낸 상세 리포트</b>는 잠시 뒤 <b>오늘 중 별도 메일</b>로 보내드립니다. (분량이 많아 생성에 시간이 조금 걸려요.)</p>
        <p style="color:#6B7280;font-size:13px;margin-top:20px">${CONTACT}</p>
      </div>
    `,
    attachments: [{ filename: `${nickname}_정밀학운리포트_요약.pdf`, content: pdf }],
  });
  if (error) throw new Error(`Resend 발송 실패: ${error.message ?? JSON.stringify(error)}`);
}

/** 메일2 — 상세 리포트(14영역 심화). 실패 시 throw. */
export async function sendDetailReportEmail({ to, nickname, pdf }: SendReportInput): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: [to],
    subject: `${nickname}의 정밀 학운 상세 리포트 (14개 영역 심화)`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#2B2B2B;line-height:1.7;max-width:560px;margin:0 auto">
        <h2 style="color:#B45309;margin-bottom:8px">${nickname}의 상세 리포트가 도착했어요</h2>
        <p>기다려 주셔서 감사합니다. 14개 영역을 각각 깊이 있게 풀어낸 <b>정밀 학운 상세 리포트</b>를 PDF로 첨부해 드렸어요. 영구 소장하실 수 있습니다.</p>
        <p style="color:#6B7280;font-size:13px;margin-top:20px">${CONTACT}</p>
      </div>
    `,
    attachments: [{ filename: `${nickname}_정밀학운리포트_상세.pdf`, content: pdf }],
  });
  if (error) throw new Error(`Resend 상세 발송 실패: ${error.message ?? JSON.stringify(error)}`);
}
