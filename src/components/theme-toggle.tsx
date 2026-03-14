"use client";

import { useSyncExternalStore } from "react";

import {
  defaultThemeMode,
  resolveThemeMode,
  themePreferenceCookieName,
  themePreferenceStorageKey,
  type ThemeMode,
} from "@/lib/theme";

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") {
    return defaultThemeMode;
  }

  return resolveThemeMode(document.documentElement.getAttribute("data-theme"));
}

function subscribeToTheme(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const observer = new MutationObserver(() => {
    callback();
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  return () => {
    observer.disconnect();
  };
}

function writeTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme);
  window.localStorage.setItem(themePreferenceStorageKey, theme);
  document.cookie = `${themePreferenceCookieName}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

type ThemeToggleProps = {
  className?: string;
  initialTheme?: ThemeMode;
};

export function ThemeToggle({ className, initialTheme = defaultThemeMode }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => initialTheme);

  function toggleTheme() {
    writeTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <button
      type="button"
      className={className ? `theme-toggle-btn ${className}` : "theme-toggle-btn"}
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "Dark" : "Light"}
    </button>
  );
}
