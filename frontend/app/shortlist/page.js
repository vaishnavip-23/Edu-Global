"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function ShortlistPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [unlockConfirm, setUnlockConfirm] = useState(null);

  const fetchShortlist = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/universities/shortlist/my-shortlist`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setShortlist(data.shortlist || []);
      } else if (response.status === 404) {
        router.push("/onboarding");
      }
    } catch (error) {
      console.error("Error fetching shortlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (isLoaded && isSignedIn) fetchShortlist();
  }, [isLoaded, isSignedIn, router]);

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
      if (response.ok) await fetchShortlist();
    } catch (error) {
      console.error("Error toggling lock:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [universityId]: false }));
      setUnlockConfirm(null);
    }
  };

  const handleRemove = async (universityId) => {
    const entry = shortlist.find((u) => u.university_id === universityId);
    if (entry?.is_locked) return; // don't allow remove when locked; user must unlock first
    try {
      setActionLoading((prev) => ({ ...prev, [universityId]: true }));
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/universities/shortlist/${universityId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) await fetchShortlist();
    } catch (error) {
      console.error("Error removing from shortlist:", error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [universityId]: false }));
    }
  };

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading your shortlist...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
      <header className="border-b border-zinc-200 bg-white/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold tracking-tight text-zinc-50 shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
                SA
              </div>
              <span className="text-sm font-medium tracking-tight text-zinc-700 dark:text-zinc-200">
                StudyAbroad AI
              </span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/dashboard")}
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push("/universities")}
                className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                Discover
              </button>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Your Shortlist
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          You can lock multiple choices. Locked universities unlock Application
          Preparation.
        </p>

        {shortlist.length === 0 ? (
          <div className="mt-8 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-zinc-600 dark:text-zinc-400">
              Your shortlist is empty. Discover universities and add them here.
            </p>
            <button
              onClick={() => router.push("/universities")}
              className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Discover Universities
            </button>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {shortlist.map((uni) => (
              <li
                key={uni.university_id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {uni.university_name}
                  </h2>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {uni.category || "—"}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {uni.country}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      uni.is_locked
                        ? setUnlockConfirm({
                            universityId: uni.university_id,
                            universityName: uni.university_name,
                          })
                        : handleLock(uni.university_id, false)
                    }
                    disabled={actionLoading[uni.university_id]}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                      uni.is_locked
                        ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-zinc-600 text-white hover:bg-zinc-700"
                    }`}
                  >
                    {actionLoading[uni.university_id]
                      ? "..."
                      : uni.is_locked
                        ? "Unlock"
                        : "Lock Choice"}
                  </button>
                  {!uni.is_locked && (
                    <button
                      onClick={() => handleRemove(uni.university_id)}
                      disabled={actionLoading[uni.university_id]}
                      className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Unlock confirmation modal */}
      {unlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Unlock university?
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Removing <strong>{unlockConfirm.universityName}</strong> from your
              locked list will change your application plan. You can lock it
              again later. Continue?
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setUnlockConfirm(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleLock(unlockConfirm.universityId, true)}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
