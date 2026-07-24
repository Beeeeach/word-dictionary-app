-- ============================================================
-- 言葉の辞書アプリ(DicDic) - 自由記述欄カラム追加
-- Supabase SQL Editor で実行してください
-- ============================================================

alter table public.posts
  add column if not exists note text;

comment on column public.posts.note is '投稿に添える自由記述欄（任意、最大200文字を想定）。意味・文脈とは別枠のひとこと。';
