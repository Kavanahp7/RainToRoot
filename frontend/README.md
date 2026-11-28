# RainToRoot frontend

The frontend is a React 19 application built with Vite. It communicates with the Flask API configured by `VITE_API_URL`.

## Implemented modules

- Registration, login, logout, session restoration, and farmer profile editing.
- Weather and rainfall search with Open-Meteo data, a seven-day forecast, and a location map.
- Soil health report entry and history.
- General rule-based crop recommendations and crop-growth records.
- Climate indicators derived from the seven-day forecast. These are not historical climate predictions.
- Mandi lookup for official records when the backend has data.gov.in credentials.
- A separate manual price comparison that never claims to be live data.
- Farm profit estimation using farmer-entered values.
- Gemini farmer assistant when the backend service is available.
- Knowledge hub, resource search, and informational farming alerts.

## Not implemented

- Password reset and reset email delivery.
- Browser push notifications or real-time farming alerts.
- Historical climate models and locally validated risk thresholds.

## Development

```text
npm install
npm run dev
```

Create `.env.local` from `.env.example` and set `VITE_API_URL` to the Flask backend. Do not put backend secrets or API keys in frontend environment files.

Useful checks:

```text
npm run lint
npm run build
```

The frontend depends on React, Vite, Chart.js, Leaflet, and React Leaflet. Data processing and machine-learning libraries such as Pandas, NumPy, and Scikit-learn are not currently used by this project.
