export type ThemeMode = "dark" | "light";

export const themePreferenceCookieName = "redstone-ui-theme";
export const themePreferenceStorageKey = "redstone-ui-theme";

export function resolveThemeMode(value: string | null | undefined): ThemeMode {
  return value === "light" ? "light" : "dark";
}
