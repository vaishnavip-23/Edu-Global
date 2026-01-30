#!/usr/bin/env python3
"""
Quick verification script to check if AI Counsellor action system is properly wired
Run: python verify_ai_actions.py
"""

import sys
from pathlib import Path

def check_file_contains(file_path: str, search_terms: list, description: str):
    """Check if a file contains all required terms"""
    try:
        content = Path(file_path).read_text()
        missing = [term for term in search_terms if term not in content]

        if missing:
            print(f"❌ {description}")
            print(f"   Missing: {', '.join(missing)}")
            return False
        else:
            print(f"✅ {description}")
            return True
    except FileNotFoundError:
        print(f"❌ {description} - File not found: {file_path}")
        return False
    except Exception as e:
        print(f"❌ {description} - Error: {e}")
        return False

def verify_ai_counsellor_actions():
    """Verify the AI Counsellor action system is properly implemented"""

    print("\n🔍 Verifying AI Counsellor Action System...\n")

    checks = []

    # Check 1: AI Service defines tools
    checks.append(check_file_contains(
        "backend/services/ai_counsellor_service.py",
        [
            "get_user_profile",
            "get_recommended_universities",
            "shortlist_university",
            "lock_university",
            "create_todo",
            "get_shortlisted_universities",
            "get_todos",
            "FunctionDeclaration",
        ],
        "AI Service defines all 7 tools"
    ))

    # Check 2: Chat endpoint executes tools
    checks.append(check_file_contains(
        "backend/routes/ai_counsellor.py",
        [
            "execute_tool_call",
            "tool_results",
            "if response.get(\"tool_calls\")",
            "for tool_call in response[\"tool_calls\"]",
        ],
        "Chat endpoint executes tool calls"
    ))

    # Check 3: Tool execution functions exist
    checks.append(check_file_contains(
        "backend/routes/ai_counsellor.py",
        [
            "def get_user_profile_tool",
            "def get_recommended_universities_tool",
            "def shortlist_university_tool",
            "def lock_university_tool",
            "def create_todo_tool",
            "def get_shortlisted_universities_tool",
            "def get_todos_tool",
        ],
        "All 7 tool execution functions exist"
    ))

    # Check 4: Shortlist tool actually adds to database
    checks.append(check_file_contains(
        "backend/routes/ai_counsellor.py",
        [
            "Shortlist(",
            "db.add(shortlist)",
            "db.commit()",
            "shortlist_university_tool",
        ],
        "Shortlist tool adds to database"
    ))

    # Check 5: Lock tool generates todos
    checks.append(check_file_contains(
        "backend/routes/ai_counsellor.py",
        [
            "lock_university_tool",
            "todos_to_create",
            "Complete Statement of Purpose",
            "Letters of Recommendation",
            "Todo(",
            "db.add(todo)",
        ],
        "Lock tool auto-generates todos"
    ))

    # Check 6: Create todo tool saves to database
    checks.append(check_file_contains(
        "backend/routes/ai_counsellor.py",
        [
            "create_todo_tool",
            "Todo(",
            "db.add(todo)",
            "db.commit()",
        ],
        "Create todo tool saves to database"
    ))

    # Check 7: Frontend displays tool results
    checks.append(check_file_contains(
        "frontend/app/counsellor/page.js",
        [
            "tool_results",
            "data.tool_results",
            "toolResult.result",
        ],
        "Frontend processes tool results"
    ))

    # Check 8: Frontend shows action confirmations
    checks.append(check_file_contains(
        "frontend/app/counsellor/page.js",
        [
            "Actions taken:",
            "result.success",
        ],
        "Frontend displays action confirmations"
    ))

    # Check 9: System prompt emphasizes actions
    checks.append(check_file_contains(
        "backend/services/ai_counsellor_service.py",
        [
            "seasoned Study Abroad Counsellor",
            "TAKE ACTION",
            "Shortlisting Universities",
            "Locking Universities",
            "Creating To-Dos",
        ],
        "System prompt emphasizes taking actions"
    ))

    # Check 10: University lock endpoint also generates todos
    checks.append(check_file_contains(
        "backend/routes/universities.py",
        [
            "@router.post(\"/lock/",
            "todos_to_create",
            "Complete Statement of Purpose",
            "existing_todos",
        ],
        "University lock endpoint generates todos"
    ))

    # Summary
    print("\n" + "="*60)
    passed = sum(checks)
    total = len(checks)

    if passed == total:
        print(f"✅ ALL CHECKS PASSED ({passed}/{total})")
        print("\n🎉 AI Counsellor action system is properly implemented!")
        print("\n📋 Next Steps:")
        print("   1. Start backend: cd backend && python main.py")
        print("   2. Start frontend: cd frontend && npm run dev")
        print("   3. Follow TEST_AI_COUNSELLOR.md for manual testing")
        return 0
    else:
        print(f"❌ SOME CHECKS FAILED ({passed}/{total})")
        print("\n⚠️  Some components may not be properly wired.")
        print("   Review the failed checks above.")
        return 1

if __name__ == "__main__":
    sys.exit(verify_ai_counsellor_actions())
