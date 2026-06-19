// /admin/feedback — 3분 피드백(mom-test 11문항) 응답 조회.

import { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { AdminNav } from '@/components/admin/AdminNav';

interface FeedbackRow {
  id: string;
  session_id: string;
  source: string;
  created_at: string;
  prompt_version: string | null;
  grade: string | null;
  gender: string | null;
  hagun_label: string | null;
  sub_tier: string | null;
  q2_hagun_accuracy: number | null;
  q3_school_match: number | null;
  q4_direction_match: number | null;
  q5_aptitude_match: number | null;
  q6_readability: number | null;
  q7_trust: number | null;
  q1_first_impression: string | null;
  q8_false_hope_or_despair: string | null;
  q9_helpful_sections: string | null;
  q10_more_info: string | null;
  q11_willing_price: string | null;
}

const SCORE_LABELS: { key: keyof FeedbackRow; label: string }[] = [
  { key: 'q2_hagun_accuracy', label: '학운 라벨·점수' },
  { key: 'q3_school_match', label: '학교' },
  { key: 'q4_direction_match', label: '방향성' },
  { key: 'q5_aptitude_match', label: '적성' },
  { key: 'q6_readability', label: '읽기 편함' },
  { key: 'q7_trust', label: '신뢰도' },
];

const TEXT_LABELS: { key: keyof FeedbackRow; label: string }[] = [
  { key: 'q1_first_impression', label: '첫인상' },
  { key: 'q8_false_hope_or_despair', label: '거짓 희망/절망' },
  { key: 'q9_helpful_sections', label: '도움된 부분' },
  { key: 'q10_more_info', label: '더 알고 싶은 것' },
  { key: 'q11_willing_price', label: '지불 의향' },
];

const SOURCE_LABEL: Record<string, string> = {
  'premium-part2': '정밀 진단',
  'deep-dive': '더 자세히 보기',
};

/** 정량 평균 (응답된 항목만). */
function avgScore(r: FeedbackRow): string {
  const vals = SCORE_LABELS.map(({ key }) => r[key] as number | null).filter(
    (v): v is number => typeof v === 'number',
  );
  if (!vals.length) return '—';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

export default function FeedbackPage() {
  const { me, loading: authLoading } = useAdminMe();
  const { logout } = useAuth();

  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeedback = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/feedback');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { feedback: FeedbackRow[] };
      setRows(json.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch 실패');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  if (authLoading || !me) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface">
      <AdminNav active="feedback" role={me.role} email={me.email} onLogout={logout} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-padding py-6 gap-4 max-w-3xl w-full self-center"
      >
        <View className="flex-row items-center justify-between">
          <Text className="font-heading-bold text-headline-md text-text-pri">
            3분 피드백 ({rows.length})
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" />
        ) : error ? (
          <Text className="font-body text-label-sm text-fire">{error}</Text>
        ) : rows.length === 0 ? (
          <Text className="font-body text-body-md text-text-sub">아직 제출된 피드백이 없어요.</Text>
        ) : (
          rows.map((r) => {
            const texts = TEXT_LABELS.map(({ key, label }) => ({ label, value: r[key] as string | null })).filter(
              (t) => t.value && t.value.trim(),
            );
            return (
              <View
                key={r.id}
                className="p-card-padding rounded-md border border-outline-warm bg-surface-container-low gap-2"
              >
                {/* 헤더 — 날짜·출처·메타 */}
                <View className="flex-row items-center justify-between flex-wrap gap-1">
                  <Text className="font-body-bold text-body-md text-text-pri">
                    평균 {avgScore(r)} · {SOURCE_LABEL[r.source] ?? r.source}
                  </Text>
                  <Text className="font-body text-label-sm text-text-sub">
                    {new Date(r.created_at).toLocaleString('ko-KR')}
                  </Text>
                </View>
                <Text className="font-body text-label-sm text-text-sub">
                  {[r.hagun_label, r.sub_tier ? `tier ${r.sub_tier}` : null, r.grade, r.gender, r.prompt_version]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>

                {/* 정량 6점 */}
                <View className="flex-row flex-wrap gap-x-3 gap-y-1 pt-1 border-t border-outline-warm">
                  {SCORE_LABELS.map(({ key, label }) => {
                    const v = r[key] as number | null;
                    return (
                      <Text key={key} className="font-body text-label-sm text-text-pri">
                        {label} <Text className="font-body-bold text-primary">{v ?? '—'}</Text>
                      </Text>
                    );
                  })}
                </View>

                {/* 정성 텍스트 */}
                {texts.length > 0 && (
                  <View className="gap-1.5 pt-1 border-t border-outline-warm">
                    {texts.map((t) => (
                      <View key={t.label} className="gap-0.5">
                        <Text className="font-body text-label-sm text-text-sub">{t.label}</Text>
                        <Text className="font-body text-body-sm text-text-pri leading-relaxed">{t.value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
