-- ============================================================
-- 言葉の辞書アプリ(DicDic) - 投票機能テーブル作成
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ------------------------------------------------------------
-- 1. postsテーブルにpost_typeを追加
--    既存の"単語投稿"と、新しい"投票投稿"を同じフィード上で扱うため、
--    種別カラムで区別する。投票投稿の場合、word列にはタイトルを入れる。
-- ------------------------------------------------------------
alter table public.posts
  add column if not exists post_type text not null default 'word'
    check (post_type in ('word', 'poll'));

comment on column public.posts.post_type is '投稿種別。word=通常の単語投稿、poll=投票投稿';

-- word列は投票投稿の場合「投票のタイトル」として流用する
-- (企画書のカラム構成を大きく変えずに済ませるための設計判断)

-- ------------------------------------------------------------
-- 2. poll_options: 投票の選択肢
-- ------------------------------------------------------------
create table if not exists public.poll_options (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

comment on table public.poll_options is '投票投稿の選択肢';

create index if not exists idx_poll_options_post_id on public.poll_options(post_id);

-- ------------------------------------------------------------
-- 3. poll_settings: 投票の締切時刻など投票固有の設定
--    postsテーブル自体を汚さないよう別テーブルに分離
-- ------------------------------------------------------------
create table if not exists public.poll_settings (
  post_id uuid primary key references public.posts(id) on delete cascade,
  closes_at timestamptz not null
);

comment on table public.poll_settings is '投票投稿の締切時刻設定';

-- ------------------------------------------------------------
-- 4. poll_votes: 誰がどの選択肢に投票したか
-- ------------------------------------------------------------
create table if not exists public.poll_votes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  option_id uuid not null references public.poll_options(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id) -- 1投稿につき1人1票（単一選択）
);

comment on table public.poll_votes is '投票の記録。1ユーザー1投稿につき1票のみ（単一選択式）。';

create index if not exists idx_poll_votes_option_id on public.poll_votes(option_id);

-- ------------------------------------------------------------
-- RLS設定
-- ------------------------------------------------------------
alter table public.poll_options enable row level security;
alter table public.poll_settings enable row level security;
alter table public.poll_votes enable row level security;

-- 選択肢: 投稿が見える範囲の人なら誰でも閲覧可
create policy "poll_options_select"
on public.poll_options for select
to authenticated, anon
using (
  exists (
    select 1 from public.posts p
    where p.id = post_id
      and (p.visibility = 'public' or p.user_id = auth.uid())
  )
);

-- 選択肢の追加は、投稿者本人が自分の投稿に対してのみ
create policy "poll_options_insert_own_post"
on public.poll_options for insert
to authenticated
with check (
  exists (
    select 1 from public.posts p
    where p.id = post_id and p.user_id = auth.uid()
  )
);

-- 締切設定: 投稿が見える範囲の人なら誰でも閲覧可
create policy "poll_settings_select"
on public.poll_settings for select
to authenticated, anon
using (
  exists (
    select 1 from public.posts p
    where p.id = post_id
      and (p.visibility = 'public' or p.user_id = auth.uid())
  )
);

create policy "poll_settings_insert_own_post"
on public.poll_settings for insert
to authenticated
with check (
  exists (
    select 1 from public.posts p
    where p.id = post_id and p.user_id = auth.uid()
  )
);

-- 投票結果: 投稿が見える範囲の人なら誰でも閲覧可（集計表示のため）
create policy "poll_votes_select"
on public.poll_votes for select
to authenticated, anon
using (
  exists (
    select 1 from public.posts p
    where p.id = post_id
      and (p.visibility = 'public' or p.user_id = auth.uid())
  )
);

-- 投票の追加は本人のみ、かつ締切前のみ許可する
create policy "poll_votes_insert_own_before_deadline"
on public.poll_votes for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.poll_settings ps
    where ps.post_id = poll_votes.post_id
      and ps.closes_at > now()
  )
);
