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
