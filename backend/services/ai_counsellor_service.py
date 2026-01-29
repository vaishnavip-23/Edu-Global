"""
AI Counsellor Service
Uses Gemini with tool calling to provide intelligent guidance
"""
import json
import logging
from typing import Dict, List, Optional
from google import genai
from google.genai.types import Tool, GenerateContentConfig, FunctionDeclaration
from backend.config import GEMINI_API_KEY

logger = logging.getLogger(__name__)


class AICounsellorService:
    """AI Counsellor using Gemini with tool calling"""

    def __init__(self):
        self.client = genai.Client(api_key=GEMINI_API_KEY)
        self.model = "gemini-2.5-flash-lite"

    def _get_tools(self) -> List[Tool]:
        """Define tools/functions the AI can call"""
        return [
            Tool(
                function_declarations=[
                    FunctionDeclaration(
                        name="get_user_profile",
                        description="Get the user's profile information including academic background, goals, budget, and exam readiness",
                        parameters={
                            "type": "object",
                            "properties": {},
                        },
                    ),
                    FunctionDeclaration(
                        name="get_recommended_universities",
                        description="Get personalized university recommendations categorized as Dream, Target, and Safe based on user profile",
                        parameters={
                            "type": "object",
                            "properties": {
                                "limit": {
                                    "type": "integer",
                                    "description": "Maximum number of universities to return per category",
                                }
                            },
                        },
                    ),
                    FunctionDeclaration(
                        name="shortlist_university",
                        description="Add a university to the user's shortlist",
                        parameters={
                            "type": "object",
                            "properties": {
                                "university_id": {
                                    "type": "string",
                                    "description": "The university ID (e.g., UNI-001)",
                                }
                            },
                            "required": ["university_id"],
                        },
                    ),
                    FunctionDeclaration(
                        name="lock_university",
                        description="Lock a shortlisted university (commitment step)",
                        parameters={
                            "type": "object",
                            "properties": {
                                "university_id": {
                                    "type": "string",
                                    "description": "The university ID to lock",
                                }
                            },
                            "required": ["university_id"],
                        },
                    ),
                    FunctionDeclaration(
                        name="create_todo",
                        description="Create a new to-do task for the user",
                        parameters={
                            "type": "object",
                            "properties": {
                                "title": {
                                    "type": "string",
                                    "description": "Task title",
                                },
                                "description": {
                                    "type": "string",
                                    "description": "Task description",
                                },
                                "priority": {
                                    "type": "string",
                                    "enum": ["low", "medium", "high"],
                                    "description": "Task priority",
                                },
                                "category": {
                                    "type": "string",
                                    "description": "Task category (e.g., exam, document, application)",
                                },
                            },
                            "required": ["title", "description"],
                        },
                    ),
                    FunctionDeclaration(
                        name="get_shortlisted_universities",
                        description="Get the list of universities the user has shortlisted",
                        parameters={
                            "type": "object",
                            "properties": {},
                        },
                    ),
                    FunctionDeclaration(
                        name="get_todos",
                        description="Get the user's to-do list",
                        parameters={
                            "type": "object",
                            "properties": {},
                        },
                    ),
                ]
            )
        ]

    def _build_system_prompt(self, user_context: Dict) -> str:
        """Build the system prompt with user context"""
        profile = user_context.get("profile", {})
        stage = user_context.get("stage", 1)
        shortlisted = user_context.get("shortlisted_count", 0)
        locked = user_context.get("locked_count", 0)

        stage_names = {
            1: "Building Profile",
            2: "Discovering Universities",
            3: "Finalizing Universities",
            4: "Preparing Applications",
        }

        return f"""You are an AI Counsellor helping students with their study-abroad journey. You are NOT just a chatbot - you are an intelligent decision and execution system that guides users step-by-step.

**Your Core Responsibilities:**
1. Understand the user's profile deeply (academics, goals, budget, readiness)
2. Explain their profile strengths and gaps honestly
3. Recommend universities categorized as Dream/Target/Safe with clear reasoning
4. Take ACTIONS: shortlist universities, lock universities, create to-do tasks
5. Guide them through stages with clarity and momentum

**Current User Context:**
- Stage: {stage} - {stage_names.get(stage, "Unknown")}
- Education: {profile.get('education_level', 'Not set')}
- Target Degree: {profile.get('target_degree', 'Not set')}
- Field of Study: {profile.get('field_of_study', 'Not set')}
- Countries: {profile.get('preferred_countries', 'Not set')}
- Budget: {profile.get('budget_range', 'Not set')}
- GPA: {profile.get('gpa', 'Not set')}
- Shortlisted Universities: {shortlisted}
- Locked Universities: {locked}

**Stage-Specific Guidance:**
{'- Stage 1: Help them understand their profile strength, identify gaps in test scores/documents' if stage == 1 else ''}
{'- Stage 2: Recommend universities, explain fit and risks, help them shortlist' if stage == 2 else ''}
{'- Stage 3: Encourage locking universities (need at least 1 locked), warn about focus and commitment' if stage == 3 else ''}
{'- Stage 4: Create application tasks, guide document preparation, manage deadlines' if stage == 4 else ''}

**How to Interact:**
- Be conversational but professional and action-oriented
- Don't just list information - explain WHY things matter
- Use tools proactively to take actions (shortlist, lock, create tasks)
- When recommending universities, ALWAYS explain:
  * Why it fits their profile
  * What the risks are
  * What category it falls into (Dream/Target/Safe)
- Create actionable next steps, not vague advice
- If they ask for universities, use get_recommended_universities tool
- If they want to shortlist, use shortlist_university tool
- If they need tasks, use create_todo tool

**Key Rules:**
- NEVER make up university names - only use data from get_recommended_universities
- NEVER shortlist or lock universities without user confirmation
- ALWAYS explain the reasoning behind categorization (Dream/Target/Safe)
- Focus on moving them forward through stages
- Create specific, actionable to-dos, not generic ones"""

    async def chat(
        self,
        message: str,
        user_context: Dict,
        conversation_history: List[Dict] = None,
    ) -> Dict:
        """
        Process a chat message with tool calling support

        Args:
            message: User's message
            user_context: User profile and state information
            conversation_history: Previous messages

        Returns:
            Response dict with message and any tool calls made
        """
        try:
            # Build system prompt
            system_instruction = self._build_system_prompt(user_context)

            # Build conversation history for Gemini
            contents = []
            if conversation_history:
                for msg in conversation_history:
                    role = "user" if msg["role"] == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": msg["content"]}]})

            # Add current message
            contents.append({"role": "user", "parts": [{"text": message}]})

            # Call Gemini with tools
            config = GenerateContentConfig(
                system_instruction=system_instruction,
                tools=self._get_tools(),
                temperature=0.7,
            )

            response = self.client.models.generate_content(
                model=self.model,
                contents=contents,
                config=config,
            )

            # Extract response
            if not response or not response.candidates:
                return {
                    "message": "I apologize, but I couldn't process that request. Could you please try again?",
                    "tool_calls": [],
                }

            candidate = response.candidates[0]
            parts = candidate.content.parts if candidate.content else []

            # Process parts to extract text and function calls
            response_text = ""
            tool_calls = []

            for part in parts:
                if hasattr(part, "text") and part.text:
                    response_text += part.text
                elif hasattr(part, "function_call") and part.function_call:
                    tool_calls.append({
                        "name": part.function_call.name,
                        "arguments": dict(part.function_call.args),
                    })

            return {
                "message": response_text.strip() or "Let me help you with that.",
                "tool_calls": tool_calls,
                "raw_response": response,
            }

        except Exception as e:
            logger.error(f"Error in AI Counsellor chat: {str(e)}")
            return {
                "message": f"I encountered an error: {str(e)}. Please try again.",
                "tool_calls": [],
            }

    def analyze_profile_strength(self, profile: Dict) -> Dict:
        """
        Analyze user profile and return strength assessment
        """
        try:
            # GPA strength
            gpa = profile.get("gpa", "")
            gpa_float = None
            try:
                gpa_float = float(gpa) if gpa else None
            except:
                pass

            if gpa_float:
                if gpa_float >= 3.5:
                    academics_strength = "Strong"
                elif gpa_float >= 3.0:
                    academics_strength = "Average"
                else:
                    academics_strength = "Weak"
            else:
                academics_strength = "Not Available"

            # Exam readiness
            ielts = profile.get("ielts_status", "")
            toefl = profile.get("toefl_status", "")
            gre = profile.get("gre_status", "")
            gmat = profile.get("gmat_status", "")

            exams_completed = sum([
                "completed" in ielts.lower() if ielts else False,
                "completed" in toefl.lower() if toefl else False,
                "completed" in gre.lower() if gre else False,
                "completed" in gmat.lower() if gmat else False,
            ])

            if exams_completed >= 2:
                exams_strength = "Completed"
            elif exams_completed >= 1:
                exams_strength = "In Progress"
            else:
                exams_strength = "Not Started"

            # SOP status
            sop = profile.get("sop_status", "")
            if "ready" in sop.lower():
                sop_strength = "Ready"
            elif "draft" in sop.lower():
                sop_strength = "Draft"
            else:
                sop_strength = "Not Started"

            return {
                "academics": academics_strength,
                "exams": exams_strength,
                "sop": sop_strength,
            }

        except Exception as e:
            logger.error(f"Error analyzing profile strength: {str(e)}")
            return {
                "academics": "Unknown",
                "exams": "Unknown",
                "sop": "Unknown",
            }


# Global instance
ai_counsellor_service = AICounsellorService()
