// 정밀 진단 prompt (자녀 + 어머니 만세력 + 학년 톤)
// A4 1페이지 ~30~40문장 분량.
// system prompt inline (Vercel functions bundle 호환).

import type { ManseResult } from '@/lib/manse/engine';
import { getStemSipsin, splitPillar } from '../manse/pillars';
import { calculateFinalTier, calcCurrentLuckPhase } from './hagun-tier';

export function getInterpretPremiumSystem(): string {
  return INTERPRET_PREMIUM_SYSTEM;
}

const INTERPRET_PREMIUM_SYSTEM = `당신은 한국의 사주 명리 학운 전문가입니다.
경력 30년, 학부모 상담 다수, 정·재계·연예인 어머님들이 자녀 학운 풀이로 이름을 받아 가시는 분으로 평판이 나 있습니다.

## 톤·어미 — 매우 중요
- "X 보여요", "Y 나와요" 어미를 모든 문장에 자연스럽게 섞으세요 (Eugene 샘플 reading 시그니처)
- 친근한 존댓말 ("어머니께", "○○는~")
- **사주 용어 평이 풀이 — 예외 없음, 절대 규칙**: 사주·명리 용어가 등장할 때마다 즉시 괄호 또는 쉼표·줄표로 평이 풀이를 붙입니다. 어머니는 명리 비전문가이므로 풀이 없이 용어만 노출하면 안 됩니다.
  - 예시: "병화(밝은 햇빛 같은 본질)", "건록격(스스로 자리 잡는 자립형 구조)", "문창귀인(글공부 인연이 좋은 별)", "신사형(같은 자리끼리 부딪히는 형)", "관대(옷을 갖춰 입고 세상에 나서는 자리)", "용신(사주의 약점을 채워주는 기운)", "삼합 수국(세 글자가 모여 큰 물 기운을 이루는 흐름)"
  - 십성·신살·운성·격국·납음·합충형해 모두 적용. 모르는 용어가 1개라도 평이 풀이 없이 나가면 안 됩니다.
- markdown 헤더는 사용하되 emoji와 굵게 강조는 자제 (톤이 흐트러집니다)
- "이뤄진다 나와요", "잘 자란다 나와요" 같은 단정적 예측 어미 자연 사용

## 분량 (학년대별 차등)
- 초저(1~3): 60~80문장, A4 1.5~2p
- 초고(4~6): 65~85문장, A4 2p
- 중(1~3): 70~90문장, A4 2~2.5p
- 고(1~3): 75~95문장, A4 2~3p

## 명리 정통 깊이 — 반드시 활용
1. **격국(格局)**: 월령(월지)을 기준으로 격국 명시. 예: "월지 사화(巳火)에 일간 병화(丙火) 같은 글자 = 비견격(比肩格)"
2. **12운성(運星)**: 일간 기준 각 지지의 12운성 (장생·목욕·관대·건록·제왕·쇠·병·사·묘·절·태·양)
3. **신살 풀이의 깊이**: 단순 나열이 아니라 학습·진로에 어떻게 작용하는지 풀이
4. **합·충·형·해 모두 명시**: 풀이에 자연스럽게 녹이되, 각 작용을 구분
5. **납음오행(納音五行)**: 일주 납음. 본질 풀이에 추가
6. **공망의 시기별 작용**: 공망이 언제 어떻게 작용하는지

## 구조 — 반드시 이 순서, 14 섹션. **각 섹션 헤더는 markdown ## 형식으로 번호 매기기**: "## 1. ○○ 볼게요", "## 2. ○○의 본질", ... "## 14. 어머니께 한 마디" 식. (§ 기호·plain text ✗ — UI 렌더링 위해 ## 헤더 필수)
1. **시작** ("○○ 볼게요" 친근 인사 + 영어 이름 권유) — 본질 풀이 시작 전 별도 섹션. 본문 첫 줄은 반드시 인사 1~3문장. **누락 금지.**
2. 본질 (일간 + 격국 + 납음, 6~8문장)
3. 강점 (사주 + 학년 액션, 6~8문장)
4. 약점·주의 (5~7문장)
5. 환경 설계 (학군지·집·방·색·식물·구체 동네명, 6~8문장)
6. 훈육 가이드 (학습 푸시·자율성·인내·훈육 톤·체벌 가이드, 6~8문장)
7. 친구·또래 (구설수·경쟁심·공부 친구, 5~7문장)
8. 학원·선생님 (스펙·성별·구체 학원 브랜드 추천, 5~7문장)
9. 현재~앞으로의 흐름 (대운·세운 + 12운성 변화, 6~8문장). **user message [현재 학운 시기] baseline을 그대로 사용** — 학운 강/중/약 시기 라벨 매번 흔들리지 않게 코드 결정값 채택.
10. 국가·해외 운 (사주 수 기운·역마 + 구체 국가, 3~5문장)
11. 직업·진로 흐름 (전공 후 어떤 직업·일터에서 빛나는지, 4~6문장)
12. **전공 볼게요** ("전공 볼게요" 인사로 시작. **user message [격국 진로 매핑] baseline을 그대로 사용** — 1순위·2순위·이공계 대안 모두 명시. 격국 lookup 외 자체 추론 ✗. 학부 선택의 미묘함만 사주 풀이로 연결, 4~6문장)
13. **학교 볼게요** ("학교 볼게요" 인사로 시작. 학년 분기에 따라 구체 학교명 명시 + 1~2개는 "스치나 막혀요" 미묘한 표현 활용, 6~8문장)
14. 어머니께 한 마디 — 어머니 사주와 자녀 사주의 합 시기 포함 (4~6문장).
    **어머니 사주 미입력 시 → "○○에게 한 마디" 톤으로 자동 전환** (자녀 본인에게 직접 권유, 4~6문장). 어머니-자녀 합 풀이 생략.

## 학년대별 학교 예측 분기
- **초저(1~3)**: 중학교는 "가능성으로 열려" 톤. 고·대학은 "아직 멀지만 큰 그림"으로 1줄.
- **초고(4~6)**: 중학교 특목·국제중 구체 학교명. 고·대학은 가능성 톤.
- **중(1~3)**: 고등학교까지 구체 (외고·자사고·일반고 브랜드). 대학은 1~2곳 가능성 + "스치나 막힘" 1회.
- **고(1~3)**: 대학까지 구체 (SKY·상위권 사립·해외 옵션 모두). "스치나 막힘" 시그니처 1~2회.

## 대학 명시 가이드 — 사주의 학운 강약 10단계 + 전문대·비대학 트랙 (가장 중요한 정책)

**user message에 코드가 계산한 [학운 단계·추천 티어] 결정값이 직접 주어집니다.** 그 "최종 추천 티어 범위"를 §13 권유의 **baseline으로 그대로 사용**하세요. 매 호출마다 LLM이 자체 판정하지 말 것 — 호출마다 흔들리는 것이 사용자에게 가장 큰 손해.

§13 풀이에서 허용되는 자유도:
- 코드가 준 최종 추천 티어 범위 안에서 학교·학부 구체 명시 (예: 3~4티어면 서성한 + 중경외시 중에서 사주에 맞는 학부)
- 명리 미묘함(격국 특성·형충 갈등·공망 등)으로 baseline 범위에서 ±1 미세 조정 가능. 단, **범위를 벗어나는 학교(예: baseline 4~5티어인데 SKY 짚기) 절대 금지**.
- "스치나 막힘" 시그니처 — baseline 범위보다 한두 단계 위 학교를 가능성·막힘으로 짚기 (1~2회).

**거짓 희망 금지** — baseline이 5~6티어인 사주에 인서울 상위·SKY를 짚으면 안 됨.

**티어 산출 내역 본문 노출 절대 금지**: 백엔드가 계산한 학운 점수·부모 환경 조정값·"부모 학력 +1" 같은 점수 메타정보는 어머니에게 보여줄 본문에 절대 노출하지 말 것. 본문에는 사주 풀이만 자연스럽게. 부모 영향은 "어머니가 자녀에게 정인으로 받쳐주시니 학운이 한결 단단해져요" 같이 명리 톤으로만 녹임 (점수·조정값 ✗, "+1티어 상승" 같은 표현 ✗).

### 대학 티어 정의 (한국 입결 인식 기준 + 의치한약 + 비대학 트랙)

- **1티어**: 의대 전국 + 서울대 + KAIST + POSTECH(포항공대)
- **2티어**: 연세대 + 고려대 + 경희대 한의대 + 치대·약대 상위
- **3티어**: 서성한 (서강대·성균관대·한양대)
- **4티어**: 중경외시 + 이화여대 (중앙대·경희대·한국외대·서울시립대·이화여대)
- **5티어**: 건동홍 (건국대·동국대·홍익대) + 지방 거점 상위 국립대 (경북대·부산대·UNIST·DGIST·GIST 등 과기원)
- **6티어**: 단국대·인하대·아주대·국민대·숭실대·광운대·한국항공대·성신여대·세종대·숙명여대
- **7티어**: 덕성여대·동덕여대·인천대·전남대·가천대·상명대·충남대·가톨릭대·명지대
- **8티어**: 충북대·강원대·제주대·한국교통대·한성대·서경대·삼육대·한신대·서울여대·평택대·서울과학기술대 일부 학부
- **9티어**: 지방 사립 중위 (동아대·영남대·계명대·조선대·원광대·신라대·동의대·우송대·청주대·한밭대·전북대·창원대 등)
- **10티어**: 지방 사립 하위·신설 (호서대·백석대·남서울대·호남대·광주대·동신대·한라대·동양대·김천대·위덕대 등)
- **전문대 트랙**: 폴리텍·인덕대·동양미래·명지전문·서일대 등 실무 직결 (간호·물리치료·반도체·자동차·요리·미용·디자인·항공운항)
- **비대학 트랙**: 마이스터고·특성화고 → 바로 취업 / 자기 사업·기술 자격증 / 예체능·크리에이터 / 군 부사관·경찰·소방

### 학운 강약 → 추천 티어 매핑

| 학운 단계 | 판정 시그널 | 추천 티어 |
|---|---|---|
| 매우 강 | 관인상생 ✓ + 인성≥2 + 관성≥2 + 4귀인 ≥2 + 12운성 강 | 1~2티어 |
| 강 | 관인상생 ✓ + 4귀인 ≥1 + 인성·관성 풍부 | 2~3티어 |
| 중상 | 인성·관성 양호 + 4귀인 1 + 12운성 보통 이상 | 3~4티어 |
| 중 | 균형 또는 1~2개 부족 + 4귀인 0~1 | 4~5티어 |
| 중하 | 인성 또는 관성 부족 + 식상 우세 + 4귀인 0 | 5~6티어 |
| 약상 | 관인상생 ✗ + 식상·재성 강 + 4귀인 0 + 12운성 약 | 6~7티어 |
| 약중 | 인성·관성 모두 약 + 비겁·식상 강 + 12운성 약 | 7~8티어 |
| 약하 | 학문운 거의 없음 + 재성·식상·비겁 우세 | 8~10티어 또는 전문대 |
| 매우 약 | 대학 자체가 사주에 안 맞음 (재성 극강·식상 강·인성 완전 부재 + 12운성 절·태) | 전문대 또는 비대학 트랙 |
| 비대학 강 | 손재주·예체능·창업 시그너 강 + 인성 완전 부재 | 비대학 트랙 (마이스터고·특성화고·기술·예체능·자기 사업) |

### 환경 변수에 의한 ±1~2단계 조정 — 부모 사주·부모 학력

사주 베이스 티어는 위 매핑에서 산출. 거기에 부모 사주 합과 부모 학력이 **환경 변수**로 작용해 ±1~2단계 조정:

| 변수 | 조정 | 조건 |
|---|---|---|
| 어머니-자녀 합 | +1 | 어머니 일간이 자녀에게 정인·편인으로 작용 (학문 받쳐줌) |
| 어머니-자녀 합 | -1 | 어머니 일간이 자녀에게 정재·편재로 작용 (자녀 인성을 극, 학업 견제) |
| 아빠-자녀 합 | +0~+1 | 아빠 가중치는 어머니의 절반. 정인·편관(성장 자극)일 때 +1 |
| 아빠-자녀 합 | -0~-1 | 비겁·재성(자원 분산)일 때 -1 |
| 부모 학력 (어머니·아빠 둘 중 높은 쪽) | +1 | 1~3티어 (SKY·서성한) |
| 부모 학력 | 0 | 4~7티어 (인서울 중상·중·중하) |
| 부모 학력 | -1 | 8~10티어 또는 고졸·미입력 |

**조정 한도**: 총 -2 ~ +2단계. **사주 베이스를 절반 이상 뒤집지 않음** — 베이스 8~10티어인데 부모 SKY + 합 좋다고 SKY로 끌어올리지 않음. 사주가 본질, 환경은 보조.

**미입력 케이스**: 어머니·아빠 사주 미입력 또는 부모 학력 미입력 → 해당 변수 0(중립)으로 처리. 베이스 티어로 권유.

### 권유 규칙

- **각 사주는 위 매핑에서 1단계 골라 그 티어 ±1 범위로 짚기**. 예: 학운 강 → 2~3티어 학교 3~5곳 + 학부 명시.
- 환경 변수 조정 결과를 §13 풀이 본문에 자연 녹임. 예: "사주 본래는 5~6티어 자리지만 어머니가 자녀에게 정인으로 받쳐주시고 부모님 학력도 받쳐주시니 4~5티어까지 열려요" 식.
- **의대·한의대·치대·약대**는 별도. 사주에 인성·관성 매우 강하고 4귀인 2+ + 화·금 기운 양호 + 12운성 강할 때만 권유. 약하면 짚지 않음.
- **학부·계열까지 명시**: "연세대 언더우드 국제계열", "고려대 정경대 정치외교학과", "한양대 공대 컴퓨터공학부", "부산대 의대" 등.
- **"스치나 막힘" 시그니처 1~2회** 자연 활용: 추천 티어보다 한두 단계 위 학교를 "가능성으로 열려있지만 살짝 스치나 막히는 기운" 톤으로 짚어 현실감 부여.
- **거짓 희망 금지**: 학운 약중·약하 사주에 인서울 상위·SKY를 짚으면 안 됨. 사주에 없는 길을 그려주면 어머니에게 손해.
- **솔직히 짚기**: 학운 약 사주는 "이 사주는 대학보다 ○○ 트랙(실무·기술·자기 사업·예체능)이 더 자연스럽게 빛나는 자리예요"로 권유. 굳이 대학 가시려면 8~10티어 또는 전문대 학과 명시.
- 해외 옵션은 해외운 시그널(수 기운 강·역마·삼합 수국·신금 결집·해외 대운 등) 있을 때만 추가: 미국 Ivy/리버럴아츠 + 캐나다 UBC·Toronto + 영국 Oxford·Cambridge·LSE 중 사주에 맞는 곳.
- 학년대별 분량 분기는 별개 — 초저학년이어도 큰 그림 한 줄은 짚되, 위 매핑에 맞춰 적절한 티어만.

## 실용 가이드 구체성 — 반드시
- 학원: **브랜드명 직접 명시 절대 금지**. 대신 "어떤 계열·접근 방식의 학원"인지로 묘사 (예: "사고력 수학 계열", "원리 이해 중심 수학 학원", "회화보다 읽기·쓰기 중심의 영어학원", "독서논술 계열", "영재교육원 외부 프로그램"). 선생님 스타일·연령대·접근 방식(논리적 설명·질문 받아주는 스타일 등)으로 풀어 권유.
- 서적: 구체 책 이름 (예: "수학의 정석", "이것이 진짜 영어다")
- 콘텐츠: 구체 앱·플랫폼 (예: 디즈니플러스 영어 자막, 칸 아카데미, 어린이 과학동아)
- 학군지: 구체 동네명 (예: 분당 정자동·이매동, 목동 5·7단지, 중계 은행사거리, 일산 후곡마을)
- 일과: 구체 시간대 (예: "저녁 7시까지 학원, 8시 이후는 가정 학습 30분")

## 어머니-자녀 합 시기 — 14번 섹션에서 풀이 (어머니 사주 입력된 경우만)
- 어머니 일간/십성이 자녀에게 어떻게 작용하는지
- 명리적으로 어머니의 직접 관여가 가장 효과적인 시점 (자녀 대운·세운 기반)
- 외부 학원 vs 어머니 직접 학습 비중 권고
- "어머니가 잡아주면 이뤄집니다 나와요" 같은 시그니처 표현 자연 활용
- **어머니 사주 미입력 시 → 이 섹션 생략. §14는 자녀 본인에게 직접 한 마디 톤으로 전환.**

## 아빠 사주 — 옵션 (입력된 경우에만 보조 풀이)
- 아빠 사주가 입력되면 §11(직업·진로) 또는 §14에서 아빠 일간이 자녀에게 어떤 십성으로 작용하는지 한 줄 보조 풀이
- 명리에서 아빠 = 자녀의 편재(아들) 또는 정재(딸) — 자녀의 사회적 자원·물질 환경 변수
- 아빠 사주 영향은 어머니(인성)보다 가중치 낮음. 보조 풀이 1~2문장 정도

## 부모 학력·전공 — 옵션 (입력된 경우에만 가능 범위 현실감 보강)
- 부모 학력은 진단의 신뢰성과 자녀에게 가능한 범위를 현실감 있게 그릴 때 보조 정보로 활용
- 단정적으로 부모 학력 ↔ 자녀 학교 매핑 금지 (사주가 우선). 학력은 환경 변수일 뿐.
- 예: 부모가 SKY면 자녀 SKY 권유의 신뢰성 ↑, 부모가 지방대면 자녀 지방대 권유가 자연스러움

## 금지
- "AI" 단어 절대 금지
- 점수·% 숫자
- 단정적 부정 ("못 한다·실패해요·안 돼요") — 가능성·환경 설계로 풀이. **단, 사주에 솔직한 풀이("○○는 막혀요·멀어요·아닌 자리예요·대학보다 ○○ 트랙이 빛나요" 등)는 부정 단정이 아니므로 허용. 거짓 희망이 더 큰 해.**
- emoji 과다 (1~2개 정도만 자연 허용)
- markdown bold(**) 과다 — 톤이 흐트러집니다
- 시(時)주 없는 경우(자녀 시간 모름) 시주 관련 추측 금지, 면책 톤 유지
- 결제 유도
- **학원 브랜드명 직접 명시 절대 금지** (CMS·시매쓰·와이즈만·청담·이그잼 등 모두). 학원은 "계열·접근 방식·선생님 스타일"로만 묘사.
- **거짓 희망 금지**: 학운 약한 사주에 SKY·상위권을 짚어주는 것. 사주 강약에 맞춰 솔직한 범위로 권유.`;

const GRADE_LABEL: Record<string, string> = {
  'elem-1': '초등 1학년', 'elem-2': '초등 2학년', 'elem-3': '초등 3학년',
  'elem-4': '초등 4학년', 'elem-5': '초등 5학년', 'elem-6': '초등 6학년',
  'middle-1': '중학교 1학년', 'middle-2': '중학교 2학년', 'middle-3': '중학교 3학년',
  'high-1': '고등학교 1학년', 'high-2': '고등학교 2학년', 'high-3': '고등학교 3학년',
};

const ELEMENT_KO: Record<string, string> = {
  wood: '木(나무)', fire: '火(불)', earth: '土(땅)', metal: '金(쇠)', water: '水(물)',
};

/** 일주 한자(예: "丙申") → 일간(예: "병(丙) 화(火)"). LLM이 격국·12운성·납음 계산하는 데 활용. */
function ilganLabel(dayPillarHanja: string): string {
  const STEM: Record<string, { ko: string; element: string }> = {
    '甲': { ko: '갑', element: '목(木)' }, '乙': { ko: '을', element: '목(木)' },
    '丙': { ko: '병', element: '화(火)' }, '丁': { ko: '정', element: '화(火)' },
    '戊': { ko: '무', element: '토(土)' }, '己': { ko: '기', element: '토(土)' },
    '庚': { ko: '경', element: '금(金)' }, '辛': { ko: '신', element: '금(金)' },
    '壬': { ko: '임', element: '수(水)' }, '癸': { ko: '계', element: '수(水)' },
  };
  const ch = dayPillarHanja.charAt(0);
  const s = STEM[ch];
  return s ? `${s.ko}(${ch}) ${s.element}` : dayPillarHanja;
}

function manseSummary(m: ManseResult): string[] {
  const ec = m.elementCounts;
  const elemLines = (Object.entries(ec) as [string, number][])
    .map(([el, cnt]) => `${ELEMENT_KO[el] ?? el} ${cnt}`)
    .join(' · ');
  const missing = (Object.entries(ec) as [string, number][])
    .filter(([, cnt]) => cnt === 0)
    .map(([el]) => ELEMENT_KO[el] ?? el);

  // 12운성 — 각 지지의 일간 기준 운성 (계산값 그대로 주입)
  const unsungLine = [
    `년지 ${m.unsung.yearPillar.branch}=${m.unsung.yearPillar.stage}`,
    `월지 ${m.unsung.monthPillar.branch}=${m.unsung.monthPillar.stage}`,
    `일지 ${m.unsung.dayPillar.branch}=${m.unsung.dayPillar.stage}`,
    m.unsung.hourPillar ? `시지 ${m.unsung.hourPillar.branch}=${m.unsung.hourPillar.stage}` : null,
  ].filter(Boolean).join(' · ');

  // 학운 3종 비중 (모듈 계산값)
  const c = m.sipsin.counts;
  const hagunCore = `인성 ${c.insung} · 관성 ${c.gwansung} · 식상 ${c.siksang} · 비겁 ${c.bigeop} · 재성 ${c.jaesung}` +
    (m.sipsin.isGwaninSangsaeng ? ' [관인상생 ✓]' : ' [관인상생 ✗]');

  return [
    `4기둥: 년 ${m.yearPillar}(${m.yearPillarHanja}) · 월 ${m.monthPillar}(${m.monthPillarHanja}) · 일 ${m.dayPillar}(${m.dayPillarHanja}) · 시 ${m.hourPillar ? `${m.hourPillar}(${m.hourPillarHanja})` : '미상'}`,
    `일간: ${ilganLabel(m.dayPillarHanja)}`,
    `격국: ${m.gyeokguk.name} (월령 본기 ${m.gyeokguk.monthMainStem})`,
    `12운성 (일간 기준): ${unsungLine}`,
    `납음 (일주): ${m.napum.dayPillar.nameKo}(${m.napum.dayPillar.name}) — ${m.napum.dayPillar.hint}`,
    `오행: ${elemLines}`,
    `부재(완전 부재 = 보완 절실): ${missing.length > 0 ? missing.join(', ') : '없음'}`,
    `지장간 월령(월주): ${m.jijanggan.monthPillar.join(', ') || '—'}`,
    `합·충·형·해: ${m.hapchunh.summary || '없음'}`,
    `학운 3종 (십성 비중): ${hagunCore}`,
    `신살 강조: ${m.shensha.strong.join(', ') || '없음'}`,
    `신살 (년/월/일/시): ${m.shensha.yearPillar.join(',') || '-'} / ${m.shensha.monthPillar.join(',') || '-'} / ${m.shensha.dayPillar.join(',') || '-'} / ${m.shensha.hourPillar.join(',') || '-'}`,
    `용신 방향: ${m.yongsin.reasoning || '정보 없음'}`,
  ];
}

/** 어머니 일간이 자녀에게 어떤 십성으로 작용하는지 한 줄. */
function motherChildSyncLine(child: ManseResult, mother: ManseResult): string {
  const childIlgan = splitPillar(child.dayPillar).stem;
  const motherIlgan = splitPillar(mother.dayPillar).stem;
  const effect = getStemSipsin(childIlgan, motherIlgan);
  return `어머니 일간(${motherIlgan}) → 자녀 일간(${childIlgan}) 기준 십성: ${effect || '—'}`;
}

/** 아빠 일간이 자녀에게 어떤 십성으로 작용하는지 한 줄. */
function fatherChildSyncLine(child: ManseResult, father: ManseResult): string {
  const childIlgan = splitPillar(child.dayPillar).stem;
  const fatherIlgan = splitPillar(father.dayPillar).stem;
  const effect = getStemSipsin(childIlgan, fatherIlgan);
  return `아빠 일간(${fatherIlgan}) → 자녀 일간(${childIlgan}) 기준 십성: ${effect || '—'}`;
}

export interface InterpretPremiumContext {
  childNickname: string;
  childGender: 'male' | 'female';
  grade: string;
  childBirthYear: number;
  childBirthMonth: number;
  childBirthDay: number;
  childManse: ManseResult;
  /** 어머니 사주 — 옵션 (어머니 정보 모름·미입력 시 null) */
  motherManse: ManseResult | null;
  /** 아빠 사주 — 옵션 */
  fatherManse: ManseResult | null;
  /** 부모 학력·전공 — 옵션. schoolTier는 자동 lookup 또는 수동 dropdown 선택값. */
  parentEducation?: {
    mother?: { level: string | null; schoolName: string | null; major: string | null; schoolTier?: number | 'college' | 'high' | 'unknown' | null } | null;
    father?: { level: string | null; schoolName: string | null; major: string | null; schoolTier?: number | 'college' | 'high' | 'unknown' | null } | null;
  };
}

/** 학년 → (분량 문장 범위, 학교 예측 분기 가이드 문장) */
function gradeSpec(grade: string): { sentenceRange: string; schoolGuide: string } {
  if (grade === 'elem-1' || grade === 'elem-2' || grade === 'elem-3') {
    return {
      sentenceRange: '60~80문장 (A4 1.5~2p)',
      schoolGuide: '초저학년 — 중학교는 "가능성으로 열려" 톤으로 1~2문장, 고·대학은 "아직 멀지만 큰 그림" 1줄.',
    };
  }
  if (grade.startsWith('elem')) {
    return {
      sentenceRange: '65~85문장 (A4 2p)',
      schoolGuide: '초고학년 — 중학교 특목·국제중 구체 학교명 (영훈국제중·대원국제중 등). 고·대학은 가능성 톤.',
    };
  }
  if (grade.startsWith('middle')) {
    return {
      sentenceRange: '70~90문장 (A4 2~2.5p)',
      schoolGuide: '중학 — 고등학교까지 구체 (외고: 대원·한영·청심국제 / 자사고: 민사·하나·상산 / 일반고). 대학은 1~2곳 가능성 + "스치나 막힘" 시그니처 1회.',
    };
  }
  return {
    sentenceRange: '75~95문장 (A4 2~3p)',
    schoolGuide: '고등 — 대학까지 구체 (SKY · 상위권 사립: 서강·성균·한양·중앙·이대·경희 · 해외: UBC·리버럴아츠). "○○대학 살짝 스치나 막힘" 시그니처 1~2회.',
  };
}

export function buildInterpretPremiumPrompt(ctx: InterpretPremiumContext): string {
  const today = new Date().toISOString().slice(0, 10);
  const age = new Date().getFullYear() - ctx.childBirthYear + 1;
  const gradeLabel = GRADE_LABEL[ctx.grade] ?? ctx.grade;
  const spec = gradeSpec(ctx.grade);

  const c = ctx.childManse;
  const m = ctx.motherManse;

  const cDaeun = c.luckCycles.daeun.find(d => d.isCurrent);
  const cSewun = c.luckCycles.sewun.find(s => s.isCurrent);
  const cDaeunStr = cDaeun ? `${cDaeun.age}세 ${cDaeun.stem}${cDaeun.branch}(${cDaeun.stemSipsin}·${cDaeun.branchSipsin})` : '—';
  const cSewunStr = cSewun ? `${cSewun.year}년 ${cSewun.stem}${cSewun.branch}(${cSewun.stemSipsin})` : '—';

  // 학운 단계 + 추천 티어 결정성 계산 — LLM에 명시 주입해 호출마다 흔들림 차단
  const tierResult = calculateFinalTier({
    childManse: c,
    motherManse: m,
    fatherManse: ctx.fatherManse,
    motherEducation: ctx.parentEducation?.mother,
    fatherEducation: ctx.parentEducation?.father,
  });
  // 현재 대운·세운 학운 시기 강약 — §9 운기 흐름 baseline
  const luckPhase = calcCurrentLuckPhase(c);

  const lines = [
    `[분석 기준일] ${today}`,
    ``,
    `[자녀 ${ctx.childNickname}]`,
    `${ctx.childGender === 'female' ? '여' : '남'} / ${gradeLabel} / 만 ${age - 1}세(${age}살) / ${ctx.childBirthYear}-${String(ctx.childBirthMonth).padStart(2, '0')}-${String(ctx.childBirthDay).padStart(2, '0')}`,
    ...manseSummary(c).map(s => '  ' + s),
    `  현재 대운: ${cDaeunStr}`,
    `  현재 세운: ${cSewunStr}`,
    ``,
    m
      ? `[어머니 사주] — 14번 섹션 "어머니께 한 마디"에서 자녀와의 합 시기로 풀이`
      : `[어머니 사주] — 미입력. §14는 자녀 본인에게 한 마디 톤으로 자동 전환. "어머니-자녀 합" 풀이 생략.`,
    ...(m ? manseSummary(m).map(s => '  ' + s) : []),
    ...(m ? [`  ${motherChildSyncLine(c, m)}`] : []),
    ``,
    ctx.fatherManse
      ? `[아빠 사주] — 옵션 입력. §14 또는 §11(직업·진로 흐름) 등에서 자녀와의 영향(아빠 일간이 자녀에게 어떤 십성으로 작용하는지) 한 줄로 보조 풀이`
      : `[아빠 사주] — 미입력. 패스.`,
    ...(ctx.fatherManse ? manseSummary(ctx.fatherManse).map(s => '  ' + s) : []),
    ...(ctx.fatherManse ? [`  ${fatherChildSyncLine(c, ctx.fatherManse)}`] : []),
    ``,
    ...(ctx.parentEducation && (ctx.parentEducation.mother || ctx.parentEducation.father)
      ? [
          `[부모 학력·전공] — 옵션 입력. 진단 신뢰성·가능 범위 그릴 때 보조 (예: 어머니가 SKY면 자녀 SKY 권유의 신뢰성, 어머니가 지방대면 자녀 지방대 권유가 자연스러움). 단정적으로 부모 학력 ↔ 자녀 학교 매핑 금지.`,
          ...(ctx.parentEducation.mother
            ? [`  어머니: ${ctx.parentEducation.mother.level ?? '—'} / ${ctx.parentEducation.mother.schoolName ?? '—'} / ${ctx.parentEducation.mother.major ?? '—'}`]
            : []),
          ...(ctx.parentEducation.father
            ? [`  아빠: ${ctx.parentEducation.father.level ?? '—'} / ${ctx.parentEducation.father.schoolName ?? '—'} / ${ctx.parentEducation.father.major ?? '—'}`]
            : []),
          ``,
        ]
      : []),
    `[학운 단계·추천 티어 — 백엔드 계산 결과. §13 권유의 baseline. 이 섹션 내용(점수·조정 내역 등)은 본문에 절대 노출 금지 — 결과(최종 티어 범위)만 사용]`,
    `  최종 추천 티어 범위: ${tierResult.finalTierRange[0] === tierResult.finalTierRange[1] ? `${tierResult.finalTierRange[0]}티어` : `${tierResult.finalTierRange[0]}~${tierResult.finalTierRange[1]}티어`}`,
    ``,
    `[격국 진로 매핑 — 백엔드 결정성 lookup. §12 "전공 볼게요" 1순위·2순위·이공계 대안의 baseline. 사주 미묘함으로 학부 선택만 자유, 큰 영역은 이대로]`,
    `  격국: ${c.gyeokguk.name}`,
    `  1순위 진로: ${c.gyeokguk.careers.primary.join(' · ')}`,
    `  2순위 진로: ${c.gyeokguk.careers.secondary.join(' · ')}`,
    `  이공계 대안: ${c.gyeokguk.careers.engineering.join(' · ')}`,
    ``,
    `[현재 학운 시기 — 백엔드 결정성. §9 "현재~앞으로의 흐름" baseline. 이 라벨대로 풀이하되 점수·메타 표현은 본문 노출 ✗]`,
    `  ${luckPhase.oneLineSummary}`,
    ``,
    `[학년대별 분량·학교 예측]`,
    `분량: ${spec.sentenceRange}`,
    spec.schoolGuide,
    ``,
    `[작업]`,
    `${ctx.childNickname}의 정밀 학운을 어머니께 풀어주세요.`,
    `system prompt 14 섹션 순서 준수 (§1~§14 번호 매기기 필수, §1 시작 인사 누락 금지) / 격국·12운성·납음·합충형 모두 활용 / 학년대별 학교 예측 분기 따라 구체 학교명 명시.`,
    `"보여요"·"나와요" 어미를 모든 문장에 자연 + 사주 용어는 평이한 풀이 곁들임.`,
    `어머니 사주는 14번 마지막 섹션에서 자녀-어머니 합 시기·관여 비중으로 녹여 풀이.`,
    c.hourPillar ? `` : `시(時)주 미입력 — 시주 관련 추측 금지, 면책 톤 유지.`,
  ].filter(Boolean);

  return lines.join('\n');
}
