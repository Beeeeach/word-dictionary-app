-- ============================================================
-- 言葉の辞書アプリ(DicDic) - アバター画像用Storageバケット設定
-- Supabase SQL Editor で実行してください
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB（アイコンなので投稿写真より小さめに制限）
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- 誰でも閲覧可能（公開バケット）
create policy "avatars_select_all"
on storage.objects for select
to authenticated, anon
using (bucket_id = 'avatars');

-- アップロードは自分のフォルダにのみ（post-photosと同じパターン）
create policy "avatars_insert_own_folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 更新も自分のフォルダのみ（アイコン差し替え時にupsertするため）
create policy "avatars_update_own_folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- 削除も自分のフォルダのみ
create policy "avatars_delete_own_folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);
