-- ============================================================
-- 言葉の辞書アプリ - 英語学習者モード
-- ============================================================
-- learner_mode = true のユーザーには:
--   1. フィード・検索・自分の辞書等で、英語の投稿(単語がアルファベットのみ)
--      のみを表示する（lib/utils/language.ts の isAlphabeticWord() で判定）。
--   2. アプリ全体のUIを英語表示に切り替える（lib/i18n/ 参照）。
-- 端末をまたいで設定を保持するため、ローカルストレージではなくDBに保存する。

alter table public.users
  add column if not exists learner_mode boolean not null default false;
