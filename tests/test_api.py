import hashlib
import unittest
from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock, patch
from urllib.parse import parse_qs, urlparse

from werkzeug.security import check_password_hash, generate_password_hash

from app import app


class RainToRootApiTests(unittest.TestCase):
    def setUp(self):
        app.config.update(TESTING=True, SECRET_KEY="test-secret-not-for-production")
        self.client = app.test_client()

    def authenticate(self, farmer_id=1, csrf_token="test-csrf"):
        with self.client.session_transaction() as session:
            session["farmer_id"] = farmer_id
            session["csrf_token"] = csrf_token
        return csrf_token

    def test_public_status_and_features(self):
        self.assertEqual(self.client.get("/").status_code, 200)
        self.assertEqual(self.client.get("/api/features").status_code, 200)

    def test_profile_requires_authentication(self):
        self.assertEqual(self.client.get("/api/auth/me").status_code, 401)
        self.assertEqual(self.client.get("/api/farmers/1").status_code, 401)

    def test_farmer_cannot_access_another_profile(self):
        self.authenticate(farmer_id=1)
        self.assertEqual(self.client.get("/api/farmers/2").status_code, 403)

    def test_farmer_cannot_update_another_profile(self):
        csrf = self.authenticate(farmer_id=1)
        response = self.client.put("/api/farmers/2", json={"name": "Other"}, headers={"X-CSRF-Token": csrf})
        self.assertEqual(response.status_code, 403)

    def test_csrf_is_required_for_ai_requests(self):
        self.authenticate()
        self.assertEqual(self.client.post("/api/assistant", json={"question": "Hello"}).status_code, 403)

    def test_empty_ai_question_is_validated_after_csrf(self):
        csrf = self.authenticate()
        self.assertEqual(self.client.post("/api/assistant", json={}, headers={"X-CSRF-Token": csrf}).status_code, 400)

    def test_ai_rejects_non_object_json_bodies(self):
        csrf = self.authenticate()
        for body in ([], "text", None):
            response = self.client.post(
                "/api/assistant",
                json=body,
                headers={"X-CSRF-Token": csrf},
            )
            self.assertEqual(response.status_code, 400)
            self.assertIn("JSON object", response.get_json()["error"])

        response = self.client.post(
            "/api/assistant",
            data="{not valid json",
            content_type="application/json",
            headers={"X-CSRF-Token": csrf},
        )
        self.assertEqual(response.status_code, 400)

    def test_farm_write_routes_reject_non_object_json_bodies(self):
        csrf = self.authenticate()
        for path in ("/api/soil-reports", "/api/selected-crop", "/api/crop-records"):
            for body in ([], "text", None):
                response = self.client.post(
                    path,
                    json=body,
                    headers={"X-CSRF-Token": csrf},
                )
                self.assertEqual(response.status_code, 400, path)
                self.assertIn("JSON object", response.get_json()["error"], path)

            response = self.client.post(
                path,
                data="{not valid json",
                content_type="application/json",
                headers={"X-CSRF-Token": csrf},
            )
            self.assertEqual(response.status_code, 400, path)

    def test_signup_validates_email_before_database_access(self):
        response = self.client.post("/api/farmers", json={"name": "Test", "email": "not-an-email", "password": "password123"})
        self.assertEqual(response.status_code, 400)

    def test_market_prices_reports_unavailable_without_official_credentials(self):
        self.authenticate()
        with patch.dict("os.environ", {
            "DATA_GOV_IN_API_KEY": "",
            "DATA_GOV_IN_RESOURCE_ID": "",
        }, clear=False):
            response = self.client.get("/api/market-prices")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.get_json()["status"], "unavailable")

    def test_authenticated_knowledge_search_and_ai_assistant(self):
        self.assertEqual(self.client.get("/api/knowledge").status_code, 401)
        self.assertEqual(self.client.get("/api/search?q=soil").status_code, 401)

        csrf = self.authenticate(farmer_id=1)

        knowledge_res = self.client.get("/api/knowledge")
        self.assertEqual(knowledge_res.status_code, 200)
        articles = knowledge_res.get_json()["articles"]
        self.assertTrue(any(a["id"] == "pesticide-safety" for a in articles))

        search_res = self.client.get("/api/search?q=soil")
        self.assertEqual(search_res.status_code, 200)
        self.assertTrue(len(search_res.get_json()["results"]) > 0)

        red_soil_res = self.client.get("/api/search?q=red%20soil")
        self.assertEqual(red_soil_res.status_code, 200)
        red_soil_results = red_soil_res.get_json()["results"]
        self.assertTrue(any(r["title"] == "Groundnut" for r in red_soil_results))
        self.assertEqual(len({r["id"] for r in red_soil_results}), len(red_soil_results))

        empty_search = self.client.get("/api/search?q=")
        self.assertEqual(empty_search.status_code, 200)
        self.assertEqual(empty_search.get_json()["results"], [])

        no_match_search = self.client.get("/api/search?q=zzzznotfound")
        self.assertEqual(no_match_search.status_code, 200)
        self.assertEqual(no_match_search.get_json()["results"], [])

        with patch("backend.routes.ai_routes.ask_gemini", return_value={"success": True, "answer": "Use drip irrigation.", "model": "gemini-test"}):
            ai_res = self.client.post(
                "/api/assistant",
                json={"question": "How can I manage irrigation?"},
                headers={"X-CSRF-Token": csrf},
            )
        self.assertEqual(ai_res.status_code, 200)
        self.assertTrue(ai_res.get_json()["success"])
        self.assertEqual(ai_res.get_json()["answer"], "Use drip irrigation.")

    def test_email_normalization_on_signup_and_login(self):
        mock_cursor = MagicMock()
        mock_cursor.fetchone.side_effect = [
            None,
            (1, "Test Farmer", "farmer@example.com", "Kolar", "Kolar", "Karnataka", 2.5, "Red Soil", "Ragi", "Rainfed", generate_password_hash("password123")),
        ]
        mock_cursor.description = [
            ("id",), ("name",), ("email",), ("village",), ("district",), ("state",),
            ("land_size",), ("soil_type",), ("current_crop",), ("irrigation",), ("password_hash",),
        ]
        mock_cursor.lastrowid = 1
        mock_conn = MagicMock()
        mock_conn.cursor.return_value = mock_cursor

        with patch("app.get_db_connection", return_value=mock_conn):
            signup_res = self.client.post(
                "/api/farmers",
                json={"name": "Test Farmer", "email": "  FARMER@Example.COM ", "password": "password123"},
            )
        self.assertEqual(signup_res.status_code, 201)
        self.assertEqual(signup_res.get_json()["farmer"]["email"], "farmer@example.com")
        self.assertIn("csrf_token", signup_res.get_json())

        # Login with uppercase and spaces
        login_cursor = MagicMock()
        login_cursor.fetchone.return_value = {
            "id": 1,
            "name": "Test Farmer",
            "email": "farmer@example.com",
            "password_hash": generate_password_hash("password123"),
        }
        login_conn = MagicMock()
        login_conn.cursor.return_value = login_cursor
        with patch("app.get_db_connection", return_value=login_conn):
            login_upper = self.client.post(
                "/api/login",
                json={"email": "  FARMER@EXAMPLE.COM  ", "password": "password123"},
            )
            login_lower = self.client.post(
                "/api/login",
                json={"email": "farmer@example.com", "password": "password123"},
            )
        self.assertEqual(login_upper.status_code, 200)
        self.assertEqual(login_lower.status_code, 200)

    def test_password_reset_requires_smtp_and_handles_tokens(self):
        with patch.dict("os.environ", {"SMTP_HOST": "", "SMTP_USER": "", "SMTP_PASSWORD": ""}, clear=False):
            res = self.client.post("/api/password-reset/request", json={"email": "farmer@example.com"})
        self.assertEqual(res.status_code, 503)

        stored_tokens = {}
        stored_farmer = {
            "id": 7,
            "name": "Asha",
            "email": "asha@example.com",
            "password_hash": generate_password_hash("oldpassword123"),
        }

        class FakeCursor:
            def __init__(self):
                self._result = None

            def execute(self, query, params=()):
                q = " ".join(query.split())
                if "FROM farmers WHERE LOWER(TRIM(email))" in q:
                    self._result = stored_farmer if params[0] == stored_farmer["email"] else None
                elif "UPDATE password_reset_tokens SET used_at" in q and "WHERE farmer_id" in q:
                    for rec in stored_tokens.values():
                        if rec["farmer_id"] == params[1] and rec["used_at"] is None:
                            rec["used_at"] = params[0]
                elif "INSERT INTO password_reset_tokens" in q:
                    farmer_id, token_hash, expires_at = params
                    stored_tokens[token_hash] = {
                        "id": len(stored_tokens) + 1,
                        "farmer_id": farmer_id,
                        "token_hash": token_hash,
                        "expires_at": expires_at,
                        "used_at": None,
                    }
                elif "FROM password_reset_tokens WHERE token_hash" in q:
                    self._result = stored_tokens.get(params[0])
                elif "UPDATE farmers SET password_hash" in q:
                    stored_farmer["password_hash"] = params[0]

            def fetchone(self):
                return self._result

            def close(self):
                pass

        class FakeConn:
            def cursor(self, dictionary=False):
                return FakeCursor()

            def start_transaction(self):
                pass

            def commit(self):
                pass

            def rollback(self):
                pass

            def close(self):
                pass

        sent_messages = []

        class FakeSMTP:
            def __init__(self, *args, **kwargs):
                pass

            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

            def starttls(self):
                pass

            def login(self, user, password):
                pass

            def send_message(self, msg):
                sent_messages.append(msg)

        with patch("backend.routes.password_reset_routes.get_db_connection", return_value=FakeConn()), \
             patch("backend.services.email_service.smtplib.SMTP", FakeSMTP), \
             patch.dict("os.environ", {
                 "SMTP_HOST": "smtp.example.com",
                 "SMTP_PORT": "587",
                 "SMTP_USER": "noreply@example.com",
                 "SMTP_PASSWORD": "app-password",
                 "FRONTEND_APP_URL": "https://raintoroot.example",
             }, clear=False):
            req_res = self.client.post("/api/password-reset/request", json={"email": " ASHA@EXAMPLE.COM "})
            self.assertEqual(req_res.status_code, 200)
            self.assertNotIn("reset_token", req_res.get_json())
            self.assertEqual(len(sent_messages), 1)

            body = sent_messages[0].get_content()
            token_line = next(line for line in body.splitlines() if "reset_token=" in line)
            raw_token = parse_qs(urlparse(token_line.strip()).query)["reset_token"][0]

            val_res = self.client.get(f"/api/password-reset/validate?token={raw_token}")
            self.assertEqual(val_res.status_code, 200)
            self.assertTrue(val_res.get_json()["valid"])

            confirm_res = self.client.post(
                "/api/password-reset/confirm",
                json={"token": raw_token, "password": "newpassword123", "confirm_password": "newpassword123"},
            )
            self.assertEqual(confirm_res.status_code, 200)
            self.assertTrue(check_password_hash(stored_farmer["password_hash"], "newpassword123"))

            # Reusing token fails
            reuse_res = self.client.post(
                "/api/password-reset/confirm",
                json={"token": raw_token, "password": "anotherpassword123"},
            )
            self.assertEqual(reuse_res.status_code, 400)

            # Expired token fails
            expired_raw = "expired-token-value"
            expired_hash = hashlib.sha256(expired_raw.encode("utf-8")).hexdigest()
            stored_tokens[expired_hash] = {
                "id": 99,
                "farmer_id": 7,
                "token_hash": expired_hash,
                "expires_at": datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=5),
                "used_at": None,
            }
            exp_res = self.client.get(f"/api/password-reset/validate?token={expired_raw}")
            self.assertEqual(exp_res.status_code, 400)
            self.assertFalse(exp_res.get_json()["valid"])


if __name__ == "__main__":
    unittest.main()
