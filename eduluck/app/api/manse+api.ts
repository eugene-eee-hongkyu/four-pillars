// POST /api/manse — 만세력 계산 (DB X)
// body: { year, month, day, hour?, minute?, gender }
// response: ManseResult (engine.ts 그대로)

import { computeManse } from '@/lib/manse/engine';

interface Body {
  year: number;
  month: number;
  day: number;
  hour?: number;
  minute?: number;
  gender: 'male' | 'female';
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const { year, month, day, gender } = body;
  if (!year || !month || !day || !gender) {
    return Response.json({ error: 'missing required fields' }, { status: 400 });
  }

  try {
    const result = computeManse(body);
    return Response.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown error';
    return Response.json({ error: message }, { status: 500 });
  }
}
