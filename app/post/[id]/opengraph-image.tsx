import { ImageResponse } from "next/og";
import { getPostById } from "@/lib/data/posts";

export const alt = "DicDicの投稿";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * 投稿の内容をもとに、SNSシェア用のOG画像を動的生成する。
 * Next.jsの opengraph-image.tsx 規約に従うと、対応するpage.tsxの
 * メタタグ(og:image等)にこの画像が自動で設定される。
 *
 * 注意: Satori(ImageResponseの内部エンジン)はFlexboxのみ対応で、
 * Tailwindのclassは使えないため、すべてインラインstyleで記述する。
 */
export default async function OGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getPostById(id, null);

  const word = post?.word ?? "DicDic";
  const meaning = post?.meaning ?? "";
  const authorName =
    post?.users?.display_name || post?.users?.username || "名無し";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundColor: "#FDFBF4",
        }}
      >
        {/* ブランドロゴ */}
        <div style={{ display: "flex", alignItems: "baseline" }}>
          <span style={{ fontSize: 40, fontWeight: 800, color: "#1C1B29" }}>
            Dic
          </span>
          <span style={{ fontSize: 40, fontWeight: 800, color: "#FF6B4A" }}>
            Dic
          </span>
        </div>

        {/* 単語（メインコンテンツ） */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: "#1C1B29",
              lineHeight: 1.1,
            }}
          >
            {word}
          </div>
          {meaning && (
            <div
              style={{
                fontSize: 36,
                color: "#5A5A6E",
                lineHeight: 1.4,
              }}
            >
              {meaning.length > 60 ? meaning.slice(0, 60) + "…" : meaning}
            </div>
          )}
        </div>

        {/* 投稿者 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            color: "#8B8B9E",
          }}
        >
          {authorName} さんの投稿
        </div>
      </div>
    ),
    { ...size }
  );
}
