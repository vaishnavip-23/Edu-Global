"""
University Service
Handles loading universities from JSON and matching logic
"""
import json
from pathlib import Path
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class UniversityService:
    """Service for university data and matching"""

    def __init__(self):
        self.universities = []
        self.load_universities()

    def load_universities(self):
        """Load universities from JSON file"""
        try:
            # Get backend directory
            current_file = Path(__file__)
            backend_dir = current_file.parent.parent
            json_path = backend_dir / "data" / "universities.json"

            with open(json_path, 'r', encoding='utf-8') as f:
                self.universities = json.load(f)

            logger.info(f"Loaded {len(self.universities)} universities")
        except Exception as e:
            logger.error(f"Error loading universities: {e}")
            self.universities = []

    def get_all_universities(self) -> List[Dict]:
        """Get all universities"""
        return self.universities

    def get_university_by_id(self, university_id: str) -> Optional[Dict]:
        """Get a specific university by ID with enhanced fields for frontend"""
        for uni in self.universities:
            if uni.get("id") == university_id:
                # Return enhanced version with mapped field names for frontend compatibility
                enhanced = uni.copy()

                # Map backend fields to frontend expected fields
                enhanced["university_id"] = uni.get("id")
                enhanced["university_name"] = uni.get("name")

                # Map cost fields - ensure it's a number
                cost_data = uni.get("estimatedAnnualCostUSD", 0)
                if isinstance(cost_data, dict):
                    cost = cost_data.get("total", 0)
                else:
                    cost = cost_data
                enhanced["estimated_total_cost_usd"] = int(cost) if cost else 0

                # Map other fields
                degrees_offered = uni.get("degreesOffered", [])
                fields = uni.get("fields", [])
                enhanced["degree_type"] = degrees_offered[0] if degrees_offered else "Masters"
                enhanced["field_of_study"] = fields[0] if fields else "Computer Science"
                enhanced["program_name"] = f"{enhanced['degree_type']} in {enhanced['field_of_study']}"
                enhanced["program_duration_years"] = 2  # Default

                # Add difficulty/competition level
                difficulty = uni.get("acceptanceDifficulty", "Medium")
                enhanced["competition_level"] = difficulty
                enhanced["acceptance_rate_estimate"] = difficulty

                # Add defaults for other expected fields
                enhanced["average_salary_usd"] = 85000
                enhanced["minimum_gpa_estimate"] = "3.0"
                enhanced["average_gpa_estimate"] = "3.5"
                enhanced["strength_tags"] = []
                enhanced["cost_level"] = uni.get("budgetTier", "Medium")
                enhanced["match_score"] = 0  # Default match score (will be overridden by recommendation system)

                # Add city if available (from meta, state, or default)
                meta = uni.get("meta", {})
                enhanced["city"] = meta.get("city") or uni.get("state") or uni.get("city") or ""

                return enhanced
        return None

    def filter_universities(
        self,
        target_degree: Optional[str] = None,
        field_of_study: Optional[str] = None,
        preferred_countries: Optional[List[str]] = None,
        budget_max: Optional[float] = None,
        target_intake_year: Optional[int] = None,
    ) -> List[Dict]:
        """
        Filter universities based on user profile
        """
        filtered = self.universities

        # Filter by degree type (degreesOffered is an array)
        if target_degree:
            filtered = [u for u in filtered if target_degree in u.get("degreesOffered", [])]

        # Filter by field of study (fields is an array - flexible matching with related fields)
        if field_of_study:
            field_lower = field_of_study.lower()

            # Define related field mappings (user query -> acceptable university field keywords)
            related_fields = {
                "artificial intelligence": ["computer science", "data science", "machine learning", "ai"],
                "computer science": ["software engineering", "data science", "artificial intelligence", "machine learning"],
                "data science": ["computer science", "artificial intelligence", "machine learning", "data analytics"],
                "business": ["mba", "management", "finance", "economics", "business administration"],
                "engineering": ["computer science", "software engineering", "robotics", "computer engineering"],
                "law": ["law", "ll.m", "corporate law", "international law", "business law"],
                "cybersecurity": ["computer science", "cybersecurity", "software engineering"],
                "economics": ["economics", "finance", "business", "data science"],
                "finance": ["finance", "economics", "business", "management"],
            }

            # Get related fields for the user's field of study
            acceptable_fields = [field_lower]
            for key, values in related_fields.items():
                if key in field_lower:
                    acceptable_fields.extend(values)

            filtered = [
                u for u in filtered
                if any(
                    any(field in uni_field.lower() for field in acceptable_fields)
                    for uni_field in u.get("fields", [])
                )
            ]

        # Filter by countries
        if preferred_countries:
            filtered = [
                u for u in filtered
                if u.get("country") in preferred_countries
            ]

        # Filter by budget (using estimatedAnnualCostUSD.total)
        if budget_max:
            filtered = [
                u for u in filtered
                if u.get("estimatedAnnualCostUSD", {}).get("total", 0) <= budget_max
            ]

        # Filter by intake year (intakeYears is an array)
        if target_intake_year:
            filtered = [
                u for u in filtered
                if target_intake_year in u.get("intakeYears", [])
            ]

        return filtered

    def score_university(
        self,
        university: Dict,
        user_gpa: Optional[float] = None,
        user_gre: Optional[int] = None,
        user_gmat: Optional[int] = None,
        user_ielts: Optional[float] = None,
        user_toefl: Optional[int] = None,
        user_budget: Optional[float] = None,
        user_countries: Optional[List[str]] = None,
    ) -> Dict:
        """
        Score a university for a user using normalized 0-100 scale
        Returns the university with match_score, category, fit_reasons, risk_factors, etc.

        Scoring Breakdown (0-100):
        - GPA Match: 35%
        - Exam Readiness: 25%
        - Budget Fit: 20%
        - Country Preference: 10%
        - University Ranking: 10%
        """
        score = 0
        reasons = []
        risks = []

        # === COMPONENT 1: GPA Match (35 points) ===
        academic_reqs = university.get("academicRequirements", {})
        min_gpa = academic_reqs.get("gpaMin", 3.0)
        avg_gpa = academic_reqs.get("gpaCompetitive", 3.5)
        competitive_gpa = avg_gpa + 0.2  # Competitive threshold

        if user_gpa:
            if user_gpa >= competitive_gpa:
                score += 35
                reasons.append(f"Strong GPA ({user_gpa:.2f}) - exceeds competitive threshold")
            elif user_gpa >= avg_gpa:
                score += 32
                reasons.append(f"Good GPA ({user_gpa:.2f}) - meets average requirement")
            elif user_gpa >= min_gpa:
                score += 28
                reasons.append(f"GPA ({user_gpa:.2f}) - meets minimum requirement")
            else:
                score += 15  # More lenient penalty
                risks.append(f"GPA ({user_gpa:.2f}) below minimum ({min_gpa:.2f})")
        else:
            # No GPA provided - give partial credit
            score += 22  # More generous default
            risks.append("GPA not provided")

        # === COMPONENT 2: Exam Readiness (25 points) ===
        exam_score = 0
        exam_summary = []
        exam_reqs = university.get("examRequirements", {})

        # Check GRE requirements
        gre_info = exam_reqs.get("gre", {})
        if gre_info.get("required") or gre_info.get("recommended"):
            min_gre = gre_info.get("minTotal") or 310
            avg_gre = min_gre + 10  # Estimate avg as 10 points above min
            exam_summary.append(f"GRE {avg_gre}+")

            if user_gre:
                if user_gre >= avg_gre + 10:
                    exam_score += 25
                    reasons.append(f"Excellent GRE score ({user_gre})")
                elif user_gre >= avg_gre:
                    exam_score += 22
                    reasons.append(f"Good GRE score ({user_gre})")
                elif user_gre >= min_gre:
                    exam_score += 18
                    reasons.append(f"GRE meets minimum ({user_gre})")
                else:
                    exam_score += 10  # More lenient
                    risks.append(f"GRE ({user_gre}) below minimum ({min_gre})")
            else:
                exam_score += 8  # Give some credit even if not provided
                risks.append(f"GRE required but not provided (need {avg_gre}+)")

        # Check GMAT requirements
        gmat_info = exam_reqs.get("gmat", {})
        if gmat_info.get("required") or gmat_info.get("recommended"):
            min_gmat = gmat_info.get("minScore") or 650
            avg_gmat = min_gmat + 30  # Estimate avg as 30 points above min
            exam_summary.append(f"GMAT {avg_gmat}+")

            if user_gmat:
                if user_gmat >= avg_gmat + 30:
                    exam_score += 25
                    reasons.append(f"Excellent GMAT score ({user_gmat})")
                elif user_gmat >= avg_gmat:
                    exam_score += 20
                    reasons.append(f"Good GMAT score ({user_gmat})")
                elif user_gmat >= min_gmat:
                    exam_score += 13
                    reasons.append(f"GMAT meets minimum ({user_gmat})")
                else:
                    exam_score += 5
                    risks.append(f"GMAT ({user_gmat}) below minimum ({min_gmat})")
            else:
                risks.append(f"GMAT required but not provided (need {avg_gmat}+)")
        else:
            # No standardized test required
            exam_score += 20  # Higher reward for not needing tests
            reasons.append("No GRE/GMAT required")

        # Check English proficiency (IELTS/TOEFL)
        ielts_info = exam_reqs.get("ielts", {})
        toefl_info = exam_reqs.get("toefl", {})
        ielts_min = ielts_info.get("minScore", 6.5)
        toefl_min = toefl_info.get("minScore", 90)

        english_ok = False
        if user_ielts:
            exam_summary.append(f"IELTS {ielts_min}+")
            if user_ielts >= ielts_min + 0.5:
                english_ok = True
                reasons.append(f"Strong IELTS score ({user_ielts})")
            elif user_ielts >= ielts_min:
                english_ok = True
                reasons.append(f"IELTS meets requirement ({user_ielts})")
            else:
                risks.append(f"IELTS ({user_ielts}) below minimum ({ielts_min})")
        elif user_toefl:
            exam_summary.append(f"TOEFL {toefl_min}+")
            if user_toefl >= toefl_min + 10:
                english_ok = True
                reasons.append(f"Strong TOEFL score ({user_toefl})")
            elif user_toefl >= toefl_min:
                english_ok = True
                reasons.append(f"TOEFL meets requirement ({user_toefl})")
            else:
                risks.append(f"TOEFL ({user_toefl}) below minimum ({toefl_min})")
        else:
            risks.append("English proficiency test score not provided")

        if not english_ok and (user_ielts or user_toefl):
            exam_score = max(0, exam_score - 5)  # Penalty for not meeting English requirement

        # Cap exam_score at 25 points (the maximum for this component)
        exam_score = min(exam_score, 25)
        score += exam_score

        # === COMPONENT 3: Budget Fit (20 points) ===
        cost_info = university.get("estimatedAnnualCostUSD", {})
        total_cost = cost_info.get("total", 0)
        cost_level = university.get("budgetTier", "Unknown")

        if user_budget and total_cost > 0:
            cost_ratio = total_cost / user_budget
            if cost_ratio <= 0.70:
                score += 20
                reasons.append(f"Well within budget (${total_cost:,})")
                cost_level = "Low"
            elif cost_ratio <= 0.85:
                score += 16
                reasons.append(f"Comfortably within budget (${total_cost:,})")
                cost_level = "Medium"
            elif cost_ratio <= 1.0:
                score += 12
                reasons.append(f"Fits budget (${total_cost:,})")
                cost_level = "Medium"
            else:
                overage = total_cost - user_budget
                if cost_ratio <= 1.15:
                    score += 7
                    cost_level = "High"
                else:
                    score += 3
                    cost_level = "High"
                risks.append(f"Cost (${total_cost:,}) exceeds budget by ${overage:,}")
        else:
            # No budget provided - use existing budgetTier
            score += 10

        # === COMPONENT 4: Country Preference (10 points) ===
        uni_country = university.get("country", "")
        if user_countries and uni_country in user_countries:
            score += 10
            reasons.append(f"Located in preferred country ({uni_country})")
        else:
            score += 2
            if user_countries:
                risks.append(f"Not in preferred countries")

        # === COMPONENT 5: University Ranking (10 points) ===
        ranking_tier = university.get("rankingTier", "")

        if "Top10" in ranking_tier or "Top 10" in ranking_tier:
            score += 10
            reasons.append(f"Top 10 ranked university")
        elif "Top20" in ranking_tier or "Top 20" in ranking_tier:
            score += 9
            reasons.append(f"Top 20 ranked university")
        elif "Top50" in ranking_tier or "Top 50" in ranking_tier:
            score += 9
            reasons.append(f"Top 50 ranked university")
        elif "Top100" in ranking_tier or "Top 100" in ranking_tier:
            score += 8
            reasons.append(f"Top 100 ranked university")
        elif "Top200" in ranking_tier or "Top 200" in ranking_tier:
            score += 7
            reasons.append(f"Top 200 ranked university")
        elif "Top300" in ranking_tier or "Top 300" in ranking_tier:
            score += 6
        elif "Top500" in ranking_tier or "Top 500" in ranking_tier:
            score += 6
        else:
            score += 5

        # Cap final score at 100 (maximum possible)
        score = min(score, 100)

        # === Determine Acceptance Chance ===
        difficulty = university.get("acceptanceDifficulty", "Medium")

        if score >= 80 and difficulty not in ["Very High", "High"]:
            acceptance_chance = "Strong"
        elif score >= 65:
            acceptance_chance = "Good"
        elif score >= 50:
            acceptance_chance = "Moderate"
        else:
            acceptance_chance = "Reach"

        # Categorize university
        category = self._categorize_university(score, university)

        # Add acceptance difficulty context to risks/reasons
        if difficulty == "Very High":
            risks.append("Extremely selective university with very low acceptance rate")
        elif difficulty == "High":
            if category == "Dream":
                risks.append("Highly competitive admissions (low acceptance rate)")
            elif category == "Target":
                reasons.append("Competitive but achievable with strong profile")
        elif difficulty == "Low":
            if category == "Safe":
                reasons.append("Accessible admissions process")

        # Build enhanced university object
        enhanced_uni = university.copy()

        # Add backward compatibility fields for frontend
        enhanced_uni["university_id"] = university.get("id")  # Map id to university_id for frontend
        enhanced_uni["university_name"] = university.get("name")  # Map name to university_name for frontend

        # Map new fields to old field names for frontend compatibility
        degrees_offered = university.get("degreesOffered", [])
        fields = university.get("fields", [])
        enhanced_uni["degree_type"] = degrees_offered[0] if degrees_offered else "Masters"
        enhanced_uni["field_of_study"] = fields[0] if fields else "Computer Science"
        enhanced_uni["program_name"] = f"{enhanced_uni['degree_type']} in {enhanced_uni['field_of_study']}"
        enhanced_uni["program_duration_years"] = 2  # Default to 2 years for Masters
        enhanced_uni["estimated_total_cost_usd"] = total_cost

        # Add old naming for competition and acceptance
        enhanced_uni["competition_level"] = difficulty
        enhanced_uni["acceptance_rate_estimate"] = difficulty

        # Add GPA fields for frontend
        enhanced_uni["minimum_gpa_estimate"] = min_gpa
        enhanced_uni["average_gpa_estimate"] = avg_gpa

        # Add default values for fields not in new schema
        enhanced_uni["average_salary_usd"] = 85000  # Default average salary
        enhanced_uni["strength_tags"] = []  # Empty for now

        # Derive strength tags from budgetTier and acceptanceDifficulty
        if cost_level == "Low":
            enhanced_uni["strength_tags"].append("Budget-friendly")
        if difficulty == "Low":
            enhanced_uni["strength_tags"].append("Accessible")
        elif difficulty == "Very High":
            enhanced_uni["strength_tags"].append("Prestigious")

        enhanced_uni["match_score"] = int(score)  # Ensure 0-100 integer
        enhanced_uni["category"] = category
        enhanced_uni["fit_reasons"] = reasons[:3]  # Top 3 reasons
        enhanced_uni["risk_factors"] = risks[:3]  # Top 3 risks
        enhanced_uni["cost_level"] = cost_level
        enhanced_uni["acceptance_chance"] = acceptance_chance
        enhanced_uni["exam_requirements_summary"] = exam_summary

        return enhanced_uni

    def _categorize_university(self, score: int, university: Dict) -> str:
        """
        Categorize university as Dream, Target, or Safe based on match score

        CORRECT LOGIC:
        - Match score represents how well USER matches UNIVERSITY requirements
        - High match score (user exceeds requirements) = Safe (definitely will get in)
        - Medium match score (user meets requirements) = Target (can try to get)
        - Low match score (user below requirements) = Dream (difficult to get)

        EXCEPTION: Very competitive schools (Very High difficulty) are always Dream
        regardless of match score, because they're selective even for qualified candidates.
        """
        difficulty = university.get("acceptanceDifficulty", "Medium")

        # Very High difficulty schools (Harvard, MIT, Stanford, etc.) are always Dream
        # These schools are extremely selective even for highly qualified candidates
        if difficulty == "Very High":
            return "Dream"

        # For other schools, categorize based on match score
        # High match score (75+) = User profile exceeds requirements = Safe
        if score >= 75:
            # Exception: High difficulty schools are still competitive even with great match
            if difficulty == "High":
                return "Target"  # Good match but still competitive
            else:
                return "Safe"  # Good match, likely acceptance

        # Medium match score (50-74) = User meets requirements = Target
        elif score >= 50:
            return "Target"

        # Low match score (<50) = User below requirements = Dream (reach school)
        else:
            # Exception: Very accessible schools (Low difficulty) can still be Target
            if difficulty == "Low" and score >= 40:
                return "Target"
            else:
                return "Dream"

    def get_recommended_universities(
        self,
        target_degree: Optional[str] = None,
        field_of_study: Optional[str] = None,
        preferred_countries: Optional[List[str]] = None,
        budget_max: Optional[float] = None,
        target_intake_year: Optional[int] = None,
        user_gpa: Optional[float] = None,
        user_gre: Optional[int] = None,
        user_gmat: Optional[int] = None,
        user_ielts: Optional[float] = None,
        user_toefl: Optional[int] = None,
    ) -> Dict[str, List[Dict]]:
        """
        Get recommended universities categorized by Dream/Target/Safe
        """
        # Filter universities
        filtered = self.filter_universities(
            target_degree=target_degree,
            field_of_study=field_of_study,
            preferred_countries=preferred_countries,
            budget_max=budget_max,
            target_intake_year=target_intake_year,
        )

        # Score each university
        scored = [
            self.score_university(
                uni,
                user_gpa=user_gpa,
                user_gre=user_gre,
                user_gmat=user_gmat,
                user_ielts=user_ielts,
                user_toefl=user_toefl,
                user_budget=budget_max,
                user_countries=preferred_countries,
            )
            for uni in filtered
        ]

        # Sort by match score (descending)
        scored.sort(key=lambda x: x["match_score"], reverse=True)

        # Group by category
        dream = [u for u in scored if u["category"] == "Dream"]
        target = [u for u in scored if u["category"] == "Target"]
        safe = [u for u in scored if u["category"] == "Safe"]

        return {
            "dream": dream,
            "target": target,
            "safe": safe,
            "all": scored,
        }


# Global instance
university_service = UniversityService()
