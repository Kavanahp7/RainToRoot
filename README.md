# RainToRoot – Smart Farming and Climate Information Platform

**From every drop of rain to better farming decisions.**

## About the Project

RainToRoot is a web-based farming decision-support platform designed to help farmers make informed decisions using weather information, soil details, crop suitability, climate-related indicators, market information, farm records, and an AI assistant.

The platform brings multiple farming-related tools together in one dashboard to support better agricultural planning and resource management.

## Problem Statement

Farmers often need information from different sources to decide which crops to grow, understand weather conditions, estimate farming expenses, and check market prices.

Finding all this information in one place can be difficult. RainToRoot aims to address this by providing a common platform with useful farming information and decision-support tools.

## Project Objectives

1. Provide weather and rainfall information.
2. Help users understand soil characteristics and crop suitability.
3. Present climate-related risk indicators.
4. Provide access to mandi price information.
5. Help estimate farming investment and possible returns.
6. Provide an AI-based assistant for farming questions.
7. Store farmer profile and farming information securely.
8. Make farming-related information accessible through a simple dashboard.

## Features and Implementation Status

### 1. Farmer Registration and Login
- Farmer registration, login, and logout.
- Password hashing.
- Signed sessions and CSRF protection.
- Profile viewing and editing.

### 2. Weather and Rainfall
- Location search using Open-Meteo geocoding.
- Seven-day weather forecasts.
- Temperature, humidity, rainfall, and wind information.
- Forecast-based farming guidance.

### 3. Soil Health and Crop Recommendation
- Soil report storage.
- Rule-based crop recommendations.
- General soil and crop suitability information.
- Selected crop storage.

### 4. Climate Risk Analysis
- Weather-related indicators based on the seven-day forecast.
- Simple rainfall and temperature thresholds.

This is simplified analysis, not historical climate prediction, drought forecasting, or an official warning service.

### 5. Crop Growth and Farm Management
- Selected crop management.
- Dated crop-growth and farm records.
- Farmer-specific data storage.

### 6. Mandi Prices and Farm Economics
- Mandi lookup through the official data.gov.in API when the required credentials are configured.
- Manual mandi price comparison.
- Farm-profit estimation using user-entered values.

Manual values are not live official market prices.

### 7. AI Farmer Assistant
- AI assistant interface for farming-related questions.
- Google Gemini API integration through the Flask backend.
- Responses depend on API configuration and service availability.

### 8. Farmer Knowledge Hub and Search
- Farming information and educational resources.
- Simple farming-resource search.

### 9. Farming Alerts and Pesticide Safety
- Informational farming guidance and farm-record reminders.
- Pesticide safety and awareness information.

Farming Alerts does not currently send real-time browser notifications.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite, JavaScript |
| Styling | CSS |
| Backend | Python, Flask |
| Database | MySQL |
| AI Integration | Google Gemini API |
| Weather Data | Open-Meteo API |
| Communication | REST APIs |
| Maps | Leaflet / OpenStreetMap |

## Project Structure

```text
RainToRoot/
├── app.py
├── backend/
│   ├── auth.py
│   ├── config/
│   │   └── database.py
│   ├── routes/
│   ├── services/
│   │   └── ai_service.py
│   ├── migrations/
│   │   └── 001_farming_data.sql
│   └── migrate.py
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── .env.example
├── tests/
├── .gitignore
└── README.md
```

## Installation and Setup

### Requirements
- Python 3.12
- Node.js and npm
- MySQL Server
- Visual Studio Code
- Internet access for external APIs

### 1. Clone the Repository

```bash
git clone https://github.com/Kavanahp7/RainToRoot.git
cd RainToRoot
```

### 2. Configure the Backend

Create your backend environment file using `backend/.env.example`.

Create and activate a Python virtual environment:

```powershell
py -3.12 -m venv venv
.\venv\Scripts\Activate.ps1
```

Install the required packages listed in the project's requirements file.

### 3. Configure MySQL

Create the `raintoroot` database and ensure the existing `farmers` table is available before applying the farming-data migration.

Apply the additive migration:

```powershell
python backend\migrate.py
```

The migration creates the additional farming tables without dropping existing farmer records.

### 4. Start the Backend

```powershell
python app.py
```

The local backend typically runs at:

```text
http://127.0.0.1:5000
```

### 5. Configure and Start the Frontend

Create `frontend/.env.local` using `frontend/.env.example`.

Set the backend API URL as required by the frontend configuration.

Then run:

```powershell
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually:

```text
http://localhost:5173
```

## Environment Configuration

Important backend environment variables include:

- `SECRET_KEY`
- `FRONTEND_ORIGIN`
- MySQL connection settings
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (optional)
- `DATA_GOV_IN_API_KEY` (optional)
- `DATA_GOV_IN_RESOURCE_ID` (optional)

For production, configure HTTPS, secure session cookies, a strong secret key, and the correct frontend origin.

Set the frontend `VITE_API_URL` to the deployed backend URL.

**Never commit `.env` files or publish API keys, database passwords, or other credentials.**

## API Endpoints

The application includes API routes for:

- Backend status and feature information.
- Weather information.
- Farmer registration and authentication.
- Farmer profile retrieval and updates.
- Soil reports and crop recommendations.
- Selected crops and farm records.
- AI assistant requests.
- Market-price lookup.

Exact routes and methods are defined in the backend source files.

## How the Project Works

1. A farmer opens the RainToRoot website.
2. The farmer registers or logs in.
3. The application displays the dashboard.
4. The farmer selects a farming module.
5. The React frontend communicates with the Flask backend through REST APIs.
6. The backend processes requests and retrieves external information when configured.
7. MySQL stores farmer account and farming data.
8. The requested information is returned and displayed on the frontend.

## Security

- Passwords are stored as hashes.
- Database credentials and API keys are maintained in environment variables.
- Signed sessions and CSRF protection are used.
- Farmer-owned data is protected through backend ownership checks.
- User input is validated by the backend.

## Verification

Run backend tests from the project root:

```powershell
python -B -m unittest discover -s tests -v
```

Run frontend checks from the `frontend` directory:

```powershell
npm.cmd run lint
npm.cmd run build
```

Live MySQL, Gemini, Open-Meteo, data.gov.in, and deployed-session behavior require their external services and credentials. Local unit tests do not guarantee those services are working.

## Limitations

- Crop recommendations provide general guidance and are not laboratory diagnoses or yield guarantees.
- Climate-risk analysis uses short-term forecast indicators rather than historical climate models.
- Official mandi results require valid data.gov.in credentials.
- Manual price comparisons are not live market data.
- Farm-profit calculations are estimates, not guaranteed returns.
- AI responses depend on Gemini API availability.
- Farming Alerts currently provides informational guidance rather than real-time browser notifications.

## Future Improvements

- Improve AI assistant reliability.
- Integrate verified and regularly updated mandi price data.
- Add historical weather datasets for climate-risk analysis.
- Improve location-specific crop recommendations.
- Add more detailed soil analysis.
- Improve mobile responsiveness.
- Deploy the frontend and backend for public access.

## Conclusion

RainToRoot brings weather information, soil and crop guidance, climate-related indicators, market information, farm management, and financial estimation tools into one platform.

The project aims to make useful farming information easier to access and support more informed agricultural decisions.

## Project Details

- **Project Name:** RainToRoot
- **Category:** Smart Agriculture and AgriTech
- **Development Type:** Full-Stack Web Application
- **Frontend:** React and Vite
- **Backend:** Python and Flask
- **Database:** MySQL