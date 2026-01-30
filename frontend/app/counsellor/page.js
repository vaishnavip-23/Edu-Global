"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useOnboardingProtection } from "../hooks/useOnboardingProtection";
import OnboardingRequiredModal from "../components/OnboardingRequiredModal";

export default function CounsellorPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const {
    loading: onboardingLoading,
    complete: onboardingComplete,
    showModal,
    closeModalAndRedirect,
  } = useOnboardingProtection();

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) return;
    if (!onboardingComplete && isSignedIn) return;

    // Add welcome message
    if (isLoaded && isSignedIn && onboardingComplete && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content:
            "👋 Hi! I'm your AI Counsellor. I'm here to guide you through your study-abroad journey step by step.\n\nI can help you:\n• Understand your profile strengths and gaps\n• Recommend universities that fit your goals\n• Shortlist and lock universities (or remove/unlock them)\n• Create and delete to-do tasks\n• Guide you through each stage\n\nJust tell me what you want to do, and I'll take action immediately!\n\nWhat would you like to know or do today?",
        },
      ]);
    }
  }, [isLoaded, isSignedIn, onboardingComplete, router, messages.length]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

      // Prepare conversation history (exclude welcome message)
      const conversationHistory = messages
        .filter((_, idx) => idx > 0) // Skip welcome message
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch(`${apiUrl}/api/ai-counsellor/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversation_history: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to get response");
      }

      const data = await response.json();

      // Format the response with tool results
      let assistantMessage = data.message;

      // If there were tool calls, append the results
      if (data.tool_results && data.tool_results.length > 0) {
        assistantMessage += "\n\n**Actions taken:**\n";
        for (const toolResult of data.tool_results) {
          const result = toolResult.result;
          const toolName = toolResult.tool;

          // Handle different tool result formats
          if (result.success !== undefined) {
            // Success/error format
            if (result.success) {
              assistantMessage += `✅ ${result.message}\n`;
            } else {
              assistantMessage += `❌ ${result.message || "Action failed"}\n`;
            }
          } else if (result.error) {
            // Error format
            assistantMessage += `❌ Error: ${result.error}\n`;
          } else if (toolName === "get_user_profile") {
            // User profile format
            assistantMessage += `\n**📋 Your Profile:**\n`;
            assistantMessage += `• **Education**: ${result.education_level} in ${result.degree_major}\n`;
            assistantMessage += `• **GPA**: ${result.gpa}\n`;
            assistantMessage += `• **Target**: ${result.target_degree} in ${result.field_of_study}\n`;
            assistantMessage += `• **Target Intake**: ${result.target_intake_year}\n`;
            assistantMessage += `• **Countries**: ${result.preferred_countries}\n`;
            assistantMessage += `• **Budget**: ${result.budget_range}\n`;
            assistantMessage += `• **English Exam**: ${result.ielts_status || result.toefl_status || "Not started"}\n`;
            assistantMessage += `• **Standardized Tests**: GRE ${result.gre_status} / GMAT ${result.gmat_status}\n`;
            assistantMessage += `• **SOP Status**: ${result.sop_status}\n`;
          } else if (result.dream || result.target || result.safe) {
            // University recommendations format
            assistantMessage += `\n**Universities Found:**\n`;
            if (result.safe && result.safe.length > 0) {
              assistantMessage += `\n**Safe Schools:**\n`;
              result.safe.forEach((uni) => {
                assistantMessage += `• ${uni.university_name} (${uni.country})\n`;
              });
            }
            if (result.target && result.target.length > 0) {
              assistantMessage += `\n**Target Schools:**\n`;
              result.target.forEach((uni) => {
                assistantMessage += `• ${uni.university_name} (${uni.country})\n`;
              });
            }
            if (result.dream && result.dream.length > 0) {
              assistantMessage += `\n**Dream Schools:**\n`;
              result.dream.forEach((uni) => {
                assistantMessage += `• ${uni.university_name} (${uni.country})\n`;
              });
            }
          } else if (result.universities) {
            // Shortlist format
            assistantMessage += `\n**Your Shortlist (${result.count} universities):**\n`;
            result.universities.forEach((uni) => {
              const locked = uni.locked ? "🔒" : "";
              assistantMessage += `• ${uni.name} ${locked}\n`;
            });
          } else if (result.todos) {
            // Todo list format
            assistantMessage += `\n**Your Tasks (${result.count} pending):**\n`;
            result.todos.forEach((todo) => {
              assistantMessage += `• ${todo.title} [${todo.priority}]\n`;
            });
          }
        }
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isLoaded || onboardingLoading) {
    return (
      <main
        className="min-h-screen bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900"
        id="main-content"
      >
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
                Loading...
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <OnboardingRequiredModal
        isOpen={showModal}
        onClose={closeModalAndRedirect}
      />
      <main
        className="flex h-[calc(100vh-4rem)] flex-col bg-gradient-to-br from-stone-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 animate-fade-in"
        id="main-content"
      >
        {/* Header */}
        <div className="border-b border-stone-200 bg-white/80 backdrop-blur-sm px-4 py-2 dark:border-stone-800 dark:bg-stone-900/80">
          <div className="mx-auto max-w-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <span className="text-xl">🤖</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
                  AI Counsellor
                </h1>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Your personal study-abroad advisor
                </p>
              </div>
            </div>
            {messages.length > 1 && (
              <button
                onClick={() => setMessages([messages[0]])}
                className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                Clear Chat
              </button>
            )}
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          <div className="mx-auto max-w-3xl space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`min-w-0 max-w-[85%] rounded-2xl px-4 py-3 break-words ${
                    message.role === "user"
                      ? "bg-orange-600 text-white"
                      : "border border-stone-200 bg-white text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50"
                  }`}
                >
                  <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mt-3 prose-headings:mb-2 prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 break-words">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="min-w-0 max-w-[85%] rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-orange-600"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-orange-600 [animation-delay:0.2s]"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-orange-600 [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-stone-200 bg-white/50 backdrop-blur-sm px-4 py-3 dark:border-stone-800 dark:bg-stone-900/50">
          <div className="mx-auto max-w-3xl">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your study-abroad journey..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:border-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-600/20 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-50 dark:placeholder-stone-600"
                style={{
                  minHeight: "40px",
                  maxHeight: "100px",
                }}
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                aria-label="Send message"
                className="rounded-xl bg-orange-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                onClick={() => setInput("Recommend universities for me")}
                className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 hover:border-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
              >
                💡 Recommend universities
              </button>
              <button
                onClick={() => setInput("What's my profile strength?")}
                className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 hover:border-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
              >
                📊 Check my profile
              </button>
              <button
                onClick={() => setInput("Show my shortlisted universities")}
                className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 hover:border-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
              >
                📋 View shortlist
              </button>
              <button
                onClick={() => setInput("What should I do next?")}
                className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-700 hover:border-orange-600 hover:bg-orange-50 hover:text-orange-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-orange-600 dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
              >
                ⏭️ Next steps
              </button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
