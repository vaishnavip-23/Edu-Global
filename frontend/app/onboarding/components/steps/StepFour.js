import { useState } from "react";
import { FormSelect, FormInput } from "../FormComponents";

export default function StepFour({ formData, updateFormData }) {
  // Track which score inputs should be shown
  const [showIeltsScore, setShowIeltsScore] = useState(
    formData.ielts_status === "Completed - Results Received",
  );
  const [showToeflScore, setShowToeflScore] = useState(
    formData.toefl_status === "Completed - Results Received",
  );
  const [showGreScores, setShowGreScores] = useState(
    formData.gre_status === "Completed - Results Received",
  );
  const [showGmatScore, setShowGmatScore] = useState(
    formData.gmat_status === "Completed - Results Received",
  );

  const englishTestOptions = [
    "Not Started",
    "Preparing / Studying",
    "Scheduled / Exam Booked",
    "Completed - Awaiting Results",
    "Completed - Results Received",
    "Not Required",
  ];

  const standardizedTestOptions = [
    "Not Started",
    "Preparing / Studying",
    "Scheduled / Exam Booked",
    "Completed - Awaiting Results",
    "Completed - Results Received",
    "Not Required / Not Applicable",
  ];

  const sopOptions = [
    "Not Started",
    "Planning / Brainstorming",
    "Draft in Progress",
    "Draft Ready",
    "Finalized",
  ];

  return (
    <div className="space-y-4">
      {/* IELTS Section */}
      <div className="space-y-2">
        <FormSelect
          label="IELTS Status *"
          value={formData.ielts_status}
          onChange={(e) => {
            updateFormData("ielts_status", e.target.value);
            setShowIeltsScore(
              e.target.value === "Completed - Results Received",
            );
            // Clear score if not "Completed - Results Received"
            if (e.target.value !== "Completed - Results Received") {
              updateFormData("ielts_score", "");
            }
          }}
          options={englishTestOptions}
          placeholder="Select IELTS status"
          helperText="International English Language Testing System"
          required
        />

        {showIeltsScore && (
          <FormInput
            label="IELTS Overall Band Score"
            type="number"
            step="0.5"
            min="0"
            max="9"
            value={formData.ielts_score || ""}
            onChange={(e) => updateFormData("ielts_score", e.target.value)}
            placeholder="e.g., 7.5"
            helperText="Enter your overall band score (0-9)"
            required
          />
        )}
      </div>

      {/* TOEFL Section */}
      <div className="space-y-2">
        <FormSelect
          label="TOEFL Status *"
          value={formData.toefl_status}
          onChange={(e) => {
            updateFormData("toefl_status", e.target.value);
            setShowToeflScore(
              e.target.value === "Completed - Results Received",
            );
            if (e.target.value !== "Completed - Results Received") {
              updateFormData("toefl_score", "");
            }
          }}
          options={englishTestOptions}
          placeholder="Select TOEFL status"
          helperText="Test of English as a Foreign Language"
          required
        />

        {showToeflScore && (
          <FormInput
            label="TOEFL Total Score"
            type="number"
            min="0"
            max="120"
            value={formData.toefl_score || ""}
            onChange={(e) => updateFormData("toefl_score", e.target.value)}
            placeholder="e.g., 105"
            helperText="Enter your total score (0-120)"
            required
          />
        )}
      </div>

      {/* GRE Section */}
      <div className="space-y-2">
        <FormSelect
          label="GRE Status *"
          value={formData.gre_status}
          onChange={(e) => {
            updateFormData("gre_status", e.target.value);
            setShowGreScores(e.target.value === "Completed - Results Received");
            if (e.target.value !== "Completed - Results Received") {
              updateFormData("gre_quant_score", "");
              updateFormData("gre_verbal_score", "");
              updateFormData("gre_awa_score", "");
            }
          }}
          options={standardizedTestOptions}
          placeholder="Select GRE status"
          helperText="Graduate Record Examination"
          required
        />

        {showGreScores && (
          <>
            <FormInput
              label="GRE Quantitative Score"
              type="number"
              min="130"
              max="170"
              value={formData.gre_quant_score || ""}
              onChange={(e) =>
                updateFormData("gre_quant_score", e.target.value)
              }
              placeholder="e.g., 165"
              helperText="Quantitative Reasoning score (130-170)"
              required
            />

            <FormInput
              label="GRE Verbal Score"
              type="number"
              min="130"
              max="170"
              value={formData.gre_verbal_score || ""}
              onChange={(e) =>
                updateFormData("gre_verbal_score", e.target.value)
              }
              placeholder="e.g., 160"
              helperText="Verbal Reasoning score (130-170)"
              required
            />

            <FormInput
              label="GRE Analytical Writing (AWA) Score"
              type="number"
              step="0.5"
              min="0"
              max="6"
              value={formData.gre_awa_score || ""}
              onChange={(e) => updateFormData("gre_awa_score", e.target.value)}
              placeholder="e.g., 4.5"
              helperText="Analytical Writing Assessment score (0-6)"
              required
            />
          </>
        )}
      </div>

      {/* GMAT Section */}
      <div className="space-y-2">
        <FormSelect
          label="GMAT Status *"
          value={formData.gmat_status}
          onChange={(e) => {
            updateFormData("gmat_status", e.target.value);
            setShowGmatScore(e.target.value === "Completed - Results Received");
            if (e.target.value !== "Completed - Results Received") {
              updateFormData("gmat_score", "");
            }
          }}
          options={standardizedTestOptions}
          placeholder="Select GMAT status"
          helperText="Graduate Management Admission Test (for MBA programs)"
          required
        />

        {showGmatScore && (
          <FormInput
            label="GMAT Total Score"
            type="number"
            min="200"
            max="800"
            value={formData.gmat_score || ""}
            onChange={(e) => updateFormData("gmat_score", e.target.value)}
            placeholder="e.g., 720"
            helperText="Enter your total score (200-800)"
            required
          />
        )}
      </div>

      {/* Statement of Purpose */}
      <FormSelect
        label="Statement of Purpose (SOP) Status"
        value={formData.sop_status}
        onChange={(e) => updateFormData("sop_status", e.target.value)}
        options={sopOptions}
        placeholder="Select SOP status"
        helperText="Personal essay explaining your goals and motivation"
        required
      />

      <div className="mt-4 rounded-lg border-2 border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/20">
        <h3 className="text-base font-semibold text-green-900 dark:text-green-200">
          ✅ You&apos;re Almost Done!
        </h3>
        <p className="mt-2 text-xs text-green-800 dark:text-green-300 sm:text-sm">
          After completing this step, you&apos;ll get:
        </p>
        <ul className="mt-2 space-y-1 text-xs text-green-800 dark:text-green-300 sm:text-sm">
          <li>✓ Access to AI Counsellor for personalized guidance</li>
          <li>✓ University recommendations based on your profile</li>
          <li>✓ Your customized dashboard and action plan</li>
          <li>✓ AI-generated to-do list</li>
        </ul>
      </div>
    </div>
  );
}
