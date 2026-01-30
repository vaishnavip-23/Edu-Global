"use client";

import Link from "next/link";
import Image from "next/image";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

export default function Home() {
  const { isLoaded } = useUser();
  return (
    <div
      className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden font-sans text-stone-900 dark:text-stone-50"
      role="main"
    >
      {/* Subtle background: gradient + soft glow */}
      <div
        className="fixed inset-0 -z-10 bg-gradient-to-b from-stone-50 via-white to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950"
        aria-hidden
      />
      <div
        className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,146,60,0.12),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(251,146,60,0.08),transparent)]"
        aria-hidden
      />

      <main
        className="mx-auto flex min-h-0 flex-1 flex-col max-w-3xl px-5 py-6 sm:px-8 sm:py-8"
        id="main-content"
      >
        {/* Hero — fits in viewport, no scroll */}
        <section className="flex min-h-0 flex-1 flex-col justify-center">
          <div className="animate-slide-up flex flex-col items-center text-center">
            {/* Logo + product name */}
            <div className="mb-5 flex flex-col items-center gap-3 sm:mb-6">
              <div className="rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-stone-200/60 dark:bg-stone-800/50 dark:ring-stone-700/50 sm:p-4">
                <Image
                  src="/icons/hero-bg.png"
                  alt="EduGlobal"
                  width={220}
                  height={88}
                  className="h-14 w-auto object-contain sm:h-16"
                  priority
                />
              </div>
              <span className="text-lg font-semibold tracking-tight text-stone-800 dark:text-stone-200 sm:text-xl">
                EduGlobal
              </span>
            </div>

            {/* Headline */}
            <h1 className="mb-3 text-2xl font-bold leading-tight tracking-tight text-stone-900 dark:text-stone-50 sm:text-3xl sm:mb-4 lg:text-4xl">
              Plan your study-abroad journey with a guided AI counsellor.
            </h1>

            {/* Short description */}
            <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-stone-600 dark:text-stone-400 sm:text-base sm:mb-8">
              Get tailored guidance on universities, programs, and
              applications—without the overwhelm.
            </p>

            {/* CTAs — clear primary/secondary, touch-friendly */}
            <div className="flex flex-col-reverse items-center gap-3 sm:flex-row sm:gap-4">
              {!isLoaded ? (
                // Loading skeletons
                <>
                  <div className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-full bg-orange-600 px-8 py-3 skeleton-shimmer">
                    <span className="invisible">Get Started</span>
                  </div>
                  <div className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-full border border-stone-300 bg-white px-8 py-3 dark:border-stone-600 dark:bg-stone-800/80 skeleton-shimmer">
                    <span className="invisible">Log In</span>
                  </div>
                </>
              ) : (
                <>
                  <SignedOut>
                    <Link
                      href="/sign-up"
                      className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-full bg-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-all hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/sign-in"
                      className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-full border border-stone-300 bg-white px-8 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-200 dark:hover:bg-stone-700/80 dark:focus:ring-stone-500 dark:focus:ring-offset-stone-900"
                    >
                      Log In
                    </Link>
                  </SignedOut>
                  <SignedIn>
                    <Link
                      href="/dashboard"
                      className="inline-flex min-h-[44px] min-w-[140px] items-center justify-center rounded-full bg-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-all hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/30 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-stone-900"
                    >
                      Get Started
                    </Link>
                  </SignedIn>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-auto shrink-0 pt-6 text-center sm:pt-8">
          <p className="text-xs text-stone-500 dark:text-stone-500">
            EduGlobal — Your AI Counsellor for study abroad
          </p>
        </footer>
      </main>
    </div>
  );
}
