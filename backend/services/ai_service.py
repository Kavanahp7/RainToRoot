import os
import time
from pathlib import Path
from dotenv import load_dotenv
from google import genai
from google.genai import types

# Load backend/.env first, with fallback to root .env
CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
ROOT_DIR = BACKEND_DIR.parent

backend_env = BACKEND_DIR / ".env"
root_env = ROOT_DIR / ".env"

if backend_env.exists():
    load_dotenv(backend_env)
elif root_env.exists():
    load_dotenv(root_env)
else:
    load_dotenv()

# Agricultural System Instruction tailored for Indian Farmers
FARMER_ASSISTANT_SYSTEM_INSTRUCTION = (
    "You are the RainToRoot AI Farmer Assistant, an expert agricultural advisor dedicated to supporting "
    "Indian farmers with practical, reliable, and easily understood farming guidance.\n\n"
    "Core Guidelines:\n"
    "1. Simplicity & Clarity: Use plain, conversational, and respectful language. Explain technical terms simply.\n"
    "2. Agricultural Focus: Provide helpful advice on crop selection, soil health, organic practices, fertilizer timing, "
    "irrigation scheduling, pest/disease identification, and seasonal preparation (Kharif, Rabi, Zaid).\n"
    "3. Caution & Local Verification: Never claim unverified farming advice is guaranteed. When recommending "
    "chemical dosages, pesticides, weedicides, or critical crop treatments, explicitly remind the farmer to confirm "
    "the recommendation with their local agricultural extension officer, Krishi Vigyan Kendra (KVK), or state agriculture department.\n"
    "4. Scientific Accuracy: Do not invent scientific facts, yield guarantees, or unproven remedies.\n"
    "5. Live Data Boundaries: Do not invent real-time market prices (mandi rates) or exact daily rainfall forecasts. "
    "Direct farmers to RainToRoot's live Weather and Mandi modules for verified numbers."
)

_client = None
_cached_key = None


def get_gemini_client():
    global _client, _cached_key
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None
    if _client is None or _cached_key != api_key:
        _client = genai.Client(api_key=api_key)
        _cached_key = api_key
    return _client


def ask_gemini(question: str, history: list = None) -> dict:
    clean_question = (question or "").strip()
    if not clean_question:
        return {
            "success": False,
            "status_code": 400,
            "error_type": "EMPTY_INPUT",
            "error": "Please enter a farming question."
        }

    client = get_gemini_client()
    if not client:
        return {
            "success": False,
            "status_code": 500,
            "error_type": "MISSING_API_KEY",
            "error": "Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env."
        }

    # Default verified against the current Google Gemini model catalogue.
    configured_model = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite").strip()
    candidate_models = [configured_model]

    # Proven fallback models from official Google catalogue
    fallback_pool = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.5-flash"]
    for fb in fallback_pool:
        if fb not in candidate_models:
            candidate_models.append(fb)

    config = types.GenerateContentConfig(
        system_instruction=FARMER_ASSISTANT_SYSTEM_INSTRUCTION,
        temperature=0.4
    )

    # Build contents with optional chat history for multi-turn conversation memory
    contents = []
    if history and isinstance(history, list):
        for msg in history:
            role = "model" if msg.get("role") in ("model", "bot", "assistant") else "user"
            text = (msg.get("text") or msg.get("content") or "").strip()
            if text:
                contents.append(types.Content(role=role, parts=[types.Part.from_text(text=text)]))

    # Append current question
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=clean_question)]))

    last_error_message = ""
    last_error_type = "UNKNOWN_ERROR"
    last_status_code = 500

    # Lean retry policy: Try at most 2 distinct models (1 attempt each)
    # This prevents quota exhaustion on transient errors or unrecoverable issues.
    models_to_try = candidate_models[:2]

    for model_name in models_to_try:
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=contents,
                config=config
            )

            answer_text = response.text.strip() if response and response.text else ""
            if not answer_text:
                return {
                    "success": False,
                    "status_code": 502,
                    "error_type": "EMPTY_RESPONSE",
                    "error": "The AI model returned an empty response. Please try rephrasing your question."
                }

            return {
                "success": True,
                "status_code": 200,
                "answer": answer_text,
                "model": model_name
            }

        except Exception as error:
            err_str = str(error)
            print(f"[Gemini Service] Error with model {model_name}: {err_str}", flush=True)

            # Unrecoverable: Invalid API Key -> Stop immediately (0 extra calls)
            if "API_KEY_INVALID" in err_str or ("400" in err_str and "key" in err_str.lower()) or "401" in err_str or "403" in err_str:
                return {
                    "success": False,
                    "status_code": 401,
                    "error_type": "INVALID_API_KEY",
                    "error": "The configured Gemini API key is invalid or unauthorized. Please verify your key on Google AI Studio."
                }

            # Unrecoverable: Quota Exceeded / Rate Limit -> Stop immediately (0 extra calls)
            if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                return {
                    "success": False,
                    "status_code": 429,
                    "error_type": "QUOTA_EXCEEDED",
                    "error": "Gemini API usage limit reached. Please wait a moment and try again."
                }

            # Unrecoverable: Network Timeout -> Stop immediately
            if "timeout" in err_str.lower() or "timed out" in err_str.lower() or "11001" in err_str or "getaddrinfo" in err_str:
                return {
                    "success": False,
                    "status_code": 504,
                    "error_type": "NETWORK_TIMEOUT",
                    "error": "Unable to connect to the Gemini AI service. Please check your internet connection."
                }

            # Model unavailable / Deprecated (404) -> Fall back to next candidate model
            if "404" in err_str or "NOT_FOUND" in err_str:
                last_error_type = "MODEL_NOT_FOUND"
                last_status_code = 404
                last_error_message = f"Model '{model_name}' is currently unavailable."
                continue

            # High Demand / Service Unavailable (503) -> Fall back to next candidate model
            if "503" in err_str or "UNAVAILABLE" in err_str:
                last_error_type = "HIGH_DEMAND"
                last_status_code = 503
                last_error_message = "Gemini service is currently experiencing high demand. Please try again in a few moments."
                time.sleep(1)
                continue

            # Generic unexpected error
            last_error_type = "SERVICE_ERROR"
            last_status_code = 500
            last_error_message = "The AI Farmer Assistant encountered an unexpected error. Please try again."
            break

    return {
        "success": False,
        "status_code": last_status_code,
        "error_type": last_error_type,
        "error": last_error_message or "The AI assistant is temporarily unavailable. Please try again later."
    }
