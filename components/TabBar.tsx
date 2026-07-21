export function TabBar({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; disabled?: boolean }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex mb-5 border-b-2" style={{ borderColor: "var(--color-line)" }}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            disabled={tab.disabled}
            className={`flex-1 pb-3 text-[15px] font-bold transition-colors ${
              tab.disabled ? "opacity-40" : ""
            }`}
            style={{
              color: isActive ? "var(--color-ink)" : "var(--color-slate-light)",
              borderBottom: isActive
                ? "2px solid var(--color-coral)"
                : "2px solid transparent",
              marginBottom: "-2px",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
