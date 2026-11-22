import os
from pathlib import Path
from urllib.parse import urlencode
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env")

import json

from decimal import Decimal
from datetime import datetime
from urllib.request import urlopen
from urllib.error import URLError, HTTPError

from flask import Flask, jsonify, request
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from mysql.connector import Error

from backend.config.database import get_db_connection
from backend.routes.ai_routes import ai_bp


app = Flask(__name__)
CORS(app)

app.register_blueprint(ai_bp)


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

        url = (
            "https://api.open-meteo.com/v1/forecast"
            f"?latitude={latitude}&longitude={longitude}"
            "&current=temperature_2m,relative_humidity_2m,"
            "apparent_temperature,precipitation,rain,weather_code,"
            "wind_speed_10m"
            "&daily=temperature_2m_max,temperature_2m_min,"
            "precipitation_probability_max"
            "&forecast_days=3&timezone=auto"
        )

        with urlopen(url, timeout=15) as response:
            weather = json.loads(response.read().decode("utf-8"))

        return jsonify({
            "message": "Weather data retrieved successfully.",
            "weather": weather
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

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({
            "error": "Name, email and password are required."
        }), 400

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
            "farmer": serialize_farmer(farmer)
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

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

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
            "SELECT * FROM farmers WHERE email = %s",
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
            "farmer": serialize_farmer(farmer)
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


# GET FARMER PROFILE
@app.route("/api/farmers/<int:farmer_id>", methods=["GET"])
def get_farmer(farmer_id):
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
def update_farmer(farmer_id):
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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
