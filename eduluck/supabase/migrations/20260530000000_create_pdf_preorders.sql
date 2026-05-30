-- pdf_preorders — mom test Fake Door: PDF 20영역 정식 출시 사전 예약 의향 측정
--
-- 진짜 의향 신호:
--   - 영역 5개 cap 도달 또는 Part2 완료 후 "PDF 사전 예약" CTA 노출
--   - 이름·연락처 입력 + 동의 제출 = 마찰(skin in the game) 통과한 진짜 의향
--
-- mom test 후 출시 시: 이 명단으로 정식 결제 안내 → 실 결제 전환율 측정.

create table public.pdf_preorders (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.sessions(id) on delete set null,
  child_subject_id uuid references public.subjects(id) on delete set null,

  -- 연락처
  name text not null,
  contact text not null,  -- 전화번호 또는 이메일 (free form, 정규식 검증은 client)
  contact_type text not null check (contact_type in ('phone', 'email')),

  -- 트리거 위치 (어디서 사전 예약 의향이 발생했는지)
  source text not null check (source in ('section_cap', 'child_cap', 'part2_bonus', 'premium_pre')),

  -- 진단 메타 (denormalize — 분석 시 join 우회)
  prompt_version text,
  git_sha text,
  grade text,
  gender text,
  hagun_label text,

  -- 동의
  marketing_consent boolean not null default false,

  created_at timestamptz default now()
);

create index pdf_preorders_session_id_idx on public.pdf_preorders(session_id);
create index pdf_preorders_created_at_idx on public.pdf_preorders(created_at desc);
create index pdf_preorders_source_idx on public.pdf_preorders(source);

alter table public.pdf_preorders enable row level security;

create policy anon_insert_pdf_preorders on public.pdf_preorders
  for insert to anon
  with check (true);

create policy auth_select_own_pdf_preorders on public.pdf_preorders
  for select to authenticated
  using (
    session_id in (select id from public.sessions where user_id = auth.uid())
  );
