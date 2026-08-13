-- Monkey D. Lucas leaderboards: run once in Supabase SQL Editor.
-- Two boards, hard-capped at 10 rows each by trigger:
--   'kills' = regular-enemy board (value = total kills, extra = accuracy %)
--   'boss'  = boss-fight board    (value = avg tracking %, extra = 0)

create table if not exists public.scores (
  id bigint generated always as identity primary key,
  board text not null check (board in ('kills', 'boss')),
  name text not null check (char_length(name) between 1 and 16),
  value int not null check (value between 1 and 9999),
  extra int not null default 0 check (extra between 0 and 100),
  created_at timestamptz not null default now()
);

alter table public.scores enable row level security;

create policy "public read" on public.scores
  for select using (true);

create policy "public insert" on public.scores
  for insert with check (true);
-- no update/delete policies: nobody can edit or wipe the board

-- after every insert, drop everything outside the top 10 for that board
create or replace function public.trim_scores() returns trigger
language plpgsql security definer as $$
begin
  delete from public.scores s
  where s.board = new.board
    and s.id not in (
      select id from public.scores
      where board = new.board
      order by value desc, extra desc, created_at asc
      limit 10
    );
  return null;
end $$;

create trigger trim_scores_after_insert
  after insert on public.scores
  for each row execute function public.trim_scores();
