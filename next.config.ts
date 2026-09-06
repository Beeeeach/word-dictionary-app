import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Supabase Storage(post-photosバケット)・Googleアカウントのアバター画像を
    // next/image で表示できるようにするための許可リスト。
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  experimental: {
    serverActions: {
      // 写真アップロード(最大5MB, storageバケット側の制限)に対応するため、
      // デフォルトの1MBから引き上げる。フォームの他フィールド分の余裕も見て6MBに設定。
      bodySizeLimit: "6mb",
    },
  },
  // 注: Next.js 16のデフォルトビルダーであるTurbopackには、日本語などの
  // マルチバイト文字を含むコメント・文字列がソースコード中の特定のバイト
  // 位置にあると、コードフレーム生成処理(next-code-frame)がバイトオフセットと
  // 文字境界のずれでパニックし、ビルドが失敗する既知の問題がある
  // (例: "end byte index N is not a char boundary" というエラー)。
  // turbopack: false 等の next.config.ts 側の設定はこの問題を回避できないため
  // (Next.js 16では未サポート)、package.json の build スクリプトで
  // "next build --webpack" を指定し、Turbopackを使わずビルドすることで回避している。
};

export default nextConfig;
