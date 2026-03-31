"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_THEME_PREFERENCE,
  DEFAULT_THEME_VISUAL_PRESET,
  applyThemePreference,
  applyThemeVisualPreset,
  getStoredThemePreference,
  getStoredThemeVisualPreset,
  persistThemePreference,
  persistThemeVisualPreset,
  type ResolvedTheme,
  type ThemePreference,
  type ThemeVisualPreset,
} from "@/lib/theme";

type ThemeContextValue = {
  resolvedTheme: ResolvedTheme;
  themePreference: ThemePreference;
  setThemePreference: (theme: ThemePreference) => void;
  themePreset: ThemeVisualPreset;
  setThemePreset: (preset: ThemeVisualPreset) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>(
    DEFAULT_THEME_PREFERENCE,
  );
  const [themePreset, setThemePresetState] = useState<ThemeVisualPreset>(
    DEFAULT_THEME_VISUAL_PRESET,
  );
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedPreference = getStoredThemePreference();
    const storedPreset = getStoredThemeVisualPreset();
    const resolved = applyThemePreference(storedPreference);

    applyThemeVisualPreset(storedPreset);
    setThemePreferenceState(storedPreference);
    setThemePresetState(storedPreset);
    setResolvedTheme(resolved);
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const resolved = applyThemePreference(themePreference);
    applyThemeVisualPreset(themePreset);
    persistThemePreference(themePreference);
    persistThemeVisualPreset(themePreset);
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
      return () =>
        mediaQuery.removeEventListener("change", handleSystemThemeChange);
    }

    mediaQuery.addListener(handleSystemThemeChange);
    return () => mediaQuery.removeListener(handleSystemThemeChange);
  }, [isHydrated, themePreference, themePreset]);

  useEffect(() => {
    if (
      !isHydrated ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    ) {
      return;
    }

    const root = document.documentElement;
    const interactiveSelector = [
      '[data-ui="button"]',
      '[data-ui="input"]',
      '[role="switch"]',
      ".app-shell-header button",
      ".app-shell-header a",
      ".app-shell-sidebar button",
      ".app-shell-sidebar a",
      ".app-shell-panel button",
      ".app-shell-panel a",
    ].join(", ");

    let activeElement: HTMLElement | null = null;

    const clearElement = (element: HTMLElement | null) => {
      if (!element) {
        return;
      }

      element.removeAttribute("data-glass-hovered");
      element.removeAttribute("data-glass-pressed");
      element.style.removeProperty("--glass-pointer-x");
      element.style.removeProperty("--glass-pointer-y");
      element.style.removeProperty("--glass-tilt-x");
      element.style.removeProperty("--glass-tilt-y");
    };

    const setRootPointer = (clientX: number, clientY: number) => {
      const x =
        window.innerWidth > 0 ? (clientX / window.innerWidth) * 100 : 50;
      const y =
        window.innerHeight > 0 ? (clientY / window.innerHeight) * 100 : 50;

      root.style.setProperty("--glass-page-x", `${x.toFixed(2)}%`);
      root.style.setProperty("--glass-page-y", `${y.toFixed(2)}%`);
    };

    const setElementPointer = (
      element: HTMLElement,
      clientX: number,
      clientY: number,
    ) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        return;
      }

      const pointerX = ((clientX - rect.left) / rect.width) * 100;
      const pointerY = ((clientY - rect.top) / rect.height) * 100;
      const tiltX = ((pointerX - 50) / 50) * 5.5;
      const tiltY = ((pointerY - 50) / 50) * 5.5;

      element.dataset.glassHovered = "true";
      element.style.setProperty("--glass-pointer-x", `${pointerX.toFixed(2)}%`);
      element.style.setProperty("--glass-pointer-y", `${pointerY.toFixed(2)}%`);
      element.style.setProperty("--glass-tilt-x", tiltX.toFixed(2));
      element.style.setProperty("--glass-tilt-y", tiltY.toFixed(2));
    };

    const handlePointerMove = (event: PointerEvent) => {
      setRootPointer(event.clientX, event.clientY);

      const target =
        event.target instanceof Element
          ? event.target.closest(interactiveSelector)
          : null;

      if (!(target instanceof HTMLElement)) {
        clearElement(activeElement);
        activeElement = null;
        return;
      }

      if (activeElement && activeElement !== target) {
        clearElement(activeElement);
      }

      activeElement = target;
      setElementPointer(target, event.clientX, event.clientY);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest(interactiveSelector)
          : null;

      if (target instanceof HTMLElement) {
        target.dataset.glassPressed = "true";
      }
    };

    const handlePointerUp = () => {
      if (activeElement) {
        activeElement.removeAttribute("data-glass-pressed");
      }
    };

    const resetPointerState = () => {
      root.style.setProperty("--glass-page-x", "50%");
      root.style.setProperty("--glass-page-y", "24%");
      clearElement(activeElement);
      activeElement = null;
    };

    if (themePreset !== "liquid-glass") {
      root.removeAttribute("data-liquid-glass-motion");
      resetPointerState();
      return;
    }

    root.dataset.liquidGlassMotion = "active";
    root.style.setProperty("--glass-page-x", "50%");
    root.style.setProperty("--glass-page-y", "24%");

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointerleave", resetPointerState);
    window.addEventListener("blur", resetPointerState);

    return () => {
      root.removeAttribute("data-liquid-glass-motion");
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointerleave", resetPointerState);
      window.removeEventListener("blur", resetPointerState);
      resetPointerState();
    };
  }, [isHydrated, themePreset]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      themePreference,
      setThemePreference: setThemePreferenceState,
      themePreset,
      setThemePreset: setThemePresetState,
    }),
    [resolvedTheme, themePreference, themePreset],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}
