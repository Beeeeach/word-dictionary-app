-- ============================================================
-- 言葉の辞書アプリ(DicDic) - 通知テーブル作成
-- Supabase SQL Editor で実行してください
-- ============================================================

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade, -- 通知を受け取る人
  actor_id uuid not null references public.users(id) on delete cascade, -- 通知のきっかけを起こした人
  type text not null check (type in ('like', 'reaction', 'comment', 'follow')),
  post_id uuid references public.posts(id) on delete cascade, -- follow通知の場合はnull
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.notifications is 'アプリ内通知。直近5日分のみ保持し、古いものは定期削除される。';

create index if not exists idx_notifications_user_id_created_at
  on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

-- 本人の通知のみ閲覧可能
create policy "notifications_select_own"
on public.notifications for select
to authenticated
using (user_id = auth.uid());

-- 本人の通知のみ既読更新可能
create policy "notifications_update_own"
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ============================================================
-- 5日より古い通知を削除する関数（バッチで定期実行する）
-- ============================================================
create or replace function public.cleanup_old_notifications()
returns void as $$
begin
  delete from public.notifications
  where created_at < now() - interval '5 days';
end;
$$ language plpgsql security definer;
