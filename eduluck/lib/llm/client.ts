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

// Claude Haiku — 모든 LLM 호출 통일 (정밀 진단·무료 진단·관계 분석).
//
// 'claude-haiku-latest' 알리어스 사용:
//   - Anthropic이 minor update 시 자동 따라감 (수동 모델 버전 갱신 불필요)
//   - 새 Haiku major release (4.5 → 5 등) 시에도 자동 전환
//   - prompt 동작 미세 변화 risk는 mom test로 즉시 detect
//
// Sonnet 대비 3x 빠름 + 3x 비용 절감. 정밀 진단 9 sample 검증 (2026-05-23):
//   - 단정 표현 0/0 (Sonnet 동등)
//   - 평균 chars ratio 98% (정보 누락 ✗)
//   - 1티어 5 sample 완전 동등 (chars·환경 표현 침투 동등 또는 우위)
//
// 환경변수 override 가능 (예: 특정 버전 pin이 필요하면 'claude-haiku-4-5-20251001').
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-latest';

/** @deprecated ANTHROPIC_MODEL과 통일됨. 옛 import 호환만 유지. 신규 코드는 ANTHROPIC_MODEL 사용. */
export const ANTHROPIC_MODEL_PREMIUM = ANTHROPIC_MODEL;
