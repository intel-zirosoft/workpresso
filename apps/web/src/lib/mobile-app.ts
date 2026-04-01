"use client";

declare global {
  interface Window {
    ReactNativeWebView?: unknown;
    WorkPressoMobile?: unknown;
  }
}

export function isEmbeddedMobileApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(window.ReactNativeWebView || window.WorkPressoMobile);
}
