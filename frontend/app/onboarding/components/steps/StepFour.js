import { FormSelect } from "../FormComponents";

export default function StepFour({ formData, updateFormData }) {
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
    <div className="space-y-6">
      <FormSelect
        label="IELTS / TOEFL Status"
        value={formData.ielts_status}
        onChange={(e) => updateFormData("ielts_status", e.target.value)}
        options={englishTestOptions}
        placeholder="Select status"
        helperText="English language proficiency test"
        required
      />

      <FormSelect
        label="GRE / GMAT Status"
        value={formData.gre_status}
        onChange={(e) => updateFormData("gre_status", e.target.value)}
        options={standardizedTestOptions}
        placeholder="Select status"
        helperText="Standardized test (required for most Master's/MBA programs)"
        required
      />

      <FormSelect
        label="Statement of Purpose (SOP) Status"
        value={formData.sop_status}
        onChange={(e) => updateFormData("sop_status", e.target.value)}
        options={sopOptions}
        placeholder="Select SOP status"
        helperText="Personal essay explaining your goals and motivation"
        required
      />

      <div className="mt-8 rounded-lg border-2 border-green-200 bg-green-50 p-6 dark:border-green-900/50 dark:bg-green-950/20">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">
          ✅ You&apos;re Almost Done!
        </h3>
        <p className="mt-3 text-sm text-green-800 dark:text-green-300">
          After completing this step, you&apos;ll get:
        </p>
        <ul className="mt-3 space-y-2 text-sm text-green-800 dark:text-green-300">
          <li>✓ Access to AI Counsellor for personalized guidance</li>
          <li>✓ University recommendations based on your profile</li>
          <li>✓ Your customized dashboard and action plan</li>
          <li>✓ AI-generated to-do list</li>
        </ul>
      </div>
    </div>
  );
}
