# RainToRoot

RainToRoot is a React/Vite and Flask/MySQL farming decision-support application. It combines farmer accounts, weather data, soil and crop guidance, farm records, market-data lookup, calculators, and an AI assistant.

## Project structure

- `app.py` — Flask application, authentication, profiles, weather proxy, and legacy farmer endpoints.
- `backend/auth.py` — signed sessions and CSRF checks.
- `backend/routes/` — AI and farmer-owned farming routes.
- `backend/services/ai_service.py` — Google Gemini integration.
- `backend/config/database.py` — MySQL connection helper.
- `backend/migrations/001_farming_data.sql` — additive soil, crop, and farm-record tables.
- `frontend/src/` — React pages, dashboard modules, API helper, and styling.
- `tests/` — backend API and validation tests.

## Features and status

Implemented:

- Farmer registration, login, logout, profile editing, password hashing, signed sessions, and CSRF protection.
- Open-Meteo geocoding and seven-day weather forecasts with forecast-based farming guidance.
- Soil report storage and transparent rule-based crop recommendations.
- Selected crops and dated crop-growth records.
- Knowledge hub and simple farming-resource search.
- Gemini-powered farmer assistant when a valid API key and available model are configured.
- Mandi lookup through `/api/market-prices` when official data.gov.in credentials are configured.
- Manual mandi price comparison and farm-profit estimation using values entered by the user.

Simplified or informational:

- Climate Risk Analysis uses seven-day forecast indicators and simple thresholds. It is not historical climate prediction, drought forecasting, or an official warning service.
- Crop recommendations are general rules, not laboratory diagnoses or yield guarantees.
- Farming Alerts contains informational guidance and farm-record reminders. It does not send real-time browser notifications.
- The manual price comparison is not live market data and does not predict prices.

Unavailable or planned:

- Secure password reset is not implemented.
- Historical climate-risk analysis, location-specific crop models, and browser notifications are not implemented.
- Official mandi results require both `DATA_GOV_IN_API_KEY` and `DATA_GOV_IN_RESOURCE_ID`; without them the API returns `unavailable`.

## Local setup

Requirements: Python 3.12, Node.js/npm, MySQL, and internet access for Open-Meteo, Gemini, or official market data.

1. Create `backend/.env` from `backend/.env.example`. Do not commit it or expose its values.
2. Create the existing `farmers` table in the `raintoroot` database before running the migration. The migration depends on that table for foreign keys.
3. Apply the additive migration:

   `venv312\Scripts\python.exe backend\migrate.py`

4. Start the backend:

   `venv312\Scripts\python.exe app.py`

5. In `frontend`, create `.env.local` from `.env.example`, run `npm install`, and run `npm run dev`.

The migration uses `CREATE TABLE IF NOT EXISTS`, adds only the four farming tables, preserves existing farmer records, and does not drop or overwrite data.

## Configuration

Important backend variables include `SECRET_KEY`, `FRONTEND_ORIGIN`, MySQL settings, `GEMINI_API_KEY`, and optionally `GEMINI_MODEL`. Live mandi lookup additionally uses `DATA_GOV_IN_API_KEY` and `DATA_GOV_IN_RESOURCE_ID`.

For production, use an explicit HTTPS frontend origin, secure cross-site session-cookie settings, and a strong secret key. Set the frontend `VITE_API_URL` to the deployed backend URL.

## Verification

From the repository root:

`venv312\Scripts\python.exe -B -m unittest discover -s tests -v`

From `frontend`:

`npm.cmd run lint`

`npm.cmd run build`

Live MySQL, Gemini, Open-Meteo, data.gov.in, and deployed-session behavior require their external services and credentials; they are not guaranteed by the local unit tests.
