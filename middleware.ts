import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Skip authentication for public routes
  const publicRoutes = ["/auth/login", "/auth/sign-up", "/auth/error", "/auth/sign-up-success", "/"]

  if (publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // For now, allow all routes - authentication will be handled client-side
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
