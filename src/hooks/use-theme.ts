import { useEffect, useState } from "react";

export type Theme = "light" | "dark";

const STORAGE_KEY = "superette:theme";

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage indisponible — repli sur la préférence système */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Thème clair/sombre — persiste dans localStorage, respecte la préférence
 * système au premier lancement. Applique/retire la classe `dark` sur
 * `<html>` (voir src/index.css : tous les jetons de couleur sont définis
 * pour `.dark`).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* best-effort */
    }
  }, [theme]);

  function toggle() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return { theme, setTheme, toggle };
}
