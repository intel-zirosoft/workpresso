"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    ReactNativeWebView?: unknown;
    WorkPressoMobile?: unknown;
  }
}

export const EMBEDDED_MOBILE_APP_ATTRIBUTE = "data-workpresso-mobile-app";

export function isEmbeddedMobileApp() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(
    window.ReactNativeWebView ||
      window.WorkPressoMobile ||
      document.documentElement.getAttribute(EMBEDDED_MOBILE_APP_ATTRIBUTE) ===
        "true",
  );
}

export function useEmbeddedMobileApp() {
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    const sync = () => {
      setEmbedded(isEmbeddedMobileApp());
    };

    sync();
    window.addEventListener("workpresso:bridge-ready", sync);

    return () => {
      window.removeEventListener("workpresso:bridge-ready", sync);
    };
  }, []);

  return embedded;
}
