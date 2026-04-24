'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { getOrCreateAnonId } from '@/lib/session/anonymous';
import { saveProfile, loadProfile } from '@/lib/session/local-store';
import { lunarToSolar } from '@fullstackfamily/manseryeok';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1949 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

export default function ScreenBirthInput() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'female' | 'male'>('female');
  const [birthYear, setBirthYear] = useState<number>(1990);
  const [birthMonth, setBirthMonth] = useState<number>(1);
  const [birthDay, setBirthDay] = useState<number>(1);
  const [birthHour, setBirthHour] = useState<number>(12);
  const [birthMinute, setBirthMinute] = useState<number>(0);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [calendarType, setCalendarType] = useState<'solar' | 'lunar'>('solar');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 2회차 이상이면 /concern으로 바로 이동
  useEffect(() => {
    const profile = loadProfile();
    if (profile && profile.sessionCount > 0) {
      router.replace('/concern');
    }
  }, [router]);

  async function handleSubmit() {
    if (!name.trim()) { setError('이름을 입력해주세요.'); return; }
    setError('');
    setLoading(true);

    try {
      const anonId = getOrCreateAnonId();

      let solarYear = birthYear, solarMonth = birthMonth, solarDay = birthDay;
      if (calendarType === 'lunar') {
        try {
          const converted = lunarToSolar(birthYear, birthMonth, birthDay, isLeapMonth);
          solarYear = converted.solar.year;
          solarMonth = converted.solar.month;
          solarDay = converted.solar.day;
        } catch {
          setError('올바르지 않은 음력 날짜입니다. 다시 확인해주세요.');
          setLoading(false);
          return;
        }
      }

      const res = await fetch('/api/manse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: solarYear,
          month: solarMonth,
          day: solarDay,
          hour: timeUnknown ? undefined : birthHour,
          minute: timeUnknown ? undefined : birthMinute,
          gender,
        }),
      });

      if (!res.ok) throw new Error('만세력 계산 실패');
      const manse = await res.json();

      saveProfile({
        anonId,
        name: name.trim(),
        gender,
        birthYear,
        birthMonth,
        birthDay,
        birthHour: timeUnknown ? undefined : birthHour,
        birthMinute: timeUnknown ? undefined : birthMinute,
        timeUnknown,
        manse,
        sessionCount: 0,
      });

      router.push('/concern');
    } catch {
      setError('잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center pt-12 pb-20 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div>
          <h1 className="text-xl font-semibold">사주톡</h1>
        </div>

        <div className="space-y-1">
          <p className="text-lg font-medium">반가워요.</p>
          <p className="text-lg font-medium">먼저 몇 가지만 알려주세요.</p>
        </div>

        <div className="space-y-6">
          {/* 이름 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">이름</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              maxLength={20}
            />
          </div>

          {/* 성별 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">성별</label>
            <div className="flex gap-6">
              {(['female', 'male'] as const).map((g) => (
                <label key={g} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="gender"
                    checked={gender === g}
                    onChange={() => setGender(g)}
                    className="accent-primary"
                  />
                  <span className="text-sm">{g === 'female' ? '여성' : '남성'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 양력/음력 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">달력</label>
            <div className="flex gap-6">
              {(['solar', 'lunar'] as const).map((c) => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="calendarType"
                    checked={calendarType === c}
                    onChange={() => { setCalendarType(c); setIsLeapMonth(false); }}
                    className="accent-primary"
                  />
                  <span className="text-sm">{c === 'solar' ? '양력' : '음력'}</span>
                </label>
              ))}
            </div>
            {calendarType === 'lunar' && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={isLeapMonth}
                  onCheckedChange={(v) => setIsLeapMonth(v === true)}
                />
                <span className="text-sm text-muted-foreground">윤달</span>
              </label>
            )}
          </div>

          {/* 생년월일 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">생년월일</label>
            <div className="flex gap-2">
              <select
                value={birthYear}
                onChange={(e) => setBirthYear(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              <select
                value={birthMonth}
                onChange={(e) => setBirthMonth(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
              <select
                value={birthDay}
                onChange={(e) => setBirthDay(Number(e.target.value))}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
          </div>

          {/* 태어난 시간 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">태어난 시간</label>
            <div className="flex gap-2">
              <select
                value={birthHour}
                onChange={(e) => setBirthHour(Number(e.target.value))}
                disabled={timeUnknown}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}시</option>
                ))}
              </select>
              <select
                value={birthMinute}
                onChange={(e) => setBirthMinute(Number(e.target.value))}
                disabled={timeUnknown}
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              >
                {MINUTES.map((m) => (
                  <option key={m} value={m}>{String(m).padStart(2, '0')}분</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={timeUnknown}
                onCheckedChange={(v) => setTimeUnknown(v === true)}
              />
              <span className="text-sm text-muted-foreground">시간을 몰라요</span>
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? '준비 중...' : '다음'}
        </Button>
      </div>
    </main>
  );
}
