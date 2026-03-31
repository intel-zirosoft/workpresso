"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useMessenger } from "@/features/pod-e/contexts/messenger-context";
import { MessengerWorkspace } from "@/features/pod-e/components/messenger-workspace";

export function MessengerModal() {
  const { isOpen, closeMessenger } = useMessenger();

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeMessenger()}>
      <DialogContent className="max-w-[95vw] lg:max-w-[1400px] h-[90vh] p-0 overflow-hidden border-none bg-transparent shadow-none gap-0">
        <DialogTitle className="sr-only">Messenger Workspace</DialogTitle>
        <div className="h-full w-full overflow-hidden rounded-[32px] border border-background/50 bg-surface shadow-2xl">
          <MessengerWorkspace />
        </div>
      </DialogContent>
    </Dialog>
  );
}
