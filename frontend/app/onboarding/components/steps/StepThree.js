import { FormSelect, FormLabel } from "../FormComponents";

export default function StepThree({ formData, updateFormData }) {
  // Ranges must be parseable by backend (max extracted from "X - Y"); covers university cost range ~$8k–$175k
  const budgetOptions = [
    "$8,000 - $15,000",
    "$15,000 - $25,000",
    "$25,000 - $40,000",
    "$40,000 - $60,000",
    "$60,000 - $80,000",
    "$80,000 - $120,000",
    "$120,000 - $180,000",
    "Not Sure / Flexible",
  ];

  const fundingOptions = [
    {
      value: "self_funded",
      title: "Self-funded",
      description: "I have the financial resources available",
    },
    {
      value: "scholarship",
      title: "Scholarship-dependent",
      description: "I need scholarship support to study abroad",
    },
    {
      value: "loan",
      title: "Loan-dependent",
      description: "I will take an education loan",
    },
    {
      value: "mixed",
      title: "Mixed Funding",
      description: "Combination of self-funding, scholarship, and/or loan",
    },
  ];

  return (
    <div className="space-y-4">
      <FormSelect
        label="Budget Range Per Year"
        value={formData.budget_range}
        onChange={(e) => updateFormData("budget_range", e.target.value)}
        options={budgetOptions}
        placeholder="Select budget range"
        helperText="Total cost including tuition + living expenses per year"
        required
      />

      <div>
        <FormLabel required>Funding Plan</FormLabel>
        <div className="space-y-2">
          {fundingOptions.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start rounded-lg border-2 p-3 transition sm:p-4 ${
                formData.funding_plan === option.value
                  ? "border-purple-600 bg-purple-50 dark:border-purple-500 dark:bg-purple-950/30"
                  : "border-zinc-200 bg-zinc-50 hover:border-purple-400 dark:border-zinc-700 dark:bg-zinc-900"
              }`}
            >
              <input
                type="radio"
                name="funding_plan"
                value={option.value}
                checked={formData.funding_plan === option.value}
                onChange={(e) => updateFormData("funding_plan", e.target.value)}
                className="mt-1 h-4 w-4 cursor-pointer accent-purple-600"
              />
              <div className="ml-3">
                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                  {option.title}
                </p>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {option.description}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
