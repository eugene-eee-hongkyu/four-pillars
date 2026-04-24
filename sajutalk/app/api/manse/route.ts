// 만세력 계산 엔드포인트
// POST { year, month, day, hour?, minute?, gender } → ManseResult

import { NextRequest, NextResponse } from 'next/server';
import { computeManse } from '@/lib/manse/engine';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { year, month, day, hour, minute, gender } = body;

  if (!year || !month || !day || !gender) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }

  try {
    const result = computeManse({ year, month, day, hour, minute, gender });
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
