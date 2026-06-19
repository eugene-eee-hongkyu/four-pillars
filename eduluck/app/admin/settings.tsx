// /admin/settings — 전역 설정.
// "더 자세히 보기"(deep-dive) 14개 영역 무료 공개 정책.
//   모드 1) 영역별 선택 — 영역마다 무료/유료 토글
//   모드 2) 앞에서부터 N개 — 1..N번 무료, 나머지 유료

import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminMe } from '@/lib/admin/useAdminMe';
import { adminFetch } from '@/lib/admin/client';
import { useAuth } from '@/lib/hooks/useAuth';
import { DEEP_SECTIONS } from '@/lib/prompts/interpret-deep';

const SECTIONS = Object.values(DEEP_SECTIONS).sort((a, b) => a.number - b.number);
const TOTAL = SECTIONS.length;

type Mode = 'per_section' | 'count';
interface Config {
  mode: Mode;
  freeSections: number[];
  freeCount: number;
}

/** "시작 — 인사·이름·전체 그림" 같은 헤더에서 em dash 앞부분만 추출 */
function headerShort(header: string): string {
  const idx = header.indexOf(' — ');
  return idx >= 0 ? header.slice(0, idx) : header;
}

function sameConfig(a: Config, b: Config): boolean {
  if (a.mode !== b.mode || a.freeCount !== b.freeCount) return false;
  if (a.freeSections.length !== b.freeSections.length) return false;
  const setB = new Set(b.freeSections);
  return a.freeSections.every((n) => setB.has(n));
}

export default function SettingsPage() {
  const router = useRouter();
  const { me, loading: authLoading } = useAdminMe();
  const { logout } = useAuth();

  const [config, setConfig] = useState<Config | null>(null);
  const [savedConfig, setSavedConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const fetchConfig = useCallback(async () => {
    if (!me) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/config');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { config: Config };
      setConfig(json.config);
      setSavedConfig(json.config);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'fetch 실패');
    } finally {
      setLoading(false);
    }
  }, [me]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const dirty = useMemo(
    () => !!config && !!savedConfig && !sameConfig(config, savedConfig),
    [config, savedConfig],
  );

  /** 현재 모드 기준 섹션 N이 무료인지 (미리보기·표시용). */
  const isFree = (n: number): boolean => {
    if (!config) return true;
    return config.mode === 'count' ? n <= config.freeCount : config.freeSections.includes(n);
  };

  const freeCount = config
    ? config.mode === 'count'
      ? config.freeCount
      : config.freeSections.length
    : TOTAL;

  const update = (patch: Partial<Config>) => {
    setSavedMsg(false);
    setConfig((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const toggleSection = (n: number) => {
    if (!config) return;
    const has = config.freeSections.includes(n);
    update({
      freeSections: has
        ? config.freeSections.filter((x) => x !== n)
        : [...config.freeSections, n].sort((a, b) => a - b),
    });
  };

  const handleSave = async () => {
    if (!config || !dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await adminFetch('/api/admin/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const json = (await res.json()) as { config: Config };
      setConfig(json.config);
      setSavedConfig(json.config);
      setSavedMsg(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || !me) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const mode = config?.mode ?? 'count';

  return (
    <View className="flex-1 bg-surface">
      {/* nav */}
      <View className="flex-row items-center justify-between px-container-padding py-3 border-b border-outline-warm">
        <View className="flex-row items-center gap-3">
          <Text className="font-heading-bold text-headline-md text-text-pri">eduluck admin</Text>
          <Pressable onPress={() => router.push('/admin/subjects' as never)}>
            <Text className="font-body text-label-md text-text-sub">진단</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/admin/users' as never)}>
            <Text className="font-body text-label-md text-text-sub">사용자</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/admin/settings' as never)}>
            <Text className="font-body-bold text-label-md text-primary">설정</Text>
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
          <Pressable onPress={logout} className="px-3 py-1.5 rounded-md border border-outline-warm">
            <Text className="font-body text-label-sm text-text-sub">로그아웃</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-container-padding py-6 gap-6 max-w-3xl w-full self-center"
      >
        <View className="gap-2">
          <Text className="font-heading-bold text-headline-md text-text-pri">
            상세 진단 무료 공개 설정
          </Text>
          <Text className="font-body text-body-sm text-text-sub leading-relaxed">
            "더 자세히 보기"의 14개 영역 중 과금 없이 볼 수 있는 범위를 정합니다. 유료 영역은 사용자에게
            잠금(결제 안내)으로 표시돼요. 이미 본 영역은 사용자가 계속 다시 볼 수 있어요.
          </Text>
        </View>

        {loading || !config ? (
          <ActivityIndicator size="large" />
        ) : (
          <>
            {/* 모드 선택 */}
            <View className="gap-2">
              <Text className="font-body-bold text-body-md text-text-pri">공개 방식</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => update({ mode: 'count' })}
                  className={`flex-1 px-4 py-3 rounded-md border ${mode === 'count' ? 'border-primary bg-secondary-container' : 'border-outline-warm bg-surface'}`}
                >
                  <Text className={`font-body text-label-md text-center ${mode === 'count' ? 'text-primary font-body-bold' : 'text-text-sub'}`}>
                    앞에서부터 N개
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => update({ mode: 'per_section' })}
                  className={`flex-1 px-4 py-3 rounded-md border ${mode === 'per_section' ? 'border-primary bg-secondary-container' : 'border-outline-warm bg-surface'}`}
                >
                  <Text className={`font-body text-label-md text-center ${mode === 'per_section' ? 'text-primary font-body-bold' : 'text-text-sub'}`}>
                    영역별 선택
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* count 모드 — 무료 개수 stepper */}
            {mode === 'count' && (
              <View className="gap-2 p-card-padding rounded-md border border-outline-warm bg-surface-container-low">
                <Text className="font-body-bold text-body-md text-text-pri">앞에서부터 무료 개수</Text>
                <View className="flex-row items-center justify-between">
                  <Pressable
                    onPress={() => update({ freeCount: Math.max(0, config.freeCount - 1) })}
                    disabled={config.freeCount <= 0}
                    className={`w-12 h-12 rounded-md border items-center justify-center ${config.freeCount <= 0 ? 'border-outline-warm opacity-40' : 'border-primary'}`}
                  >
                    <Text className="font-heading-bold text-headline-md text-primary">−</Text>
                  </Pressable>
                  <View className="items-center">
                    <Text className="font-heading-bold text-display-sm text-text-pri">{config.freeCount}</Text>
                    <Text className="font-body text-label-sm text-text-sub">/ {TOTAL}개 무료</Text>
                  </View>
                  <Pressable
                    onPress={() => update({ freeCount: Math.min(TOTAL, config.freeCount + 1) })}
                    disabled={config.freeCount >= TOTAL}
                    className={`w-12 h-12 rounded-md border items-center justify-center ${config.freeCount >= TOTAL ? 'border-outline-warm opacity-40' : 'border-primary'}`}
                  >
                    <Text className="font-heading-bold text-headline-md text-primary">＋</Text>
                  </Pressable>
                </View>
                <Text className="font-body text-label-sm text-text-sub text-center">
                  {config.freeCount === 0
                    ? '전체 유료'
                    : config.freeCount >= TOTAL
                      ? '전체 무료'
                      : `1~${config.freeCount}번 무료 · ${config.freeCount + 1}~${TOTAL}번 유료`}
                </Text>
              </View>
            )}

            {/* per_section 모드 — 전체 무료/잠금 빠른 버튼 */}
            {mode === 'per_section' && (
              <View className="flex-row items-center justify-between">
                <Text className="font-body-bold text-body-md text-text-pri">
                  무료 {freeCount} / {TOTAL}개
                </Text>
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => update({ freeSections: SECTIONS.map((s) => s.number) })}
                    className="px-3 py-1.5 rounded-md border border-outline-warm"
                  >
                    <Text className="font-body text-label-sm text-text-pri">전체 무료</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => update({ freeSections: [] })}
                    className="px-3 py-1.5 rounded-md border border-outline-warm"
                  >
                    <Text className="font-body text-label-sm text-text-pri">전체 잠금</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* 14개 영역 — per_section: 토글 / count: 미리보기(읽기 전용) */}
            <View className="gap-2">
              {SECTIONS.map((s) => {
                const free = isFree(s.number);
                const interactive = mode === 'per_section';
                return (
                  <View
                    key={s.number}
                    className="flex-row items-center gap-3 p-card-padding rounded-md border border-outline-warm bg-surface-container-low"
                  >
                    <Text className="text-headline-md">{s.emoji}</Text>
                    <View className="flex-1 gap-0.5">
                      <Text className="font-body-bold text-body-md text-text-pri">
                        {s.number}. {headerShort(s.header)}
                      </Text>
                      <Text className="font-body text-label-sm text-text-sub">{s.oneLine}</Text>
                    </View>
                    <Pressable
                      onPress={interactive ? () => toggleSection(s.number) : undefined}
                      disabled={!interactive}
                      accessibilityRole={interactive ? 'switch' : 'text'}
                      accessibilityState={{ checked: free, disabled: !interactive }}
                      accessibilityLabel={`${s.number}번 ${headerShort(s.header)} ${free ? '무료' : '유료'}`}
                      className={`px-4 py-2 rounded-full border ${free ? 'border-primary bg-secondary-container' : 'border-outline-warm bg-surface'} ${interactive ? '' : 'opacity-80'}`}
                    >
                      <Text
                        className={`font-body text-label-md ${free ? 'text-primary font-body-bold' : 'text-text-sub'}`}
                      >
                        {free ? '무료' : '유료'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            {/* 저장 */}
            <View className="gap-2">
              <Pressable
                onPress={handleSave}
                disabled={!dirty || saving}
                className={`px-4 py-3 rounded-md items-center ${!dirty || saving ? 'bg-outline-warm' : 'bg-primary'}`}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="font-body-bold text-label-md text-surface-container-low">
                    {dirty ? '저장' : '저장됨'}
                  </Text>
                )}
              </Pressable>
              {savedMsg && <Text className="font-body text-label-sm text-secondary">저장됐어요.</Text>}
              {error && <Text className="font-body text-label-sm text-fire">{error}</Text>}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
