RainToRoot

From every drop of rain to better farming decisions.

PROJECT OVERVIEW

RainToRoot is a smart farming and climate information platform designed to help farmers make better agricultural decisions.

The platform brings together weather information, rainfall updates, soil details, crop suitability, climate-related insights, mandi price tracking, and farm profit estimation in one place.

It aims to make useful farming information easier to access through a simple web-based platform.

PROBLEM STATEMENT

Farmers often need to refer to different sources to understand weather conditions, soil suitability, crop choices, and market prices. Accessing this information separately can make agricultural planning difficult.

RainToRoot aims to bring these useful features together in a single platform.

PROJECT OBJECTIVES

Provide weather and rainfall information.
Help farmers understand soil and crop suitability.
Present climate-related risk information.
Support crop planning and agricultural decisions.
Provide mandi price tracking features.
Help estimate farming costs and expected profit.
Offer an AI-powered assistant for general questions.

MAIN FEATURES

1. Farmer Registration and Login

Farmers can create an account, log in, and manage their profile information.

2. Weather Information

Displays weather information using the Open-Meteo API, including temperature, humidity, rainfall, and forecast details.

3. Soil and Crop Suitability

Provides soil-related information and general crop suitability guidance based on selected soil and seasonal conditions.

4. Climate Risk Analysis

Presents weather-related indicators to help users understand possible agricultural risks. The current analysis uses available weather information and should not be treated as a long-term climate prediction.

5. Mandi Price Tracker

Provides a section for checking and comparing mandi prices to support market-related decisions.

6. Farm Profit Simulator

Helps users estimate farming expenses, expected income, and possible profit based on the values they enter.

7. AI Farmer Assistant

Includes a Gemini-powered AI assistant designed to answer user questions. Its availability depends on the Gemini API service and usage limits.

8. Farmer Profile and Settings

Allows users to view and manage their personal and farming information.

TECHNOLOGY STACK

Frontend
React.js
Vite
JavaScript
HTML5
CSS3

Backend
Python
Flask
REST API

Database
MySQL

Data Analysis
Pandas
NumPy

Machine Learning
Scikit-learn

Data Visualization
Chart.js

Maps
Leaflet

AI Integration
Google Gemini API

External Weather API
Open-Meteo API

PROJECT STRUCTURE

RainToRoot/
    backend/
        config/
            database.py
        routes/
            ai_routes.py
        services/
            ai_service.py
        test_connection.py

    frontend/
        public/
        src/
            assets/
            App.jsx
            App.css
            Dashboard.jsx
            index.css
            main.jsx
        package.json
        vite.config.js

    app.py
    .gitignore
    README.md

INSTALLATION AND SETUP

Requirements

Python 3.12
Node.js and npm
MySQL Server
Visual Studio Code
Git

Step 1: Clone the repository

git clone YOUR_GITHUB_REPOSITORY_URL

Step 2: Open the project folder

cd RainToRoot

Step 3: Install frontend dependencies

cd frontend
npm install

Step 4: Start the frontend

npm run dev

Step 5: Set up the Python environment

Open another terminal in the main project folder.

Create a virtual environment:

python -m venv venv312

Activate it in Windows PowerShell:

.\venv312\Scripts\Activate.ps1

Install the required backend packages:

pip install Flask Flask-CORS mysql-connector-python python-dotenv pandas numpy scikit-learn google-genai

Step 6: Configure the database

Create a MySQL database named:

raintoroot

Create a .env file in the main project folder and add your own configuration:

MYSQL_HOST=localhost
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password
MYSQL_DATABASE=raintoroot
MYSQL_PORT=3306

GEMINI_API_KEY=your_gemini_api_key

Do not upload your actual .env file or API keys to GitHub.

Step 7: Start the backend

From the main project folder, run:

python app.py

The backend runs at:

http://127.0.0.1:5000

The frontend and backend should run in separate terminals.

DATABASE

RainToRoot uses MySQL to store farmer information.

The farmers table contains information such as:

Farmer ID
Name
Email
Password Hash
Village
District
State
Land Size
Soil Type
Current Crop
Irrigation Method
Account Creation Date

API ENDPOINTS

GET /

Checks backend availability.

GET /api/features

Returns available platform features.

GET /api/weather

Retrieves weather information.

POST /api/farmers

Registers a new farmer.

POST /api/login

Authenticates a farmer.

GET /api/farmers/{farmer_id}

Retrieves farmer profile information.

PUT /api/farmers/{farmer_id}

Updates farmer profile information.

POST /api/assistant

Sends a question to the AI assistant.

PROJECT WORKFLOW

The farmer accesses the RainToRoot web application and registers or logs in.

The farmer can enter and manage personal and farming information.

The frontend communicates with the Flask backend through REST APIs.

The backend connects to the MySQL database to manage farmer information.

External weather services provide weather information.

The platform presents farming-related information and planning tools through the dashboard.

SECURITY

Passwords are stored using password hashing.

Database credentials and API keys are maintained in environment variables.

The .env file and virtual environment folders are excluded from Git tracking.

PROJECT LIMITATIONS

Some features provide estimates or general guidance rather than guaranteed agricultural recommendations.

Climate risk analysis currently relies on available weather information and does not represent a complete long-term climate forecasting system.

Mandi price information should be verified against official market sources before making financial decisions.

AI responses depend on the availability and usage limits of the Gemini API.

FUTURE ENHANCEMENTS

Integration with more official agricultural and government data sources.

Improved crop recommendations using additional soil and weather information.

More detailed climate risk analysis using historical datasets.

Live mandi price integration.

Advanced machine learning models for agricultural insights.

Support for additional Indian languages.

Mobile-friendly improvements and wider deployment.

CONCLUSION

RainToRoot aims to make agricultural information more accessible by combining weather updates, crop guidance, soil information, market-related features, and farm planning tools in one platform.

The project focuses on supporting informed farming decisions through technology and accessible information.

PROJECT INFORMATION

Project Name: RainToRoot

Project Category: Smart Agriculture and Climate Information Platform

Project Type: Web Application

Target Users: Farmers and agricultural information seekers
