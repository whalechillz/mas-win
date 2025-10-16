-- short_links 테이블 및 함수 (Supabase에서 실행)
create table if not exists public.short_links (
  id bigserial primary key,
  code varchar(16) unique not null,
  target_url text not null,
  utm jsonb,
  expires_at timestamptz,
  click_count bigint default 0,
  created_at timestamptz default now()
);

-- 클릭 카운트 증가 함수
create or replace function public.increment_click_count(p_code varchar)
returns void
language plpgsql
as $$
begin
  update public.short_links set click_count = coalesce(click_count,0) + 1 where code = p_code;
end;
$$;

-- 인덱스
create index if not exists idx_short_links_code on public.short_links(code);



