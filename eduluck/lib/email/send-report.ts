// 정밀 학운 PDF 리포트 이메일 발송 — Resend. 서버(api/payments/confirm)에서만 호출.
// 발신: Resend 에 이미 인증(Verified)된 도메인 aiusage.z21labs.world 사용.
//       (회신은 받지 않는 no-reply 주소.)

import { Resend } from 'resend';

const FROM = 'eduluck 정밀 학운 <noreply@aiusage.z21labs.world>';

export interface SendReportInput {
  to: string;
  nickname: string;
  pdf: Buffer;
}

/** 실패 시 throw — 호출 측(confirm)에서 catch 해 결제는 유지하고 발송 실패만 기록. */
export async function sendReportEmail({ to, nickname, pdf }: SendReportInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY 미설정');

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject: `${nickname}의 정밀 학운 리포트 (PDF)`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#2B2B2B;line-height:1.7;max-width:560px;margin:0 auto">
        <h2 style="color:#B45309;margin-bottom:8px">${nickname}의 정밀 학운 리포트가 도착했어요</h2>
        <p>결제해 주셔서 감사합니다. 자녀의 만세력을 기반으로 한 학운 정밀 진단 전문(14개 영역)을 PDF로 첨부해 드렸어요. 영구 소장하실 수 있습니다.</p>
        <p style="color:#6B7280;font-size:13px;margin-top:20px">문의: info@z21labs.xyz · eduluck (luck.z21labs.world)</p>
      </div>
    `,
    attachments: [
      {
        filename: `${nickname}_정밀학운리포트.pdf`,
        content: pdf,
      },
    ],
  });

  if (error) throw new Error(`Resend 발송 실패: ${error.message ?? JSON.stringify(error)}`);
}
