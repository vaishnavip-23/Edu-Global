"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useOnboardingProtection } from "../hooks/useOnboardingProtection";
import UniversityCard from "../components/UniversityCard";

export default function UniversitiesPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    loading: onboardingLoading,
    complete: onboardingComplete,
  } = useOnboardingProtection();

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState({});
  const [unlockConfirm, setUnlockConfirm] = useState(null);
  const [lockConfirm, setLockConfirm] = useState(null);

  const fetchRecommendations = useCallback(async () => {
    if (!onboardingComplete) return;

    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Fetch recommendations
      const response = await fetch(`${apiUrl}/api/universities/recommended`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Recommendations data received:", data);
        setRecommendations(data.recommendations);
      } else {
        const errorText = await response.text();
        console.error(
          "Failed to fetch recommendations. Status:",
          response.status,
          "Error:",
          errorText,
        );
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken, onboardingComplete]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isLoaded && isSignedIn && onboardingComplete) {
      fetchRecommendations();
    }
  }, [isLoaded, isSignedIn, onboardingComplete, router, fetchRecommendations]);

  const handleShortlist = async (universityId, isShortlisted, university) => {
    try {
      setActionLoading({ ...actionLoading, [universityId]: true });
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const method = isShortlisted ? "DELETE" : "POST";
      const body = method === "POST" && university ? {
        match_score: university.match_score || 0,
        category: university.category || "Target"
      } : undefined;

      const response = await fetch(
        `${apiUrl}/api/universities/shortlist/${universityId}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          ...(body && { body: JSON.stringify(body) }),
        },
      );

      if (response.ok) {
        // Refresh recommendations to update shortlist status
        await fetchRecommendations();
      }
    } catch (error) {
      console.error("Error toggling shortlist:", error);
    } finally {
      setActionLoading({ ...actionLoading, [universityId]: false });
    }
  };

  const handleLock = async (universityId, isLocked) => {
    try {
      setActionLoading((prev) => ({ ...prev, [universityId]: true }));
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const endpoint = isLocked ? "unlock" : "lock";
      const response = await fetch(
        `${apiUrl}/api/universities/${endpoint}/${universityId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (response.ok) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error("Error toggling lock:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [universityId]: false }));
      setUnlockConfirm(null);
    }
  };

  if (!isLoaded || onboardingLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900" id="main-content">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
                Loading universities...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const getUniversitiesByTab = () => {
    if (!recommendations) return [];
    switch (activeTab) {
      case "dream":
        return recommendations.dream;
      case "target":
        return recommendations.target;
      case "safe":
        return recommendations.safe;
      default:
        return recommendations.all;
    }
  };

  const universities = getUniversitiesByTab();

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 animate-fade-in" id="main-content">
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-50">
            Discover Universities
          </h1>
          <p className="mt-2 text-stone-600 dark:text-stone-400">
            Universities matched to your profile
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-stone-200 dark:border-stone-800">
          {[
            {
              key: "all",
              label: "All",
              count: recommendations?.all.length || 0,
            },
            {
              key: "dream",
              label: "Dream",
              count: recommendations?.dream.length || 0,
            },
            {
              key: "target",
              label: "Target",
              count: recommendations?.target.length || 0,
            },
            {
              key: "safe",
              label: "Safe",
              count: recommendations?.safe.length || 0,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "border-b-2 border-orange-600 text-orange-600 dark:text-orange-400"
                  : "text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* University Cards */}
        {universities.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-12 text-center dark:border-stone-800 dark:bg-stone-900/50">
            <p className="text-stone-600 dark:text-stone-400">
              No universities found for this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 stagger-children">
            {universities.map((uni) => (
              <UniversityCard
                key={uni.university_id}
                university={uni}
                onShortlist={handleShortlist}
                onLock={handleLock}
                onRequestUnlock={setUnlockConfirm}
                onRequestLock={setLockConfirm}
                loading={actionLoading[uni.university_id]}
              />
            ))}
          </div>
        )}

        {/* Lock commitment confirmation modal */}
        {lockConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
            <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-stone-900 animate-scale-in">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                  <span className="text-3xl">🔒</span>
                </div>
              </div>
              <h3 className="mt-4 text-center text-xl font-semibold text-stone-900 dark:text-stone-50">
                Lock {lockConfirm.universityName}?
              </h3>
              <p className="mt-3 text-center text-sm text-stone-600 dark:text-stone-400">
                You're about to commit to applying to{" "}
                <strong>{lockConfirm.universityName}</strong> ({lockConfirm.country}).
              </p>

              <div className="mt-4 space-y-2 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                <p className="text-xs font-semibold text-green-900 dark:text-green-300">
                  What locking means:
                </p>
                <ul className="space-y-1 text-xs text-green-800 dark:text-green-400">
                  <li>✓ You're committing to apply to this university</li>
                  <li>✓ Application guidance & tasks will be unlocked</li>
                  <li>✓ Your strategy becomes university-specific</li>
                  <li>✓ You can unlock later if needed (with a warning)</li>
                </ul>
              </div>

              <p className="mt-4 text-center text-sm font-medium text-stone-900 dark:text-stone-50">
                Are you ready to commit?
              </p>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setLockConfirm(null)}
                  disabled={actionLoading[lockConfirm.universityId]}
                  className="flex-1 rounded-lg border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  Not Yet
                </button>
                <button
                  onClick={() => {
                    handleLock(lockConfirm.universityId, false);
                    setLockConfirm(null);
                  }}
                  disabled={actionLoading[lockConfirm.universityId]}
                  className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading[lockConfirm.universityId] ? "Locking..." : "Yes, Lock It"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Unlock confirmation modal */}
        {unlockConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-stone-900 animate-scale-in">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                  <span className="text-3xl">⚠️</span>
                </div>
              </div>
              <h3 className="mt-4 text-center text-xl font-semibold text-stone-900 dark:text-stone-50">
                Unlock {unlockConfirm.universityName}?
              </h3>
              <p className="mt-3 text-center text-sm text-stone-600 dark:text-stone-400">
                <strong>Warning:</strong> Unlocking{" "}
                <strong>{unlockConfirm.universityName}</strong> will remove it from your
                committed list and change your application strategy.
              </p>

              <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300">
                  What happens:
                </p>
                <ul className="space-y-1 text-xs text-amber-800 dark:text-amber-400">
                  <li>• Application tasks for this university remain</li>
                  <li>• You can lock it again anytime</li>
                  <li>• University-specific guidance will be adjusted</li>
                </ul>
              </div>

              <p className="mt-4 text-center text-sm font-medium text-stone-900 dark:text-stone-50">
                Continue unlocking?
              </p>

              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => setUnlockConfirm(null)}
                  disabled={actionLoading[unlockConfirm.universityId]}
                  className="flex-1 rounded-lg border border-stone-200 px-4 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleLock(unlockConfirm.universityId, true);
                    setUnlockConfirm(null);
                  }}
                  disabled={actionLoading[unlockConfirm.universityId]}
                  className="flex-1 rounded-lg bg-orange-600 px-4 py-3 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading[unlockConfirm.universityId] ? "Unlocking..." : "Yes, Unlock"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

