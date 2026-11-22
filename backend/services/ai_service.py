
import os
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / ".env")

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None


def ask_gemini(question):
    if not client:
        return "Gemini API key is missing. Please check your .env file."

    prompt = (
        "You are RainToRoot, an agricultural assistant "
        "for Indian farmers. Give clear, practical and "
        "easy-to-understand farming guidance. "
        "Never invent live weather or mandi prices.\n\n"
        f"Question: {question}"
    )

    for attempt in range(2):
        try:
            response = client.models.generate_content(
                model="gemini-3.8-flash",
                contents=prompt
            )

            return response.text or "No answer was returned."

        except Exception as error:
            error_message = str(error)
            print("Gemini error:", error_message)

            if "503" in error_message or "UNAVAILABLE" in error_message:
                if attempt == 0:
                    time.sleep(3)
                    continue

                return (
                    "Gemini is temporarily experiencing high demand. "
                    "Please try again later."
                )

            if "429" in error_message or "RESOURCE_EXHAUSTED" in error_message:
                return (
                    "Gemini API usage limit reached. "
                    "Please try again later."
                )

            return (
                "The AI assistant is temporarily unavailable. "
                "Please try again."
            )

    return "Please try again later."
