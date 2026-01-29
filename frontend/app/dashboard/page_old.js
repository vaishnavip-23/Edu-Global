"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkOnboardingAndFetchData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // First, check if onboarding is complete
      const statusResponse = await fetch(
        `${apiUrl}/api/onboarding/status/${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();

        // If onboarding is not complete, redirect to onboarding page
        if (!statusData.onboarding_complete) {
          router.push("/onboarding");
          return;
        }
      }

      // If onboarding is complete, fetch the data
      const dataResponse = await fetch(
        `${apiUrl}/api/onboarding/${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (dataResponse.ok) {
        const data = await dataResponse.json();
        setOnboardingData(data);
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isLoaded && isSignedIn) {
      checkOnboardingAndFetchData();
    }
  }, [isLoaded, isSignedIn, router, checkOnboardingAndFetchData]);

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 py-10 dark:from-black dark:to-zinc-900">
        <div className="mx-auto max-w-6xl flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  // Don't render dashboard if no onboarding data (will redirect)
  if (!onboardingData) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold tracking-tight text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                SA
              </div>
              <span className="text-sm font-medium tracking-tight text-zinc-700 dark:text-zinc-200">
                StudyAbroad AI
              </span>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Your personalized study abroad dashboard
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Profile Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Your Profile
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Education:</span>{" "}
                <span className="text-zinc-900 dark:text-zinc-50">
                  {onboardingData.education_level}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Major:</span>{" "}
                <span className="text-zinc-900 dark:text-zinc-50">
                  {onboardingData.degree_major}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Target Degree:</span>{" "}
                <span className="text-zinc-900 dark:text-zinc-50">
                  {onboardingData.target_degree || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Study Goals Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Study Goals
            </h2>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Field:</span>{" "}
                <span className="text-zinc-900 dark:text-zinc-50">
                  {onboardingData.field_of_study || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Target Intake:</span>{" "}
                <span className="text-zinc-900 dark:text-zinc-50">
                  {onboardingData.target_intake_year || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 dark:text-zinc-400">Countries:</span>{" "}
                <span className="text-zinc-900 dark:text-zinc-50">
                  {onboardingData.preferred_countries || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Next Steps Card */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Next Steps
            </h2>
            <div className="mt-4 space-y-3">
              <button
                onClick={() => router.push("/universities")}
                className="flex w-full items-start gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-left transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/20 dark:hover:bg-purple-900/30"
              >
                <span className="text-purple-600 dark:text-purple-400">🎓</span>
                <div>
                  <div className="font-medium text-purple-900 dark:text-purple-100">
                    Discover Universities
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    View personalized recommendations
                  </div>
                </div>
              </button>
              <div className="flex items-start gap-2 p-3 text-sm">
                <span className="text-zinc-400">→</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  AI Counsellor (Coming Soon)
                </span>
              </div>
              <div className="flex items-start gap-2 p-3 text-sm">
                <span className="text-zinc-400">→</span>
                <span className="text-zinc-600 dark:text-zinc-400">
                  Application Tracker (Coming Soon)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder for future features */}
        <div className="mt-8 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            More features coming soon! We&apos;re building AI-powered guidance, university recommendations, and application tracking.
          </p>
        </div>
      </div>
    </main>
  );
}
