import { FormSelect, FormInput, FormLabel } from "../FormComponents";

export default function StepTwo({ formData, updateFormData }) {
  const degreeOptions = ["Bachelor's", "Master's", "MBA", "PhD", "Diploma / Certificate"];
  const intakeOptions = ["Fall 2026", "Spring 2027", "Fall 2027", "Spring 2028", "Fall 2028", "Spring 2029"];
  const countries = ["USA", "UK", "Canada", "Australia", "Germany", "Singapore", "Netherlands", "Ireland", "New Zealand", "Other"];

  const toggleCountry = (country) => {
    updateFormData(
      "preferred_countries",
      formData.preferred_countries.includes(country)
        ? formData.preferred_countries.filter((c) => c !== country)
        : [...formData.preferred_countries, country]
    );
  };

  return (
    <div className="space-y-6">
      <FormSelect
        label="Intended Degree"
        value={formData.target_degree}
        onChange={(e) => updateFormData("target_degree", e.target.value)}
        options={degreeOptions}
        placeholder="Select degree type"
        required
      />

      <FormInput
        label="Field of Study"
        value={formData.field_of_study}
        onChange={(e) => updateFormData("field_of_study", e.target.value)}
        placeholder="e.g., Data Science, Business Analytics, Computer Engineering"
        helperText="What do you want to study?"
        required
      />

      <FormSelect
        label="Target Intake Year"
        value={formData.target_intake_year}
        onChange={(e) => updateFormData("target_intake_year", e.target.value)}
        options={intakeOptions}
        placeholder="Select intake"
        required
      />

      <div>
        <FormLabel required>Preferred Countries</FormLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {countries.map((country) => (
            <label
              key={country}
              className="flex cursor-pointer items-center rounded-lg border-2 border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-purple-400 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <input
                type="checkbox"
                checked={formData.preferred_countries.includes(country)}
                onChange={() => toggleCountry(country)}
                className="h-4 w-4 cursor-pointer accent-purple-600"
              />
              <span className="ml-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {country}
              </span>
            </label>
          ))}
        </div>
        {formData.preferred_countries.length === 0 && (
          <p className="mt-2 text-xs text-red-600">Please select at least one country</p>
        )}
      </div>
    </div>
  );
}
