"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { OnboardingForm } from "./components/OnboardingForm";

export default function OnboardingPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // If Clerk has loaded and user is not signed in, redirect to sign-in
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    // If user is signed in, check onboarding status
    if (isLoaded && isSignedIn && user) {
      // Check if onboarding is already complete
      const checkOnboarding = async () => {
        try {
          const apiUrl =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const response = await fetch(
            `${apiUrl}/api/onboarding/status/${user.id}`,
            {
              headers: { "Content-Type": "application/json" },
            },
          );

          if (response.ok) {
            const data = await response.json();
            if (data.onboarding_complete) {
              // Already completed, redirect to dashboard
              router.push("/dashboard");
              return;
            }
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        }

        setCheckingStatus(false);
      };

      checkOnboarding();
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Show loading state while Clerk is loading or checking status
  if (!isLoaded || checkingStatus) {
    return (
      <main
        className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100 px-4 dark:from-stone-950 dark:to-stone-900"
        id="main-content"
      >
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent" />
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              Loading...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // If not signed in, show nothing (will redirect via useEffect)
  if (!isSignedIn) {
    return null;
  }

  // User is authenticated and hasn't completed onboarding — fixed height, no page scroll
  return (
    <main
      className="flex h-[calc(100vh-4rem)] flex-col overflow-hidden bg-gradient-to-br from-stone-50 to-stone-100 px-4 py-6 dark:from-stone-950 dark:to-stone-900 sm:py-8 animate-fade-in"
      id="main-content"
    >
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col">
        <OnboardingForm />
      </div>
    </main>
  );
}
