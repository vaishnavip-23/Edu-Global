"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import StepOne from "../onboarding/components/steps/StepOne";
import StepTwo from "../onboarding/components/steps/StepTwo";
import StepThree from "../onboarding/components/steps/StepThree";
import StepFour from "../onboarding/components/steps/StepFour";

export default function ProfilePage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    education_level: "",
    degree_major: "",
    major_other: "",
    graduation_year: "",
    gpa: "",
    target_degree: "",
    field_of_study: "",
    target_intake_year: "",
    preferred_countries: [],
    budget_range: "",
    funding_plan: "",
    ielts_status: "",
    toefl_status: "",
    gre_status: "",
    gmat_status: "",
    sop_status: "",
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/onboarding/${user.id}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        const countries = data.preferred_countries
          ? data.preferred_countries.split(", ").filter((c) => c)
          : [];
        setFormData({
          education_level: data.education_level || "",
          degree_major: data.degree_major || "",
          major_other: "",
          graduation_year: data.graduation_year
            ? String(data.graduation_year)
            : "",
          gpa: data.gpa || "",
          target_degree: data.target_degree || "",
          field_of_study: data.field_of_study || "",
          target_intake_year: data.target_intake_year
            ? `Fall ${data.target_intake_year}`
            : "",
          preferred_countries: countries,
          budget_range: data.budget_range || "",
          funding_plan: data.funding_plan || "",
          ielts_status: data.ielts_status || "",
          toefl_status: data.toefl_status || "",
          gre_status: data.gre_status || "",
          gmat_status: data.gmat_status || "",
          sop_status: data.sop_status || "",
        });
      } else if (response.status === 404) {
        router.push("/onboarding");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, router]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (isLoaded && isSignedIn && user?.id) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      fetch(`${apiUrl}/api/onboarding/status/${user.id}`, {
        headers: { "Content-Type": "application/json" },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.onboarding_complete) {
            router.push("/onboarding");
            return;
          }
          fetchProfile();
        })
        .catch(() => fetchProfile());
    }
  }, [isLoaded, isSignedIn, user?.id, router, fetchProfile]);

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
    setSaved(false);
  };

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const apiData = {
        clerk_user_id: user.id,
        email: user?.primaryEmailAddress?.emailAddress || "",
        education_level: formData.education_level || null,
        degree_major:
          formData.degree_major === "other"
            ? formData.major_other
            : formData.degree_major || null,
        graduation_year: formData.graduation_year || null,
        gpa: formData.gpa || null,
        target_degree: formData.target_degree || null,
        field_of_study: formData.field_of_study || null,
        target_intake_year: formData.target_intake_year || null,
        preferred_countries:
          formData.preferred_countries.length > 0
            ? formData.preferred_countries.join(", ")
            : null,
        budget_range: formData.budget_range || null,
        funding_plan: formData.funding_plan || null,
        ielts_status: formData.ielts_status || null,
        toefl_status: formData.toefl_status || null,
        gre_status: formData.gre_status || null,
        gmat_status: formData.gmat_status || null,
        sop_status: formData.sop_status || null,
        is_final_submit: false,
      };
      const response = await fetch(`${apiUrl}/api/onboarding/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Failed to save");
      }
      setSaved(true);
    } catch (err) {
      setError(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
        <div className="mx-auto max-w-2xl px-4 py-10 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading profile...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black dark:to-zinc-900">
      <header className="border-b border-zinc-200 bg-white/50 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-xs font-semibold text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900">
              SA
            </div>
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
              Edit Profile
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

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Profile Management
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Update your profile. Changes will update recommendations and tasks.
        </p>

        <div className="mt-8 space-y-10">
          <section>
            <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Academic Background
            </h2>
            <StepOne formData={formData} updateFormData={updateFormData} />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Study Goal
            </h2>
            <StepTwo formData={formData} updateFormData={updateFormData} />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Budget
            </h2>
            <StepThree formData={formData} updateFormData={updateFormData} />
          </section>
          <section>
            <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              Exams & Readiness
            </h2>
            <StepFour formData={formData} updateFormData={updateFormData} />
          </section>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {saved && (
          <p className="mt-4 text-sm text-green-600 dark:text-green-400">
            Profile saved. Recommendations and tasks will use your updated data.
          </p>
        )}

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-zinc-200 px-6 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </main>
  );
}
