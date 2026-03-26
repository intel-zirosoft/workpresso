import type { Metadata } from 'next'
import { Fredoka, Nunito } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from '@/providers'
import { Sidebar } from '@/components/shared/sidebar'
import { Header } from '@/components/shared/header'
import { THEME_STORAGE_KEY } from '@/lib/theme'

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
  description: '부드럽고 신뢰할 수 있는 협업 공간',
}

const themeInitScript = `
  (function() {
    try {
      var stored = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      var preference =
        stored === 'light' || stored === 'dark' || stored === 'default'
          ? stored
          : 'default';
      var resolved =
        preference === 'default'
          ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
          : preference;

      document.documentElement.dataset.theme = resolved;
      document.documentElement.style.colorScheme = resolved;
    } catch (error) {
      document.documentElement.dataset.theme = 'light';
      document.documentElement.style.colorScheme = 'light';
    }
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" suppressHydrationWarning className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="font-body bg-background text-text antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          <div className="flex min-h-screen">
            {/* Left Sidebar - Fixed 260px */}
            <Sidebar />
            
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen bg-background">
              <Header />
              <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-8 max-w-[1400px]">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  )
}
