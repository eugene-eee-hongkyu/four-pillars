// Deep-dive 14 섹션 정의 (순수 데이터 — leaf 모듈).
//
// ⚠️ 이 파일은 무거운 import(점수엔진·학교표·만세력)를 끌어오지 않는다.
//    클라이언트 화면(deep-select·admin 설정 등)이 섹션 메타데이터만 쓰려고
//    프롬프트/사주 점수 그래프 전체를 번들에 싣지 않도록 분리해 둔 것.
//    프롬프트 빌더는 interpret-deep.ts 에 있고, 여기 데이터만 import 한다.

/** 14 섹션 정의 — section number + 헤더 + deep-dive 작업 가이드 + UI 표시용 메타. */
export interface DeepSectionSpec {
  number: number;
  header: string;
  /** UI deep-select 카드용 한 줄 요약 (어머니가 보고 클릭할지 판단) — 12~30자 */
  oneLine: string;
  /** Part 1(1~7) 또는 Part 2(8~14) 그룹 */
  group: 'Part1' | 'Part2';
  /** UI 이모지 — 카드 시각 anchor */
  emoji: string;
  /** deep-dive 시 LLM에게 주는 작업 가이드 (system prompt와 별도, section 고유) */
  taskGuide: string;
}

export const DEEP_SECTIONS: Record<number, DeepSectionSpec> = {
  1: { number: 1, header: '시작 — 인사·이름·전체 그림', oneLine: '인사 + 영어 이름 + 전체 그림', group: 'Part1', emoji: '👋',
    taskGuide: `인사 + 영어 이름 권유 + 전체 그림 1단락. 사주의 본질 한 줄로 anchor. 어머니가 "내 아이가 이런 결이구나"를 첫 인상으로 받게.` },
  2: { number: 2, header: '본질 — 일간·격국·납음 깊이', oneLine: '일간·격국·납음의 본질', group: 'Part1', emoji: '🌱',
    taskGuide: `일간 / 격국 / 납음 각각 별도 단락으로 깊이 풀이. 십성 비중·관인상생·12운성·오행 균형까지 종합. "본질은 ~한 자리예요" 결론.` },
  3: { number: 3, header: '강점 — 사주가 받쳐주는 영역', oneLine: '사주가 받쳐주는 강점', group: 'Part1', emoji: '✨',
    taskGuide: `사주의 강한 시그너(귀인·격국·일간·12운성 강·인성·관성)를 모두 짚고 학년대 액션으로 연결. 강점별로 단락 분리.` },
  4: { number: 4, header: '약점·주의 — 보강해야 할 영역', oneLine: '보강해야 할 약점·주의', group: 'Part1', emoji: '⚠️',
    taskGuide: `사주 약한 십성(인성 약·관성 약·식상 약·비겁 약)·공망·충형·약 12운성 종합. 약점은 환경·보강으로 푸는 톤.` },
  5: { number: 5, header: '환경 설계 — 학군지·집·방·색 + 건강', oneLine: '학군지·집·방·색 + 체질·건강', group: 'Part1', emoji: '🏠',
    taskGuide: `용신 오행 기반 환경: 학군지 구체 동네명 (분당 정자동·이매동, 목동 5·7단지, 중계 은행사거리 등)·집·방·색·식물·일과 시간대. + 건강 한 단락 (일간 오행·천의성·백호·양인·12운성·오행 부재 → 체질·면역·집중력, 학년대별, 건강 단정 ✗).` },
  6: { number: 6, header: '부모-자녀 합 — 어머니·아버지 일간 매핑', oneLine: '부모-자녀 합·관계 결', group: 'Part1', emoji: '👨‍👩‍👧',
    taskGuide: `어머니 일간 → 자녀 십성 매핑(메인): 정인·편인(받쳐줌)/정관·편관(규율)/정재·편재(견제)/식상(끌어냄)/비겁(친구). 일주 합·충 깊이. + 아버지 일간 매핑(가중치 절반, 정관·편관 강조). 미입력 부모는 placeholder로 입력 유도 + 일반론.` },
  7: { number: 7, header: '양육 가이드 — 훈육 + 자율 경계', oneLine: '훈육 톤 + 자율 보장 영역', group: 'Part1', emoji: '🌿',
    taskGuide: `[개입] 격국·일간 본질에 맞춘 훈육 톤·학습 푸시·자율성·체벌·기다림 시점. + [경계] 자율 보장 영역 3가지 + 대체 액션 (명리 중도(中道)·분(分)). "본질을 살리는 결" 긍정·중립 톤, 부정 단어("막혀요·사고") ✗.` },
  8: { number: 8, header: '친구·선생님 — 또래 + 학원/선생님', oneLine: '친구·또래 + 학원·선생님', group: 'Part2', emoji: '👥',
    taskGuide: `[또래] user message [§11 친구·또래] baseline: 비겁 중심·신살 보조, 사교/구설/소수정예/균형 유형 + 학년대별. "친구 때문에 성적" 인과 ✗. + [학원·선생님] [§12 학원·선생님] baseline: 격국 → 학원 계열·선생님 스타일(브랜드명 ✗). efficacy 단정 ✗ → fit 톤.` },
  9: { number: 9, header: '현재~앞으로의 흐름 — 대운·세운·사춘기', oneLine: '대운·세운·사춘기 흐름', group: 'Part2', emoji: '🌊',
    taskGuide: `user message [현재 학운 시기] baseline 사용. 대운·세운·12운성 변화. 사춘기 시기 (만 12~16세) 통합 풀이.` },
  10: { number: 10, header: '가장 조심해야 하는 한 해', oneLine: '조심해야 하는 한 해', group: 'Part2', emoji: '🛡️',
    taskGuide: `흐름 직후 worst year zoom in. user message [조심해야 하는 한 해] baseline 사용. "사고 난다" 단정 ✗ → "흔들리기 쉬워요·집중력 흩어져요" 부드럽게. 1~2개 구체 액션.` },
  11: { number: 11, header: '국가·해외 운 — 유학·해외', oneLine: '해외 유학·해외 운', group: 'Part2', emoji: '🌏',
    taskGuide: `user message [해외운 점수] baseline 사용. 양인격·오행 불균형·충·공망·대운 종합. 구체 국가명 ✗ → 용신 오행 방위(참고)·유학 권유 톤.` },
  12: { number: 12, header: '전공·진로 — 학과·계열 + 직업 흐름', oneLine: '전공·학과 + 직업 흐름', group: 'Part2', emoji: '📚',
    taskGuide: `[전공] 격국 진로 매핑 baseline + 예술·의약 점수 보강, 1·2순위·이공계 대안. + [직업 흐름] 주력 방향성 Top 2~3로 직장·일터 결, 일·시지 12운성. 어린 자녀라 단정 ✗.` },
  13: { number: 13, header: '학교 — 안정·가능·도전 3구간', oneLine: '학교 권유 (안정·가능·도전)', group: 'Part2', emoji: '🏫',
    taskGuide: `user message [학운 sub-tier] baseline 사용. 학년대 구체 학교명. "안정·가능·도전" 3구간 톤. "스치다·막힘" ✗.` },
  14: { number: 14, header: '어머니께 한 마디 — 종합 + 효과적 액션', oneLine: '종합 한 마디 + 액션 3카드', group: 'Part2', emoji: '💌',
    taskGuide: `[종합] 현재 대운 + 입시 타임라인 + 가장 중요한 1가지 + 가치(자율선택) 메모. + [효과적 액션 3카드] 용신 환경·약점 보강·시기 활용. 시그니처 "어머님이 잡아주시면 이뤄지는 자리예요". 성인 회고용은 본인 청자.` },
};
