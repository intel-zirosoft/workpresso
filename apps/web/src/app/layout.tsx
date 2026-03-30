import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { ReactNode } from "react";
import "@/styles/globals.css";
import { FloatingAIAssistant } from "@/features/pod-c/components/floating-ai-assistant";
import { Providers } from "@/providers";
import { Sidebar } from "@/components/shared/sidebar";
import { Header } from "@/components/shared/header";

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
          <div className="flex min-h-screen relative overflow-x-hidden">
            <div className="hidden md:block w-[260px] shrink-0 border-r border-background/50">
              <Sidebar />
            </div>

            <div className="flex-1 flex flex-col min-h-screen bg-background w-full">
              <Header />
              <main className="flex-1 overflow-y-auto w-full">
                <div className="container mx-auto max-w-[1600px] p-4 md:p-8">
                  {children}
                </div>
              </main>
            </div>

            <FloatingAIAssistant />
          </div>
        </Providers>
      </body>
    </html>
  );
}
