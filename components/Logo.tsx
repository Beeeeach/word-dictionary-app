import Image from "next/image";

const ICON_SIZE = { sm: 20, md: 28, lg: 40 } as const;

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const textSize =
    size === "lg" ? "text-4xl" : size === "sm" ? "text-lg" : "text-2xl";
  const iconPx = ICON_SIZE[size];

  return (
    <span className="inline-flex items-center gap-2">
      {/*
        アイコン画像は public/logo-icon.jpg に配置する。
        ファイルが無い場合は next/image がエラーになるため、
        配置前は下のImageタグごとコメントアウトしておいても良い。
      */}
      <Image
        src="/logo-icon.jpg"
        alt=""
        width={iconPx}
        height={iconPx}
        className="rounded-lg"
        style={{ width: iconPx, height: iconPx }}
      />
      <span className={`brand-wordmark ${textSize} inline-flex items-baseline`}>
        <span style={{ color: "var(--color-ink)" }}>Dic</span>
        <span style={{ color: "var(--color-coral)" }}>Dic</span>
      </span>
    </span>
  );
}

export function BrandHeader({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <div>
      <Logo size="lg" />
      {showTagline && (
        <p
          className="text-sm mt-1 tracking-wide"
          style={{ color: "var(--color-slate)" }}
        >
          コトバを広げるSNS
        </p>
      )}
    </div>
  );
}
