// 한국 일광절약시간(서머타임) 자동 보정 모듈
//
// 라이브러리(@fullstackfamily/manseryeok)가 DST 보정을 안 함이 검증됨 (validate-manse).
// 이 모듈에서 입력 datetime이 DST 시기였다면 -1시간 적용하여 표준시(KST, UTC+9)로 정규화.
//
// 출처: 위키백과 한국 일광절약시간제, IANA tzdata zone Asia/Seoul
// 1987-1988만 학운 서비스 학부모(36-37세) 대상에 영향. 1948-1960은 사주톡 호환·완전성용.

export interface DstPeriod {
  start: Date;   // 한국 표준시(KST) 기준 시작 시점
  end: Date;     // 한국 표준시(KST) 기준 종료 시점 (이 시각부터 DST 종료, 즉 표시시각 다시 KST)
  label: string;
}

// DST 기간 — 표시시각(local clock) 기준.
// "이 기간에 입력된 시각은 DST(+1h)였다" 라는 의미.
// 1948-1960 데이터는 IANA tzdata 및 위키백과 기반 best-effort.
// 1987-1988 데이터는 명확.
export const KR_DST_PERIODS: DstPeriod[] = [
  { start: new Date('1948-06-01T00:00:00'), end: new Date('1948-09-13T00:00:00'), label: '1948' },
  { start: new Date('1949-04-03T00:00:00'), end: new Date('1949-09-11T00:00:00'), label: '1949' },
  { start: new Date('1950-04-01T00:00:00'), end: new Date('1950-09-10T00:00:00'), label: '1950' },
  { start: new Date('1951-05-06T00:00:00'), end: new Date('1951-09-09T00:00:00'), label: '1951' },
  { start: new Date('1955-05-05T00:00:00'), end: new Date('1955-09-09T00:00:00'), label: '1955' },
  { start: new Date('1956-05-20T00:00:00'), end: new Date('1956-09-30T00:00:00'), label: '1956' },
  { start: new Date('1957-05-05T00:00:00'), end: new Date('1957-09-22T00:00:00'), label: '1957' },
  { start: new Date('1958-05-04T00:00:00'), end: new Date('1958-09-21T00:00:00'), label: '1958' },
  { start: new Date('1959-05-03T00:00:00'), end: new Date('1959-09-20T00:00:00'), label: '1959' },
  { start: new Date('1960-05-01T00:00:00'), end: new Date('1960-09-18T00:00:00'), label: '1960' },
  // 1987-1988 서울올림픽 대비 부활. 둘째 일요일 02:00 ~ 둘째 일요일 03:00 종료.
  { start: new Date('1987-05-10T02:00:00'), end: new Date('1987-10-11T03:00:00'), label: '1987' },
  { start: new Date('1988-05-08T02:00:00'), end: new Date('1988-10-09T03:00:00'), label: '1988' },
];

export interface DstCorrectionResult {
  applied: boolean;
  label?: string;           // 적용된 DST 시기 ('1988' 등)
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

/**
 * 입력 시각이 한국 DST 기간에 해당하면 -1시간 적용해 KST(표준시)로 정규화.
 * 시간 음수가 되면 전일로 자동 롤백.
 *
 * @param year   양력 연도
 * @param month  월 1-12
 * @param day    일 1-31
 * @param hour   시 0-23 (입력 시점의 표시시각)
 * @param minute 분 0-59
 */
export function applyDstCorrection(
  year: number, month: number, day: number, hour: number, minute: number,
): DstCorrectionResult {
  // 입력을 로컬 Date로 — DST 판정에만 사용 (실제 시각 계산은 분리)
  const inputLocal = new Date(year, month - 1, day, hour, minute);

  for (const p of KR_DST_PERIODS) {
    if (inputLocal >= p.start && inputLocal < p.end) {
      // -1시간 적용. 자정 통과 시 일자 자동 롤백.
      const correctedMs = inputLocal.getTime() - 60 * 60 * 1000;
      const corrected = new Date(correctedMs);
      return {
        applied: true,
        label: p.label,
        year: corrected.getFullYear(),
        month: corrected.getMonth() + 1,
        day: corrected.getDate(),
        hour: corrected.getHours(),
        minute: corrected.getMinutes(),
      };
    }
  }

  return { applied: false, year, month, day, hour, minute };
}
