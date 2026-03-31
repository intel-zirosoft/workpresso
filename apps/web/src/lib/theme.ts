export const THEME_STORAGE_KEY = "workpresso-theme";
export const THEME_VISUAL_PRESET_STORAGE_KEY = "workpresso-theme-preset";

export const THEME_OPTIONS = ["default", "light", "dark"] as const;
export const THEME_VISUAL_PRESET_OPTIONS = ["classic", "liquid-glass"] as const;

export type ThemePreference = (typeof THEME_OPTIONS)[number];
export type ThemeVisualPreset = (typeof THEME_VISUAL_PRESET_OPTIONS)[number];
export type ResolvedTheme = "light" | "dark";

export const DEFAULT_THEME_PREFERENCE: ThemePreference = "default";
export const DEFAULT_THEME_VISUAL_PRESET: ThemeVisualPreset = "classic";

export const THEME_LABELS: Record<ThemePreference, string> = {
  default: "System",
  light: "Light",
  dark: "Dark",
};

export const THEME_VISUAL_PRESET_LABELS: Record<ThemeVisualPreset, string> = {
  classic: "Classic",
  "liquid-glass": "Liquid Glass",
};

export function isThemePreference(value: string | null | undefined): value is ThemePreference {
  return value === "default" || value === "light" || value === "dark";
}

export function isThemeVisualPreset(value: string | null | undefined): value is ThemeVisualPreset {
  return value === "classic" || value === "liquid-glass";
}

export function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  return preference === "default" ? getSystemTheme() : preference;
}

export function getStoredThemePreference(): ThemePreference {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_PREFERENCE;
  }

  const storedPreference = window.localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(storedPreference) ? storedPreference : DEFAULT_THEME_PREFERENCE;
}

export function getStoredThemeVisualPreset(): ThemeVisualPreset {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_VISUAL_PRESET;
  }

  const storedPreset = window.localStorage.getItem(THEME_VISUAL_PRESET_STORAGE_KEY);
  return isThemeVisualPreset(storedPreset) ? storedPreset : DEFAULT_THEME_VISUAL_PRESET;
}

export function applyResolvedTheme(theme: ResolvedTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function applyThemeVisualPreset(preset: ThemeVisualPreset) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.themePreset = preset;
}

export function applyThemePreference(preference: ThemePreference): ResolvedTheme {
  const resolvedTheme = resolveTheme(preference);
  applyResolvedTheme(resolvedTheme);
  return resolvedTheme;
}

export function persistThemeVisualPreset(preset: ThemeVisualPreset) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_VISUAL_PRESET_STORAGE_KEY, preset);
}

export function persistThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, preference);
}
