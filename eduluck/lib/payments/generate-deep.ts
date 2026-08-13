// 상세 리포트용 — deep 14섹션을 서버에서 보장(누락분 생성·저장).
// 사용자가 화면에서 만든 섹션은 interpretations(kind=deep-{n})에 이미 있고,
// 없는 섹션만 여기서 non-streaming 으로 생성해 채운다. 동시성 제한으로 시간·rate 관리.

import type { SupabaseClient } from '@supabase/supabase-js';
import { getAnthropicClient, ANTHROPIC_MODEL } from '../llm/client';
import {
  getInterpretDeepSystem,
  buildInterpretDeepPrompt,
  DEEP_SECTIONS,
} from '../prompts/interpret-deep';
import type { InterpretPremiumContext } from '../prompts/interpret-premium-shared';
import { PREMIUM_PROMPT_VERSION } from '../prompts/version';
import { hydrateManse } from '../manse/hydrate';

export interface DeepSectionResult {
  number: number;
  header: string;
  text: string;
}

const ALL_SECTIONS = Array.from({ length: 14 }, (_, i) => i + 1);
const CONCURRENCY = 4;

/** 제한 동시성으로 작업 실행 — 각 작업은 실패해도 다른 작업을 막지 않는다. */
async function runPool<T>(items: T[], limit: number, fn: (item: T) => Promise<void>): Promise<void> {
  let idx = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (idx < items.length) {
      const cur = items[idx++];
      await fn(cur);
    }
  });
  await Promise.all(workers);
}

async function loadContext(
  sb: SupabaseClient,
  sessionId: string,
  childSubjectId: string | null,
): Promise<{ ctx: InterpretPremiumContext; childSubjectId: string; motherSubjectId: string | null }> {
  const { data: subjects } = await sb
    .from('subjects')
    .select('*')
    .eq('session_id', sessionId);
  const rows = subjects ?? [];
  const child =
    (childSubjectId ? rows.find((r) => r.id === childSubjectId) : null) ??
    rows.find((r) => r.role === 'child');
  if (!child) throw new Error('자녀 사주 정보를 찾지 못했습니다.');
  const mother = rows.find((r) => r.role === 'mother') ?? null;
  const father = rows.find((r) => r.role === 'father') ?? null;

  const ctx: InterpretPremiumContext = {
    childNickname: child.nickname ?? '아이',
    childGender: child.gender,
    grade: child.grade ?? 'elem-3',
    childBirthYear: child.birth_year,
    childBirthMonth: child.birth_month,
    childBirthDay: child.birth_day,
    childManse: hydrateManse(child.manse_json),
    motherManse: mother ? hydrateManse(mother.manse_json) : null,
    fatherManse: father ? hydrateManse(father.manse_json) : null,
  };
  return { ctx, childSubjectId: child.id, motherSubjectId: mother?.id ?? null };
}

/**
 * 세션의 deep 14섹션을 모두 보장하고 순서대로 반환.
 * 누락 섹션은 생성·저장. 일부 실패 시(성공분은 저장) throw — 다음 시도에서 나머지만 재생성.
 */
export async function ensureDeepSections(
  sb: SupabaseClient,
  order: { session_id: string | null; child_subject_id: string | null },
): Promise<DeepSectionResult[]> {
  const sessionId = order.session_id;
  if (!sessionId) throw new Error('세션 정보가 없어 상세 리포트를 만들 수 없습니다.');

  // 기존 deep 섹션 로드 (kind=deep-{n})
  const { data: existingRows } = await sb
    .from('interpretations')
    .select('kind, body_text, created_at')
    .eq('session_id', sessionId)
    .like('kind', 'deep-%')
    .order('created_at', { ascending: false });

  const existing = new Map<number, string>();
  for (const r of existingRows ?? []) {
    const m = /^deep-(\d+)$/.exec(r.kind);
    if (!m) continue;
    const n = Number(m[1]);
    if (n >= 1 && n <= 14 && !existing.has(n) && r.body_text) {
      existing.set(n, r.body_text); // 최신순 정렬이라 첫 항목이 최신
    }
  }

  const missing = ALL_SECTIONS.filter((n) => !existing.has(n));
  if (missing.length > 0) {
    const { ctx, childSubjectId, motherSubjectId } = await loadContext(
      sb,
      sessionId,
      order.child_subject_id,
    );
    const system = getInterpretDeepSystem();
    const client = getAnthropicClient();

    await runPool(missing, CONCURRENCY, async (n) => {
      try {
        const res = await client.messages.create({
          model: ANTHROPIC_MODEL,
          max_tokens: 12000,
          temperature: 0.5,
          system,
          messages: [{ role: 'user', content: buildInterpretDeepPrompt(ctx, n) }],
        });
        const text = res.content
          .map((b) => (b.type === 'text' ? b.text : ''))
          .join('')
          .trim();
        if (!text) throw new Error('empty generation');

        await sb.from('interpretations').insert({
          session_id: sessionId,
          kind: `deep-${n}`,
          child_subject_id: childSubjectId,
          mother_subject_id: motherSubjectId,
          body_text: text,
          prompt_version: PREMIUM_PROMPT_VERSION,
          llm_model: ANTHROPIC_MODEL,
        });
        existing.set(n, text);
      } catch (e) {
        console.error('[generate-deep] section fail', { section: n, sessionId, error: e instanceof Error ? e.message : String(e) });
        // 실패 섹션은 existing 에 안 들어감 → 아래에서 미완 판정
      }
    });
  }

  const stillMissing = ALL_SECTIONS.filter((n) => !existing.has(n));
  if (stillMissing.length > 0) {
    throw new Error(`상세 섹션 생성 미완: ${stillMissing.join(',')}`);
  }

  return ALL_SECTIONS.map((n) => ({
    number: n,
    header: DEEP_SECTIONS[n].header,
    text: existing.get(n)!,
  }));
}
