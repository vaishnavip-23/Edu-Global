"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

export default function ApplicationPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [shortlist, setShortlist] = useState([]);
  const [locked, setLocked] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [todos, setTodos] = useState([]);
  const [actionLoading, setActionLoading] = useState({});

  const fetchShortlist = useCallback(async () => {
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
      const list = data.shortlist || [];
      setShortlist(list);
      const lockedList = list.filter((u) => u.is_locked);
      setLocked(lockedList);
      if (lockedList.length > 0 && !selectedId) {
        setSelectedId(lockedList[0].university_id);
      } else if (lockedList.length === 0) {
        setSelectedId(null);
      }
    }
  }, [getToken, selectedId]);

  const fetchTodos = useCallback(
    async (universityId) => {
      if (!universityId) {
        setTodos([]);
        return;
      }
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/todos/?university_id=${encodeURIComponent(universityId)}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setTodos(data.todos || []);
      }
    },
    [getToken],
  );

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (isLoaded && isSignedIn) {
      setLoading(true);
      fetchShortlist().finally(() => setLoading(false));
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (selectedId) fetchTodos(selectedId);
    else setTodos([]);
  }, [selectedId, fetchTodos]);

  const toggleTodoStatus = async (todoId, currentStatus) => {
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    setTodos((prev) =>
      prev.map((t) => (t.id === todoId ? { ...t, status: newStatus } : t)),
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
        setTodos((prev) =>
          prev.map((t) =>
            t.id === todoId ? { ...t, status: currentStatus } : t,
          ),
        );
      }
    } catch (error) {
      console.error("Error updating todo:", error);
      setTodos((prev) =>
        prev.map((t) =>
          t.id === todoId ? { ...t, status: currentStatus } : t,
        ),
      );
    }
  };

  const selected = locked.find((u) => u.university_id === selectedId);
  const pendingCount = todos.filter((t) => t.status !== "completed").length;
  const totalTodos = todos.length;
  const completedCount = totalTodos - pendingCount;
  const readinessPercent = totalTodos
    ? Math.round((completedCount / totalTodos) * 100)
    : 0;

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (locked.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
        <header className="border-b border-zinc-200 bg-white/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
                SA
              </div>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
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
        </header>
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Application Preparation
          </h1>
          <p className="mt-4 text-zinc-600 dark:text-zinc-400">
            Lock at least one university to unlock application guidance,
            documents, and tasks.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={() => router.push("/shortlist")}
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
            >
              Your Shortlist
            </button>
            <button
              onClick={() => router.push("/universities")}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Discover Universities
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
      <header className="border-b border-zinc-200 bg-white/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
              SA
            </div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
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
              onClick={() => router.push("/shortlist")}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Shortlist
            </button>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
          Application Preparation
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Manage your tasks and documents for your locked universities.
        </p>

        {/* Select locked university */}
        {locked.length > 1 && (
          <div className="mt-6">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Target university
            </label>
            <select
              value={selectedId || ""}
              onChange={(e) => setSelectedId(e.target.value)}
              className="mt-2 block w-full max-w-md rounded-lg border border-zinc-200 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            >
              {locked.map((u) => (
                <option key={u.university_id} value={u.university_id}>
                  {u.university_name} ({u.country})
                </option>
              ))}
            </select>
          </div>
        )}

        {selected && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {/* Target University card */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                TARGET UNIVERSITY
              </h2>
              <div className="mt-4">
                <p className="font-medium text-zinc-900 dark:text-zinc-50">
                  {selected.university_name}
                </p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {selected.country}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    LOCKED
                  </span>
                  <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {selected.category || "—"}
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Readiness Score
                  </p>
                  <p className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
                    {readinessPercent}% completed
                  </p>
                  <div className="mt-2 h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-purple-600"
                      style={{ width: `${readinessPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Plan */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Action Plan for {selected.university_name}
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {pendingCount} Pending
              </p>
              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                {todos.length === 0 ? (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    No tasks yet. Ask the AI Counsellor to create application
                    tasks for this university.
                  </p>
                ) : (
                  todos.map((todo) => (
                    <div
                      key={todo.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        todo.status === "completed"
                          ? "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.status === "completed"}
                        onChange={() => toggleTodoStatus(todo.id, todo.status)}
                        className="mt-1 h-4 w-4 cursor-pointer rounded border-zinc-300 text-purple-600"
                      />
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            todo.status === "completed"
                              ? "line-through text-zinc-500"
                              : "text-zinc-900 dark:text-zinc-50"
                          }`}
                        >
                          {todo.title}
                        </p>
                        {todo.description && (
                          <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            {todo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
