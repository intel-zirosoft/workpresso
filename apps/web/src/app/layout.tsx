import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ReactNode } from "react";
import "@/styles/globals.css";
import { Providers } from "@/providers";
import { AppShell } from "@/components/shared/app-shell";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${fredoka.variable} ${nunito.variable}`}
    >
      <body className="font-body bg-background text-text antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
