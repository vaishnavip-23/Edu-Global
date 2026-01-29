"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import StepOne from "./steps/StepOne";
import StepTwo from "./steps/StepTwo";
import StepThree from "./steps/StepThree";
import StepFour from "./steps/StepFour";
import ProgressBar from "./ProgressBar";

export function OnboardingForm() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { user } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    // Step 1
    education_level: "",
    degree_major: "",
    major_other: "",
    graduation_year: "",
    gpa: "",

    // Step 2
    target_degree: "",
    field_of_study: "",
    target_intake_year: "",
    preferred_countries: [],

    // Step 3
    budget_range: "",
    funding_plan: "",

    // Step 4
    ielts_status: "",
    toefl_status: "",
    gre_status: "",
    gmat_status: "",
    sop_status: "",
  });

  const fetchExistingData = useCallback(async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/onboarding/${user.id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Parse preferred_countries back to array
        const countries = data.preferred_countries
          ? data.preferred_countries.split(", ").filter(c => c)
          : [];

        // Populate form with existing data
        setFormData({
          education_level: data.education_level || "",
          degree_major: data.degree_major || "",
          major_other: "",
          graduation_year: data.graduation_year ? String(data.graduation_year) : "",
          gpa: data.gpa || "",
          target_degree: data.target_degree || "",
          field_of_study: data.field_of_study || "",
          target_intake_year: data.target_intake_year ? `Fall ${data.target_intake_year}` : "",
          preferred_countries: countries,
          budget_range: data.budget_range || "",
          funding_plan: data.funding_plan || "",
          ielts_status: data.ielts_status || "",
          toefl_status: data.toefl_status || "",
          gre_status: data.gre_status || "",
          gmat_status: data.gmat_status || "",
          sop_status: data.sop_status || "",
        });

        // Calculate which step to start from
        const startStep = calculateStartStep(data);
        setCurrentStep(startStep);
      }
    } catch (error) {
      console.error("Error fetching existing data:", error);
    } finally {
      setLoadingData(false);
    }
  }, [user]);

  // Fetch existing onboarding data when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchExistingData();
    }
  }, [user?.id, fetchExistingData]);

  const calculateStartStep = (data) => {
    // Check Step 1 completion
    const step1Complete = data.education_level && data.degree_major && data.graduation_year;
    if (!step1Complete) return 1;

    // Check Step 2 completion
    const step2Complete = data.target_degree && data.field_of_study &&
                          data.target_intake_year && data.preferred_countries;
    if (!step2Complete) return 2;

    // Check Step 3 completion
    const step3Complete = data.budget_range && data.funding_plan;
    if (!step3Complete) return 3;

    // Check Step 4 completion
    const step4Complete = data.ielts_status && data.gre_status && data.sop_status;
    if (!step4Complete) return 4;

    // All steps complete, start from step 1 (shouldn't reach here normally)
    return 1;
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateStep = (step) => {
    setError(null);

    if (step === 1) {
      if (
        !formData.education_level ||
        !formData.degree_major ||
        !formData.graduation_year
      ) {
        setError("Please fill in all required fields");
        return false;
      }
      if (
        formData.degree_major === "other" &&
        !formData.major_other.trim()
      ) {
        setError("Please specify your degree/major");
        return false;
      }
    }

    if (step === 2) {
      if (
        !formData.target_degree ||
        !formData.field_of_study ||
        !formData.target_intake_year ||
        formData.preferred_countries.length === 0
      ) {
        setError("Please fill in all required fields");
        return false;
      }
    }

    if (step === 3) {
      if (!formData.budget_range || !formData.funding_plan) {
        setError("Please fill in all required fields");
        return false;
      }
    }

    if (step === 4) {
      if (
        !formData.ielts_status ||
        !formData.gre_status ||
        !formData.sop_status
      ) {
        setError("Please fill in all required fields");
        return false;
      }
    }

    return true;
  };

  const saveStep = async (isFinalSubmit = false) => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

      // Prepare data for API
      const apiData = {
        clerk_user_id: user?.id,
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
        preferred_countries: formData.preferred_countries.length > 0 ? formData.preferred_countries.join(", ") : null,
        budget_range: formData.budget_range || null,
        funding_plan: formData.funding_plan || null,
        ielts_status: formData.ielts_status || null,
        toefl_status: formData.toefl_status || null,
        gre_status: formData.gre_status || null,
        gmat_status: formData.gmat_status || null,
        sop_status: formData.sop_status || null,
        is_final_submit: isFinalSubmit,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(
        `${apiUrl}/api/onboarding/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to save progress");
      }

      return true;
    } catch (err) {
      setError(err.message || "Failed to save progress");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      const saved = await saveStep();
      if (saved) {
        setCurrentStep((prev) => prev + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Use saveStep with isFinalSubmit = true
    const saved = await saveStep(true);
    if (saved) {
      // Redirect to dashboard
      router.push("/dashboard");
    }
  };

  // Show loading state while fetching existing data
  if (loadingData) {
    return (
      <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-100 dark:bg-zinc-950 dark:ring-zinc-800">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
              Loading your information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="rounded-2xl bg-white p-8 shadow-lg ring-1 ring-zinc-100 dark:bg-zinc-950 dark:ring-zinc-800">
      <ProgressBar percentage={progressPercentage} />

      <div className="mb-8">
        <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">
          Step {currentStep} of 4
        </p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          {currentStep === 1 && "Academic Background"}
          {currentStep === 2 && "Study Goal"}
          {currentStep === 3 && "Budget"}
          {currentStep === 4 && "Exams & Readiness"}
        </h1>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Steps */}
      {currentStep === 1 && (
        <StepOne formData={formData} updateFormData={updateFormData} />
      )}
      {currentStep === 2 && (
        <StepTwo formData={formData} updateFormData={updateFormData} />
      )}
      {currentStep === 3 && (
        <StepThree formData={formData} updateFormData={updateFormData} />
      )}
      {currentStep === 4 && (
        <StepFour formData={formData} updateFormData={updateFormData} />
      )}

      {/* Buttons */}
      <div className="mt-8 flex gap-4">
        {currentStep > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 rounded-lg border-2 border-zinc-200 px-6 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            ← Back
          </button>
        )}

        {currentStep < 4 && (
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
          >
            {loading ? "Saving..." : "Next Step →"}
          </button>
        )}

        {currentStep === 4 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
          >
            {loading ? "Completing..." : "Complete Onboarding & Access Dashboard"}
          </button>
        )}
      </div>
    </div>
  );
}
