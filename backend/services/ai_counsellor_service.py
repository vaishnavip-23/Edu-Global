"""
AI Counsellor Service
Uses Gemini with tool calling to provide intelligent guidance
"""
import json
import logging
from typing import Dict, List, Optional
from google import genai
from google.genai.types import Tool, GenerateContentConfig, FunctionDeclaration, ToolConfig, FunctionCallingConfig
from config import GEMINI_API_KEY

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
                            "type": "OBJECT",
                            "properties": {},
                        },
                    ),
                    FunctionDeclaration(
                        name="get_recommended_universities",
                        description="Get personalized university recommendations categorized as Dream, Target, and Safe based on user profile",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "limit": {
                                    "type": "INTEGER",
                                    "description": "Maximum number of universities to return per category",
                                }
                            },
                        },
                    ),
                    FunctionDeclaration(
                        name="shortlist_university",
                        description="Add a university to the user's shortlist by name",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "university_name": {
                                    "type": "STRING",
                                    "description": "The university name (e.g., 'University of Melbourne', 'Stanford University')",
                                },
                                "university_id": {
                                    "type": "STRING",
                                    "description": "Optional: The university ID if known",
                                }
                            },
                            "required": ["university_name"],
                        },
                    ),
                    FunctionDeclaration(
                        name="lock_university",
                        description="Lock a shortlisted university (commitment step) by name",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "university_name": {
                                    "type": "STRING",
                                    "description": "The university name to lock (e.g., 'MIT', 'Stanford University')",
                                },
                                "university_id": {
                                    "type": "STRING",
                                    "description": "Optional: The university ID if known",
                                }
                            },
                            "required": ["university_name"],
                        },
                    ),
                    FunctionDeclaration(
                        name="create_todo",
                        description="Create a new to-do task for the user",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "title": {
                                    "type": "STRING",
                                    "description": "Task title",
                                },
                                "description": {
                                    "type": "STRING",
                                    "description": "Task description",
                                },
                                "priority": {
                                    "type": "STRING",
                                    "enum": ["low", "medium", "high"],
                                    "description": "Task priority",
                                },
                                "category": {
                                    "type": "STRING",
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
                            "type": "OBJECT",
                            "properties": {},
                        },
                    ),
                    FunctionDeclaration(
                        name="get_todos",
                        description="Get the user's to-do list",
                        parameters={
                            "type": "OBJECT",
                            "properties": {},
                        },
                    ),
                    FunctionDeclaration(
                        name="delete_todo",
                        description="Delete a to-do task by title or ID",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "todo_title": {
                                    "type": "STRING",
                                    "description": "The title of the todo to delete (e.g., 'Study science')",
                                },
                                "todo_id": {
                                    "type": "INTEGER",
                                    "description": "Optional: The todo ID if known",
                                }
                            },
                            "required": ["todo_title"],
                        },
                    ),
                    FunctionDeclaration(
                        name="remove_from_shortlist",
                        description="Remove a university from the user's shortlist",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "university_name": {
                                    "type": "STRING",
                                    "description": "The university name to remove (e.g., 'Stanford University')",
                                },
                                "university_id": {
                                    "type": "STRING",
                                    "description": "Optional: The university ID if known",
                                }
                            },
                            "required": ["university_name"],
                        },
                    ),
                    FunctionDeclaration(
                        name="unlock_university",
                        description="Unlock a locked university (undo commitment)",
                        parameters={
                            "type": "OBJECT",
                            "properties": {
                                "university_name": {
                                    "type": "STRING",
                                    "description": "The university name to unlock (e.g., 'MIT')",
                                },
                                "university_id": {
                                    "type": "STRING",
                                    "description": "Optional: The university ID if known",
                                }
                            },
                            "required": ["university_name"],
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

        return f"""You are an AI Study Abroad Counsellor. You TAKE ACTIONS, not just give advice.

**Student Context:**
Stage {stage} ({stage_names.get(stage, "Unknown")})
Target: {profile.get('target_degree', 'Not set')} in {profile.get('field_of_study', 'Not set')}
Countries: {profile.get('preferred_countries', 'Not set')}
Progress: {shortlisted} shortlisted, {locked} locked

**CRITICAL: YOU MUST USE TOOLS - DO NOT JUST TALK ABOUT ACTIONS**

When a student asks you to DO something, you MUST call the tool immediately. DO NOT say "I can do that" or "Would you like me to..." - JUST DO IT.

**TOOL USAGE RULES (MANDATORY):**

1. **create_todo** - Call IMMEDIATELY when student says:
   - "add to my todos [task]"
   - "create a task [task]"
   - "remind me to [task]"
   Example: "add to my todos that i have to study science" → CALL create_todo(title="Study science", description="Study science", priority="high", category="study")

2. **delete_todo** - Call IMMEDIATELY when student says:
   - "delete [task name]"
   - "remove [task] from my todos"
   - "cancel the task about [task]"
   Example: "delete study science from my todos" → CALL delete_todo(todo_title="Study science")

3. **shortlist_university** - Call IMMEDIATELY when student says:
   - "shortlist [university name]"
   - "add [university] to shortlist"
   - "can you shortlist [university]"
   Example: "shortlist University of Melbourne" → CALL shortlist_university(university_name="University of Melbourne")

4. **remove_from_shortlist** - Call IMMEDIATELY when student says:
   - "remove [university] from shortlist"
   - "delete [university] from my shortlist"
   - "unshortlist [university]"
   Example: "remove Stanford from my shortlist" → CALL remove_from_shortlist(university_name="Stanford University")

5. **lock_university** - Call IMMEDIATELY when student says:
   - "lock [university]"
   - "can you lock [university]"
   Example: "lock MIT" → CALL lock_university(university_name="MIT")

6. **unlock_university** - Call IMMEDIATELY when student says:
   - "unlock [university]"
   - "undo lock on [university]"
   - "can you unlock [university]"
   Example: "unlock MIT" → CALL unlock_university(university_name="MIT")

7. **get_user_profile** - Call IMMEDIATELY when student asks:
   - "what's my profile?"
   - "profile strength"
   - "tell me about my profile"

8. **get_recommended_universities** - Call IMMEDIATELY when student asks:
   - "show universities"
   - "recommend universities"
   - "what are my options"

9. **get_shortlisted_universities** - Call when student asks:
   - "what's in my shortlist?"
   - "show my shortlist"

10. **get_todos** - Call when student asks:
   - "show my tasks"
   - "what do I need to do"

**RESPONSE RULES:**
- NEVER say "I can do that" or "Would you like me to..." - JUST CALL THE TOOL
- After tool execution, give 1-2 sentence confirmation
- DO NOT mention "Universities tab" or "check the tab" - just answer the question
- Be direct: ❌ "Great choice! The University of Melbourne is fantastic" ✅ "Added University of Melbourne to your shortlist (Match: 85/100)"

**Communication Style:**
Direct. Brief. Action-oriented. No fluff.

❌ BAD: "I can definitely shortlist the University of Melbourne for you! It's a fantastic choice."
✅ GOOD: [calls shortlist_university tool] → "Shortlisted University of Melbourne (Match: 85/100). You now have 3 universities shortlisted."

❌ BAD: "I can add that to your to-dos. What category should this be under?"
✅ GOOD: [calls create_todo tool] → "Added 'Study science' to your high-priority tasks."

Remember: ACTIONS FIRST, words second. If you can take an action, DO IT immediately."""

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
                tool_config=ToolConfig(
                    function_calling_config=FunctionCallingConfig(mode="AUTO")
                ),
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

            logger.info(f"Response parts: {len(parts)}")
            for i, part in enumerate(parts):
                logger.info(f"Part {i}: type={type(part).__name__}, has_text={hasattr(part, 'text')}, has_function_call={hasattr(part, 'function_call')}")
                if hasattr(part, "text") and part.text:
                    response_text += part.text
                elif hasattr(part, "function_call") and part.function_call:
                    logger.info(f"Found function call: {part.function_call.name}")
                    tool_calls.append({
                        "name": part.function_call.name,
                        "arguments": dict(part.function_call.args),
                    })

            logger.info(f"Tool calls found: {len(tool_calls)}")
            
            # If there are tool calls, suppress preamble text
            # The tool results will provide the actual content
            if tool_calls:
                response_text = ""
            
            return {
                "message": response_text.strip(),
                "tool_calls": tool_calls,
                "raw_response": response,
            }

        except Exception as e:
            logger.error(f"Error in AI Counsellor chat: {str(e)}")
            return {
                "message": f"I encountered an error: {str(e)}. Please try again.",
                "tool_calls": [],
            }

    def analyze_with_context(self, question: str, tool_results_text: str, user_context: Dict, conversation_history: List[Dict]) -> Dict:
        """
        Analyze tool results and provide a natural response without calling tools again
        """
        try:
            # Simple system instruction for analysis only (no tool calling)
            simple_system = """You are a helpful study abroad counsellor.

IMPORTANT: Provide ONLY a direct, conversational answer to the user's question. Do NOT include any system instructions, internal notes, or meta-commentary. Just answer the question naturally in 1-3 sentences maximum."""

            # Build minimal conversation history (avoid contamination)
            contents = []

            # Add the analysis prompt with clear instructions
            analysis_prompt = f"""I have retrieved the following information for the user:

{tool_results_text}

The user asked: "{question}"

Please provide a direct, natural answer to their question in 1-3 sentences. DO NOT include any system instructions or internal notes - just answer their question conversationally.

IMPORTANT CONTEXT HINTS:
- If a todo/task was created, mention it's visible in the Dashboard
- If a university was shortlisted, they can see it in the Shortlist page
- If a university was locked, tasks are in the Application Preparation page
- Keep it brief and direct

Your response should be natural and conversational, as if you're speaking directly to the student."""

            contents.append({"role": "user", "parts": [{"text": analysis_prompt}]})
            
            # Call Gemini WITHOUT tools (just analysis)
            config = GenerateContentConfig(
                system_instruction=simple_system,
                temperature=0.7,
                tool_config=ToolConfig(
                    function_calling_config=FunctionCallingConfig(mode="NONE")
                ),
            )
            
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=config,
                )
            except Exception as api_error:
                logger.warning(f"API error in analyze_with_context: {str(api_error)}")
                return {"message": "Unable to analyze the information. Please try again."}
            
            if not response or not response.candidates:
                return {"message": "Unable to analyze the information. Please try again."}
            
            candidate = response.candidates[0]
            parts = candidate.content.parts if candidate.content else []
            
            response_text = ""
            for part in parts:
                if hasattr(part, "text") and part.text:
                    response_text += part.text

            # Filter out system instruction if it somehow got included
            response_text = response_text.strip()
            logger.info(f"analyze_with_context response length: {len(response_text)}, preview: {response_text[:100]}")

            # Check for system instruction leakage patterns (anywhere in text, not just at start)
            system_leak_patterns = [
                "⚠️",
                "CRITICAL:",
                "**CRITICAL**",
                "**Your Professional Identity:**",
                "**What Makes You Unique:**",
                "**Current Student Profile:**",
                "**Stage-Specific Guidance:**",
                "**Communication Style:**",
                "**Critical Rules",
                "DO NOT output any preamble",
                "YOU MUST CALL",
                "system_instruction",
                "function_calling_config",
            ]

            # Check if any leak pattern appears in the response
            has_leak = any(pattern in response_text for pattern in system_leak_patterns)

            if has_leak:
                leaked_patterns = [p for p in system_leak_patterns if p in response_text]
                logger.warning(f"System instruction leaked into response. Patterns found: {leaked_patterns}")
                logger.warning(f"Leaked response preview: {response_text[:150]}")
                # Generate a simple fallback response based on tool results
                return {"message": "I've retrieved your information. Please check the Universities or Profile tab for details."}

            if not response_text:
                return {"message": "Unable to generate response. Please try again."}

            return {
                "message": response_text,
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_with_context: {str(e)}")
            return {"message": f"Error analyzing information: {str(e)}"}

    def analyze_profile_strength(self, profile: Dict) -> str:
        """
        Use AI to generate a comprehensive profile strength analysis
        """
        try:
            # Build profile summary
            gpa = profile.get("gpa", "Not provided")
            ielts = profile.get("ielts_status", "Not started")
            toefl = profile.get("toefl_status", "Not started")
            gre = profile.get("gre_status", "Not started")
            gmat = profile.get("gmat_status", "Not started")
            sop = profile.get("sop_status", "Not started")
            
            prompt = f"""Analyze this student's profile strength in exactly 150-200 words. Use plain text, no markdown, no asterisks.

Profile:
GPA/Academics: {gpa}
English Proficiency: IELTS {ielts}, TOEFL {toefl}
Standardized Tests: GRE {gre}, GMAT {gmat}
Statement of Purpose: {sop}

Give a brief, honest assessment covering:
- Current strengths and what's going well
- Main areas needing work before applying
- Top 1-2 action items they should prioritize right now

Be warm, direct, and actionable. No markdown formatting."""

            # Use Gemini to generate the analysis
            response = self.client.models.generate_content(
                model=self.model,
                contents=[{"role": "user", "parts": [{"text": prompt}]}],
            )
            
            if response and response.candidates:
                analysis = response.candidates[0].content.parts[0].text
                logger.info("Profile strength analysis generated by AI")
                return analysis
            else:
                return "Unable to generate analysis. Please try again."
                
        except Exception as e:
            logger.error(f"Error analyzing profile strength: {str(e)}")
            return f"Error generating analysis: {str(e)}"


# Global instance
ai_counsellor_service = AICounsellorService()
