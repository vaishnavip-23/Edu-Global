"use client";

import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useOnboardingProtection } from "../hooks/useOnboardingProtection";

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    loading: onboardingLoading,
    complete: onboardingComplete,
  } = useOnboardingProtection();

  const [onboardingData, setOnboardingData] = useState(null);
  const [profileStrength, setProfileStrength] = useState(null);
  const [todos, setTodos] = useState([]);
  const [userStage, setUserStage] = useState(1);
  const [lockedCount, setLockedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!onboardingComplete) return;

    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Fetch dashboard data and profile strength in parallel (optimized!)
      const [dashboardResponse, strengthResponse] = await Promise.all([
        fetch(`${apiUrl}/api/users/dashboard-data`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${apiUrl}/api/ai-counsellor/profile-strength`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      // Handle dashboard data
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();

        // Set all dashboard state
        setUserStage(dashboardData.user?.current_stage ?? 1);
        setOnboardingData(dashboardData.onboarding);
        setTodos(dashboardData.todos || []);
        setLockedCount(dashboardData.locked_count || 0);
      }

      // Handle profile strength
      if (strengthResponse.ok) {
        const strengthData = await strengthResponse.json();
        setProfileStrength(strengthData.analysis);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
      fetchDashboardData();
    }
  }, [isLoaded, isSignedIn, onboardingComplete, router, fetchDashboardData]);

  const toggleTodoStatus = async (todoId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    // Optimistic update - update UI immediately
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === todoId ? { ...todo, status: newStatus } : todo,
      ),
    );

    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      const response = await fetch(`${apiUrl}/api/todos/${todoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        // Revert on failure
        setTodos((prevTodos) =>
          prevTodos.map((todo) =>
            todo.id === todoId ? { ...todo, status: currentStatus } : todo,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      // Revert on error
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === todoId ? { ...todo, status: currentStatus } : todo,
        ),
      );
    }
  };

  const getStageInfo = (stage) => {
    const stages = {
      1: {
        name: "Building Profile",
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
      },
      2: {
        name: "Discovering Universities",
        color:
          "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
      },
      3: {
        name: "Finalizing Universities",
        color:
          "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
      },
      4: {
        name: "Preparing Applications",
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
      },
    };
    return stages[stage] || stages[1];
  };

  const getStrengthColor = (strength) => {
    if (
      strength === "Strong" ||
      strength === "Completed" ||
      strength === "Ready"
    ) {
      return "text-green-600 dark:text-green-400";
    } else if (
      strength === "Average" ||
      strength === "In Progress" ||
      strength === "Draft"
    ) {
      return "text-yellow-600 dark:text-yellow-400";
    } else {
      return "text-red-600 dark:text-red-400";
    }
  };

  if (!isLoaded || onboardingLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900" id="main-content">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              Loading...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!onboardingData) {
    return null;
  }

  const stageInfo = getStageInfo(userStage);
  const pendingTodos = todos.filter((t) => t.status !== "completed");

  return (
    <main className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 animate-fade-in" id="main-content">
      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Welcome & Stage */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-50">
            Welcome back, {user?.firstName || "there"}!
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-stone-600 dark:text-stone-400">
              Current Stage:
            </span>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${stageInfo.color}`}
            >
              Stage {userStage}: {stageInfo.name}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 lg:grid-cols-3 stagger-children">
          {/* Left Column - Profile & Strength */}
          <div className="space-y-6 lg:col-span-2">
            {/* Profile Summary */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                  Your Profile
                </h2>
                <button
                  onClick={() => router.push("/profile")}
                  className="text-sm font-medium text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                >
                  Edit profile
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    Education:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.education_level}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    Major:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.degree_major}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    GPA:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.gpa || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    Target Degree:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.target_degree || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    Field:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.field_of_study || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    Countries:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.preferred_countries || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    Budget:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.budget_range || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    Funding:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.funding_plan || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    IELTS/TOEFL:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.ielts_status ||
                      onboardingData.toefl_status ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    GRE/GMAT:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.gre_status ||
                      onboardingData.gmat_status ||
                      "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-stone-500 dark:text-stone-400">
                    SOP Status:
                  </span>
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                    {onboardingData.sop_status || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Strength */}
            {profileStrength && (
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-stone-800 dark:bg-stone-900">
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                  Profile Strength
                </h2>
                <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                  AI assessment of your profile
                </p>
                <div className="mt-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                  {typeof profileStrength === 'string' ? (
                    profileStrength
                  ) : (
                    <p>Loading analysis...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Actions & To-Dos */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                Quick Actions
              </h2>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => router.push("/counsellor")}
                  className="flex w-full items-center gap-3 rounded-lg border border-orange-200 bg-orange-50 p-3 text-left shadow-sm transition-all duration-200 hover:bg-orange-100 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:border-orange-800 dark:bg-orange-900/20 dark:hover:bg-orange-900/30"
                >
                  <span className="text-xl">🤖</span>
                  <div>
                    <div className="font-medium text-orange-900 dark:text-orange-100">
                      AI Counsellor
                    </div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">
                      Get personalized guidance
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/universities")}
                  className="flex w-full items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-left shadow-sm transition-all duration-200 hover:bg-stone-100 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                >
                  <span className="text-xl">🎓</span>
                  <div>
                    <div className="font-medium text-stone-900 dark:text-stone-100">
                      Universities
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">
                      Browse recommendations
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => router.push("/shortlist")}
                  className="flex w-full items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 text-left shadow-sm transition-all duration-200 hover:bg-stone-100 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:border-stone-700 dark:bg-stone-800 dark:hover:bg-stone-700"
                >
                  <span className="text-xl">📋</span>
                  <div>
                    <div className="font-medium text-stone-900 dark:text-stone-100">
                      Your Shortlist
                    </div>
                    <div className="text-xs text-stone-600 dark:text-stone-400">
                      Lock choices and manage shortlist
                    </div>
                  </div>
                </button>
                {lockedCount > 0 ? (
                  <button
                    onClick={() => router.push("/application")}
                    className="flex w-full items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3 text-left shadow-sm transition-all duration-200 hover:bg-green-100 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] dark:border-green-800 dark:bg-green-900/20 dark:hover:bg-green-900/30"
                  >
                    <span className="text-xl">📄</span>
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-100">
                        Application Preparation
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">
                        Tasks & documents for {lockedCount} locked{" "}
                        {lockedCount === 1 ? "university" : "universities"}
                      </div>
                    </div>
                  </button>
                ) : (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Lock a university to unlock Application Preparation
                    </p>
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                      Go to Your Shortlist and lock at least one choice.
                    </p>
                    <button
                      onClick={() => router.push("/shortlist")}
                      className="mt-2 text-xs font-medium text-amber-700 underline dark:text-amber-300"
                    >
                      Your Shortlist →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* To-Do List */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                To-Do List
              </h2>
              <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
                {pendingTodos.length} pending{" "}
                {pendingTodos.length === 1 ? "task" : "tasks"}
              </p>
              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                {todos.length === 0 ? (
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    No tasks yet. The AI Counsellor will create tasks for you!
                  </p>
                ) : (
                  todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 shadow-sm transition-all duration-200 ${
                        todo.status === "completed"
                          ? "border-stone-200 bg-stone-50 opacity-60 dark:border-stone-800 dark:bg-stone-800/50"
                          : "border-stone-200 bg-white hover:shadow-md dark:border-stone-700 dark:bg-stone-900"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.status === "completed"}
                        onChange={() => toggleTodoStatus(todo.id, todo.status)}
                        className="mt-1 h-4 w-4 cursor-pointer rounded border-stone-300 text-orange-600 transition-all duration-200 focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium transition-all duration-200 ${
                            todo.status === "completed"
                              ? "line-through text-stone-500 dark:text-stone-500"
                              : "text-stone-900 dark:text-stone-50"
                          }`}
                        >
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                            {todo.description}
                          </p>
                        )}
                        <div className="mt-1.5 flex gap-2">
                          {todo.category && (
                            <span className="inline-flex items-center rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-700 dark:bg-stone-800 dark:text-stone-300">
                              {todo.category}
                            </span>
                          )}
                          {todo.priority === "high" && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              High Priority
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
