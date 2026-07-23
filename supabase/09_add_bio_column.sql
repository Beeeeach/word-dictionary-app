-- ============================================================
-- 言葉の辞書アプリ(DicDic) - 自己紹介文カラム追加
-- Supabase SQL Editor で実行してください
-- ============================================================

alter table public.users
  add column if not exists bio text;

comment on column public.users.bio is 'プロフィールの自己紹介文（任意、最大160文字を想定）';
