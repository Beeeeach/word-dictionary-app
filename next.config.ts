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
};

export default nextConfig;
