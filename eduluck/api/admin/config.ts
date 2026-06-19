// /api/admin/config — 전역 설정 조회·변경 (admin).
//   GET: { config: DeepSectionAccessConfig, allSections } — deep-dive 무료 정책 + 전체 번호
//   PUT: { mode, freeSections, freeCount } → 저장 후 { config }
//
// audit: update_config (PUT 시).

import { verifyAdminRequest, logAdminAction } from '../../lib/admin/auth';
import {
  getDeepSectionAccess,
  setDeepSectionAccess,
  ALL_DEEP_SECTION_NUMBERS,
  type DeepSectionAccessConfig,
} from '../../lib/config/app-config';

export async function GET(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });

  const config = await getDeepSectionAccess(result.sb);
  return Response.json({ config, allSections: ALL_DEEP_SECTION_NUMBERS });
}

export async function PUT(request: Request) {
  const result = await verifyAdminRequest(request, 'admin');
  if (!result.ok) return Response.json({ error: result.error }, { status: result.status });
  const { admin, sb } = result;

  let body: Partial<DeepSectionAccessConfig>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  let config: DeepSectionAccessConfig;
  try {
    config = await setDeepSectionAccess(sb, body, admin.email);
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : 'save failed' },
      { status: 500 },
    );
  }

  await logAdminAction(sb, admin, 'update_config', 'deep_section_access', {
    mode: config.mode,
    freeSections: config.freeSections,
    freeCount: config.freeCount,
  });
  return Response.json({ config });
}
