/**
 * DBスキーマに対応する型定義。
 * supabase/01_schema.sql のテーブル構成と一致させている。
 *
 * 本来は `supabase gen types typescript` コマンドで自動生成するのが望ましいが、
 * このプロジェクトはSupabase CLIを直接使わない前提のため手動定義している。
 * テーブル構造を変更した場合は、このファイルも合わせて更新すること。
 *
 * 各テーブルの `Relationships` は、supabase-jsが `select("users:user_id(...)")`
 * のような外部キーJOINを型解決するために必須のプロパティ。
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "posts_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "post_emotion_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "post_emotion_tags_emotion_tag_id_fkey";
            columns: ["emotion_tag_id"];
            isOneToOne: false;
            referencedRelation: "emotion_tags";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "reaction_tags_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reaction_tags_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reaction_tags_emotion_tag_id_fkey";
            columns: ["emotion_tag_id"];
            isOneToOne: false;
            referencedRelation: "emotion_tags";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
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
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
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
  /** 感情タグごとの反応件数の内訳（タグID→件数） */
  reaction_summary?: { emotion_tag: EmotionTag; count: number }[];
  /** 自分が既に反応済みの感情タグID一覧 */
  my_reaction_tag_ids?: number[];
}
