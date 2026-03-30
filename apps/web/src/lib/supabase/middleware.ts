import { createServerClient, type SetAllCookies } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 중요: 사용자의 인증 세션을 확인합니다.
  const { data: { user } } = await supabase.auth.getUser()

  if (user && request.nextUrl.pathname.startsWith('/settings')) {
    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    const role = profile?.role || 'USER'
    const url = request.nextUrl.clone()

    if (request.nextUrl.pathname.startsWith('/settings/system') && role !== 'SUPER_ADMIN') {
      url.pathname = '/settings/profile'
      return NextResponse.redirect(url)
    }
    
    if (
      (request.nextUrl.pathname.startsWith('/settings/organization') || 
       request.nextUrl.pathname.startsWith('/settings/integrations')) && 
      role !== 'SUPER_ADMIN' && role !== 'ORG_ADMIN'
    ) {
      url.pathname = '/settings/profile'
      return NextResponse.redirect(url)
    }

    if (request.nextUrl.pathname.startsWith('/settings/team') && 
        role !== 'SUPER_ADMIN' && role !== 'ORG_ADMIN' && role !== 'TEAM_ADMIN') {
      url.pathname = '/settings/profile'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
