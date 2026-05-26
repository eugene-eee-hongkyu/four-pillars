// Anthropic SDK 싱글톤 — API key는 ANTHROPIC_API_KEY 환경변수에서 자동 로드
import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY 환경변수 미설정. eduluck/.env.local 확인');
  }
  _client = new Anthropic();
  return _client;
}

// Claude Haiku 4.5 (강제) — 모든 LLM 호출 통일 (정밀 진단·무료 진단·관계 분석).
//
// 강제 Haiku 로직 (env override 안전 처리):
//   - 사용자 의도: Sonnet → Haiku 통일 (3x 빠름 + 3x 비용 절감)
//   - Vercel ENV에 옛 'claude-sonnet-4-6' 또는 'claude-haiku-latest' (alias가 sonnet으로 resolve)
//     같은 비-Haiku 모델이 설정되어 있으면 자동 무시 + 명시 Haiku 강제
//   - env가 'haiku' 명시 모델이면 그대로 사용 (예: 다른 Haiku 버전 테스트)
//
// Haiku 4.5 검증 (2026-05-23, 9 sample):
//   - 단정 표현 0/0 (Sonnet 동등)
//   - 평균 chars ratio 98% (정보 누락 ✗)
//   - 1티어 5 sample 완전 동등 (chars·환경 표현 침투 동등 또는 우위)
//
// 강제 무력화 원하면 ENV에 'claude-haiku-4-5-20251001' 같은 명시 Haiku 설정 (alias·sonnet 무시됨).
const DEFAULT_HAIKU = 'claude-haiku-4-5-20251001';
const envModel = process.env.ANTHROPIC_MODEL;
const envIsHaiku = envModel?.toLowerCase().includes('haiku') && !envModel.toLowerCase().includes('latest');
if (envModel && !envIsHaiku) {
  // Vercel ENV에 옛 Sonnet 또는 alias 남아 있는 경우 — 경고 + 무시
  // eslint-disable-next-line no-console
  console.warn(`[client] ANTHROPIC_MODEL env="${envModel}" is not a pinned Haiku model. Forcing default ${DEFAULT_HAIKU}.`);
}
export const ANTHROPIC_MODEL = envIsHaiku ? envModel! : DEFAULT_HAIKU;

/** @deprecated ANTHROPIC_MODEL과 통일됨. 옛 import 호환만 유지. 신규 코드는 ANTHROPIC_MODEL 사용. */
export const ANTHROPIC_MODEL_PREMIUM = ANTHROPIC_MODEL;
