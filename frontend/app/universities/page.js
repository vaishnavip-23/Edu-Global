"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export default function UniversitiesPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }

    if (isLoaded && isSignedIn) {
      fetchRecommendations();
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(
        `${apiUrl}/api/universities/recommended`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations);
      } else if (response.status === 404) {
        // User hasn't completed onboarding
        router.push("/onboarding");
      } else {
        console.error("Failed to fetch recommendations");
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleShortlist = async (universityId, isShortlisted) => {
    try {
      setActionLoading({ ...actionLoading, [universityId]: true });
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const method = isShortlisted ? "DELETE" : "POST";
      const response = await fetch(
        `${apiUrl}/api/universities/shortlist/${universityId}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
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
      setActionLoading({ ...actionLoading, [universityId]: true });
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
        }
      );

      if (response.ok) {
        await fetchRecommendations();
      }
    } catch (error) {
      console.error("Error toggling lock:", error);
    } finally {
      setActionLoading({ ...actionLoading, [universityId]: false });
    }
  };

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
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
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
      {/* Header */}
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
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            Discover Universities
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Universities matched to your profile
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
          {[
            { key: "all", label: "All", count: recommendations?.all.length || 0 },
            { key: "dream", label: "Dream", count: recommendations?.dream.length || 0 },
            { key: "target", label: "Target", count: recommendations?.target.length || 0 },
            { key: "safe", label: "Safe", count: recommendations?.safe.length || 0 },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "border-b-2 border-purple-600 text-purple-600 dark:text-purple-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* University Cards */}
        {universities.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-zinc-600 dark:text-zinc-400">
              No universities found for this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {universities.map((uni) => (
              <UniversityCard
                key={uni.university_id}
                university={uni}
                onShortlist={handleShortlist}
                onLock={handleLock}
                loading={actionLoading[uni.university_id]}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function UniversityCard({ university, onShortlist, onLock, loading }) {
  const [expanded, setExpanded] = useState(false);

  const getCategoryColor = (category) => {
    switch (category) {
      case "Dream":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "Target":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "Safe":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
    }
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {university.university_name}
            </h3>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {university.city}, {university.country}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryColor(
              university.category
            )}`}
          >
            {university.category}
          </span>
        </div>
      </div>

      {/* Program Info */}
      <div className="mb-4 space-y-2 text-sm">
        <div>
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {university.program_name}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-zinc-600 dark:text-zinc-400">
          <span>📚 {university.degree_type}</span>
          <span>⏱️ {university.program_duration_years} years</span>
          <span>💰 ${university.estimated_total_cost_usd.toLocaleString()}/year</span>
        </div>
      </div>

      {/* Match Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">Match Score</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400">
            {university.match_score}/100
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600"
            style={{ width: `${university.match_score}%` }}
          ></div>
        </div>
      </div>

      {/* Fit Reasons */}
      {university.fit_reasons && university.fit_reasons.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Why it fits:
          </p>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {university.fit_reasons.slice(0, 2).map((reason, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {university.risk_factors && university.risk_factors.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Risks to consider:
          </p>
          <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
            {university.risk_factors.slice(0, 2).map((risk, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-yellow-600 dark:text-yellow-400">⚠</span>
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="mb-4 space-y-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Competition:</span>{" "}
              <span className="text-zinc-900 dark:text-zinc-50">
                {university.competition_level}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Acceptance:</span>{" "}
              <span className="text-zinc-900 dark:text-zinc-50">
                {university.acceptance_rate_estimate}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Min GPA:</span>{" "}
              <span className="text-zinc-900 dark:text-zinc-50">
                {university.minimum_gpa_estimate}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Avg Salary:</span>{" "}
              <span className="text-zinc-900 dark:text-zinc-50">
                ${university.average_salary_usd.toLocaleString()}
              </span>
            </div>
          </div>

          {university.strength_tags && university.strength_tags.length > 0 && (
            <div>
              <span className="text-zinc-500 dark:text-zinc-400">Strengths: </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {university.strength_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          {expanded ? "Show Less" : "View Details"}
        </button>
        <button
          onClick={() => onShortlist(university.university_id, university.is_shortlisted)}
          disabled={loading}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
            university.is_shortlisted
              ? "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
              : "bg-purple-600 text-white hover:bg-purple-700"
          } disabled:opacity-50`}
        >
          {loading ? "..." : university.is_shortlisted ? "Shortlisted ✓" : "Shortlist"}
        </button>
        {university.is_shortlisted && (
          <button
            onClick={() => onLock(university.university_id, university.is_locked)}
            disabled={loading}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              university.is_locked
                ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                : "bg-zinc-600 text-white hover:bg-zinc-700"
            } disabled:opacity-50`}
          >
            {university.is_locked ? "🔒" : "🔓"}
          </button>
        )}
      </div>
    </div>
  );
}
