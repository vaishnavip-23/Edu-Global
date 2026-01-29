import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();
  const { pathname } = request.nextUrl;

  // If user is authenticated and trying to access root, redirect to onboarding
  // The onboarding page will handle further redirects to dashboard if already complete
  if (userId && pathname === '/') {
    return NextResponse.redirect(new URL('/onboarding', request.url));
  }

  // Protect all routes except public ones
  if (!isPublicRoute(request) && !userId) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
