import os
import sys
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.services.ai_service import ask_gemini

if __name__ == "__main__":
    print("Testing RainToRoot Gemini AI Integration...")
    test_question = "What are 2 good tips for growing ragi in rainfed soil?"
    print(f"Question: {test_question}\n")

    result = ask_gemini(test_question)

    if result.get("success"):
        print("SUCCESS! Model used:", result.get("model"))
        print("\nAssistant Response:\n", result.get("answer"))
    else:
        print("FAILED! Error type:", result.get("error_type"))
        print("Error message:", result.get("error"))
