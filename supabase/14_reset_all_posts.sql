-- ============================================================
-- 言葉の辞書アプリ(DicDic) - 全投稿リセットSQL
-- Supabase SQL Editor で実行してください
--
-- ⚠️ 注意: このSQLは全ユーザーの投稿・いいね・コメント・反応・
--          投票・通知・スコアデータを完全に削除します。元に戻せません。
--          実行前に本当にリセットしたいか確認してください。
-- ============================================================

-- postsを削除すると、以下は on delete cascade により自動的に連鎖削除される:
--   post_emotion_tags, reaction_tags, likes, comments,
--   poll_options, poll_settings, poll_votes, post_scores,
--   notifications(post_idを参照するもの)
delete from public.posts;

-- ユーザーごとのストリーク記録もリセットしたい場合は以下も実行する
-- (投稿が無くなった状態に合わせてストリークも0に戻す)
update public.users
set current_streak = 0,
    longest_streak = 0,
    last_posted_date = null;

-- ユーザーごとの好み分析データもリセットする
-- (投稿・反応データが無くなったため、古い好みデータを残す意味がないため)
truncate table public.user_tag_affinity;
truncate table public.user_author_affinity;
