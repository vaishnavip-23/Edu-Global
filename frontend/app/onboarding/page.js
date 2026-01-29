"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
      checkOnboardingStatus();
    }
  }, [isLoaded, isSignedIn, user, router]);

  const checkOnboardingStatus = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/onboarding/status/${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.onboarding_complete) {
          // User has completed onboarding, redirect to dashboard
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Show loading state while Clerk is loading or checking status
  if (!isLoaded || checkingStatus) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 py-10 dark:from-black dark:to-zinc-900">
        <div className="mx-auto max-w-2xl flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  // If not signed in, show nothing (will redirect via useEffect)
  if (!isSignedIn) {
    return null;
  }

  // User is authenticated and hasn't completed onboarding, show form
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 py-10 dark:from-black dark:to-zinc-900">
      <div className="mx-auto max-w-2xl">
        <OnboardingForm />
      </div>
    </main>
  );
}
