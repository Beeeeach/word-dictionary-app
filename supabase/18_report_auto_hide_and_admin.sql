-- ============================================================
-- 言葉の辞書アプリ(DicDic) - 通報の自動非表示・管理者フラグ
-- supabase/17_reports_and_blocks.sql (reports/blocksテーブル) の後に実行してください。
-- ============================================================

-- ------------------------------------------------------------
-- 1. posts / comments に is_hidden を追加
--    3件以上通報されたら自動でtrueになり、フィード等から一時的に隠す。
--    管理者が「問題なし」と判断した場合は手動でfalseに戻す（却下操作）。
-- ------------------------------------------------------------
alter table public.posts
  add column if not exists is_hidden boolean not null default false;

alter table public.comments
  add column if not exists is_hidden boolean not null default false;

comment on column public.posts.is_hidden is '3件以上通報されると自動でtrueになり、一覧から一時非表示になる。管理者が却下すると手動でfalseに戻せる。';
comment on column public.comments.is_hidden is '3件以上通報されると自動でtrueになり、一覧から一時非表示になる。管理者が却下すると手動でfalseに戻せる。';

-- ------------------------------------------------------------
-- 2. 通報が入るたびに自動集計し、しきい値(3件)を超えたら is_hidden = true にするトリガー。
--    運営の判断を待たずに一時的に隠すことで、被害の拡大を素早く抑える。
--    実際の削除は管理者が /admin から手動で行う想定（このトリガーは非表示化のみ）。
-- ------------------------------------------------------------
create or replace function public.auto_hide_on_report_threshold()
returns trigger as $$
declare
  report_count integer;
  threshold constant integer := 3;
begin
  if new.target_type = 'post' and new.target_post_id is not null then
    select count(*) into report_count
    from public.reports
    where target_type = 'post' and target_post_id = new.target_post_id;

    if report_count >= threshold then
      update public.posts set is_hidden = true where id = new.target_post_id;
    end if;
  elsif new.target_type = 'comment' and new.target_comment_id is not null then
    select count(*) into report_count
    from public.reports
    where target_type = 'comment' and target_comment_id = new.target_comment_id;

    if report_count >= threshold then
      update public.comments set is_hidden = true where id = new.target_comment_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_auto_hide_on_report on public.reports;
create trigger trg_auto_hide_on_report
  after insert on public.reports
  for each row execute function public.auto_hide_on_report_threshold();

-- ------------------------------------------------------------
-- 3. users.is_admin: 管理画面(/admin)へのアクセス判定に使う簡易フラグ。
--    今回は「特定ユーザーIDを手動で登録する」運用のため、
--    このマイグレーション自体はデフォルトfalseのカラム追加のみ行い、
--    実際にどのユーザーを管理者にするかはSupabase側で直接
--    update文を実行して設定する(下にコメントでサンプルを残す)。
-- ------------------------------------------------------------
alter table public.users
  add column if not exists is_admin boolean not null default false;

comment on column public.users.is_admin is '管理画面(/admin)にアクセスできるユーザーかどうか。Supabase側で手動でtrueに設定する運用。';

-- 管理者を設定する例（実行者が自分のuser_idに置き換えて別途実行すること）:
-- update public.users set is_admin = true where id = '実際のUUID';
