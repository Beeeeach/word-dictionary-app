/**
 * DBスキーマに対応する型定義。
 * supabase/01_schema.sql のテーブル構成と一致させている。
 *
 * 本来は `supabase gen types typescript` コマンドで自動生成するのが望ましいが、
 * このプロジェクトはSupabase CLIを直接使わない前提のため手動定義している。
 * テーブル構造を変更した場合は、このファイルも合わせて更新すること。
 */

export type Visibility = "public" | "private";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
        };
      };
      posts: {
        Row: {
          id: string;
          user_id: string;
          word: string;
          meaning: string | null;
          context: string | null;
          photo_url: string | null;
          visibility: Visibility;
          like_count: number;
          comment_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          word: string;
          meaning?: string | null;
          context?: string | null;
          photo_url?: string | null;
          visibility?: Visibility;
        };
        Update: {
          word?: string;
          meaning?: string | null;
          context?: string | null;
          photo_url?: string | null;
          visibility?: Visibility;
        };
      };
      emotion_tags: {
        Row: {
          id: number;
          name: string;
          emoji: string | null;
          sort_order: number;
        };
        Insert: {
          id?: number;
          name: string;
          emoji?: string | null;
          sort_order?: number;
        };
        Update: {
          name?: string;
          emoji?: string | null;
          sort_order?: number;
        };
      };
      post_emotion_tags: {
        Row: {
          post_id: string;
          emotion_tag_id: number;
        };
        Insert: {
          post_id: string;
          emotion_tag_id: number;
        };
        Update: Record<string, never>;
      };
      reaction_tags: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          emotion_tag_id: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          emotion_tag_id: number;
        };
        Update: Record<string, never>;
      };
      likes: {
        Row: {
          post_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
        };
        Update: Record<string, never>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          user_id: string;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          post_id: string;
          user_id: string;
          body: string;
        };
        Update: {
          body?: string;
        };
      };
    };
  };
}

// よく使う複合型（JOIN結果など）はここに追記していく
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type EmotionTag = Database["public"]["Tables"]["emotion_tags"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];

/** フィード表示用: 投稿者情報・感情タグ・自分のいいね状態を含む拡張型 */
export interface PostWithRelations extends Post {
  users: Pick<UserProfile, "id" | "username" | "display_name" | "avatar_url">;
  post_emotion_tags: { emotion_tags: EmotionTag }[];
  liked_by_me?: boolean;
}
