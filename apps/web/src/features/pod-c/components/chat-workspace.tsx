"use client";

import { useSearchParams } from "next/navigation";

import { useEmbeddedMobileApp } from "@/lib/mobile-app";
import { ChatPanel } from "@/features/pod-c/components/chat-panel";
import { MobileChatWorkspace } from "@/features/pod-c/components/mobile-chat-workspace";

export function ChatWorkspace() {
  const searchParams = useSearchParams();
  const isEmbeddedMobile = useEmbeddedMobileApp();
  const mobile = searchParams.get("mobile") === "1";
  const context = searchParams.get("context");

  if (isEmbeddedMobile || mobile || context === "work") {
    return <MobileChatWorkspace />;
  }

  return <ChatPanel />;
}
