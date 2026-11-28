import os
import sys
import re
import secrets
from pathlib import Path
from urllib.parse import urlencode
from dotenv import load_dotenv

# Determine directories dynamically whether running from root or backend/
CURRENT_DIR = Path(__file__).resolve().parent
if (CURRENT_DIR / "backend").exists():
    ROOT_DIR = CURRENT_DIR
    BACKEND_DIR = CURRENT_DIR / "backend"
else:
    BACKEND_DIR = CURRENT_DIR
    ROOT_DIR = CURRENT_DIR.parent

if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Requirement 1: Load backend/.env first for secret credentials
backend_env = BACKEND_DIR / ".env"
root_env = ROOT_DIR / ".env"

if backend_env.exists():
    load_dotenv(backend_env)
elif root_env.exists():
    load_dotenv(root_env)
else:
    load_dotenv()

import json

from decimal import Decimal
from datetime import datetime
from urllib.request import urlopen
from urllib.error import URLError, HTTPError

from flask import Flask, g, jsonify, request, session
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import generate_password_hash, check_password_hash
from mysql.connector import Error

from backend.config.database import get_db_connection
from backend.auth import clear_session, establish_session, require_auth, require_csrf
from backend.routes.ai_routes import ai_bp
from backend.routes.farm_routes import farm_bp
from backend.routes.password_reset_routes import password_reset_bp


app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1)
is_production = (
    os.getenv("FLASK_ENV", "development").lower() == "production"
    or os.getenv("RENDER", "").lower() == "true"
)
secret_key = os.getenv("SECRET_KEY", "").strip()
if not secret_key:
    if is_production:
        raise RuntimeError("SECRET_KEY must be configured when running in production.")
    secret_key = secrets.token_urlsafe(32)

# Configure CORS using FRONTEND_ORIGIN
frontend_origins_raw = os.getenv(
    "FRONTEND_ORIGIN",
    "" if is_production else "http://localhost:5173,http://127.0.0.1:5173"
)
frontend_origins = [
    origin.strip().rstrip("/") for origin in frontend_origins_raw.split(",") if origin.strip()
]

if not frontend_origins or "*" in frontend_origins:
    raise RuntimeError("Set explicit FRONTEND_ORIGIN values; wildcard CORS is not supported.")

has_https_origin = any(origin.startswith("https://") for origin in frontend_origins)
use_cross_site_cookies = is_production or has_https_origin
cookie_samesite = os.getenv(
    "SESSION_COOKIE_SAMESITE",
    "None" if use_cross_site_cookies else "Lax"
)
cookie_secure = os.getenv(
    "SESSION_COOKIE_SECURE",
    "True" if (use_cross_site_cookies or cookie_samesite.lower() == "none") else "False"
).lower() in ("true", "1", "yes")
if cookie_samesite.lower() == "none":
    cookie_secure = True

app.config.update(
    SECRET_KEY=secret_key,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SECURE=cookie_secure,
    SESSION_COOKIE_SAMESITE=cookie_samesite,
    PERMANENT_SESSION_LIFETIME=60 * 60 * 24 * 7,
)

CORS(app, origins=frontend_origins, supports_credentials=True)

app.register_blueprint(ai_bp)
app.register_blueprint(farm_bp)
app.register_blueprint(password_reset_bp)


# CONVERT DATABASE VALUES INTO JSON-SAFE VALUES
def serialize_farmer(farmer):
    if not farmer:
        return None

    farmer = dict(farmer)
    farmer.pop("password_hash", None)

    for key, value in farmer.items():
        if isinstance(value, Decimal):
            farmer[key] = float(value)
        elif isinstance(value, datetime):
            farmer[key] = value.isoformat()

    return farmer


def text_value(data, field, maximum=255):
    value = data.get(field, "")
    if not isinstance(value, str):
        return ""
    return value.strip()[:maximum]


def valid_email(email):
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email))


# HOME
@app.route("/")
def home():
    return jsonify({
        "message": "Welcome to RainToRoot!",
        "status": "Backend running successfully"
    })


# PROJECT FEATURES
@app.route("/api/features")
def features():
    return jsonify({
        "features": [
            "Weather and Rainfall",
            "Soil Analysis",
            "Crop Advisory",
            "Climate Risk",
            "Mandi Prices",
            "Profit Calculator",
            "AI Farmer Assistant"
        ]
    })


# WEATHER API
@app.route("/api/weather", methods=["GET"])
def get_weather():
    try:
        latitude = float(request.args.get("latitude"))
        longitude = float(request.args.get("longitude"))

        if not -90 <= latitude <= 90:
            return jsonify({"error": "Invalid latitude."}), 400

        if not -180 <= longitude <= 180:
            return jsonify({"error": "Invalid longitude."}), 400

        weather_params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
            "forecast_days": 7,
            "timezone": "auto",
        }
        url = f"https://api.open-meteo.com/v1/forecast?{urlencode(weather_params)}"

        with urlopen(url, timeout=15) as response:
            weather = json.loads(response.read().decode("utf-8"))

        current = weather.get("current", {})
        guidance = []
        if current.get("rain", 0) >= 5:
            guidance.append("Rainfall is being reported. Avoid field operations that compact wet soil and check drainage.")
        if current.get("wind_speed_10m", 0) >= 25:
            guidance.append("Strong wind is being reported. Secure loose covers and avoid spray decisions until conditions are suitable.")
        if not guidance:
            guidance.append("Use this forecast together with field observations before planning irrigation or crop work.")
        return jsonify({
            "message": "Weather data retrieved successfully.",
            "weather": weather,
            "guidance": guidance,
        })

    except (TypeError, ValueError):
        return jsonify({
            "error": "Please provide valid latitude and longitude."
        }), 400

    except (HTTPError, URLError, TimeoutError):
        return jsonify({
            "error": "Weather service is temporarily unavailable."
        }), 503

    except Exception as error:
        print("Weather error:", error)
        return jsonify({
            "error": "Unable to retrieve weather data."
        }), 500


# FARMER SIGNUP
@app.route("/api/farmers", methods=["POST"])
def create_farmer():
    data = request.get_json(silent=True) or {}

    name = text_value(data, "name", 100)
    email = text_value(data, "email", 150).lower()
    password = data.get("password", "") if isinstance(data.get("password", ""), str) else ""

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email and password are required."
        }), 400

    if not valid_email(email):
        return jsonify({"error": "Please provide a valid email address."}), 400

    if len(password) < 8:
        return jsonify({
            "error": "Password must contain at least 8 characters."
        }), 400

    password_hash = generate_password_hash(password)

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        cursor.execute(
            "SELECT id FROM farmers WHERE LOWER(TRIM(email)) = %s LIMIT 1",
            (email,)
        )
        if cursor.fetchone():
            return jsonify({
                "error": "This email is already registered."
            }), 409

        query = """
            INSERT INTO farmers
            (name, email, village, district, state, land_size,
             soil_type, current_crop, irrigation, password_hash)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        values = (
            name,
            email,
            data.get("village"),
            data.get("district"),
            data.get("state"),
            data.get("land_size"),
            data.get("soil_type"),
            data.get("current_crop"),
            data.get("irrigation"),
            password_hash
        )

        cursor.execute(query, values)
        connection.commit()

        farmer_id = cursor.lastrowid

        cursor.execute(
            "SELECT * FROM farmers WHERE id = %s",
            (farmer_id,)
        )

        farmer = dict(zip(
            [column[0] for column in cursor.description],
            cursor.fetchone()
        ))

        return jsonify({
            "message": "Account created successfully!",
            "farmer": serialize_farmer(farmer),
            "csrf_token": establish_session(farmer_id),
        }), 201

    except Error as error:
        if error.errno == 1062:
            return jsonify({
                "error": "This email is already registered."
            }), 409

        print("Signup database error:", error)
        return jsonify({
            "error": "Database error occurred."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# FARMER LOGIN
@app.route("/api/login", methods=["POST"])
def login_farmer():
    data = request.get_json(silent=True) or {}

    email = text_value(data, "email", 150).lower()
    password = data.get("password", "") if isinstance(data.get("password", ""), str) else ""

    if not email or not password:
        return jsonify({
            "error": "Email and password are required."
        }), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM farmers WHERE LOWER(TRIM(email)) = %s LIMIT 1",
            (email,)
        )

        farmer = cursor.fetchone()

        if not farmer or not farmer.get("password_hash"):
            return jsonify({
                "error": "Account not found or password not set."
            }), 401

        if not check_password_hash(
            farmer["password_hash"], password
        ):
            return jsonify({
                "error": "Incorrect email or password."
            }), 401

        return jsonify({
            "message": "Login successful!",
            "farmer": serialize_farmer(farmer),
            "csrf_token": establish_session(farmer["id"]),
        }), 200

    except Error as error:
        print("Login database error:", error)
        return jsonify({
            "error": "Database error occurred."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# AUTHENTICATED FARMER PROFILE
@app.route("/api/auth/me", methods=["GET"])
@require_auth
def get_current_farmer():
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT * FROM farmers WHERE id = %s", (g.farmer_id,))
        farmer = cursor.fetchone()
        if not farmer:
            clear_session()
            return jsonify({"error": "Farmer account not found."}), 401
        csrf_token = session.get("csrf_token")
        if not csrf_token:
            csrf_token = secrets.token_urlsafe(32)
            session["csrf_token"] = csrf_token
        return jsonify({"farmer": serialize_farmer(farmer), "csrf_token": csrf_token})
    except Error:
        return jsonify({"error": "Unable to retrieve farmer profile."}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# GET FARMER PROFILE (kept for compatibility; only the signed-in farmer is allowed)
@app.route("/api/farmers/<int:farmer_id>", methods=["GET"])
@require_auth
def get_farmer(farmer_id):
    if farmer_id != g.farmer_id:
        return jsonify({"error": "You can only access your own profile."}), 403
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        cursor.execute(
            "SELECT * FROM farmers WHERE id = %s",
            (farmer_id,)
        )

        farmer = cursor.fetchone()

        if not farmer:
            return jsonify({
                "error": "Farmer not found."
            }), 404

        return jsonify({
            "farmer": serialize_farmer(farmer)
        })

    except Error as error:
        print("Profile database error:", error)
        return jsonify({
            "error": "Database error occurred."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


# UPDATE FARMER PROFILE
@app.route("/api/farmers/<int:farmer_id>", methods=["PUT"])
@require_auth
@require_csrf
def update_farmer(farmer_id):
    if farmer_id != g.farmer_id:
        return jsonify({"error": "You can only update your own profile."}), 403
    data = request.get_json(silent=True) or {}

    allowed_fields = [
        "name", "village", "district", "state",
        "land_size", "soil_type", "current_crop", "irrigation"
    ]

    updates = {
        field: data[field]
        for field in allowed_fields
        if field in data
    }

    if not updates:
        return jsonify({
            "error": "No valid fields provided."
        }), 400

    if "name" in updates:
        updates["name"] = text_value(data, "name", 100)
        if not updates["name"]:
            return jsonify({"error": "Name cannot be empty."}), 400
    for field, maximum in (("village", 100), ("district", 100), ("state", 100), ("soil_type", 100), ("current_crop", 100), ("irrigation", 100)):
        if field in updates:
            updates[field] = text_value(data, field, maximum) or None
    if "land_size" in updates:
        try:
            updates["land_size"] = float(updates["land_size"]) if updates["land_size"] not in (None, "") else None
            if updates["land_size"] is not None and updates["land_size"] < 0:
                raise ValueError
        except (TypeError, ValueError):
            return jsonify({"error": "Land size must be a non-negative number."}), 400

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        fields = ", ".join(
            f"{field} = %s" for field in updates
        )

        values = list(updates.values()) + [farmer_id]

        cursor.execute(
            f"UPDATE farmers SET {fields} WHERE id = %s",
            values
        )

        if cursor.rowcount == 0:
            cursor.execute(
                "SELECT id FROM farmers WHERE id = %s",
                (farmer_id,)
            )

            if not cursor.fetchone():
                return jsonify({
                    "error": "Farmer not found."
                }), 404

        connection.commit()

        return jsonify({
            "message": "Farmer profile updated successfully."
        })

    except Error as error:
        print("Update database error:", error)
        return jsonify({
            "error": "Database error occurred."
        }), 500

    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@app.route("/api/logout", methods=["POST"])
@require_auth
@require_csrf
def logout_farmer():
    clear_session()
    return jsonify({"message": "Logged out successfully."})


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "False").lower() in ("true", "1", "yes") and not is_production
    app.run(host="0.0.0.0", port=port, debug=debug)
