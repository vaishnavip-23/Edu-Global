"use client";

import { useState } from "react";

export default function UniversityCard({
  university,
  onShortlist,
  onLock,
  onRemove,
  onRequestUnlock,
  onRequestLock,
  loading,
  variant = "universities", // "universities" or "shortlist"
}) {
  const [expanded, setExpanded] = useState(false);

  const getCategoryColor = (category) => {
    switch (category) {
      case "Dream":
        // FIXED: Purple for Dream (was Orange)
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
      case "Target":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "Safe":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 dark:border-stone-800 dark:bg-stone-900">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
              {university.university_name}
            </h3>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {university.city ? `${university.city}, ` : ''}{university.country}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getCategoryColor(
              university.category,
            )}`}
          >
            {university.category}
          </span>
        </div>
      </div>

      {/* Program Info */}
      <div className="mb-4 space-y-2 text-sm">
        <div>
          <span className="font-medium text-stone-700 dark:text-stone-300">
            {university.program_name}
          </span>
        </div>
        <div className="flex flex-wrap gap-4 text-stone-600 dark:text-stone-400">
          <span>📚 {university.degree_type || "Masters"}</span>
          <span>⏱️ {university.program_duration_years || 2} years</span>
          <span>
            💰 ${(university.estimated_total_cost_usd || university.estimatedAnnualCostUSD || 0).toLocaleString()}/year
          </span>
        </div>
      </div>

      {/* Cost Level & Acceptance Chance */}
      {(university.cost_level || university.acceptance_chance) && (
        <div className="mb-4 flex gap-4 text-xs text-stone-600 dark:text-stone-400">
          {university.cost_level && (
            <span className="rounded-md bg-stone-100 px-2 py-1 dark:bg-stone-800">
              Cost: {university.cost_level}
            </span>
          )}
          {university.acceptance_chance && (
            <span className="rounded-md bg-stone-100 px-2 py-1 dark:bg-stone-800">
              Chance: {university.acceptance_chance}
            </span>
          )}
        </div>
      )}

      {/* Exam Requirements Summary */}
      {university.exam_requirements_summary &&
       university.exam_requirements_summary.length > 0 && (
        <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
          <p className="mb-1 text-xs font-semibold text-blue-900 dark:text-blue-300">
            📝 Exam Requirements
          </p>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-400">
            {university.exam_requirements_summary.map((req, idx) => (
              <li key={idx}>• {req}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Match Score - only show on universities page, not shortlist page */}
      {variant === "universities" && university.match_score !== undefined && university.match_score !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-600 dark:text-stone-400">
              Match Score
            </span>
            <span className="font-semibold text-orange-600 dark:text-orange-400">
              {university.match_score}/100
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-stone-100 dark:bg-stone-800">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-orange-600 to-blue-600"
              style={{ width: `${university.match_score}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Fit Reasons */}
      {university.fit_reasons && university.fit_reasons.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
            Why it fits:
          </p>
          <ul className="space-y-1 text-sm text-stone-600 dark:text-stone-400">
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
          <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
            Risks to consider:
          </p>
          <ul className="space-y-1 text-sm text-stone-600 dark:text-stone-400">
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
        <div className="mb-4 space-y-3 border-t border-stone-200 pt-4 text-sm dark:border-stone-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-stone-500 dark:text-stone-400">
                Competition:
              </span>{" "}
              <span className="text-stone-900 dark:text-stone-50">
                {university.competition_level}
              </span>
            </div>
            <div>
              <span className="text-stone-500 dark:text-stone-400">
                Acceptance:
              </span>{" "}
              <span className="text-stone-900 dark:text-stone-50">
                {university.acceptance_rate_estimate}
              </span>
            </div>
            <div>
              <span className="text-stone-500 dark:text-stone-400">
                Min GPA:
              </span>{" "}
              <span className="text-stone-900 dark:text-stone-50">
                {university.minimum_gpa_estimate}
              </span>
            </div>
            <div>
              <span className="text-stone-500 dark:text-stone-400">
                Avg Salary:
              </span>{" "}
              <span className="text-stone-900 dark:text-stone-50">
                ${university.average_salary_usd.toLocaleString()}
              </span>
            </div>
          </div>

          {university.strength_tags && university.strength_tags.length > 0 && (
            <div>
              <span className="text-stone-500 dark:text-stone-400">
                Strengths:{" "}
              </span>
              <div className="mt-1 flex flex-wrap gap-2">
                {university.strength_tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-700 dark:bg-stone-800 dark:text-stone-300"
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
          className="flex-1 rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          {expanded ? "Show Less" : "View Details"}
        </button>

        {variant === "universities" ? (
          <>
            {/* Universities Page: Shortlist Button */}
            <button
              onClick={() =>
                onShortlist(university.university_id, university.is_shortlisted, university)
              }
              disabled={loading}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                university.is_shortlisted
                  ? "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300"
                  : "bg-orange-600 text-white hover:bg-orange-700"
              } disabled:opacity-50`}
            >
              {loading
                ? "..."
                : university.is_shortlisted
                  ? "Shortlisted ✓"
                  : "Shortlist"}
            </button>
            {/* Lock Button (only if shortlisted) */}
            {university.is_shortlisted && (
              <button
                onClick={() => {
                  if (university.is_locked && onRequestUnlock) {
                    onRequestUnlock({
                      universityId: university.university_id,
                      universityName: university.university_name,
                    });
                  } else if (!university.is_locked && onRequestLock) {
                    onRequestLock({
                      universityId: university.university_id,
                      universityName: university.university_name,
                      country: university.country,
                      category: university.category,
                    });
                  } else {
                    onLock(university.university_id, university.is_locked);
                  }
                }}
                disabled={loading}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  university.is_locked
                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300"
                    : "bg-stone-600 text-white hover:bg-stone-700"
                } disabled:opacity-50`}
              >
                {university.is_locked ? "🔒 Unlock" : "🔓 Lock"}
              </button>
            )}
          </>
        ) : (
          <>
            {/* Shortlist Page: Lock Choice + Remove OR Unlock + Application */}
            {university.is_locked ? (
              <>
                <button
                  onClick={() => {
                    if (onRequestUnlock) {
                      onRequestUnlock({
                        universityId: university.university_id,
                        universityName: university.university_name,
                      });
                    } else {
                      onLock(university.university_id, true);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 transition hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 disabled:opacity-50"
                >
                  {loading ? "..." : "🔒 Unlock"}
                </button>
                <button
                  onClick={() => window.location.href = `/application?university=${university.university_id || university.id}`}
                  className="flex-1 rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
                >
                  📋 Application
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    if (onRequestLock) {
                      onRequestLock({
                        universityId: university.university_id,
                        universityName: university.university_name,
                        country: university.country,
                        category: university.category,
                      });
                    } else {
                      onLock(university.university_id, false);
                    }
                  }}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-stone-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700 disabled:opacity-50"
                >
                  {loading ? "..." : "🔓 Lock Choice"}
                </button>
                <button
                  onClick={() => onRemove && onRemove(university.university_id)}
                  disabled={loading}
                  className="flex-1 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-50"
                >
                  {loading ? "..." : "Remove"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
