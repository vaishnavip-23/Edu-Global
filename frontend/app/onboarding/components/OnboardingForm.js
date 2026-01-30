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

    // Exam Scores
    ielts_score: "",
    toefl_score: "",
    gre_quant_score: "",
    gre_verbal_score: "",
    gre_awa_score: "",
    gmat_score: "",
  });

  const fetchExistingData = useCallback(async () => {
    try {
      const token = await getToken();

      if (!token) {
        console.warn("No authentication token available");
        setLoadingData(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/onboarding/${user.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Parse preferred_countries back to array
        const countries = data.preferred_countries
          ? data.preferred_countries.split(", ").filter((c) => c)
          : [];

        // Populate form with existing data
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
          // Exam Scores
          ielts_score: data.ielts_score ? String(data.ielts_score) : "",
          toefl_score: data.toefl_score ? String(data.toefl_score) : "",
          gre_quant_score: data.gre_quant_score
            ? String(data.gre_quant_score)
            : "",
          gre_verbal_score: data.gre_verbal_score
            ? String(data.gre_verbal_score)
            : "",
          gre_awa_score: data.gre_awa_score ? String(data.gre_awa_score) : "",
          gmat_score: data.gmat_score ? String(data.gmat_score) : "",
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
    const step1Complete =
      data.education_level && data.degree_major && data.graduation_year;
    if (!step1Complete) return 1;

    // Check Step 2 completion
    const step2Complete =
      data.target_degree &&
      data.field_of_study &&
      data.target_intake_year &&
      data.preferred_countries;
    if (!step2Complete) return 2;

    // Check Step 3 completion
    const step3Complete = data.budget_range && data.funding_plan;
    if (!step3Complete) return 3;

    // Check Step 4 completion
    const step4Complete =
      data.ielts_status && data.gre_status && data.sop_status;
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
    const missingFields = [];

    if (step === 1) {
      if (!formData.education_level) missingFields.push("Education level");
      if (!formData.degree_major) missingFields.push("Degree/Major");
      if (!formData.graduation_year) missingFields.push("Graduation year");

      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(", ")}`);
        return false;
      }

      if (formData.degree_major === "other" && !formData.major_other.trim()) {
        setError("Please specify your degree/major");
        return false;
      }
    }

    if (step === 2) {
      if (!formData.target_degree) missingFields.push("Target degree");
      if (!formData.field_of_study) missingFields.push("Field of study");
      if (!formData.target_intake_year)
        missingFields.push("Target intake year");
      if (formData.preferred_countries.length === 0)
        missingFields.push("Preferred countries");

      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(", ")}`);
        return false;
      }
    }

    if (step === 3) {
      if (!formData.budget_range) missingFields.push("Budget range");
      if (!formData.funding_plan) missingFields.push("Funding plan");

      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(", ")}`);
        return false;
      }
    }

    if (step === 4) {
      if (!formData.ielts_status) missingFields.push("IELTS/TOEFL status");
      if (!formData.gre_status) missingFields.push("GRE/GMAT status");
      if (!formData.sop_status) missingFields.push("SOP status");

      if (missingFields.length > 0) {
        setError(`Please fill in: ${missingFields.join(", ")}`);
        return false;
      }
    }

    return true;
  };

  const saveStep = async (isFinalSubmit = false) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting to get authentication token...");
      const token = await getToken();
      console.log(
        "Token retrieved:",
        token ? `${token.substring(0, 20)}...` : "null/undefined",
      );

      if (!token) {
        throw new Error(
          "Failed to get authentication token. Please try signing in again.",
        );
      }

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
        // Exam Scores
        ielts_score: formData.ielts_score
          ? parseFloat(formData.ielts_score)
          : null,
        toefl_score: formData.toefl_score
          ? parseInt(formData.toefl_score)
          : null,
        gre_quant_score: formData.gre_quant_score
          ? parseInt(formData.gre_quant_score)
          : null,
        gre_verbal_score: formData.gre_verbal_score
          ? parseInt(formData.gre_verbal_score)
          : null,
        gre_awa_score: formData.gre_awa_score
          ? parseFloat(formData.gre_awa_score)
          : null,
        gmat_score: formData.gmat_score ? parseInt(formData.gmat_score) : null,
        is_final_submit: isFinalSubmit,
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const response = await fetch(`${apiUrl}/api/onboarding/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

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
      }
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
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
      <div className="animate-scale-in rounded-2xl bg-white p-8 shadow-lg ring-1 ring-stone-100 dark:bg-stone-950 dark:ring-stone-800">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-500 border-r-transparent"></div>
            <p className="mt-4 text-sm text-stone-600 dark:text-stone-400">
              Loading your information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="animate-scale-in flex min-h-0 flex-1 flex-col rounded-2xl bg-white p-6 shadow-lg ring-1 ring-stone-100 dark:bg-stone-950 dark:ring-stone-800 sm:p-6">
      <ProgressBar percentage={progressPercentage} />

      <div className="shrink-0 mb-4">
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 sm:text-sm">
          Step {currentStep} of 4
        </p>
        <h1 className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-50 sm:text-2xl">
          {currentStep === 1 && "Academic Background"}
          {currentStep === 2 && "Study Goal"}
          {currentStep === 3 && "Budget"}
          {currentStep === 4 && "Exams & Readiness"}
        </h1>
      </div>

      {error && (
        <div className="shrink-0 mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Step content — scrolls inside card when needed; scrollbar hidden for clean look */}
      <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto -mx-1 px-1">
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
      </div>

      {/* Buttons — always visible at bottom */}
      <div className="mt-6 shrink-0 flex gap-4">
        {currentStep > 1 && (
          <button
            onClick={handleBack}
            className="flex-1 rounded-lg border-2 border-stone-200 px-6 py-3 font-semibold text-stone-900 shadow-sm transition-all duration-200 hover:bg-stone-50 hover:border-stone-300 hover:shadow-md active:scale-[0.98] dark:border-stone-700 dark:text-stone-100 dark:hover:bg-stone-800"
          >
            ← Back
          </button>
        )}

        {currentStep < 4 && (
          <button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Saving...
              </span>
            ) : (
              "Next Step →"
            )}
          </button>
        )}

        {currentStep === 4 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/20 transition-all duration-200 hover:shadow-xl hover:shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Completing...
              </span>
            ) : (
              "Complete Onboarding & Access Dashboard"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
