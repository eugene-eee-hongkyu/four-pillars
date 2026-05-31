// PII 마스킹 유틸 — 어드민이 기본적으로 마스킹된 데이터를 보고,
// "원본 보기" 토글 클릭 시에만 풀 노출 (audit log 기록).
//
// 한국 이름·주소 규칙:
//   - 2자: '홍규' → '홍*'
//   - 3자: '이재훈' → '이*훈' (성+가운데*+끝)
//   - 4자+: '남궁민수' → '남*민*' (첫 글자 + 짝수 인덱스 마스킹)
//   - 영문/숫자: 첫 1글자 + 나머지 *
//   - 빈 값: 빈 값 그대로

export function maskName(name: string | null | undefined): string {
  if (!name) return '';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length === 1) return '*';
  if (trimmed.length === 2) return trimmed[0] + '*';
  if (trimmed.length === 3) return trimmed[0] + '*' + trimmed[2];
  // 4자 이상: 첫 글자 유지, 가운데 마스킹, 마지막 글자 유지
  return trimmed[0] + '*'.repeat(trimmed.length - 2) + trimmed[trimmed.length - 1];
}

/** 고향(시·도) 마스킹 — '서울특별시' → '서울*시', '경기도' → '경*도' */
export function maskLocation(loc: string | null | undefined): string {
  if (!loc) return '';
  const trimmed = loc.trim();
  if (trimmed.length === 0) return '';
  if (trimmed.length <= 2) return trimmed[0] + '*';
  // 첫 2글자 + 마스킹 + 마지막 1글자
  return trimmed.slice(0, 2) + '*'.repeat(Math.max(1, trimmed.length - 3)) + trimmed[trimmed.length - 1];
}

/** 생년월일 — 연도 마지막 자리 가림. '2015-05-15' → '201*-05-15' */
export function maskBirthDate(year: number, month: number, day: number): string {
  const yStr = String(year);
  const masked = yStr.slice(0, 3) + '*';
  return `${masked}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 시간 — 마스킹 안 함 (학운 진단에 필요한 정보, 노출 위험 낮음) */
export function formatBirthTime(hour: number | null, minute: number | null): string {
  if (hour === null) return '시간모름';
  const m = minute ?? 0;
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** 마스킹 여부 결정 — query param `unmask=1`일 때만 풀 노출 */
export function shouldUnmask(unmaskParam: string | string[] | undefined): boolean {
  if (Array.isArray(unmaskParam)) return unmaskParam[0] === '1';
  return unmaskParam === '1';
}
