RainToRoot – Smart Farming and Climate Information Platform

From every drop of rain to better farming decisions.

ABOUT THE PROJECT

RainToRoot is a web-based farming support platform designed to help farmers make better farming decisions using weather information, soil details, crop suitability, climate-related information, market prices, and farm investment calculations.

The main idea behind RainToRoot is to bring different farming-related tools together in one platform. Instead of checking different sources for every farming decision, users can access several useful features through a single dashboard.

The platform is designed with Indian farmers in mind and aims to support better planning, resource management, and agricultural decision-making.

PROBLEM STATEMENT

Farmers often need information from different sources to decide which crops to grow, understand weather conditions, estimate farming expenses, and check market prices.

Finding all this information in one place can be difficult. Lack of accessible information can also make farm planning more challenging.

RainToRoot aims to address this problem by providing a common platform that brings together useful farming information and decision-support tools.

PROJECT OBJECTIVES

1. Provide weather and rainfall information.
2. Help users understand soil characteristics and crop suitability.
3. Present climate-related risk information.
4. Provide a section for checking mandi prices.
5. Help estimate farming investment and possible returns.
6. Provide an AI-based assistant for answering questions.
7. Store farmer profile information securely.
8. Make farming-related information easier to access through a simple dashboard.

MAIN FEATURES

1. Farmer Registration and Login

New users can create an account.
Existing users can log in.
Farmer details are stored in a MySQL database.
Passwords are stored as hashes instead of plain text.
Users can view and manage their profile information.

2. Weather Information

Users can search for weather information using a location.
The application retrieves weather information using the Open-Meteo API.
Weather information includes temperature, humidity, rainfall, and wind speed.
This information can help users plan farming activities.

3. Soil and Crop Suitability

Provides a section for exploring soil information.
Helps users understand the relationship between soil types and crop selection.
Includes crop and season-related information.

Crop suitability information is intended as general guidance and should be checked against local agricultural recommendations.

4. Climate Risk Analysis

Provides a section for exploring climate-related factors.
Includes weather-related indicators such as rainfall and temperature.
Helps users understand conditions that may affect farming activities.

Short-term weather indicators are not the same as long-term climate predictions. Reliable climate-risk predictions require suitable historical data and validation.

5. Mandi Price Tracker

Provides a dedicated section for mandi and agricultural market prices.
Helps users explore market-price information for agricultural products.

Price information should be verified against official market data. Sample or manually entered values should not be treated as live official prices.

6. Farm Profit Simulator

Allows users to enter farming-related values.
Helps estimate expenses, expected income, and possible profit.
Provides a basic way to compare farming investment and returns.

The calculated values are estimates. Actual farming income may differ.

7. AI Farmer Assistant

Includes an AI assistant interface.
Uses the Gemini API through the Python backend.
Allows users to enter questions and receive AI-generated responses when the service is available.

The Gemini integration is currently under testing and may not return responses consistently.

8. Farmer Profile and Settings

Displays registered farmer information.
Provides profile management options.
Includes dashboard navigation and logout functionality.

TECHNOLOGY STACK

Frontend: React.js, Vite, JavaScript
Styling: CSS
Backend: Python and Flask
Database: MySQL
Data Analysis: Pandas and NumPy
Machine Learning: Scikit-learn
AI Integration: Google Gemini API
Weather Data: Open-Meteo API
Communication: REST APIs

PROJECT STRUCTURE

RainToRoot

    frontend
        public
            raintoroot-logo.png
        src
            App.jsx
            Dashboard.jsx
            main.jsx
        package.json

    backend
        config
            database.py
        routes
            ai_routes.py
        services
            ai_service.py
        test_connection.py

    app.py
    .gitignore
    README.md

INSTALLATION AND SETUP

Requirements

Python 3.12
Node.js and npm
MySQL Server
Visual Studio Code
Internet connection for external API access

1. Clone the Repository

Open the terminal and run:

git clone YOUR_GITHUB_REPOSITORY_URL

cd RainToRoot

Replace the repository URL with your actual GitHub repository URL.

2. Set Up the Frontend

Open the frontend folder in the terminal and run:

cd frontend

npm install

npm run dev

Open the local URL displayed in the terminal. It is usually:

http://localhost:5173

3. Set Up the Python Backend

Open another terminal in the main project folder.

Create a virtual environment:

py -3.12 -m venv venv312

Activate the environment:

.\venv312\Scripts\Activate.ps1

Install the required packages:

pip install Flask flask-cors mysql-connector-python python-dotenv pandas numpy scikit-learn google-genai

Start the backend:

python app.py

The backend runs at:

http://127.0.0.1:5000

4. Configure the MySQL Database

Open MySQL Workbench and execute the following SQL commands:

CREATE DATABASE IF NOT EXISTS raintoroot;

USE raintoroot;

CREATE TABLE IF NOT EXISTS farmers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(150) UNIQUE,
    village VARCHAR(100),
    district VARCHAR(100),
    state VARCHAR(100),
    land_size DECIMAL(10,2),
    soil_type VARCHAR(100),
    current_crop VARCHAR(100),
    irrigation VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    password_hash VARCHAR(255)
);

5. Configure Environment Variables

Create a file named .env in the main project folder.

Add the following configuration with your own credentials:

MYSQL_HOST=localhost

MYSQL_USER=root

MYSQL_PASSWORD=your_mysql_password

MYSQL_DATABASE=raintoroot

MYSQL_PORT=3306

GEMINI_API_KEY=your_gemini_api_key

Replace the example values with your own credentials.

Never upload your .env file or share your API keys and database passwords publicly.

API ENDPOINTS

GET /  
Checks the backend status.

GET /api/features  
Retrieves feature information.

GET /api/weather  
Retrieves weather information.

POST /api/farmers  
Registers a new farmer.

POST /api/login  
Authenticates a farmer.

GET /api/farmers/farmer_id  
Retrieves farmer details.

PUT /api/farmers/farmer_id  
Updates farmer details.

POST /api/assistant  
Sends a question to the AI assistant.

HOW THE PROJECT WORKS

1. A farmer opens the RainToRoot website.
2. The farmer registers or logs in.
3. The application displays the main dashboard.
4. The farmer can access different farming-related modules.
5. The frontend communicates with the Flask backend through REST APIs.
6. The backend retrieves or processes the requested information.
7. MySQL stores farmer account and profile information.
8. The requested information is returned to the frontend and displayed to the user.

SECURITY

Passwords are stored using password hashing.
Database credentials are maintained in environment variables.
API keys should not be committed to public repositories.
User input is validated by the backend.

FUTURE IMPROVEMENTS

Improve Gemini AI response reliability.
Integrate verified and regularly updated mandi price data.
Add historical weather datasets for more reliable climate-risk analysis.
Improve crop recommendations using location-specific agricultural data.
Add more detailed soil analysis.
Improve mobile responsiveness.
Deploy the frontend and backend for public access.

LIMITATIONS

Some crop suitability information is general and may not represent every local farming condition.
Climate-risk analysis requires more historical data for reliable long-term predictions.
Mandi prices must be connected to verified market sources for live updates.
Profit calculations are estimates and not guaranteed results.
AI assistant responses depend on Gemini API availability.

CONCLUSION

RainToRoot is an attempt to make useful farming information easier to access through one web-based platform. It combines weather information, crop and soil guidance, climate-related indicators, market information, and financial estimation tools.

The project aims to support farmers in planning their agricultural activities and making more informed decisions.

PROJECT DETAILS

Project Name: RainToRoot

Project Category: Smart Agriculture and AgriTech

Development Type: Full-Stack
