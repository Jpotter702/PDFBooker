import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
 
const publicPaths = ["/", "/api/webhook", "/pricing"];

function isPublic(path: string) {
  return publicPaths.find(x => 
    path === x || path.startsWith(`${x}/`)
  );
}
 
export default function middleware(request: NextRequest) {
  if (isPublic(request.nextUrl.pathname)) {
    return NextResponse.next();
  }
  
  // Get auth info
  const { userId } = getAuth(request);
  
  // If user is not signed in, redirect to sign-in page
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }
  
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
