// /admin/subjects — 진단 데이터 리스트 + 검색 + 마스킹 토글 + 페이지네이션.
//
// PC (width >= 768): 가로 스크롤 테이블 (기록일·subTier·11 방향성·5 raw 점수)
// 모바일: 컴팩트 행 + 클릭 시 펼침 토글

import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { DIRECTION_KEYS, DIRECTION_UI_LABELS, type DirectionKey } from '@/lib/direction-system';

const RAW_SCORE_KEYS = ['arts', 'abroad', 'medical', 'research', 'publicForce'] as const;
type RawScoreKey = (typeof RAW_SCORE_KEYS)[number];

const RAW_SCORE_LABELS: Record<RawScoreKey, string> = {
  arts: '예술raw',
  abroad: '해외raw',
  medical: '의약raw',
  research: '연구raw',
  publicForce: '공무raw',
};

interface SubjectListRow {
  id: string;
  sessionId: string;
  nickname: string | null;
  nicknameRaw: string | null;
  gender: string;
  grade: string | null;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number | null;
  birthMinute: number | null;
  birthLocation: string | null;
  hagunScore: number | null;
  finalScore: number | null;
  subTier: string | null;
  directionScores: Partial<Record<DirectionKey, number>>;
  rawScores: Record<RawScoreKey, number | null>;
  createdAt: string;
}

interface ListResponse {
  subjects: SubjectListRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  hasNext: boolean;
}

export default function AdminSubjects() {
  const router = useRouter();
  const { me, loading: authLoading } = useAdminMe();
  const { logout } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [unmask, setUnmask] = useState(false);
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        unmask: unmask ? '1' : '0',
      });
      if (q.trim()) params.set('q', q.trim());
      const res = await adminFetch(`/api/admin/subjects?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as ListResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch 실패');
    } finally {
      setLoading(false);
    }
  }, [me, page, q, unmask]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (authLoading || !me) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

  return (
    <View className="flex-1 bg-surface">
      <AdminHeader me={me} onLogout={logout} router={router} />

      <View className="px-container-padding py-4 gap-3 border-b border-outline-warm">
        <View className="flex-row items-center gap-2">
          <TextInput
            value={q}
            onChangeText={(t) => {
              setQ(t);
              setPage(1);
            }}
            placeholder="이름·생년월일(YYYY-MM-DD)·고향 검색"
            placeholderTextColor="#9CA3AF"
            className="flex-1 px-4 py-3 rounded-md border border-outline-warm bg-surface-container-low font-body text-body-md"
          />
          <Pressable
            onPress={() => setUnmask(!unmask)}
            className={`px-4 py-3 rounded-md border ${
              unmask ? 'border-primary bg-secondary-container' : 'border-outline-warm bg-surface-container-low'
            }`}
          >
            <Text className={`font-body-bold text-label-md ${unmask ? 'text-primary' : 'text-text-sub'}`}>
              {unmask ? '🔓 원본 보기 ON' : '🔒 마스킹'}
            </Text>
          </Pressable>
        </View>
        <Text className="font-body text-label-sm text-text-sub">
          총 {data?.totalCount ?? 0}건 · 페이지 {data?.page ?? 1}/{totalPages} ·{' '}
          {isDesktop ? 'PC 펼침' : '모바일 컴팩트'}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View className="p-card-padding">
          <Text className="font-body text-body-md text-fire">{error}</Text>
        </View>
      ) : isDesktop ? (
        <DesktopTable rows={data?.subjects ?? []} />
      ) : (
        <MobileList
          rows={data?.subjects ?? []}
          expandedId={expandedId}
          onToggle={(id) => setExpandedId(expandedId === id ? null : id)}
        />
      )}

      <Pagination page={data?.page ?? 1} totalPages={totalPages} onJump={setPage} />
    </View>
  );
}

function AdminHeader({
  me,
  onLogout,
  router,
}: {
  me: { email: string; role: string };
  onLogout: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View className="flex-row items-center justify-between px-container-padding py-3 border-b border-outline-warm bg-surface">
      <View className="flex-row items-center gap-3">
        <Text className="font-heading-bold text-headline-md text-text-pri">eduluck admin</Text>
        <Pressable onPress={() => router.push('/admin/subjects' as never)}>
          <Text className="font-body text-label-md text-text-sub">진단</Text>
        </Pressable>
        {me.role === 'super_admin' && (
          <>
            <Pressable onPress={() => router.push('/admin/admins' as never)}>
              <Text className="font-body text-label-md text-text-sub">어드민</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/admin/audit-log' as never)}>
              <Text className="font-body text-label-md text-text-sub">감사로그</Text>
            </Pressable>
          </>
        )}
      </View>
      <View className="flex-row items-center gap-2">
        <Text className="font-body text-label-sm text-text-sub">{me.email}</Text>
        <Text className="font-body text-label-sm text-primary">[{me.role}]</Text>
        <Pressable onPress={onLogout} className="px-3 py-1.5 rounded-md border border-outline-warm">
          <Text className="font-body text-label-sm text-text-sub">로그아웃</Text>
        </Pressable>
      </View>
    </View>
  );
}

function DesktopTable({ rows }: { rows: SubjectListRow[] }) {
  return (
    <ScrollView horizontal className="flex-1">
      <ScrollView className="flex-1">
        <View className="min-w-full">
          {/* 헤더 */}
          <View className="flex-row bg-surface-container-low border-b border-outline-warm">
            <HeaderCell width={110} text="기록일" />
            <HeaderCell width={120} text="이름" />
            <HeaderCell width={50} text="성별" />
            <HeaderCell width={80} text="학년" />
            <HeaderCell width={110} text="생년월일" />
            <HeaderCell width={60} text="시간" />
            <HeaderCell width={120} text="고향" />
            <HeaderCell width={80} text="학운(정규화)" />
            <HeaderCell width={70} text="티어" />
            {DIRECTION_KEYS.map((k) => (
              <HeaderCell key={k} width={70} text={DIRECTION_UI_LABELS[k].label.split('·')[0]} />
            ))}
            {RAW_SCORE_KEYS.map((k) => (
              <HeaderCell key={k} width={75} text={RAW_SCORE_LABELS[k]} />
            ))}
          </View>

          {rows.map((r) => (
            <View key={r.id} className="flex-row border-b border-outline-warm/50">
              <DataCell width={110} text={formatDate(r.createdAt)} />
              <DataCell width={120} text={r.nickname ?? '-'} />
              <DataCell width={50} text={r.gender === 'male' ? '남' : '여'} />
              <DataCell width={80} text={r.grade ?? '-'} />
              <DataCell width={110} text={`${r.birthYear}-${pad(r.birthMonth)}-${pad(r.birthDay)}`} />
              <DataCell
                width={60}
                text={r.birthHour !== null ? `${pad(r.birthHour)}:${pad(r.birthMinute ?? 0)}` : '모름'}
              />
              <DataCell width={120} text={r.birthLocation ?? '-'} />
              <DataCell
                width={80}
                text={r.finalScore !== null ? String(r.finalScore) : '-'}
                emphasize
              />
              <DataCell width={70} text={r.subTier ?? '-'} emphasize />
              {DIRECTION_KEYS.map((k) => (
                <ScoreCell key={k} score={r.directionScores[k]} width={70} />
              ))}
              {RAW_SCORE_KEYS.map((k) => (
                <ScoreCell key={k} score={r.rawScores[k] ?? undefined} width={75} muted />
              ))}
            </View>
          ))}

          {rows.length === 0 && (
            <View className="p-card-padding">
              <Text className="font-body text-body-md text-text-sub">결과 없음</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

function MobileList({
  rows,
  expandedId,
  onToggle,
}: {
  rows: SubjectListRow[];
  expandedId: string | null;
  onToggle: (id: string) => void;
}) {
  return (
    <ScrollView className="flex-1">
      {rows.map((r) => {
        const expanded = expandedId === r.id;
        return (
          <Pressable
            key={r.id}
            onPress={() => onToggle(r.id)}
            className="p-card-padding border-b border-outline-warm/50 gap-1"
          >
            <View className="flex-row justify-between">
              <Text className="font-body-bold text-body-md text-text-pri">{r.nickname ?? '-'}</Text>
              <Text className="font-body text-label-sm text-text-sub">
                {r.finalScore ?? '-'}점 · 티어 {r.subTier ?? '-'}
              </Text>
            </View>
            <Text className="font-body text-label-md text-text-sub">
              {r.gender === 'male' ? '남' : '여'} · {r.grade ?? '-'} ·{' '}
              {r.birthYear}-{pad(r.birthMonth)}-{pad(r.birthDay)}{' '}
              {r.birthHour !== null ? `${pad(r.birthHour)}:${pad(r.birthMinute ?? 0)}` : ''} · {r.birthLocation}
            </Text>
            <Text className="font-body text-label-sm text-text-sub">
              기록: {formatDate(r.createdAt)}
            </Text>

            {expanded && (
              <View className="mt-2 pt-2 border-t border-outline-warm/30 gap-1">
                <Text className="font-body-bold text-label-sm text-text-pri">방향성 점수</Text>
                {DIRECTION_KEYS.map((k) => {
                  const score = r.directionScores[k];
                  return (
                    <View key={k} className="flex-row justify-between">
                      <Text className="font-body text-label-sm text-text-sub">
                        {DIRECTION_UI_LABELS[k].emoji} {DIRECTION_UI_LABELS[k].label}
                      </Text>
                      <Text className="font-body-bold text-label-sm text-text-pri">
                        {score !== undefined ? score : '-'}
                      </Text>
                    </View>
                  );
                })}
                <Text className="font-body-bold text-label-sm text-text-pri mt-2">Raw 점수 (5종)</Text>
                {RAW_SCORE_KEYS.map((k) => (
                  <View key={k} className="flex-row justify-between">
                    <Text className="font-body text-label-sm text-text-sub">{RAW_SCORE_LABELS[k]}</Text>
                    <Text className="font-body text-label-sm text-text-sub">
                      {r.rawScores[k] ?? '-'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        );
      })}

      {rows.length === 0 && (
        <View className="p-card-padding">
          <Text className="font-body text-body-md text-text-sub">결과 없음</Text>
        </View>
      )}
    </ScrollView>
  );
}

/**
 * 페이지네이션 — 1, 2, 3 ... 10 형식.
 * 현재 페이지 주변 (앞뒤 2개) + 첫/끝 페이지 + 생략 표시(…).
 */
function Pagination({
  page,
  totalPages,
  onJump,
}: {
  page: number;
  totalPages: number;
  onJump: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = buildPageRange(page, totalPages);

  return (
    <View className="flex-row items-center justify-center gap-1 py-4 border-t border-outline-warm bg-surface flex-wrap">
      <Pressable
        onPress={() => onJump(Math.max(1, page - 1))}
        disabled={page <= 1}
        className={`px-3 py-2 rounded-md border ${page <= 1 ? 'border-outline-warm opacity-30' : 'border-outline-warm active:opacity-70'}`}
      >
        <Text className="font-body text-label-md text-text-pri">‹</Text>
      </Pressable>

      {pages.map((p, i) =>
        p === '…' ? (
          <Text key={`gap-${i}`} className="px-2 font-body text-label-md text-text-sub">
            …
          </Text>
        ) : (
          <Pressable
            key={p}
            onPress={() => onJump(p)}
            className={`min-w-[36px] px-2 py-2 rounded-md border items-center ${
              p === page
                ? 'border-primary bg-primary'
                : 'border-outline-warm active:opacity-70'
            }`}
          >
            <Text
              className={`font-body${p === page ? '-bold' : ''} text-label-md ${
                p === page ? 'text-surface-container-low' : 'text-text-pri'
              }`}
            >
              {p}
            </Text>
          </Pressable>
        ),
      )}

      <Pressable
        onPress={() => onJump(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className={`px-3 py-2 rounded-md border ${page >= totalPages ? 'border-outline-warm opacity-30' : 'border-outline-warm active:opacity-70'}`}
      >
        <Text className="font-body text-label-md text-text-pri">›</Text>
      </Pressable>
    </View>
  );
}

function buildPageRange(current: number, total: number): (number | '…')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  const out: (number | '…')[] = [];
  const window = 2; // 현재 페이지 앞뒤 2개

  out.push(1);
  if (current - window > 2) out.push('…');
  for (let p = Math.max(2, current - window); p <= Math.min(total - 1, current + window); p++) {
    out.push(p);
  }
  if (current + window < total - 1) out.push('…');
  out.push(total);
  return out;
}

function HeaderCell({ width, text }: { width: number; text: string }) {
  return (
    <View style={{ width }} className="px-2 py-2 border-r border-outline-warm/30">
      <Text className="font-body-bold text-label-sm text-text-pri" numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function DataCell({ width, text, emphasize }: { width: number; text: string; emphasize?: boolean }) {
  return (
    <View style={{ width }} className="px-2 py-2 border-r border-outline-warm/30">
      <Text
        className={`${emphasize ? 'font-body-bold text-primary' : 'font-body text-text-pri'} text-label-sm`}
        numberOfLines={1}
      >
        {text}
      </Text>
    </View>
  );
}

function ScoreCell({
  score,
  width = 70,
  muted,
}: {
  score: number | undefined;
  width?: number;
  muted?: boolean;
}) {
  const s = score ?? 0;
  let color = muted ? 'text-text-sub' : s >= 70 ? 'text-primary' : s >= 40 ? 'text-text-pri' : 'text-text-sub';
  return (
    <View style={{ width }} className="px-2 py-2 border-r border-outline-warm/30">
      <Text className={`font-body text-label-sm ${color}`}>{score !== undefined && score !== null ? score : '-'}</Text>
    </View>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return '-';
  }
}
