-- ============================================================
-- 言葉の辞書アプリ(DicDic) - パーソナライズフィード取得関数
-- Supabase SQL Editor で実行してください（07の後）
-- ============================================================

-- ============================================================
-- 関数: get_personalized_feed(viewer_id, page_size, page_offset)
-- 事前計算済みの base_score と、ユーザーの好み(affinity)を掛け合わせて
-- 最終スコア順に投稿IDを返す。重い計算は行わず、事前計算済みの値を
-- 参照するだけなので、投稿数が増えても高速に動作する。
--
-- 数式:
--   personal_multiplier = 1
--     + Σ_tag∈投稿のタグ ( tag_affinity[tag] * 0.3 )
--     + author_affinity[投稿者] * 0.5
--   final_score = base_score * personal_multiplier
-- ============================================================
create or replace function public.get_personalized_feed(
  viewer_id uuid,
  page_size int,
  page_offset int
)
returns table (post_id uuid, final_score double precision) as $$
begin
  return query
  select
    p.id,
    coalesce(ps.base_score, 0) * (
      1
      + coalesce((
          select sum(uta.affinity * 0.3)
          from public.post_emotion_tags pet
          join public.user_tag_affinity uta
            on uta.emotion_tag_id = pet.emotion_tag_id
            and uta.user_id = viewer_id
          where pet.post_id = p.id
        ), 0)
      + coalesce((
          select uaa.affinity * 0.5
          from public.user_author_affinity uaa
          where uaa.user_id = viewer_id and uaa.author_id = p.user_id
        ), 0)
    ) as final_score
  from public.posts p
  left join public.post_scores ps on ps.post_id = p.id
  where p.visibility = 'public' or p.user_id = viewer_id
  order by final_score desc
  limit page_size
  offset page_offset;
end;
$$ language plpgsql security definer stable;
