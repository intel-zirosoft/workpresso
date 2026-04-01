"use client";

import { useSearchParams } from "next/navigation";

import { useEmbeddedMobileApp } from "@/lib/mobile-app";
import { MobileChatterWorkspace } from "@/features/pod-e/components/mobile-chatter-workspace";
import { MessengerWorkspace } from "@/features/pod-e/components/messenger-workspace";

export function ChatterWorkspace() {
  const searchParams = useSearchParams();
  const isEmbeddedMobile = useEmbeddedMobileApp();
  const mobile = searchParams.get("mobile") === "1";
  const view = searchParams.get("view");

  if (isEmbeddedMobile || mobile || view === "inbox") {
    return (
      <MobileChatterWorkspace initialView={view === "all" ? "all" : "inbox"} />
    );
  }

  return <MessengerWorkspace />;
}
