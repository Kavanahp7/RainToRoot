
from flask import Blueprint, request, jsonify
from backend.services.ai_service import ask_gemini

ai_bp = Blueprint("ai", __name__)

@ai_bp.route("/api/assistant", methods=["POST"])
def assistant():
    data = request.get_json(silent=True) or {}
    question = data.get("question", "").strip()

    if not question:
        return jsonify({"error": "Please enter a question."}), 400

    print("AI request received:", question, flush=True)

    answer = ask_gemini(question)

    print("AI request completed.", flush=True)

    return jsonify({"answer": answer})
