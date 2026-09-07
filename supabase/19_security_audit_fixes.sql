-- ============================================================
-- 言葉の辞書アプリ(DicDic) - セキュリティ監査による修正
-- 実行順序: これまでのマイグレーション(15〜18番)の後に実行してください。
-- ============================================================

-- ------------------------------------------------------------
-- 1. users.is_admin の権限昇格防止
--
-- 問題: users_update_own ポリシーは「本人の行のみ更新可」までしか
-- 制御しておらず、is_admin や learner_mode を含め、どのカラムを
-- 変更してよいかまでは制限していない。
-- そのため、publishable key を持つ悪意あるクライアントが
-- supabase.from('users').update({ is_admin: true }) を直接呼べば、
-- RLS上は通ってしまい、誰でも自分を管理者に昇格できてしまう。
--
-- 対策: BEFORE UPDATE トリガーで、リクエストがservice_role(管理者用の
-- secret keyクライアント)経由でない限り、is_adminの値を「変更前のまま」
-- に強制的に上書きする。これにより、一般ユーザーのUPDATEでは
-- is_adminがどんな値を送ってきても実質的に無視される。
-- （admin付与はSupabase側で直接UPDATEするか、service_role経由の
-- 処理からのみ行う運用のため、この制限と矛盾しない）
-- ------------------------------------------------------------
create or replace function public.prevent_self_admin_escalation()
returns trigger as $$
begin
  -- service_role(secret key)からの呼び出しはauth.role()が'service_role'になるため、
  -- その場合のみis_adminの変更を許可する。
  if auth.role() <> 'service_role' then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_prevent_self_admin_escalation on public.users;
create trigger trg_prevent_self_admin_escalation
  before update on public.users
  for each row execute function public.prevent_self_admin_escalation();

-- ------------------------------------------------------------
-- 2. reports テーブルの管理者向けアクセス
--
-- 問題: reports_select_own は reporter_id = auth.uid() のみを許可しており、
-- 管理画面(/admin, lib/actions/admin.ts)が通常のcookieベースクライアントで
-- 全通報を取得しようとしても、自分が出した通報以外は見えず機能しない。
--
-- 対策: is_admin = true のユーザーには全件のSELECTを許可するポリシーを追加する。
-- status の UPDATE (却下操作)も同様に管理者に許可する。
-- ------------------------------------------------------------
drop policy if exists reports_select_admin on public.reports;
create policy reports_select_admin
on public.reports for select
to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
);

drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin
on public.reports for update
to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
);

-- ------------------------------------------------------------
-- 3. 管理者による posts / comments の is_hidden 復元・削除を
--    自身のセッションから直接行えるようにするポリシー。
--    削除操作(lib/actions/admin.ts の deleteReportedContent)は
--    取り消しがきかないため、引き続きservice_role(secret key)経由で
--    実行する運用のままにするが、ポリシー自体はここで用意しておく。
--    却下操作(dismissReport, is_hiddenの復元)は通常セッションのRLS経由に変更する。
-- ------------------------------------------------------------
drop policy if exists posts_update_admin on public.posts;
create policy posts_update_admin
on public.posts for update
to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
);

drop policy if exists comments_update_admin on public.comments;
create policy comments_update_admin
on public.comments for update
to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
)
with check (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
);

drop policy if exists posts_delete_admin on public.posts;
create policy posts_delete_admin
on public.posts for delete
to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
);

drop policy if exists comments_delete_admin on public.comments;
create policy comments_delete_admin
on public.comments for delete
to authenticated
using (
  exists (
    select 1 from public.users
    where users.id = auth.uid() and users.is_admin = true
  )
);

-- ------------------------------------------------------------
-- 4. follows テーブルに自己フォロー防止のDB制約を追加
--
-- 問題: 自分自身をフォローできないチェックは lib/actions/follows.ts の
-- toggleFollow内でのみ行われており、DB側には制約がない。
-- アプリのコードを経由しない直接のINSERT(誤操作・将来の実装ミス・
-- クライアントからの直接呼び出し等)でも自己フォローが成立しうるため、
-- blocksテーブルと同様にDBレベルでも防止する。
-- ------------------------------------------------------------
alter table public.follows
  drop constraint if exists follows_no_self_follow;

alter table public.follows
  add constraint follows_no_self_follow check (follower_id <> followee_id);
