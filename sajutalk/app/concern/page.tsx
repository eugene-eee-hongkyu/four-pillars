'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { loadProfile, saveConversation } from '@/lib/session/local-store';

interface Card {
  emoji: string;
  label: string;
  value: string;
}

const CARDS: Card[] = [
  { emoji: '💼', label: '이직·일', value: '이직' },
  { emoji: '💕', label: '연애', value: '연애' },
  { emoji: '💍', label: '결혼', value: '결혼' },
  { emoji: '✏️', label: '직접 쓸게요', value: '직접입력' },
];

export default function ScreenConcern() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    const profile = loadProfile();
    if (!profile) { router.replace('/'); return; }
    setName(profile.name);
  }, [router]);

  async function proceed(concern: string, category?: string) {
    let resolvedCategory = category;
    if (!resolvedCategory) {
      setClassifying(true);
      try {
        const res = await fetch('/api/classify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ concern }),
        });
        const data = await res.json();
        resolvedCategory = data.category;
      } catch {
        resolvedCategory = '기타';
      } finally {
        setClassifying(false);
      }
    }
    saveConversation({ concern, concernCategory: resolvedCategory, pattern: '' });
    router.push('/pattern');
  }

  function handleCardClick(card: Card) {
    if (card.value === '직접입력') {
      setSelected('직접입력');
      return;
    }
    setSelected(card.value);
    proceed(card.label, card.value);
  }

  return (
    <main className="min-h-screen bg-background flex flex-col items-center pt-12 pb-20 px-4">
      <div className="w-full max-w-sm space-y-8">
        <h1 className="text-xl font-semibold">사주톡</h1>

        <p className="text-lg font-medium">
          {name ? `${name}님, ` : ''}지금 어떤 고민이세요?
        </p>

        <div className="space-y-3">
          {CARDS.map((card) => (
            <button
              key={card.value}
              onClick={() => handleCardClick(card)}
              disabled={classifying}
              className={`w-full rounded-xl border p-4 text-left transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring ${
                selected === card.value ? 'border-primary bg-accent' : 'border-border'
              }`}
            >
              <span className="mr-2">{card.emoji}</span>
              {card.label}
              {selected === card.value && card.value === '직접입력' && ' ✓'}
            </button>
          ))}
        </div>

        {selected === '직접입력' && (
          <div className="space-y-3">
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              placeholder="예: 이직을 할지 말지 고민이에요&#10;    만나는 사람과 결혼해도 될지"
              rows={3}
              className="w-full rounded-xl border border-border bg-transparent p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <Button
              className="w-full"
              disabled={!freeText.trim() || classifying}
              onClick={() => proceed(freeText.trim())}
            >
              {classifying ? '읽고 있어요...' : '다음'}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
