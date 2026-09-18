// 정밀 학운 PDF 리포트 이메일 발송 — Resend. 서버에서만 호출.
// 발신: Resend 에 이미 인증(Verified)된 도메인 aiusage.z21labs.world 사용(회신 없는 no-reply).
//
// PDF 는 첨부하지 않는다 — 보관소(Storage)에 두고 다운로드 링크만 보낸다.
// 이용기간: 결제일로부터 1년(약관 제6조). 메일에 만료일을 명시.
//
// 2단계 발송:
//   메일1(요약, 결제 즉시): sendReportEmail — 요약 PDF 링크 + '상세는 오늘 중 별도 발송' 안내
//   메일2(상세, 백그라운드): sendDetailReportEmail — 14영역 심화 상세 PDF 링크

import { Resend } from 'resend';

const FROM = 'eduluck 정밀 학운 <noreply@aiusage.z21labs.world>';
const CONTACT = '문의: info@z21labs.xyz · eduluck (luck.z21labs.world)';

export interface SendReportInput {
  to: string;
  nickname: string;
  /** /api/download 링크 (토큰 포함) */
  downloadUrl: string;
  /** 만료일 표기 (YYYY.MM.DD) */
  expiresLabel: string;
}

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY 미설정');
  return new Resend(apiKey);
}

function downloadBlock(downloadUrl: string, label: string, expiresLabel: string): string {
  return `
        <p style="margin:22px 0 10px">
          <a href="${downloadUrl}" style="display:inline-block;background:#B45309;color:#ffffff;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:8px">${label}</a>
        </p>
        <p style="background:#F3F4F6;border-radius:6px;padding:12px 14px;color:#374151;font-size:14px">
          <b>⏳ 다운로드 기간: ${expiresLabel}까지</b> (결제일로부터 1년)<br/>
          기간이 지나면 링크가 만료되어 내려받을 수 없어요. 받으신 뒤 <b>파일을 기기에 저장해 보관</b>해 주세요.
        </p>
        <p style="color:#6B7280;font-size:12px;word-break:break-all">버튼이 안 눌리면 이 주소를 복사해 브라우저에 붙여넣어 주세요:<br/>${downloadUrl}</p>`;
}

/** 메일1 — 요약 리포트(결제 즉시). 실패 시 throw. */
export async function sendReportEmail({ to, nickname, downloadUrl, expiresLabel }: SendReportInput): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: [to],
    subject: `${nickname}의 정밀 학운 리포트 (요약본) 다운로드 안내`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#2B2B2B;line-height:1.7;max-width:560px;margin:0 auto">
        <h2 style="color:#B45309;margin-bottom:8px">${nickname}의 정밀 학운 리포트가 준비됐어요</h2>
        <p>결제해 주셔서 감사합니다. 자녀의 만세력을 기반으로 한 학운 진단 <b>요약본(14개 영역)</b> PDF를 아래 버튼으로 내려받으실 수 있어요.</p>
        ${downloadBlock(downloadUrl, '📄 요약 리포트 PDF 내려받기', expiresLabel)}
        <p style="background:#FBF3E6;border-radius:6px;padding:12px 14px;color:#7C4A03"><b>📖 14개 영역을 하나하나 깊이 풀어낸 상세 리포트</b>는 잠시 뒤 <b>오늘 중 별도 메일</b>로 안내드립니다. (분량이 많아 생성에 시간이 조금 걸려요.)</p>
        <p style="color:#6B7280;font-size:13px;margin-top:20px">${CONTACT}</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend 발송 실패: ${error.message ?? JSON.stringify(error)}`);
}

/** 메일2 — 상세 리포트(14영역 심화). 실패 시 throw. */
export async function sendDetailReportEmail({ to, nickname, downloadUrl, expiresLabel }: SendReportInput): Promise<void> {
  const { error } = await getResend().emails.send({
    from: FROM,
    to: [to],
    subject: `${nickname}의 정밀 학운 상세 리포트 (14개 영역 심화) 다운로드 안내`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Malgun Gothic',sans-serif;color:#2B2B2B;line-height:1.7;max-width:560px;margin:0 auto">
        <h2 style="color:#B45309;margin-bottom:8px">${nickname}의 상세 리포트가 준비됐어요</h2>
        <p>기다려 주셔서 감사합니다. 14개 영역을 각각 깊이 있게 풀어낸 <b>정밀 학운 상세 리포트</b> PDF를 아래 버튼으로 내려받으실 수 있어요.</p>
        ${downloadBlock(downloadUrl, '📖 상세 리포트 PDF 내려받기', expiresLabel)}
        <p style="color:#6B7280;font-size:13px;margin-top:20px">${CONTACT}</p>
      </div>
    `,
  });
  if (error) throw new Error(`Resend 상세 발송 실패: ${error.message ?? JSON.stringify(error)}`);
}
