"use client";

import { useTheme, type Theme } from "@/lib/theme";

const THEMES: { value: Theme; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Clean and bright" },
  { value: "dim", label: "Dim", description: "Easy on the eyes" },
  { value: "dark", label: "Dark", description: "For night owls" },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-3">
      {THEMES.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => setTheme(t.value)}
          className={`flex-1 rounded-lg border-2 p-3 text-left transition-colors ${
            theme === t.value
              ? "border-[var(--accent)] bg-[var(--accent-light)]"
              : "border-[var(--border)] hover:border-[var(--border-strong)]"
          }`}
        >
          <span className="block text-sm font-medium text-[var(--text-primary)]">
            {t.label}
          </span>
          <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
            {t.description}
          </span>
        </button>
      ))}
    </div>
  );
}
