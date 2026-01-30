/**
 * Custom hook to protect routes that require onboarding completion
 * Shows a modal if user tries to access protected content before onboarding
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

export function useOnboardingProtection() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [onboardingStatus, setOnboardingStatus] = useState({
    loading: true,
    complete: false,
    showModal: false,
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

        // Get user ID from token claims
        const decoded = token ? JSON.parse(atob(token.split('.')[1])) : {};
        const clerkUserId = decoded.sub;

        const response = await fetch(`${apiUrl}/api/onboarding/status/${clerkUserId}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (!data.onboarding_complete) {
            // Automatically redirect to onboarding instead of showing modal
            router.push("/onboarding");
            setOnboardingStatus({
              loading: false,
              complete: false,
              showModal: false,
            });
          } else {
            setOnboardingStatus({
              loading: false,
              complete: true,
              showModal: false,
            });
          }
        } else {
          // Redirect to onboarding if status check fails
          router.push("/onboarding");
          setOnboardingStatus({
            loading: false,
            complete: false,
            showModal: false,
          });
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        // Redirect to onboarding on error
        router.push("/onboarding");
        setOnboardingStatus({
          loading: false,
          complete: false,
          showModal: false,
        });
      }
    };

    checkOnboarding();
  }, [getToken, router]);

  const closeModalAndRedirect = () => {
    setOnboardingStatus((prev) => ({ ...prev, showModal: false }));
    router.push("/onboarding");
  };

  return {
    ...onboardingStatus,
    closeModalAndRedirect,
  };
}
