"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface ScheduleContextType {
  isOpen: boolean;
  openSchedule: () => void;
  closeSchedule: () => void;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openSchedule = () => setIsOpen(true);
  const closeSchedule = () => setIsOpen(false);

  return (
    <ScheduleContext.Provider value={{ isOpen, openSchedule, closeSchedule }}>
      {children}
    </ScheduleContext.Provider>
  );
}

export function useSchedule() {
  const context = useContext(ScheduleContext);
  if (context === undefined) {
    throw new Error("useSchedule must be used within a ScheduleProvider");
  }
  return context;
}
