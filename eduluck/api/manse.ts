// POST /api/manse — 만세력 계산 (DB X)
// body: { year, month, day, hour?, minute?, gender, birthCalendar? }
// response: ManseResult (engine.ts 그대로)

import { computeManse } from '../lib/manse/engine';
import { normalizeToSolar } from '../lib/manse/lunar-to-solar';

interface Body {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  gender: 'male' | 'female';
  birthCalendar?: 'solar' | 'lunar';
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const { year, month, day, gender, birthCalendar } = body;
  if (!year || !month || !day || !gender) {
    return Response.json({ error: 'missing required fields' }, { status: 400 });
  }

  // 음력 입력 시 양력 변환
  const solar = normalizeToSolar(birthCalendar ?? 'solar', year, month, day);

  try {
    const result = computeManse({
      year: solar.year,
      month: solar.month,
      day: solar.day,
      hour: body.hour,
      minute: body.minute,
      gender,
    });
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
