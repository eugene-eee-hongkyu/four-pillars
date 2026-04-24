'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadProfile, loadConversation, saveConversation } from '@/lib/session/local-store';

type Category = '이직' | '연애' | '결혼' | '기타';

const PATTERN_QUESTIONS: Record<Category, { question: string; options: string[] }> = {
  이직: {
    question: '일과 관련해서 반복되는 게 있나요?',
    options: [
      '잘 되다가 갑자기 그만두고 싶어짐',
      '처음엔 재미있다가 금방 식음',
      '남들은 버티는데 나만 못 버팀',
      '잘 모르겠다',
    ],
  },
  연애: {
    question: '연애에서 반복되는 게 있나요?',
    options: [
      '처음엔 설레는데 시간이 지나면 식음',
      '좋아하다가 막상 잘 되면 도망가고 싶어짐',
      '상대가 너무 집착하거나 너무 멀게 느껴짐',
      '잘 모르겠다',
    ],
  },
  결혼: {
    question: '결혼·파트너십에서 반복되는 게 있나요?',
    options: [
      '중요한 결정 앞에서 늘 망설임',
      '확신이 들다가도 금방 흔들림',
      '주변 의견에 쉽게 휘둘림',
      '잘 모르겠다',
    ],
  },
  기타: {
    question: '삶에서 반복되는 패턴이 있나요?',
    options: [
      '시작은 잘 하는데 끝을 못 맺음',
      '남의 눈치를 많이 봄',
      '원하는 게 뭔지 자주 헷갈림',
      '잘 모르겠다',
    ],
  },
};

export default function ScreenPattern() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('기타');

  useEffect(() => {
    const profile = loadProfile();
    const conversation = loadConversation();
    if (!profile || !conversation) { router.replace('/'); return; }
    setName(profile.name);
    setCategory((conversation.concernCategory as Category) ?? '기타');
  }, [router]);

  function handleSelect(option: string) {
    const conv = loadConversation()!;
    saveConversation({ ...conv, pattern: option });
    router.push('/chat');
  }

  const q = PATTERN_QUESTIONS[category];

  return (
    <main className="min-h-screen bg-background flex flex-col items-center pt-12 pb-20 px-4">
      <div className="w-full max-w-sm space-y-8">
        <h1 className="text-xl font-semibold">사주톡</h1>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">한 가지만 더 여쭤볼게요.</p>
          <p className="text-lg font-medium">{q.question}</p>
        </div>

        <div className="space-y-3">
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              className="w-full rounded-xl border border-border p-4 text-left text-sm transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring active:scale-[0.98]"
            >
              <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">(선택하면 바로 진행돼요)</p>
      </div>
    </main>
  );
}
