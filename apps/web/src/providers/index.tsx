'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { ThemeProvider } from '@/providers/theme-provider'

import { MessengerProvider } from "@/features/pod-e/contexts/messenger-context";
import { ScheduleProvider } from "@/features/pod-e/contexts/schedule-context";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
      },
    },
  }))

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <MessengerProvider>
          <ScheduleProvider>
            {children}
          </ScheduleProvider>
        </MessengerProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
