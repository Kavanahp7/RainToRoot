RainToRoot

From every drop of rain to better farming decisions.

ABOUT THE PROJECT

RainToRoot is a smart farming and climate information platform developed to help farmers make informed agricultural decisions. It combines weather information, soil details, crop guidance, climate-related insights, mandi prices, and farm planning tools in one platform.

OBJECTIVES

- Provide weather forecasts and rainfall information.
- Help farmers understand soil conditions and crop suitability.
- Present climate-related agricultural risks.
- Provide mandi price information.
- Estimate farming expenses and potential profit.
- Offer an AI assistant for user queries.

FEATURES

- Farmer Registration and Login – Allows farmers to create accounts and manage their profiles.
- Weather Information – Displays temperature, humidity, rainfall, and forecast details.
- Soil and Crop Suitability – Provides general crop guidance based on soil and seasonal conditions.
- Climate Risk Analysis – Presents weather-related indicators to help farmers understand possible risks.
- Mandi Price Tracker – Helps users check and compare market prices.
- Farm Profit Simulator – Estimates farming costs, expected income, and potential profit.
- AI Farmer Assistant – Uses Google Gemini API to answer user questions.
- Profile and Settings – Allows farmers to view and manage their information.

TECHNOLOGY STACK

- Frontend: React.js, Vite, JavaScript, HTML5 and CSS3
- Backend: Python and Flask
- Database: MySQL
- Data Analysis: Pandas and NumPy
- Machine Learning: Scikit-learn
- Charts: Chart.js
- Maps: Leaflet
- AI Integration: Google Gemini API
- Weather API: Open-Meteo

PROJECT STRUCTURE

RainToRoot/
│
├── backend/
│   ├── config/
│   │   └── database.py
│   │
│   ├── routes/
│   │   └── ai_routes.py
│   │
│   ├── services/
│   │   └── ai_service.py
│   │
│   └── test_connection.py
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   ├── icons.svg
│   │   └── raintoroot-logo.png
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   └── hero.png
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Dashboard.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── vite.config.js
│
├── app.py
├── .gitignore
└── README.md

INSTALLATION AND SETUP

Requirements:
- Python 3.12
- Node.js and npm
- MySQL Server
- Visual Studio Code

Setup steps:

- Clone the GitHub repository.
- Open the project folder in Visual Studio Code.
- Navigate to the frontend folder and run npm install.
- Create and activate a Python virtual environment.
- Install the required Python packages.
- Create a MySQL database named raintoroot.
- Configure database credentials and the Gemini API key in the root .env file.
- Run the backend using python app.py.
- Run the frontend using npm run dev.
- Open the frontend URL displayed in the terminal.

PROJECT LIMITATIONS

- Crop suitability provides general guidance and may require local verification.
- Climate risk analysis uses available weather information and is not a long-term climate prediction.
- Mandi prices should be verified with official market sources.
- Profit calculations are estimates based on user-entered values.
- AI responses depend on Gemini API availability.

FUTURE ENHANCEMENTS

- Integration with more official agricultural datasets.
- Live mandi price updates.
- Improved crop recommendations.
- Advanced climate risk analysis.
- Support for additional Indian languages.
- Improved mobile accessibility.

CONCLUSION

RainToRoot brings useful farming information and digital tools together to support better agricultural planning. It aims to make weather information, crop guidance, market details, and farm management easier for farmers to access.
