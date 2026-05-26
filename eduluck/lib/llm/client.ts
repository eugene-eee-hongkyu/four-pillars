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

// Claude Haiku 4.5 (명시 버전 pin) — 모든 LLM 호출 통일 (정밀 진단·무료 진단·관계 분석).
//
// 명시 버전 'claude-haiku-4-5-20251001' 사용 이유:
//   - 'claude-haiku-latest' 알리어스 사용 시 Anthropic이 다른 모델로 resolve할 가능성
//     (실제 검증 2026-05-26: alias 사용 시 response.model 필드가 'claude-sonnet-4-6'로 저장됨)
//   - 명시 버전 pin이 결정성·재현성 보장 + prompt 동작 안정
//   - minor/major update는 명시적으로 model ID 갱신해서 추적
//
// Sonnet 대비 3x 빠름 + 3x 비용 절감. 정밀 진단 9 sample 검증 (2026-05-23):
//   - 단정 표현 0/0 (Sonnet 동등)
//   - 평균 chars ratio 98% (정보 누락 ✗)
//   - 1티어 5 sample 완전 동등 (chars·환경 표현 침투 동등 또는 우위)
//
// 환경변수 override 가능 (예: 'claude-haiku-latest' alias 원하면 Vercel ENV에 ANTHROPIC_MODEL 설정).
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5-20251001';

/** @deprecated ANTHROPIC_MODEL과 통일됨. 옛 import 호환만 유지. 신규 코드는 ANTHROPIC_MODEL 사용. */
export const ANTHROPIC_MODEL_PREMIUM = ANTHROPIC_MODEL;
