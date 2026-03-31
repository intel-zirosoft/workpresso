import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ReactNode } from "react";
import "@/styles/globals.css";
import { Providers } from "@/providers";
import { AppShell } from "@/components/shared/app-shell";
import {
  THEME_STORAGE_KEY,
  THEME_VISUAL_PRESET_STORAGE_KEY,
} from "@/lib/theme";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  weight: ["500", "600"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "WorkPresso",
  description: "부드럽고 신뢰할 수 있는 협업 공간",
};

const themeInitScript = `
  (function() {
    try {
      var stored = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      var storedPreset = window.localStorage.getItem('${THEME_VISUAL_PRESET_STORAGE_KEY}');
      var preference =
        stored === 'light' || stored === 'dark' || stored === 'default'
          ? stored
          : 'default';
      var preset = storedPreset === 'liquid-glass' || storedPreset === 'classic'
        ? storedPreset
        : 'classic';
      var resolved =
        preference === 'default'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : preference;

      document.documentElement.dataset.theme = resolved;
      document.documentElement.dataset.themePreset = preset;
      document.documentElement.style.colorScheme = resolved;
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.dataset.themePreset = 'classic';
      document.documentElement.style.colorScheme = 'light';
    }
  })();
`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${fredoka.variable} ${nunito.variable}`}
    >
      <body className="bg-background font-body text-text antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
