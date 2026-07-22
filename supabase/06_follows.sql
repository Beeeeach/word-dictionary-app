-- ============================================================
-- 言葉の辞書アプリ(DicDic) - フォロー機能テーブル作成
-- Supabase SQL Editor で実行してください
-- ============================================================

create table if not exists public.follows (
  follower_id uuid not null references public.users(id) on delete cascade,  -- フォローする側
  followee_id uuid not null references public.users(id) on delete cascade,  -- フォローされる側
  created_at timestamptz not null default now(),
  primary key (follower_id, followee_id),
  constraint follows_no_self_follow check (follower_id <> followee_id)
);

comment on table public.follows is 'フォロー関係（follower_idがfollowee_idをフォローしている）';

create index if not exists idx_follows_follower_id on public.follows(follower_id);
create index if not exists idx_follows_followee_id on public.follows(followee_id);

alter table public.follows enable row level security;

-- 誰でもフォロー関係を閲覧できる(フォロワー数などを公開情報として扱う)
create policy "follows_select_all"
on public.follows for select
to authenticated, anon
using (true);

-- フォローの作成は自分自身がfollower_idの場合のみ
create policy "follows_insert_own"
on public.follows for insert
to authenticated
with check (follower_id = auth.uid());

-- フォロー解除も自分自身がfollower_idの場合のみ
create policy "follows_delete_own"
on public.follows for delete
to authenticated
using (follower_id = auth.uid());
