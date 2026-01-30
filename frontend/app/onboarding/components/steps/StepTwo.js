import { FormSelect, FormLabel } from "../FormComponents";

export default function StepTwo({ formData, updateFormData }) {
  // Options must match universities.json (degreesOffered, fields, country, intakeYears)
  const degreeOptions = [
    "Masters",
    "PhD",
    "MBA",
    "Bachelors",
    "MS",
    "MSc",
    "LL.M",
    "MPhil",
    "MTech",
    "MASc",
    "MEng",
    "MSE",
    "MCS",
  ];
  const fieldOptions = [
    "Artificial Intelligence",
    "Biomedical Engineering",
    "Biotechnology",
    "Business",
    "Business Administration",
    "Business Law",
    "Computer Science",
    "Corporate Law",
    "Cybersecurity",
    "Data Analytics",
    "Data Science",
    "Economics",
    "Engineering",
    "Environmental Science",
    "Entrepreneurship",
    "European Law",
    "Finance",
    "International Law",
    "Public International Law",
    "Life Sciences",
    "Machine Learning",
    "Management",
    "Mathematics",
    "Public Health",
    "Robotics",
    "Software Engineering",
    "Statistics",
  ];
  const intakeOptions = [
    "Fall 2026",
    "Spring 2027",
    "Fall 2027",
    "Spring 2028",
    "Fall 2028",
  ];
  // Top countries by university count, rest grouped as "Others"
  const mainCountries = [
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Netherlands",
    "Germany",
    "India",
    "France",
    "Singapore",
    "China",
  ];

  const otherCountries = [
    "Belgium",
    "Denmark",
    "Finland",
    "Hong Kong",
    "Ireland",
    "Italy",
    "Japan",
    "New Zealand",
    "Norway",
    "Poland",
    "South Korea",
    "Spain",
    "Sweden",
    "Switzerland",
    "Taiwan",
  ];

  const countries = [...mainCountries, "Others"];

  const toggleCountry = (country) => {
    updateFormData(
      "preferred_countries",
      formData.preferred_countries.includes(country)
        ? formData.preferred_countries.filter((c) => c !== country)
        : [...formData.preferred_countries, country],
    );
  };

  return (
    <div className="space-y-4">
      <FormSelect
        label="Intended Degree"
        value={formData.target_degree}
        onChange={(e) => updateFormData("target_degree", e.target.value)}
        options={degreeOptions}
        placeholder="Select degree type"
        required
      />

      <FormSelect
        label="Field of Study"
        value={formData.field_of_study}
        onChange={(e) => updateFormData("field_of_study", e.target.value)}
        options={fieldOptions}
        placeholder="Select your field of study"
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
        <p className="mb-3 text-xs text-zinc-600 dark:text-zinc-400">
          Select all countries you're interested in
        </p>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2">
          {countries.map((country) => (
            <label
              key={country}
              className={`flex cursor-pointer items-center rounded-lg border-2 px-2.5 py-2 text-sm transition-all duration-200 sm:px-3 sm:py-2.5 ${
                formData.preferred_countries.includes(country)
                  ? "border-purple-500 bg-purple-50 shadow-sm dark:border-purple-500 dark:bg-purple-900/30"
                  : "border-zinc-200 bg-white hover:border-purple-300 hover:bg-purple-50/50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-purple-700"
              }`}
            >
              <input
                type="checkbox"
                checked={formData.preferred_countries.includes(country)}
                onChange={() => toggleCountry(country)}
                className="h-4 w-4 cursor-pointer rounded accent-purple-600"
              />
              <span className="ml-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {country}
              </span>
            </label>
          ))}
        </div>
        {formData.preferred_countries.length === 0 && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            Please select at least one country
          </p>
        )}
      </div>
    </div>
  );
}
