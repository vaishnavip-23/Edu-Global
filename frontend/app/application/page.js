"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useOnboardingProtection } from "../hooks/useOnboardingProtection";
import OnboardingRequiredModal from "../components/OnboardingRequiredModal";

export default function ApplicationPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    loading: onboardingLoading,
    complete: onboardingComplete,
    showModal,
    closeModalAndRedirect,
  } = useOnboardingProtection();

  const [loading, setLoading] = useState(true);
  const [lockedUniversities, setLockedUniversities] = useState([]);
  const [todosByUniversity, setTodosByUniversity] = useState({});
  const [expandedUniversity, setExpandedUniversity] = useState(null);

  const fetchApplicationData = useCallback(async () => {
    if (!onboardingComplete) return;

    try {
      setLoading(true);
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Fetch shortlist to get locked universities
      const shortlistResponse = await fetch(
        `${apiUrl}/api/universities/shortlist/my-shortlist`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (shortlistResponse.ok) {
        const shortlistData = await shortlistResponse.json();
        const locked = (shortlistData.shortlist || []).filter((u) => u.is_locked);
        setLockedUniversities(locked);

        // Expand first university by default
        if (locked.length > 0 && !expandedUniversity) {
          setExpandedUniversity(locked[0].university_id || locked[0].id);
        }
      }

      // Fetch all todos
      const todosResponse = await fetch(`${apiUrl}/api/todos/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (todosResponse.ok) {
        const todosData = await todosResponse.json();
        const todos = todosData.todos || [];

        // Group todos by university_id
        const grouped = {};
        todos.forEach((todo) => {
          const uniId = todo.university_id;
          if (uniId) {
            if (!grouped[uniId]) grouped[uniId] = [];
            grouped[uniId].push(todo);
          }
        });

        setTodosByUniversity(grouped);
      }
    } catch (error) {
      console.error("Error fetching application data:", error);
    } finally {
      setLoading(false);
    }
  }, [getToken, onboardingComplete, expandedUniversity]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (isLoaded && isSignedIn && onboardingComplete) {
      fetchApplicationData();
    }
  }, [isLoaded, isSignedIn, onboardingComplete, fetchApplicationData, router]);

  const handleToggleTodo = async (todoId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    // Optimistic UI update - update state immediately for instant feedback
    setTodosByUniversity((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((uniId) => {
        updated[uniId] = updated[uniId].map((todo) =>
          todo.id === todoId ? { ...todo, status: newStatus } : todo
        );
      });
      return updated;
    });

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

      // If API call fails, revert the optimistic update
      if (!response.ok) {
        setTodosByUniversity((prev) => {
          const updated = { ...prev };
          Object.keys(updated).forEach((uniId) => {
            updated[uniId] = updated[uniId].map((todo) =>
              todo.id === todoId ? { ...todo, status: currentStatus } : todo
            );
          });
          return updated;
        });
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      // Revert on error
      setTodosByUniversity((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((uniId) => {
          updated[uniId] = updated[uniId].map((todo) =>
            todo.id === todoId ? { ...todo, status: currentStatus } : todo
          );
        });
        return updated;
      });
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "border-l-red-500 bg-red-50/50 dark:bg-red-950/20";
      case "medium":
        return "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/20";
      case "low":
        return "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20";
      default:
        return "border-l-stone-300 bg-stone-50/50 dark:bg-stone-800/50";
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "exam":
        return "📝";
      case "documents":
        return "📄";
      case "application":
        return "📋";
      case "visa":
        return "✈️";
      default:
        return "📌";
    }
  };

  if (!isLoaded || onboardingLoading || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900" id="main-content">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              Loading application guidance...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <OnboardingRequiredModal isOpen={showModal} onClose={closeModalAndRedirect} />
      <main className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 animate-fade-in" id="main-content">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-stone-900 dark:text-stone-50">
              Application Preparation
            </h1>
            <p className="mt-2 text-stone-600 dark:text-stone-400">
              Track and complete your application tasks for each locked university.
            </p>
          </div>

          {lockedUniversities.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-stone-200 bg-stone-50/50 p-12 text-center dark:border-stone-800 dark:bg-stone-900/50">
              <div className="mx-auto max-w-md">
                <div className="mb-4 text-5xl">🔒</div>
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50 mb-2">
                  No Locked Universities Yet
                </h3>
                <p className="text-stone-600 dark:text-stone-400 mb-6">
                  Lock universities in your shortlist to unlock application guidance and see personalized tasks here.
                </p>
                <button
                  onClick={() => router.push("/shortlist")}
                  className="rounded-lg bg-orange-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-orange-700 transition-colors"
                >
                  Go to Shortlist
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {lockedUniversities.map((university, index) => {
                const uniId = university.university_id || university.id;
                const todos = todosByUniversity[uniId] || [];
                const isExpanded = expandedUniversity === uniId;
                const completedCount = todos.filter((t) => t.status === "completed").length;
                const totalCount = todos.length;
                const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                return (
                  <div
                    key={uniId}
                    className="rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-800 dark:bg-stone-900 overflow-hidden"
                  >
                    {/* University Header */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setExpandedUniversity(isExpanded ? null : uniId);
                      }}
                      className="w-full p-6 text-left hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-semibold text-stone-900 dark:text-stone-50">
                              {university.university_name || university.name}
                            </h2>
                            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                              university.category === "Dream"
                                ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                                : university.category === "Target"
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                  : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            }`}>
                              {university.category}
                            </span>
                          </div>
                          <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">
                            {university.city ? `${university.city}, ` : ''}{university.country} • {university.program_name || university.field_of_study}
                          </p>

                          {/* Progress Bar */}
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-stone-700 dark:text-stone-300 whitespace-nowrap">
                              {completedCount}/{totalCount} tasks
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{isExpanded ? "▼" : "▶"}</span>
                        </div>
                      </div>
                    </button>

                    {/* Todos List */}
                    {isExpanded && (
                      <div className="border-t border-stone-200 dark:border-stone-800 p-6 bg-stone-50/50 dark:bg-stone-800/30">
                        {todos.length === 0 ? (
                          <p className="text-center text-stone-600 dark:text-stone-400 py-8">
                            No tasks yet. Tasks will be generated when you lock this university.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {todos.map((todo) => (
                              <div
                                key={todo.id}
                                className={`rounded-lg border-l-4 bg-white dark:bg-stone-900 p-4 shadow-sm transition-all duration-200 hover:shadow-md ${getPriorityColor(todo.priority)}`}
                              >
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={todo.status === "completed"}
                                    onChange={() => handleToggleTodo(todo.id, todo.status)}
                                    className="mt-1 h-5 w-5 rounded border-stone-300 text-orange-600 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 cursor-pointer"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                      <h4 className={`text-sm font-medium ${
                                        todo.status === "completed"
                                          ? "line-through text-stone-500 dark:text-stone-500"
                                          : "text-stone-900 dark:text-stone-50"
                                      }`}>
                                        {getCategoryIcon(todo.category)} {todo.title}
                                      </h4>
                                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${
                                        todo.priority === "high"
                                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                          : todo.priority === "medium"
                                            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                                            : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                      }`}>
                                        {todo.priority}
                                      </span>
                                    </div>
                                    <p className={`text-sm ${
                                      todo.status === "completed"
                                        ? "text-stone-500 dark:text-stone-500"
                                        : "text-stone-600 dark:text-stone-400"
                                    }`}>
                                      {todo.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
