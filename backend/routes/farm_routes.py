"""Farmer-owned soil, crop, records, knowledge, search and market routes."""

import os
from datetime import date
from decimal import Decimal
from urllib.parse import urlencode
from urllib.request import urlopen
from urllib.error import HTTPError, URLError

from flask import Blueprint, g, jsonify, request
from mysql.connector import Error

from backend.auth import require_auth, require_csrf
from backend.config.database import get_db_connection


farm_bp = Blueprint("farm", __name__)


# Transparent, general decision-support rules. These are not yield guarantees.
CROP_RULES = {
    "Black": [
        ("Soybean", "Kharif", "Moderate", "Balanced NPK based on a soil test", 100),
        ("Pigeon pea", "Kharif", "Low to moderate", "Phosphorus and potassium should follow a soil test", 160),
        ("Cotton", "Kharif", "Moderate", "Nutrient plan must follow a local soil test", 170),
    ],
    "Red": [
        ("Groundnut", "Kharif", "Moderate", "Calcium and balanced nutrients should follow a soil test", 120),
        ("Finger millet", "Kharif", "Low to moderate", "Balanced nutrients based on a soil test", 120),
        ("Pigeon pea", "Kharif", "Low to moderate", "Phosphorus and potassium should follow a soil test", 160),
    ],
    "Alluvial": [
        ("Rice", "Kharif", "High", "Nitrogen management should follow local extension guidance", 135),
        ("Wheat", "Rabi", "Moderate", "Balanced nutrients based on a soil test", 130),
        ("Maize", "Kharif", "Moderate", "Nitrogen should be split according to local advice", 115),
    ],
    "Laterite": [
        ("Cashew", "Perennial", "Moderate", "Organic matter and nutrients should follow a soil test", 365),
        ("Finger millet", "Kharif", "Low to moderate", "Balanced nutrients based on a soil test", 120),
        ("Pineapple", "Perennial", "Moderate", "Nutrient plan should follow local recommendations", 450),
    ],
    "Sandy": [
        ("Pearl millet", "Kharif", "Low", "Organic matter and split nutrients are generally useful", 85),
        ("Groundnut", "Kharif", "Moderate", "Calcium and balanced nutrients should follow a soil test", 120),
        ("Watermelon", "Zaid", "Moderate", "Nutrient plan and irrigation need local guidance", 90),
    ],
    "Clay": [
        ("Rice", "Kharif", "High", "Nitrogen management should follow local extension guidance", 135),
        ("Sugarcane", "Perennial", "High", "Use a local, soil-test-based nutrient plan", 330),
        ("Wheat", "Rabi", "Moderate", "Balanced nutrients based on a soil test", 130),
    ],
}

KNOWLEDGE_ARTICLES = [
    {"id": "soil-testing", "title": "Understanding a soil report", "topic": "Soil preparation", "summary": "A laboratory soil report measures pH and nutrients; a soil-type selection does not replace one."},
    {"id": "crop-rotation", "title": "Crop rotation basics", "topic": "Sustainable agriculture", "summary": "Rotating crop families can help diversify farm planning and should be adapted to local conditions."},
    {"id": "irrigation", "title": "Irrigation awareness", "topic": "Irrigation", "summary": "Check soil moisture, growth stage and local weather before irrigating. Avoid fixed schedules without field observation."},
    {"id": "organic-matter", "title": "Building soil organic matter", "topic": "Organic farming", "summary": "Compost, cover crops and residue management can support soil health when suitable for the farm."},
    {"id": "pesticide-safety", "title": "Pesticide safety and IPM", "topic": "Safety", "summary": "Use labelled products only as directed, wear protective equipment, store safely and consult a KVK for diagnosis and treatment advice."},
]


def json_safe(row):
    result = dict(row)
    for key, value in result.items():
        if isinstance(value, Decimal):
            result[key] = float(value)
        elif isinstance(value, (date,)):
            result[key] = value.isoformat()
    return result


def get_json_number(data, key, minimum=None, maximum=None):
    value = data.get(key)
    if value in (None, ""):
        return None
    try:
        value = float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{key.replace('_', ' ').title()} must be a number.")
    if minimum is not None and value < minimum:
        raise ValueError(f"{key.replace('_', ' ').title()} must be at least {minimum}.")
    if maximum is not None and value > maximum:
        raise ValueError(f"{key.replace('_', ' ').title()} must be at most {maximum}.")
    return value


def request_json_object():
    """Return a JSON object body, or None for invalid/non-object bodies."""
    data = request.get_json(silent=True)
    return data if isinstance(data, dict) else None


def latest_soil_report(farmer_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM soil_reports WHERE farmer_id = %s ORDER BY report_date DESC, id DESC LIMIT 1",
            (farmer_id,),
        )
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()


def normalized_soil_type(value):
    """Accept the labels used by the profile/UI while keeping stored values unchanged."""
    raw = (value or "").strip()
    if raw in CROP_RULES:
        return raw
    without_suffix = raw[:-5].strip() if raw.lower().endswith(" soil") else raw
    return next((key for key in CROP_RULES if key.lower() == without_suffix.lower()), raw)


@farm_bp.route("/api/soil-reports", methods=["GET"])
@require_auth
def list_soil_reports():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM soil_reports WHERE farmer_id = %s ORDER BY report_date DESC, id DESC LIMIT 50",
            (g.farmer_id,),
        )
        return jsonify({"reports": [json_safe(row) for row in cursor.fetchall()]})
    except Error:
        return jsonify({"error": "Unable to retrieve soil reports."}), 500
    finally:
        cursor.close()
        connection.close()


@farm_bp.route("/api/soil-reports", methods=["POST"])
@require_auth
@require_csrf
def create_soil_report():
    data = request_json_object()
    if data is None:
        return jsonify({"error": "Request body must be a JSON object."}), 400

    source = data.get("source", "manual")
    soil_type = (data.get("soil_type") or "").strip() or None
    report_date = data.get("report_date") or date.today().isoformat()
    if source not in {"laboratory", "manual"}:
        return jsonify({"error": "Source must be laboratory or manual."}), 400
    try:
        date.fromisoformat(report_date)
        ph = get_json_number(data, "ph", 0, 14)
        nitrogen = get_json_number(data, "nitrogen", 0)
        phosphorus = get_json_number(data, "phosphorus", 0)
        potassium = get_json_number(data, "potassium", 0)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    if not soil_type and all(value is None for value in (ph, nitrogen, phosphorus, potassium)):
        return jsonify({"error": "Enter a soil type or at least one measured soil value."}), 400

    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            """INSERT INTO soil_reports
               (farmer_id, report_date, source, soil_type, ph, nitrogen, phosphorus, potassium, notes)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (g.farmer_id, report_date, source, soil_type, ph, nitrogen, phosphorus, potassium, (data.get("notes") or "").strip() or None),
        )
        connection.commit()
        return jsonify({"message": "Soil report saved.", "id": cursor.lastrowid}), 201
    except Error:
        connection.rollback()
        return jsonify({"error": "Unable to save the soil report."}), 500
    finally:
        cursor.close()
        connection.close()


@farm_bp.route("/api/crop-recommendations", methods=["GET"])
@require_auth
def crop_recommendations():
    season = (request.args.get("season") or "Kharif").strip()
    report = latest_soil_report(g.farmer_id)
    soil_type = (report or {}).get("soil_type") or request.args.get("soil_type") or ""
    rules = CROP_RULES.get(normalized_soil_type(soil_type), [])
    recommendations = []
    for crop, growing_season, water, nutrients, duration in rules:
        if season not in {"All", growing_season}:
            continue
        recommendations.append({
            "crop_name": crop,
            "season": growing_season,
            "reason": f"{crop} is shown as a general option for {soil_type} soil and the {growing_season} season. Confirm suitability with your local KVK.",
            "water_requirement": water,
            "nutrient_requirement": nutrients,
            "growing_duration_days": duration,
        })
    return jsonify({
        "soil_report": json_safe(report) if report else None,
        "recommendations": recommendations,
        "disclaimer": "These are transparent general rules, not a laboratory diagnosis, local advisory or yield guarantee.",
    })


@farm_bp.route("/api/selected-crop", methods=["GET"])
@require_auth
def get_selected_crop():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM selected_crops WHERE farmer_id = %s AND is_active = TRUE ORDER BY selected_on DESC, id DESC LIMIT 1",
            (g.farmer_id,),
        )
        selected = cursor.fetchone()
        return jsonify({"selected_crop": json_safe(selected) if selected else None})
    finally:
        cursor.close()
        connection.close()


@farm_bp.route("/api/selected-crop", methods=["POST"])
@require_auth
@require_csrf
def select_crop():
    data = request_json_object()
    if data is None:
        return jsonify({"error": "Request body must be a JSON object."}), 400

    crop_name = (data.get("crop_name") or "").strip()
    season = (data.get("season") or "").strip()
    if not crop_name or not season:
        return jsonify({"error": "Crop name and season are required."}), 400
    if len(crop_name) > 100 or len(season) > 40:
        return jsonify({"error": "Crop name or season is too long."}), 400
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        connection.start_transaction()
        cursor.execute("UPDATE selected_crops SET is_active = FALSE WHERE farmer_id = %s AND is_active = TRUE", (g.farmer_id,))
        cursor.execute(
            """INSERT INTO crop_recommendations
               (farmer_id, soil_report_id, crop_name, season, reason, water_requirement, nutrient_requirement, growing_duration_days)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (g.farmer_id, data.get("soil_report_id"), crop_name, season, (data.get("reason") or "Selected by farmer.").strip(), (data.get("water_requirement") or "Confirm locally").strip(), (data.get("nutrient_requirement") or "Use a soil-test-based plan").strip(), data.get("growing_duration_days")),
        )
        recommendation_id = cursor.lastrowid
        cursor.execute(
            """INSERT INTO selected_crops (farmer_id, recommendation_id, crop_name, season, selected_on, notes)
               VALUES (%s, %s, %s, %s, %s, %s)""",
            (g.farmer_id, recommendation_id, crop_name, season, date.today(), (data.get("notes") or "").strip() or None),
        )
        selected_id = cursor.lastrowid
        connection.commit()
        return jsonify({"message": "Selected crop saved.", "id": selected_id}), 201
    except Error:
        connection.rollback()
        return jsonify({"error": "Unable to save the selected crop."}), 500
    finally:
        cursor.close()
        connection.close()


@farm_bp.route("/api/crop-records", methods=["GET"])
@require_auth
def list_crop_records():
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT * FROM crop_records WHERE farmer_id = %s ORDER BY record_date DESC, id DESC LIMIT 100",
            (g.farmer_id,),
        )
        return jsonify({"records": [json_safe(row) for row in cursor.fetchall()]})
    finally:
        cursor.close()
        connection.close()


@farm_bp.route("/api/crop-records", methods=["POST"])
@require_auth
@require_csrf
def create_crop_record():
    data = request_json_object()
    if data is None:
        return jsonify({"error": "Request body must be a JSON object."}), 400

    stage = (data.get("growth_stage") or "").strip()
    if not stage or len(stage) > 100:
        return jsonify({"error": "A valid growth stage is required."}), 400
    try:
        record_date = data.get("record_date") or date.today().isoformat()
        date.fromisoformat(record_date)
        progress = get_json_number(data, "progress_percent", 0, 100)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400
    selected_crop_id = data.get("selected_crop_id")
    if selected_crop_id not in (None, ""):
        try:
            selected_crop_id = int(selected_crop_id)
        except (TypeError, ValueError):
            return jsonify({"error": "Selected crop is invalid."}), 400

    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        if selected_crop_id is not None:
            cursor.execute(
                "SELECT id FROM selected_crops WHERE id = %s AND farmer_id = %s",
                (selected_crop_id, g.farmer_id),
            )
            if not cursor.fetchone():
                return jsonify({"error": "Selected crop does not belong to this farmer."}), 400
        cursor.execute(
            """INSERT INTO crop_records
               (farmer_id, selected_crop_id, record_date, growth_stage, progress_percent, irrigation_note, nutrient_note, notes)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s)""",
            (g.farmer_id, selected_crop_id, record_date, stage, progress, (data.get("irrigation_note") or "").strip() or None, (data.get("nutrient_note") or "").strip() or None, (data.get("notes") or "").strip() or None),
        )
        connection.commit()
        return jsonify({"message": "Farm record saved.", "id": cursor.lastrowid}), 201
    except Error:
        connection.rollback()
        return jsonify({"error": "Unable to save the farm record."}), 500
    finally:
        cursor.close()
        connection.close()


@farm_bp.route("/api/knowledge", methods=["GET"])
@require_auth
def knowledge_hub():
    return jsonify({"articles": KNOWLEDGE_ARTICLES})


@farm_bp.route("/api/search", methods=["GET"])
@require_auth
def search_resources():
    query = (request.args.get("q") or "").strip().lower()
    if len(query) < 2:
        return jsonify({"results": []})
    tokens = [token for token in query.split() if token]
    results = []
    for article in KNOWLEDGE_ARTICLES:
        haystack = " ".join(str(value) for value in article.values()).lower()
        if query in haystack or all(token in haystack for token in tokens):
            results.append(article)
    for soil_type, crops in CROP_RULES.items():
        for crop, season, water, nutrients, *_ in crops:
            haystack = f"{soil_type} soil {crop} {season} {water} {nutrients}".lower()
            if query in haystack or all(token in haystack for token in tokens):
                results.append({
                    "id": f"crop-{soil_type.lower()}-{crop.lower().replace(' ', '-')}",
                    "title": crop,
                    "topic": "Crop guidance",
                    "summary": f"General {season} option shown for {soil_type} soil.",
                })
    return jsonify({"results": results[:20]})


@farm_bp.route("/api/market-prices", methods=["GET"])
@require_auth
def market_prices():
    api_key = os.getenv("DATA_GOV_IN_API_KEY", "").strip()
    resource_id = os.getenv("DATA_GOV_IN_RESOURCE_ID", "").strip()
    if not api_key or not resource_id:
        return jsonify({
            "status": "unavailable",
            "message": "Official mandi data is not configured. Add DATA_GOV_IN_API_KEY and DATA_GOV_IN_RESOURCE_ID after registering on data.gov.in.",
            "records": [],
        }), 503
    params = {"api-key": api_key, "format": "json", "limit": 50}
    for incoming, field in (("state", "State"), ("district", "District"), ("market", "Market"), ("commodity", "Commodity")):
        value = (request.args.get(incoming) or "").strip()
        if value:
            params[f"filters[{field}]"] = value
    url = f"https://api.data.gov.in/resource/{resource_id}?{urlencode(params)}"
    try:
        with urlopen(url, timeout=15) as response:
            payload = __import__("json").loads(response.read().decode("utf-8"))
        return jsonify({"status": "live", "records": payload.get("records", []), "count": payload.get("count", 0)})
    except (HTTPError, URLError, TimeoutError):
        return jsonify({"status": "unavailable", "message": "Official mandi data is temporarily unavailable.", "records": []}), 503
