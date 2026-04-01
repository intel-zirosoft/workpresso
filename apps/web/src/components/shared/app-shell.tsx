"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

import { Header } from "@/components/shared/header";
import { Sidebar } from "@/components/shared/sidebar";
import { isChromelessPath } from "@/components/shared/navigation";
import { FloatingAIAssistant } from "@/features/pod-c/components/floating-ai-assistant";
import { preloadDocumentWorkspace } from "@/features/pod-a/components/document-workspace-entry";
import { MessengerModal } from "@/features/pod-e/components/messenger-modal";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideChrome = isChromelessPath(pathname);

  useEffect(() => {
    if (hideChrome) {
      return;
    }

    let cancelled = false;

    const warmup = () => {
      if (cancelled) {
        return;
      }

      preloadDocumentWorkspace();
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(warmup, { timeout: 1500 });

      return () => {
        cancelled = true;
        window.cancelIdleCallback(idleId);
      };
    }

    const timeoutId = globalThis.setTimeout(warmup, 300);

    return () => {
      cancelled = true;
      globalThis.clearTimeout(timeoutId);
    };
  }, [hideChrome]);

  if (hideChrome) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="relative flex min-h-screen overflow-x-hidden">
      <div className="hidden w-[260px] shrink-0 border-r border-background/50 md:block">
        <Sidebar />
      </div>

      <div className="flex min-h-screen w-full flex-1 flex-col bg-background">
        <Header />
        <main className="flex-1 overflow-y-auto scrollbar-hide">
          <div className="container mx-auto max-w-[1600px] p-4 pb-24 md:p-8 md:pb-8">
            {children}
          </div>
        </main>
      </div>

      <FloatingAIAssistant />
      <MessengerModal />
    </div>
  );
}
