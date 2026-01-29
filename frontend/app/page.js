"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10 sm:px-10">
        {/* Header / Logo */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold tracking-tight text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
              SA
            </div>
            <span className="text-sm font-medium tracking-tight text-zinc-700 dark:text-zinc-200">
              StudyAbroad AI
            </span>
          </div>
        </header>

        {/* Hero */}
        <section className="flex flex-1 items-center">
          <div className="max-w-2xl space-y-6">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              Plan your study-abroad journey with a guided AI counsellor.
            </h1>
            <p className="max-w-xl text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
              Get tailored guidance on programs, applications, and timelines so you always know
              what to do next—without the overwhelm.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <SignedOut>
                <Link
                  href="/sign-up"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Get Started
                </Link>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-900/40"
                >
                  Login
                </Link>
              </SignedOut>

              <SignedIn>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-zinc-50 shadow-sm transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900/60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  Get Started
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-6 py-2.5 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 dark:border-zinc-700 dark:bg-transparent dark:text-zinc-200 dark:hover:border-zinc-500 dark:hover:bg-zinc-900/40"
                >
                  Login
                </Link>
              </SignedIn>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
