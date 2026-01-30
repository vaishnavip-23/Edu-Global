"use client";

/**
 * Modal that appears when user tries to access protected content
 * before completing onboarding
 */
export default function OnboardingRequiredModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-stone-900 animate-scale-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <span className="text-3xl">🎓</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-4 text-center text-xl font-semibold text-stone-900 dark:text-stone-50">
          Complete Your Profile First
        </h3>

        {/* Description */}
        <p className="mt-3 text-center text-sm text-stone-600 dark:text-stone-400">
          This feature is <strong>unlocked after completing onboarding</strong>.
          Tell us about your academic background, goals, and preferences to get
          personalized recommendations.
        </p>

        {/* Benefits */}
        <div className="mt-4 space-y-2 rounded-lg border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/50">
          <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            What you&apos;ll unlock:
          </p>
          <ul className="space-y-1 text-xs text-stone-600 dark:text-stone-400">
            <li>✓ Personalized university recommendations</li>
            <li>✓ AI Counsellor guidance</li>
            <li>✓ Application timeline & to-do lists</li>
            <li>✓ Shortlist management</li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-orange-700 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          Complete Onboarding Now
        </button>

        {/* Helper text */}
        <p className="mt-3 text-center text-xs text-stone-500 dark:text-stone-400">
          Takes only 3-5 minutes
        </p>
      </div>
    </div>
  );
}
