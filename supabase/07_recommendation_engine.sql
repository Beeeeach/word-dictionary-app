-- ============================================================
-- 言葉の辞書アプリ(DicDic) - パーソナライズおすすめアルゴリズム
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ------------------------------------------------------------
-- 1. post_scores: 投稿ごとの基礎スコア(人気度×鮮度)を保持
--    15分ごとにバッチで再計算する(Materialized Viewの代わりに
--    通常テーブル+関数を使うことで、更新タイミングを制御しやすくする)
-- ------------------------------------------------------------
create table if not exists public.post_scores (
  post_id uuid primary key references public.posts(id) on delete cascade,
  base_score double precision not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.post_scores is '投稿ごとの基礎スコア(人気度×時間減衰)。バッチで定期更新される。';

create index if not exists idx_post_scores_base_score on public.post_scores(base_score desc);

-- ------------------------------------------------------------
-- 2. user_tag_affinity: ユーザー×感情タグの好みスコア
-- ------------------------------------------------------------
create table if not exists public.user_tag_affinity (
  user_id uuid not null references public.users(id) on delete cascade,
  emotion_tag_id int not null references public.emotion_tags(id) on delete cascade,
  affinity double precision not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, emotion_tag_id)
);

comment on table public.user_tag_affinity is 'ユーザーごとの感情タグ嗜好スコア。1日1回バッチで再計算される。';

-- ------------------------------------------------------------
-- 3. user_author_affinity: ユーザー×投稿者の好みスコア
-- ------------------------------------------------------------
create table if not exists public.user_author_affinity (
  user_id uuid not null references public.users(id) on delete cascade,
  author_id uuid not null references public.users(id) on delete cascade,
  affinity double precision not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, author_id)
);

comment on table public.user_author_affinity is 'ユーザーごとの投稿者嗜好スコア。1日1回バッチで再計算される。';

-- RLS: どちらも本人のみ閲覧可能(他人の好みプロファイルは非公開情報として扱う)
alter table public.post_scores enable row level security;
alter table public.user_tag_affinity enable row level security;
alter table public.user_author_affinity enable row level security;

create policy "post_scores_select_all"
on public.post_scores for select
to authenticated, anon
using (true);

create policy "user_tag_affinity_select_own"
on public.user_tag_affinity for select
to authenticated
using (user_id = auth.uid());

create policy "user_author_affinity_select_own"
on public.user_author_affinity for select
to authenticated
using (user_id = auth.uid());

-- ============================================================
-- 関数1: recalculate_post_scores()
-- 全投稿のbase_scoreを再計算する。15分ごとにバッチ実行される想定。
--
-- 数式:
--   base_score = (like_count*1.0 + reaction_count*1.2 + comment_count*2.0 + 1)
--                / (経過時間[時間] + 2) ^ 1.5
-- ============================================================
create or replace function public.recalculate_post_scores()
returns void as $$
begin
  insert into public.post_scores (post_id, base_score, updated_at)
  select
    p.id,
    (
      p.like_count * 1.0
      + coalesce(rt.reaction_count, 0) * 1.2
      + p.comment_count * 2.0
      + 1
    ) / power(
        extract(epoch from (now() - p.created_at)) / 3600.0 + 2,
        1.5
      ),
    now()
  from public.posts p
  left join (
    select post_id, count(*) as reaction_count
    from public.reaction_tags
    group by post_id
  ) rt on rt.post_id = p.id
  on conflict (post_id) do update
    set base_score = excluded.base_score,
        updated_at = excluded.updated_at;
end;
$$ language plpgsql security definer;

-- ============================================================
-- 関数2: recalculate_user_affinities()
-- 全ユーザーの tag_affinity / author_affinity を再計算する。
-- 1日1回のバッチ実行を想定(計算コストが高いため頻度を抑える)。
--
-- 重み: いいね=1.0, 反応タグ=1.5, コメント=2.0
-- ============================================================
create or replace function public.recalculate_user_affinities()
returns void as $$
begin
  -- --- tag_affinity の再計算 ---
  truncate table public.user_tag_affinity;

  insert into public.user_tag_affinity (user_id, emotion_tag_id, affinity, updated_at)
  select user_id, emotion_tag_id, sum(weight), now()
  from (
    -- いいねした投稿に付いているタグ(投稿者タグ+反応タグの両方)
    select l.user_id, pet.emotion_tag_id, 1.0 as weight
    from public.likes l
    join public.post_emotion_tags pet on pet.post_id = l.post_id
    union all
    select l.user_id, rt.emotion_tag_id, 1.0 as weight
    from public.likes l
    join public.reaction_tags rt on rt.post_id = l.post_id and rt.user_id = l.user_id

    union all
    -- 自分が反応タグを付けた投稿のタグ
    select rt.user_id, pet.emotion_tag_id, 1.5 as weight
    from public.reaction_tags rt
    join public.post_emotion_tags pet on pet.post_id = rt.post_id
    union all
    select rt.user_id, rt.emotion_tag_id, 1.5 as weight
    from public.reaction_tags rt

    union all
    -- コメントした投稿のタグ
    select c.user_id, pet.emotion_tag_id, 2.0 as weight
    from public.comments c
    join public.post_emotion_tags pet on pet.post_id = c.post_id
  ) all_signals
  group by user_id, emotion_tag_id;

  -- --- author_affinity の再計算 ---
  truncate table public.user_author_affinity;

  insert into public.user_author_affinity (user_id, author_id, affinity, updated_at)
  select user_id, author_id, sum(weight), now()
  from (
    select l.user_id, p.user_id as author_id, 1.0 as weight
    from public.likes l
    join public.posts p on p.id = l.post_id
    where p.user_id <> l.user_id -- 自分の投稿への自分の行動は好み計算から除外

    union all
    select rt.user_id, p.user_id as author_id, 1.5 as weight
    from public.reaction_tags rt
    join public.posts p on p.id = rt.post_id
    where p.user_id <> rt.user_id

    union all
    select c.user_id, p.user_id as author_id, 2.0 as weight
    from public.comments c
    join public.posts p on p.id = c.post_id
    where p.user_id <> c.user_id
  ) all_signals
  group by user_id, author_id;
end;
$$ language plpgsql security definer;
