-- ============================================================
-- 言葉の辞書アプリ(DicDic) - 連続投稿記録(ストリーク)機能
-- Supabase SQL Editor で実行してください
-- ============================================================

alter table public.users
  add column if not exists current_streak int not null default 0,
  add column if not exists longest_streak int not null default 0,
  add column if not exists last_posted_date date;

comment on column public.users.current_streak is '現在の連続投稿日数';
comment on column public.users.longest_streak is '自己ベストの連続投稿日数';
comment on column public.users.last_posted_date is '最後に投稿した日付(日本時間の日付ベース)';

-- ============================================================
-- 関数: update_user_streak(user_id)
-- 投稿が作成されるたびに呼び出し、ストリークを更新する。
--
-- ロジック:
--   - 今日すでに投稿済み(last_posted_date = 今日) -> 何もしない
--   - 前回の投稿が「昨日」だった -> current_streak + 1
--   - それ以外(2日以上空いた、または初投稿) -> current_streak を 1 にリセット
--   - longest_streak は current_streak の過去最大値を保持する
--
-- 日付は日本時間(JST, UTC+9)を基準にする。Supabaseのnow()はUTCのため、
-- +9時間した上でdateにキャストして「日本時間の今日」を求めている。
-- ============================================================
create or replace function public.update_user_streak(target_user_id uuid)
returns void as $$
declare
  today date;
  last_date date;
  current_count int;
  longest_count int;
begin
  today := (now() at time zone 'utc' + interval '9 hours')::date;

  select last_posted_date, current_streak, longest_streak
  into last_date, current_count, longest_count
  from public.users
  where id = target_user_id;

  if last_date = today then
    -- 今日すでに投稿済みなら何もしない
    return;
  elsif last_date = today - interval '1 day' then
    current_count := current_count + 1;
  else
    current_count := 1;
  end if;

  if current_count > longest_count then
    longest_count := current_count;
  end if;

  update public.users
  set
    current_streak = current_count,
    longest_streak = longest_count,
    last_posted_date = today
  where id = target_user_id;
end;
$$ language plpgsql security definer;
