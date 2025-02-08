import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const publicPaths = ['/login', '/register', '/forgot', '/password']

    // Skip static file paths (_next, images, favicon, etc.)
    if (
        request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.startsWith('/images')
    ) {
        return NextResponse.next()
    }

    // Handle authentication redirects here (if necessary)
    const isLoggedIn = request.cookies.get('isLoggedIn')
    if (!isLoggedIn && !publicPaths.includes(request.nextUrl.pathname)) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!api|_next|favicon.ico).*)'],
}
