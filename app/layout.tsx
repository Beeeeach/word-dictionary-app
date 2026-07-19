import type { Metadata } from "next";
import "./globals.css";

// 注: フォントは Step 7 前後のデザインフェーズで正式決定する。
// (このサンドボックス環境では Google Fonts への外部アクセスが
//  許可されていないためビルド確認できないので、一旦システムフォントで進める)

export const metadata: Metadata = {
  title: "みんなの言葉辞書",
  description: "面白い単語・びっくりした単語を投稿し、みんなで育てる辞書アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
