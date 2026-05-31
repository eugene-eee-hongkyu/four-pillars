// /admin/subjects — 진단 데이터 리스트 + 검색 + 마스킹 토글 + 페이지네이션.
//
// PC (width >= 768): 14컬럼 가로 스크롤 테이블
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
  hagunLabel: string | null;
  primaryTier: string | null;
  directionScores: Partial<Record<DirectionKey, number>>;
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
          총 {data?.totalCount ?? 0}건 · 페이지 {data?.page ?? 1} · {isDesktop ? 'PC 펼침' : '모바일 컴팩트'}
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

      <Pagination
        page={data?.page ?? 1}
        hasNext={data?.hasNext ?? false}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />
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
            <HeaderCell width={120} text="이름" />
            <HeaderCell width={50} text="성별" />
            <HeaderCell width={80} text="학년" />
            <HeaderCell width={110} text="생년월일" />
            <HeaderCell width={60} text="시간" />
            <HeaderCell width={120} text="고향" />
            <HeaderCell width={80} text="학운" />
            <HeaderCell width={70} text="티어" />
            {DIRECTION_KEYS.map((k) => (
              <HeaderCell key={k} width={70} text={DIRECTION_UI_LABELS[k].label.split('·')[0]} />
            ))}
          </View>

          {rows.map((r) => (
            <View key={r.id} className="flex-row border-b border-outline-warm/50">
              <DataCell width={120} text={r.nickname ?? '-'} />
              <DataCell width={50} text={r.gender === 'male' ? '남' : '여'} />
              <DataCell width={80} text={r.grade ?? '-'} />
              <DataCell width={110} text={`${r.birthYear}-${pad(r.birthMonth)}-${pad(r.birthDay)}`} />
              <DataCell
                width={60}
                text={r.birthHour !== null ? `${pad(r.birthHour)}:${pad(r.birthMinute ?? 0)}` : '모름'}
              />
              <DataCell width={120} text={r.birthLocation ?? '-'} />
              <DataCell width={80} text={r.hagunLabel ?? '-'} />
              <DataCell width={70} text={r.primaryTier ?? '-'} />
              {DIRECTION_KEYS.map((k) => (
                <ScoreCell key={k} score={r.directionScores[k]} />
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
                {r.hagunLabel ?? '-'} · {r.primaryTier ?? '-'}
              </Text>
            </View>
            <Text className="font-body text-label-md text-text-sub">
              {r.gender === 'male' ? '남' : '여'} · {r.grade ?? '-'} ·{' '}
              {r.birthYear}-{pad(r.birthMonth)}-{pad(r.birthDay)}{' '}
              {r.birthHour !== null ? `${pad(r.birthHour)}:${pad(r.birthMinute ?? 0)}` : ''} · {r.birthLocation}
            </Text>

            {expanded && (
              <View className="mt-2 pt-2 border-t border-outline-warm/30 gap-1">
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

function Pagination({
  page,
  hasNext,
  onPrev,
  onNext,
}: {
  page: number;
  hasNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <View className="flex-row items-center justify-center gap-3 py-4 border-t border-outline-warm bg-surface">
      <Pressable
        onPress={onPrev}
        disabled={page <= 1}
        className={`px-4 py-2 rounded-md border ${page <= 1 ? 'border-outline-warm opacity-30' : 'border-outline-warm'}`}
      >
        <Text className="font-body text-label-md text-text-pri">‹ 이전</Text>
      </Pressable>
      <Text className="font-body-bold text-label-md text-text-pri">페이지 {page}</Text>
      <Pressable
        onPress={onNext}
        disabled={!hasNext}
        className={`px-4 py-2 rounded-md border ${!hasNext ? 'border-outline-warm opacity-30' : 'border-outline-warm'}`}
      >
        <Text className="font-body text-label-md text-text-pri">다음 ›</Text>
      </Pressable>
    </View>
  );
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

function DataCell({ width, text }: { width: number; text: string }) {
  return (
    <View style={{ width }} className="px-2 py-2 border-r border-outline-warm/30">
      <Text className="font-body text-label-sm text-text-pri" numberOfLines={1}>
        {text}
      </Text>
    </View>
  );
}

function ScoreCell({ score }: { score: number | undefined }) {
  const s = score ?? 0;
  const color = s >= 70 ? 'text-primary' : s >= 40 ? 'text-text-pri' : 'text-text-sub';
  return (
    <View style={{ width: 70 }} className="px-2 py-2 border-r border-outline-warm/30">
      <Text className={`font-body text-label-sm ${color}`}>{score !== undefined ? score : '-'}</Text>
    </View>
  );
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
