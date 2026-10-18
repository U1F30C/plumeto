import { useState } from "react";

export type Theme = "light" | "dark";

const storageKey = "plumeto-theme";

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // storage can be unavailable (private mode, blocked site data)
  }
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

// set on <html> right away, so anything reading theme colors sees the new ones
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const theme = initialTheme();
    applyTheme(theme);
    return theme;
  });

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(storageKey, next);
    } catch {
      // not remembering the choice is fine
    }
    setTheme(next);
  }

  return { theme, toggleTheme };
}
