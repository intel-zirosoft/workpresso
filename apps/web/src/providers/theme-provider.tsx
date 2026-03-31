"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_THEME_PREFERENCE,
  applyThemePreference,
  getStoredThemePreference,
  persistThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  resolvedTheme: ResolvedTheme;
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(DEFAULT_THEME_PREFERENCE);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedPreference = getStoredThemePreference();
    const resolved = applyThemePreference(storedPreference);

    setThemePreferenceState(storedPreference);
    setResolvedTheme(resolved);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const resolved = applyThemePreference(themePreference);
    persistThemePreference(themePreference);
    setResolvedTheme(resolved);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      if (themePreference !== "default") {
        return;
      }

      setResolvedTheme(applyThemePreference("default"));
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleSystemThemeChange);
      return () => mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }

    mediaQuery.addListener(handleSystemThemeChange);
    return () => mediaQuery.removeListener(handleSystemThemeChange);
  }, [isHydrated, themePreference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      themePreference,
      setThemePreference: setThemePreferenceState,
    }),
    [resolvedTheme, themePreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
