"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface MessengerContextType {
  isOpen: boolean;
  openMessenger: () => void;
  closeMessenger: () => void;
}

const MessengerContext = createContext<MessengerContextType | undefined>(undefined);

export function MessengerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openMessenger = () => setIsOpen(true);
  const closeMessenger = () => setIsOpen(false);

  return (
    <MessengerContext.Provider value={{ isOpen, openMessenger, closeMessenger }}>
      {children}
    </MessengerContext.Provider>
  );
}

export function useMessenger() {
  const context = useContext(MessengerContext);
  if (context === undefined) {
    throw new Error("useMessenger must be used within a MessengerProvider");
  }
  return context;
}
