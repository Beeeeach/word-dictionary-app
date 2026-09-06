import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getCurrentUser, getCurrentUserProfile } from "@/lib/supabase/current-user";
import { OneSignalInit } from "@/components/OneSignalInit";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { InstallPrompt } from "@/components/InstallPrompt";

// 注: フォントは Step 7 前後のデザインフェーズで正式決定する。
// (このサンドボックス環境では Google Fonts への外部アクセスが
//  許可されていないためビルド確認できないので、一旦システムフォントで進める)

export const metadata: Metadata = {
  title: "DicDic | コトバを広げるSNS",
  description: "面白い単語・びっくりした単語を投稿し、みんなで育てる言葉の辞書SNS「DicDic」",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "DicDic",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1b29",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  // 英語学習者モードがオンの場合、html lang属性も "en" に切り替える
  // (アクセシビリティ・SEO上、表示言語とlang属性を一致させるため)
  const profile = await getCurrentUserProfile();
  const learnerMode = profile?.learner_mode ?? false;

  return (
    <html lang={learnerMode ? "en" : "ja"} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <OneSignalInit userId={user?.id ?? null} />
        <ServiceWorkerRegister />
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
