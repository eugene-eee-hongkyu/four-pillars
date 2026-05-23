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

export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';

// 정밀 진단(§12 16섹션) 전용 모델 — Haiku 4.5 (Sonnet 대비 3x 비용 절감).
// 검증 결과 (2026-05-23, 9 sample 전체 비교):
//   - 단정 표현 0/0 (Sonnet 동등)
//   - 평균 chars ratio 98% (정보 누락 ✗)
//   - 1티어 5명 sample 완전 동등 (chars·환경 표현 침투 동등 또는 우위)
//   - 와이프 6티어 sample만 narrative 풍부도 -26% (약 영역이라 자연스러운 압축)
// 무료 간이 진단(interpret-free)·관계 분석(relation-mini)은 미검증 영역이라 Sonnet 유지.
export const ANTHROPIC_MODEL_PREMIUM = process.env.ANTHROPIC_MODEL_PREMIUM ?? 'claude-haiku-4-5-20251001';
