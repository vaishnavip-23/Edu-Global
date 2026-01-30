import { FormSelect, FormInput } from "../FormComponents";

export default function StepOne({ formData, updateFormData }) {
  const educationLevels = [
    "High School / Secondary School",
    "Diploma",
    "Associate Degree",
    "Bachelor's Degree - Pursuing",
    "Bachelor's Degree - Completed",
    "Master's Degree - Pursuing",
    "Master's Degree - Completed",
    "PhD - Pursuing",
    "PhD - Completed",
  ];

  // Majors aligned with fields present in universities (current background)
  const majors = [
    "Computer Science",
    "Data Science",
    "Software Engineering",
    "Information Technology",
    "Engineering",
    "Business Administration",
    "Business",
    "Management",
    "Finance",
    "Economics",
    "Law",
    "Mathematics",
    "Life Sciences",
    "Biotechnology",
    "Environmental Science",
    "Public Health",
    "Statistics",
    { value: "other", label: "Other (Specify below)" },
  ];

  const graduationYears = Array.from({ length: 11 }, (_, i) =>
    String(2020 + i),
  );

  const gpaOptions = [
    "Not Applicable",
    "Above 3.7 / 90%+",
    "3.5 - 3.7 / 85-90%",
    "3.3 - 3.5 / 80-85%",
    "3.0 - 3.3 / 75-80%",
    "2.7 - 3.0 / 70-75%",
    "Below 2.7 / Below 70%",
  ];

  return (
    <div className="space-y-4">
      <FormSelect
        label="Current Education Level"
        value={formData.education_level}
        onChange={(e) => updateFormData("education_level", e.target.value)}
        options={educationLevels}
        placeholder="Select your current education level"
        required
      />

      <div>
        <FormSelect
          label="Degree / Major"
          value={formData.degree_major}
          onChange={(e) => updateFormData("degree_major", e.target.value)}
          options={majors}
          placeholder="Select your degree/major"
          required
        />

        {formData.degree_major === "other" && (
          <FormInput
            value={formData.major_other}
            onChange={(e) => updateFormData("major_other", e.target.value)}
            placeholder="Enter your degree/major"
          />
        )}
      </div>

      <FormSelect
        label="Graduation Year"
        value={formData.graduation_year}
        onChange={(e) => updateFormData("graduation_year", e.target.value)}
        options={graduationYears}
        placeholder="Select year"
        required
      />

      <FormSelect
        label="GPA or Percentage"
        value={formData.gpa}
        onChange={(e) => updateFormData("gpa", e.target.value)}
        options={gpaOptions}
        placeholder="Select GPA range (optional)"
        helperText="Approximate range is fine"
      />
    </div>
  );
}
