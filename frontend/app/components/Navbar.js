"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";

export default function Navbar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  // Don't show navbar on auth and onboarding pages
  if (
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname?.startsWith("/onboarding")
  ) {
    return null;
  }

  const isActive = (path) => pathname === path;

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-orange-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>
      <nav className="sticky top-0 z-50 border-b border-stone-200 bg-white/80 backdrop-blur-md dark:border-stone-800 dark:bg-stone-900/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo */}
            <Link
              href="/"
              className="flex items-center gap-3 transition-transform hover:opacity-90"
            >
              <Image
                src="/icons/hero-bg.png"
                alt="EduGlobal"
                width={120}
                height={40}
                className="h-9 w-auto object-contain sm:h-10"
                priority
              />
              <span className="text-base font-semibold tracking-tight text-stone-900 dark:text-stone-100">
                EduGlobal
              </span>
            </Link>

            {/* Center: Main Navigation (Authenticated) */}
            <SignedIn>
              <div className="hidden md:flex items-center gap-1">
                <NavLink href="/dashboard" isActive={isActive("/dashboard")}>
                  Dashboard
                </NavLink>
                <NavLink
                  href="/universities"
                  isActive={isActive("/universities")}
                >
                  Universities
                </NavLink>
                <NavLink href="/shortlist" isActive={isActive("/shortlist")}>
                  Shortlist
                </NavLink>
                <NavLink href="/counsellor" isActive={isActive("/counsellor")}>
                  <span className="tracking-wider">AI</span> Counsellor
                </NavLink>
                <NavLink
                  href="/application"
                  isActive={isActive("/application")}
                >
                  Applications
                </NavLink>
              </div>
            </SignedIn>

            {/* Right: Auth Actions */}
            <div className="flex items-center gap-3">
              {!isLoaded ? (
                // Loading skeletons
                <>
                  <div className="rounded-lg px-4 py-2 h-9 w-16 skeleton-shimmer"></div>
                  <div className="rounded-lg px-4 py-2 h-9 w-24 bg-gradient-to-r from-orange-500 to-orange-600 skeleton-shimmer"></div>
                </>
              ) : (
                <>
                  <SignedOut>
                    {/* Before Auth: Log In + Get Started */}
                    <Link
                      href="/sign-in"
                      className="rounded-lg px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                    >
                      Log In
                    </Link>
                    <Link
                      href="/sign-up"
                      className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-orange-500/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-500/30"
                    >
                      Get Started
                    </Link>
                  </SignedOut>

                  <SignedIn>
                    {/* After Auth: Welcome + Profile + User Button */}
                    <div className="hidden sm:flex items-center gap-3">
                      <span className="text-sm text-stone-600 dark:text-stone-400">
                        Welcome,{" "}
                        <span className="font-semibold text-orange-600 dark:text-orange-400">
                          {user?.firstName || "there"}
                        </span>
                      </span>
                      <Link
                        href="/profile"
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                          isActive("/profile")
                            ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                            : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
                        }`}
                      >
                        Profile
                      </Link>
                    </div>
                    <UserButton
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox:
                            "h-9 w-9 ring-2 ring-orange-500/20 hover:ring-orange-500/40 transition-all",
                        },
                      }}
                    />
                  </SignedIn>
                </>
              )}
            </div>
          </div>

          {/* Mobile Navigation (Authenticated) */}
          <SignedIn>
            <div className="flex md:hidden gap-1 overflow-x-auto pb-3 pt-1 scrollbar-hide">
              <MobileNavLink
                href="/dashboard"
                isActive={isActive("/dashboard")}
              >
                Dashboard
              </MobileNavLink>
              <MobileNavLink
                href="/universities"
                isActive={isActive("/universities")}
              >
                Universities
              </MobileNavLink>
              <MobileNavLink
                href="/shortlist"
                isActive={isActive("/shortlist")}
              >
                Shortlist
              </MobileNavLink>
              <MobileNavLink
                href="/counsellor"
                isActive={isActive("/counsellor")}
              >
                <span className="tracking-wider">AI</span> Counsellor
              </MobileNavLink>
              <MobileNavLink
                href="/application"
                isActive={isActive("/application")}
              >
                Applications
              </MobileNavLink>
            </div>
          </SignedIn>
        </div>
      </nav>
    </>
  );
}

// Desktop Navigation Link Component
function NavLink({ href, children, isActive }) {
  return (
    <Link
      href={href}
      className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
        isActive
          ? "text-orange-600 dark:text-orange-400"
          : "text-stone-700 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      }`}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-3/4 -translate-x-1/2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600"></span>
      )}
    </Link>
  );
}

// Mobile Navigation Link Component
function MobileNavLink({ href, children, isActive }) {
  return (
    <Link
      href={href}
      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
        isActive
          ? "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
          : "text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
      }`}
    >
      {children}
    </Link>
  );
}
