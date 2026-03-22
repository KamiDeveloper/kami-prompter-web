// ARCH DECISION: Se mantiene middleware.ts por requerimiento explicito del proyecto,
// aunque Next.js 16 recomienda migrar a proxy.ts.
import { NextResponse, type NextRequest } from 'next/server'

import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware'

const PUBLIC_ROUTES = new Set(['/', '/login', '/register', '/forgot-password', '/auth/callback'])

function copyCookies(from: NextResponse, to: NextResponse): void {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie)
  }
}

export async function middleware(request: NextRequest) {
  const { supabase, getResponse } = createSupabaseMiddlewareClient(request)

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const baseResponse = getResponse()
  const pathname = request.nextUrl.pathname
  const isAppRoute = pathname.startsWith('/app')
  const isAuthEntry = pathname === '/login' || pathname === '/register'
  const isPublic = PUBLIC_ROUTES.has(pathname)

  if (isAppRoute && !session) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    const redirectResponse = NextResponse.redirect(url)
    copyCookies(baseResponse, redirectResponse)
    return redirectResponse
  }

  if (isAuthEntry && session) {
    const url = request.nextUrl.clone()
    url.pathname = '/app/dashboard'
    const redirectResponse = NextResponse.redirect(url)
    copyCookies(baseResponse, redirectResponse)
    return redirectResponse
  }

  if (isPublic || isAppRoute) {
    return baseResponse
  }

  return baseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
