import type { Metadata } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import { ReactNode } from 'react'
import '@/styles/globals.css'
import { Providers } from '@/providers'
import { Sidebar } from '@/components/shared/sidebar'

const fredoka = Fredoka({ 
  subsets: ['latin'],
  variable: '--font-fredoka',
  weight: ['500', '600']
})

const nunito = Nunito({ 
  subsets: ['latin'],
  variable: '--font-nunito',
  weight: ['400', '700']
})

export const metadata: Metadata = {
  title: 'WorkPresso',
  description: 'Soft & Trustworthy Collaborative Workspace',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="font-body bg-background text-text antialiased">
        <Providers>
          <div className="flex min-h-screen">
            {/* Left Sidebar - Fixed 260px */}
            <Sidebar />
            
            {/* Main Content Area */}
            <main className="flex-1 bg-background overflow-y-auto">
              <div className="container mx-auto p-8 max-w-[1400px]">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
