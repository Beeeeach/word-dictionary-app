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

/**
 * 投稿者が付けるタグ（post_emotion_tags経由）のカテゴリ。
 * supabase/15_emotion_tags_categories.sql で投入するタグは必ずこの
 * いずれかに属する。閲覧者の反応タグ(reaction_tags)用の従来タグは
 * category = null のまま。
 */
export type EmotionTagCategory =
  | "theme"
  | "emotion"
  | "purpose"
  | "mood"
  | "format"
  | "target"
  | "scene";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          current_streak: number;
          longest_streak: number;
          last_posted_date: string | null;
          /**
           * 英語学習者モード。true の場合:
           *  - フィード等でアルファベットのみの投稿(英語投稿)だけが表示される
           *  - アプリ全体のUIが英語表示になる
           * (lib/i18n/, lib/utils/language.ts 参照)
           */
          learner_mode: boolean;
          /** 管理画面(/admin)へのアクセス可否。Supabase側で手動設定する運用 */
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          learner_mode?: boolean;
        };
        Update: {
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          learner_mode?: boolean;
          is_admin?: boolean;
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
          note: string | null;
          visibility: Visibility;
          post_type: "word" | "poll";
          like_count: number;
          comment_count: number;
          /** 3件以上通報されると自動でtrueになり、一覧から一時非表示になる */
          is_hidden: boolean;
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
          note?: string | null;
          visibility?: Visibility;
          post_type?: "word" | "poll";
        };
        Update: {
          word?: string;
          meaning?: string | null;
          context?: string | null;
          photo_url?: string | null;
          note?: string | null;
          visibility?: Visibility;
          post_type?: "word" | "poll";
          is_hidden?: boolean;
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
          /**
           * 投稿者向けカテゴリタグの場合はカテゴリ名、
           * 閲覧者の反応タグ（従来の絵文字タグ）の場合は null。
           */
          category: EmotionTagCategory | null;
          /**
           * 英語学習者モードでの表示用英訳。カテゴリタグにのみ設定され、
           * 閲覧者の反応タグ(category = null)では null。
           */
          name_en: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          emoji?: string | null;
          sort_order?: number;
          category?: EmotionTagCategory | null;
          name_en?: string | null;
        };
        Update: {
          name?: string;
          emoji?: string | null;
          sort_order?: number;
          category?: EmotionTagCategory | null;
          name_en?: string | null;
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
          /** 3件以上通報されると自動でtrueになり、一覧から一時非表示になる */
          is_hidden: boolean;
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
          is_hidden?: boolean;
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
      follows: {
        Row: {
          follower_id: string;
          followee_id: string;
          created_at: string;
        };
        Insert: {
          follower_id: string;
          followee_id: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey";
            columns: ["follower_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "follows_followee_id_fkey";
            columns: ["followee_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          actor_id: string;
          type: "like" | "reaction" | "comment" | "follow";
          post_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          actor_id: string;
          type: "like" | "reaction" | "comment" | "follow";
          post_id?: string | null;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      poll_options: {
        Row: {
          id: string;
          post_id: string;
          label: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          post_id: string;
          label: string;
          sort_order?: number;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "poll_options_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      poll_settings: {
        Row: {
          post_id: string;
          closes_at: string;
        };
        Insert: {
          post_id: string;
          closes_at: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "poll_settings_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: true;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
        ];
      };
      poll_votes: {
        Row: {
          post_id: string;
          user_id: string;
          option_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          option_id: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "poll_votes_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "poll_votes_option_id_fkey";
            columns: ["option_id"];
            isOneToOne: false;
            referencedRelation: "poll_options";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          target_type: "post" | "comment" | "user";
          target_post_id: string | null;
          target_comment_id: string | null;
          target_user_id: string | null;
          reason: "spam" | "harassment" | "inappropriate" | "hate_speech" | "other";
          detail: string | null;
          status: "pending" | "reviewed" | "dismissed";
          created_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          target_type: "post" | "comment" | "user";
          target_post_id?: string | null;
          target_comment_id?: string | null;
          target_user_id?: string | null;
          reason: "spam" | "harassment" | "inappropriate" | "hate_speech" | "other";
          detail?: string | null;
          status?: "pending" | "reviewed" | "dismissed";
        };
        Update: {
          status?: "pending" | "reviewed" | "dismissed";
        };
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_post_id_fkey";
            columns: ["target_post_id"];
            isOneToOne: false;
            referencedRelation: "posts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_comment_id_fkey";
            columns: ["target_comment_id"];
            isOneToOne: false;
            referencedRelation: "comments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      blocks: {
        Row: {
          blocker_id: string;
          blocked_id: string;
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_id: string;
        };
        Update: Record<string, never>;
        Relationships: [
          {
            foreignKeyName: "blocks_blocker_id_fkey";
            columns: ["blocker_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blocks_blocked_id_fkey";
            columns: ["blocked_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_personalized_feed: {
        Args: {
          viewer_id: string;
          page_size: number;
          page_offset: number;
        };
        Returns: {
          post_id: string;
          final_score: number;
        }[];
      };
      recalculate_post_scores: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      recalculate_user_affinities: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      cleanup_old_notifications: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      update_user_streak: {
        Args: { target_user_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// よく使う複合型（JOIN結果など）はここに追記していく
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type UserProfile = Database["public"]["Tables"]["users"]["Row"];
export type EmotionTag = Database["public"]["Tables"]["emotion_tags"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];

/** 投票の選択肢＋得票数（結果表示・投票UI共通で使う） */
export interface PollOptionWithVotes {
  id: string;
  label: string;
  sort_order: number;
  vote_count: number;
}

/** フィード表示用: 投稿者情報・感情タグ・自分のいいね状態を含む拡張型 */
export interface PostWithRelations extends Post {
  users: Pick<UserProfile, "id" | "username" | "display_name" | "avatar_url">;
  post_emotion_tags: { emotion_tags: EmotionTag }[];
  liked_by_me?: boolean;
  /** 感情タグごとの反応件数の内訳（タグID→件数） */
  reaction_summary?: { emotion_tag: EmotionTag; count: number }[];
  /** 自分が既に反応済みの感情タグID一覧 */
  my_reaction_tag_ids?: number[];
  /** post_type = 'poll' の場合のみ入る投票情報 */
  poll?: {
    closesAt: string;
    options: PollOptionWithVotes[];
    myVoteOptionId: string | null;
    totalVotes: number;
  };
}
