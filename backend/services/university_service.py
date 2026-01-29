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
            # Get project root directory
            current_file = Path(__file__)
            project_root = current_file.parent.parent.parent
            json_path = project_root / "universities.json"

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
        """Get a specific university by ID"""
        for uni in self.universities:
            if uni.get("university_id") == university_id:
                return uni
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

        # Filter by degree type
        if target_degree:
            filtered = [u for u in filtered if u.get("degree_type") == target_degree]

        # Filter by field of study (flexible matching)
        if field_of_study:
            field_lower = field_of_study.lower()
            filtered = [
                u for u in filtered
                if field_lower in u.get("field_of_study", "").lower()
            ]

        # Filter by countries
        if preferred_countries:
            filtered = [
                u for u in filtered
                if u.get("country") in preferred_countries
            ]

        # Filter by budget (using estimated_total_cost_usd)
        if budget_max:
            filtered = [
                u for u in filtered
                if u.get("estimated_total_cost_usd", 0) <= budget_max
            ]

        # Filter by intake year
        if target_intake_year:
            filtered = [
                u for u in filtered
                if target_intake_year in u.get("intake_years_supported", [])
            ]

        return filtered

    def score_university(
        self,
        university: Dict,
        user_gpa: Optional[float] = None,
        user_gre: Optional[int] = None,
        user_gmat: Optional[int] = None,
        user_budget: Optional[float] = None,
    ) -> Dict:
        """
        Score a university for a user and categorize as Dream/Target/Safe
        Returns the university with added 'match_score', 'category', and 'fit_explanation'
        """
        score = 0
        reasons = []
        risks = []

        # GPA Match
        min_gpa = university.get("minimum_gpa_estimate", 0)
        avg_gpa = university.get("average_gpa_estimate", 0)

        if user_gpa:
            if user_gpa >= avg_gpa:
                score += 30
                reasons.append(f"Your GPA ({user_gpa}) exceeds the average ({avg_gpa})")
            elif user_gpa >= min_gpa:
                score += 20
                reasons.append(f"Your GPA ({user_gpa}) meets the minimum ({min_gpa})")
            else:
                score += 5
                risks.append(f"Your GPA ({user_gpa}) is below minimum ({min_gpa})")

        # GRE Match
        if university.get("gre_required") and user_gre:
            min_gre = university.get("minimum_gre_estimate", 0)
            if user_gre >= min_gre + 10:
                score += 25
                reasons.append(f"Your GRE ({user_gre}) is strong for this program")
            elif user_gre >= min_gre:
                score += 15
                reasons.append(f"Your GRE ({user_gre}) meets requirements")
            else:
                score += 5
                risks.append(f"Your GRE ({user_gre}) is below expected ({min_gre})")

        # GMAT Match
        if university.get("gmat_required") and user_gmat:
            min_gmat = university.get("minimum_gmat_estimate", 0)
            if user_gmat >= min_gmat + 20:
                score += 25
                reasons.append(f"Your GMAT ({user_gmat}) is excellent")
            elif user_gmat >= min_gmat:
                score += 15
                reasons.append(f"Your GMAT ({user_gmat}) meets requirements")
            else:
                score += 5
                risks.append(f"Your GMAT ({user_gmat}) is below expected ({min_gmat})")

        # Competition Level (inverse scoring)
        competition = university.get("competition_level", "Medium")
        if competition == "Low":
            score += 20
            reasons.append("Lower competition increases acceptance chances")
        elif competition == "Medium":
            score += 10
        else:  # High
            score += 5
            risks.append("Highly competitive program")

        # Acceptance Rate
        acceptance = university.get("acceptance_rate_estimate", "Medium")
        if acceptance == "High":
            score += 15
            reasons.append("Higher acceptance rate")
        elif acceptance == "Medium":
            score += 10
        else:  # Low
            risks.append("Low acceptance rate")

        # Budget fit
        total_cost = university.get("estimated_total_cost_usd", 0)
        if user_budget:
            if total_cost <= user_budget * 0.8:
                score += 15
                reasons.append("Well within budget")
            elif total_cost <= user_budget:
                score += 10
                reasons.append("Fits budget")
            else:
                risks.append(f"Cost (${total_cost:,}) exceeds budget")

        # ROI
        roi_level = university.get("roi_level", "Medium")
        if roi_level == "High":
            reasons.append("Strong return on investment")

        # Categorize based on score and competition
        category = self._categorize_university(score, university)

        # Add metadata to university
        enhanced_uni = university.copy()
        enhanced_uni["match_score"] = score
        enhanced_uni["category"] = category
        enhanced_uni["fit_reasons"] = reasons
        enhanced_uni["risk_factors"] = risks

        return enhanced_uni

    def _categorize_university(self, score: int, university: Dict) -> str:
        """
        Categorize university as Dream, Target, or Safe based on score
        """
        competition = university.get("competition_level", "Medium")
        acceptance = university.get("acceptance_rate_estimate", "Medium")

        # Dream: High competition OR low acceptance OR low score
        if competition == "High" or acceptance == "Low" or score < 50:
            return "Dream"
        # Safe: Low competition AND high acceptance AND high score
        elif competition == "Low" and acceptance == "High" and score >= 70:
            return "Safe"
        # Target: Everything else
        else:
            return "Target"

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
                user_budget=budget_max,
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
