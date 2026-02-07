/**
 * Custom hook to protect routes that require onboarding completion
 * Shows a modal if user tries to access protected content before onboarding
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

function decodeJwtPayload(token) {
  try {
    if (!token) return {};
    const parts = token.split(".");
    if (parts.length < 2) return {};
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    return JSON.parse(atob(padded));
  } catch {
    return {};
  }
}

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

        // Get user ID from token claims (JWT uses base64url encoding)
        const decoded = decodeJwtPayload(token);
        const clerkUserId = decoded.sub;

        if (!clerkUserId) {
          router.push("/onboarding");
          setOnboardingStatus({
            loading: false,
            complete: false,
            showModal: false,
          });
          return;
        }

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
