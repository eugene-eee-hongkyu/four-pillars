// 24절기 분 단위 시각 기반 년주·월주 자체 계산 모듈
//
// 배경:
//   @fullstackfamily/manseryeok 라이브러리가 절기를 "당일 0시 기준"으로 처리해
//   절기 당일 출생자의 년주·월주가 부정확함이 검증됨.
//   예: 2024-02-04 17:00 출생자는 KASI 공식 입춘(17:27) 전이라 명리학적 2023년(계묘)인데
//       라이브러리는 2024년(갑진)으로 잡음.
//
// 해결:
//   lunar-typescript에서 절기 시각(분 단위, 천문 알고리즘 기반)을 가져와 KST로 변환 후
//   년주·월주를 자체 계산. 일주·시주는 라이브러리 그대로 사용.
//
// 검증:
//   2024 입춘 lunar-typescript 결과(16:27:07 CST → 17:27:07 KST) ≈ KASI 공식(17:27:01) — 6초 오차
//   천문 알고리즘 기반이라 정밀도 충분.

import { Solar } from 'lunar-typescript';

// ─── 12절(節) 정의 ────────────────────────────────────────────
// 24절기 중 월주 경계가 되는 12개만. 나머지 12기(氣)는 월 중간.
// 키는 lunar-typescript가 사용하는 **간체자** (惊蛰, 清明, 芒种).
const JIE_TO_BRANCH: Record<string, string> = {
  '立春': '인', '惊蛰': '묘', '清明': '진', '立夏': '사',
  '芒种': '오', '小暑': '미', '立秋': '신', '白露': '유',
  '寒露': '술', '立冬': '해', '大雪': '자', '小寒': '축',
};
const JIE_NAMES_KR: Record<string, string> = {
  '立春': '입춘', '惊蛰': '경칩', '清明': '청명', '立夏': '입하',
  '芒种': '망종', '小暑': '소서', '立秋': '입추', '白露': '백로',
  '寒露': '한로', '立冬': '입동', '大雪': '대설', '小寒': '소한',
};
const JIE_ORDER = Object.keys(JIE_TO_BRANCH);

// ─── 천간·지지 순서 ───────────────────────────────────────────
const STEM_ORDER = ['갑','을','병','정','무','기','경','신','임','계'];
const BRANCH_ORDER = ['자','축','인','묘','진','사','오','미','신','유','술','해'];

// 한글 → 한자 매핑
const STEM_HANJA: Record<string, string> = {
  갑:'甲', 을:'乙', 병:'丙', 정:'丁', 무:'戊', 기:'己', 경:'庚', 신:'辛', 임:'壬', 계:'癸',
};
const BRANCH_HANJA: Record<string, string> = {
  자:'子', 축:'丑', 인:'寅', 묘:'卯', 진:'辰', 사:'巳',
  오:'午', 미:'未', 신:'申', 유:'酉', 술:'戌', 해:'亥',
};

export function pillarToHanja(pillar: string): string {
  const stem = pillar[0] ?? '';
  const branch = pillar[1] ?? '';
  return (STEM_HANJA[stem] ?? '') + (BRANCH_HANJA[branch] ?? '');
}

// 寅월부터 시작하는 12지지 순서 (월지 진행 순서)
const BRANCH_FROM_IN = ['인','묘','진','사','오','미','신','유','술','해','자','축'];

// 오호둔법(五虎遁法): 년간 → 寅월 천간 매핑
// 甲己년 寅=丙, 乙庚년 寅=戊, 丙辛년 寅=庚, 丁壬년 寅=壬, 戊癸년 寅=甲
const YEAR_STEM_TO_IN_STEM: Record<string, string> = {
  '갑': '병', '기': '병',
  '을': '무', '경': '무',
  '병': '경', '신': '경',
  '정': '임', '임': '임',
  '무': '갑', '계': '갑',
};

// ─── 절기 시각 ────────────────────────────────────────────────

export interface JieTime {
  jieName: string;        // 한자 ('立春')
  jieNameKr: string;      // 한글 ('입춘')
  branch: string;         // 월지 ('인')
  dateMs: number;         // KST timestamp (밀리초)
}

/**
 * 주어진 연도의 12절 시각을 KST로 반환.
 * lunar-typescript의 절기는 CST(UTC+8) 기준이라 +1시간 보정.
 */
export function getJieTimes(year: number): JieTime[] {
  const solar = Solar.fromYmd(year, 6, 15); // 연도 중간 임의 날짜로 절기 테이블 확보
  const table = solar.getLunar().getJieQiTable();

  const result: JieTime[] = [];
  for (const jie of JIE_ORDER) {
    const j = table[jie];
    if (!j) continue;
    // CST → KST: lunar-typescript의 year/month/day/hour 값을 UTC로 취급하고 +1h
    const cstAsUtcMs = Date.UTC(j.getYear(), j.getMonth() - 1, j.getDay(), j.getHour(), j.getMinute(), j.getSecond());
    const kstMs = cstAsUtcMs + 60 * 60 * 1000;
    result.push({
      jieName: jie,
      jieNameKr: JIE_NAMES_KR[jie],
      branch: JIE_TO_BRANCH[jie],
      dateMs: kstMs,
    });
  }
  return result;
}

/**
 * 입력 시각(KST)에서 직전 12절을 찾는다.
 * 1월 출생자는 전년도 절기로, 12월 출생자는 다음 연도 절기로 넘어갈 수 있어
 * 전년·당년·다음연도 절기를 모두 검색.
 */
export function findPrevJie(year: number, month: number, day: number, hour: number, minute: number): JieTime {
  const inputMs = Date.UTC(year, month - 1, day, hour, minute);

  const all = [
    ...getJieTimes(year - 1),
    ...getJieTimes(year),
    ...getJieTimes(year + 1),
  ].sort((a, b) => a.dateMs - b.dateMs);

  let lastJie: JieTime | null = null;
  for (const j of all) {
    if (j.dateMs <= inputMs) {
      lastJie = j;
    } else {
      break;
    }
  }
  if (!lastJie) throw new Error(`절기 데이터 없음: ${year}-${month}-${day}`);
  return lastJie;
}

// ─── 년주 자체 계산 (입춘 기준) ───────────────────────────────

/**
 * 입력 시각의 명리학적 년주(year pillar).
 * 입춘 이전 출생자는 전년도 년주 적용.
 *
 * 60갑자 인덱스 계산:
 *   1984-02-04 입춘 시점 = 갑자년 시작
 *   (yearAfterIpchun - 1984) mod 60 = 60갑자 인덱스 (음수 처리)
 */
export function calcYearPillar(year: number, month: number, day: number, hour: number, minute: number): { stem: string; branch: string; pillar: string } {
  const inputMs = Date.UTC(year, month - 1, day, hour, minute);

  // 그 해 입춘 시각 — 입력 시각이 입춘 전이면 명리학적 전년도
  const thisYearJies = getJieTimes(year);
  const ipchun = thisYearJies.find(j => j.jieName === '立春');
  if (!ipchun) throw new Error(`입춘 데이터 없음: ${year}`);

  const myungriYear = inputMs < ipchun.dateMs ? year - 1 : year;

  // 60갑자 인덱스 (1984년 갑자년 기준)
  let idx = (myungriYear - 1984) % 60;
  if (idx < 0) idx += 60;

  const stem = STEM_ORDER[idx % 10];
  const branch = BRANCH_ORDER[idx % 12];
  return { stem, branch, pillar: stem + branch };
}

// ─── 월주 자체 계산 (12절 기준 + 오호둔법) ────────────────────

/**
 * 입력 시각의 월주(month pillar).
 * 직전 12절로 월지 결정, 명리학적 년간으로 오호둔법 적용해 월간 결정.
 */
export function calcMonthPillar(year: number, month: number, day: number, hour: number, minute: number): { stem: string; branch: string; pillar: string; jie: string } {
  const prevJie = findPrevJie(year, month, day, hour, minute);
  const branch = prevJie.branch;

  const yearPillar = calcYearPillar(year, month, day, hour, minute);
  const inStem = YEAR_STEM_TO_IN_STEM[yearPillar.stem];
  if (!inStem) throw new Error(`잘못된 년간: ${yearPillar.stem}`);

  const inStemIdx = STEM_ORDER.indexOf(inStem);
  const branchOffset = BRANCH_FROM_IN.indexOf(branch);
  if (branchOffset < 0) throw new Error(`잘못된 월지: ${branch}`);
  const stem = STEM_ORDER[(inStemIdx + branchOffset) % 10];

  return { stem, branch, pillar: stem + branch, jie: prevJie.jieNameKr };
}
