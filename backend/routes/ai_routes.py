from flask import Blueprint, request, jsonify
from backend.auth import require_auth, require_csrf
from backend.services.ai_service import ask_gemini

ai_bp = Blueprint("ai", __name__)


@ai_bp.route("/api/assistant", methods=["POST"])
@require_auth
@require_csrf
def assistant():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({
            "success": False,
            "error": "Request body must be a JSON object.",
            "answer": "Request body must be a JSON object."
        }), 400

    question = data.get("question", "").strip()
    history = data.get("history")

    if not question:
        return jsonify({
            "success": False,
            "error": "Please enter a question.",
            "answer": "Please enter a question."
        }), 400

    turns_count = len(history) if isinstance(history, list) else 0
    print(f"[AI Assistant] Received question: {question} (history_turns={turns_count})", flush=True)

    result = ask_gemini(question, history=history)

    print(f"[AI Assistant] Request completed with success={result.get('success')}", flush=True)

    if result.get("success"):
        return jsonify({
            "success": True,
            "answer": result.get("answer"),
            "model": result.get("model")
        }), 200
    else:
        status_code = result.get("status_code", 500)
        return jsonify({
            "success": False,
            "error": result.get("error", "The AI assistant is temporarily unavailable."),
            "answer": result.get("error", "The AI assistant is temporarily unavailable."),
            "error_type": result.get("error_type", "GENERAL_ERROR")
        }), status_code
