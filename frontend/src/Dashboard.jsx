
import React, { useState } from "react";

export default function Dashboard({
  onHome = () => window.location.reload(),
  onLogout = () => {}
}) {
  const [active, setActive] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [farmer, setFarmer] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("raintorootFarmer")) || {};
    } catch {
      return {};
    }
  });

  const [profileForm, setProfileForm] = useState({});
  const [theme, setTheme] = useState(localStorage.getItem("rtTheme") || "light");
  const [language, setLanguage] = useState(localStorage.getItem("rtLanguage") || "English");
  const [notifications, setNotifications] = useState(
    localStorage.getItem("rtNotifications") !== "false"
  );

  const [weatherLocation, setWeatherLocation] = useState(
    [farmer.village, farmer.district, farmer.state].filter(Boolean).join(", ")
  );
  const [weatherSearched, setWeatherSearched] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState("");

  const [soilType, setSoilType] = useState(farmer.soilType || "");
  const [season, setSeason] = useState("Monsoon");
  const [cropSearch, setCropSearch] = useState("");

  const [climateLocation, setClimateLocation] = useState(
    [farmer.village, farmer.district, farmer.state].filter(Boolean).join(", ")
  );
  const [climateSeason, setClimateSeason] = useState("Monsoon");
  const [climateChecked, setClimateChecked] = useState(false);
  const [climateData, setClimateData] = useState(null);
  const [climateLoading, setClimateLoading] = useState(false);
  const [climateError, setClimateError] = useState("");

  const [mandiCrop, setMandiCrop] = useState("Tomato");
  const [mandiMarket, setMandiMarket] = useState("");
  const [previousMandiPrice, setPreviousMandiPrice] = useState("2000");
  const [currentMandiPrice, setCurrentMandiPrice] = useState("2200");
  const [mandiCalculated, setMandiCalculated] = useState(false);

  const [profitCrop, setProfitCrop] = useState(farmer.currentCrop || "Tomato");
  const [area, setArea] = useState(farmer.landSize || 2);
  const [yieldPerAcre, setYieldPerAcre] = useState(1500);
  const [price, setPrice] = useState(25);
  const [seedCost, setSeedCost] = useState(3000);
  const [fertilizerCost, setFertilizerCost] = useState(4000);
  const [labourCost, setLabourCost] = useState(5000);
  const [irrigationCost, setIrrigationCost] = useState(2000);
  const [otherCost, setOtherCost] = useState(1000);
  const [profitCalculated, setProfitCalculated] = useState(false);

  const [question, setQuestion] = useState("");
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Welcome to RainToRoot Farmer Assistant! Ask about crops, soil, rainfall, irrigation and farming calculations."
    }
  ]);

  const features = [
    {
      title: "Rainfall & Weather",
      description: "Check weather forecasts and rainfall information.",
      icon: "🌧️"
    },
    {
      title: "Soil & Crop Suitability",
      description: "Discover suitable crops based on soil characteristics.",
      icon: "🌱"
    },
    {
      title: "Climate Risk Analysis",
      description: "Understand drought, dry periods and heavy rainfall risks.",
      icon: "🌦️"
    },
    {
      title: "Mandi Price Tracker",
      description: "Calculate and compare agricultural market prices.",
      icon: "📊"
    },
    {
      title: "Farm Profit Simulator",
      description: "Estimate farming expenses, income and profit.",
      icon: "💰"
    },
    {
      title: "AI Farmer Assistant",
      description: "Get assistance with your farming questions.",
      icon: "🤖"
    }
  ];

  const cropSuggestions = {
    "Red Soil": ["Ragi", "Groundnut", "Millets", "Pulses"],
    "Black Soil": ["Cotton", "Sorghum", "Pulses", "Soybean"],
    "Alluvial Soil": ["Rice", "Wheat", "Sugarcane", "Maize"],
    "Laterite Soil": ["Cashew", "Coconut", "Tapioca"],
    "Sandy Soil": ["Groundnut", "Millets", "Watermelon"],
    "Clay Soil": ["Rice", "Wheat", "Vegetables"],
    "Not Sure": ["Ragi", "Maize", "Groundnut", "Pulses"]
  };

  const cropDetails = {
    Ragi: "A millet crop grown in several rainfed regions. Check local rainfall and soil conditions.",
    Groundnut: "Often grown in well-drained soils. Avoid waterlogging and follow local seasonal guidance.",
    Millets: "Millets can be useful in semi-arid farming regions. Select varieties suited to your area.",
    Pulses: "Pulses support crop diversity. Choose varieties according to local soil and season.",
    Cotton: "Cotton generally needs suitable soil, warm conditions and careful pest management.",
    Sorghum: "Sorghum is grown in different dryland regions. Select a locally recommended variety.",
    Soybean: "Soybean needs suitable drainage and rainfall conditions.",
    Rice: "Rice requires suitable water availability and locally appropriate varieties.",
    Wheat: "Wheat is generally grown in cooler growing seasons.",
    Sugarcane: "Sugarcane has a long growing period and significant water requirements.",
    Maize: "Maize can be grown in different seasons depending on local climate and variety.",
    Cashew: "Cashew is grown in suitable tropical and lateritic regions.",
    Coconut: "Coconut is a perennial crop requiring suitable climate and long-term planning.",
    Tapioca: "Tapioca is grown in suitable tropical conditions and well-managed soils.",
    Watermelon: "Watermelon generally needs warm conditions and well-drained soil.",
    Vegetables: "Choose vegetable varieties based on season, water availability and nearby markets."
  };

  const cropSeasonSuitability = {
    Ragi: ["Monsoon", "Winter"],
    Groundnut: ["Monsoon", "Winter"],
    Millets: ["Monsoon", "Winter"],
    Pulses: ["Summer", "Monsoon", "Post-Monsoon", "Winter"],
    Cotton: ["Monsoon"],
    Sorghum: ["Monsoon", "Winter"],
    Soybean: ["Monsoon"],
    Rice: ["Monsoon", "Winter"],
    Wheat: ["Winter"],
    Sugarcane: ["Summer", "Monsoon", "Post-Monsoon", "Winter"],
    Maize: ["Summer", "Monsoon", "Winter"],
    Cashew: ["Summer", "Monsoon", "Post-Monsoon", "Winter"],
    Coconut: ["Summer", "Monsoon", "Post-Monsoon", "Winter"],
    Tapioca: ["Summer", "Monsoon", "Post-Monsoon", "Winter"],
    Watermelon: ["Summer"],
    Vegetables: ["Summer", "Monsoon", "Post-Monsoon", "Winter"]
  };

  const crops = soilType ? cropSuggestions[soilType] || [] : [];

  const filteredCrops = crops.filter(crop =>
    cropSeasonSuitability[crop]?.includes(season) &&
    crop.toLowerCase().includes(cropSearch.toLowerCase())
  );

  const totalYield = Number(area) * Number(yieldPerAcre);
  const totalIncome = totalYield * Number(price);
  const totalExpenses =
    Number(seedCost) +
    Number(fertilizerCost) +
    Number(labourCost) +
    Number(irrigationCost) +
    Number(otherCost);
  const netProfit = totalIncome - totalExpenses;

  const previousPrice = Number(previousMandiPrice);
  const currentPrice = Number(currentMandiPrice);
  const priceDifference = currentPrice - previousPrice;
  const percentageChange = previousPrice > 0
    ? (priceDifference / previousPrice) * 100
    : 0;

  const styles = `
    * { box-sizing: border-box; }

    .rt-page {
      min-height: 100vh;
      background: #f4f8f3;
      color: #173c2b;
      font-family: Arial, sans-serif;
    }

    .rt-layout {
      display: grid;
      grid-template-columns: 245px 1fr;
      min-height: 100vh;
    }

    .rt-sidebar {
      background: #082c1d;
      color: white;
      padding: 28px 20px;
      display: flex;
      flex-direction: column;
    }

    .rt-logo {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      font-size: 23px;
      font-weight: 800;
      margin-bottom: 42px;
    }

    .rt-logo img {
      width: 43px;
      height: 43px;
      object-fit: contain;
    }

    .rt-logo span { color: #9bc77b; }

    .rt-sidebar-user {
      padding: 18px 10px;
      border-top: 1px solid #ffffff35;
      border-bottom: 1px solid #ffffff35;
      margin-bottom: 25px;
    }

    .rt-sidebar-user h3 {
      color: white;
      margin: 10px 0 5px;
      overflow-wrap: anywhere;
    }

    .rt-sidebar-user p {
      color: #c5d9ca;
      font-size: 13px;
      overflow-wrap: anywhere;
    }

    .rt-side-btn {
      display: block;
      width: 100%;
      text-align: left;
      padding: 14px 12px;
      margin: 6px 0;
      border: none;
      border-radius: 8px;
      background: transparent;
      color: white;
      cursor: pointer;
      font-size: 15px;
    }

    .rt-side-btn:hover,
    .rt-side-btn.selected { background: #ffffff20; }

    .rt-logout-btn {
      margin-top: auto;
      color: #ffd6d6;
    }

    .rt-logout-btn:hover {
      background: #8b2929;
      color: white;
    }

    .rt-main {
      padding: 38px 5%;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }

    .rt-welcome {
      background: linear-gradient(120deg, #164f35, #36764b);
      color: white;
      padding: 34px;
      border-radius: 16px;
      margin-bottom: 30px;
    }

    .rt-welcome h1 { font-size: 30px; margin: 0 0 12px; }
    .rt-welcome p { color: #e0eee3; line-height: 1.6; margin: 0; }

    .rt-heading {
      font-size: 23px;
      margin: 0 0 20px;
      color: #164f35;
    }

    .rt-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 20px;
    }

    .rt-card, .rt-module {
      background: white;
      border: 1px solid #e4ece4;
      border-radius: 13px;
      padding: 23px;
      min-width: 0;
    }

    .rt-card {
      transition: .2s;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .rt-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 22px #164f3515;
    }

    .rt-card h3 { color: #164f35; margin: 12px 0 8px; }
    .rt-card p { color: #718176; font-size: 14px; line-height: 1.6; }
    .rt-icon { font-size: 30px; }

    .rt-btn {
      background: #164f35;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 11px 18px;
      cursor: pointer;
      font-weight: 600;
      margin-top: 12px;
    }

    .rt-btn:hover { background: #236b49; }
    .rt-btn:disabled { opacity: .6; cursor: not-allowed; }

    .rt-outline, .rt-back-home {
      background: white;
      color: #164f35;
      border: 1px solid #cbd9cd;
      border-radius: 7px;
      padding: 9px 14px;
      font-size: 14px;
      cursor: pointer;
      font-weight: 600;
    }

    .rt-outline:hover, .rt-back-home:hover { background: #edf5ed; }

    .rt-page-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 18px;
    }

    .rt-bottom {
      display: flex;
      justify-content: center;
      margin-top: auto;
      padding-top: 35px;
    }

    .rt-ai-float {
      position: fixed;
      bottom: 25px;
      right: 25px;
      background: #164f35;
      color: white;
      border: none;
      border-radius: 30px;
      padding: 14px 21px;
      font-size: 14px;
      font-weight: 600;
      box-shadow: 0 5px 18px #0002;
      cursor: pointer;
      z-index: 10;
    }

    .rt-label {
      display: block;
      font-weight: 600;
      margin: 15px 0 8px;
    }

    .rt-input {
      width: 100%;
      padding: 12px;
      border: 1px solid #cbd9cd;
      border-radius: 8px;
      font-size: 15px;
      color: #173c2b;
      background: white;
      min-width: 0;
    }

    .rt-input:focus { outline: 2px solid #a8c8a9; }
    .rt-module h1 { color: #164f35; margin-top: 0; }
    .rt-muted { color: #718176; line-height: 1.6; }

    .rt-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 18px;
      min-width: 520px;
    }

    .rt-table th, .rt-table td {
      text-align: left;
      padding: 13px;
      border-bottom: 1px solid #e5ece5;
    }

    .rt-table th { background: #edf5ed; color: #164f35; }

    .rt-result {
      background: #edf5ed;
      border-left: 4px solid #75a94c;
      padding: 18px;
      border-radius: 8px;
      margin-top: 20px;
      line-height: 1.8;
    }

    .rt-chat {
      min-height: 280px;
      max-height: 380px;
      overflow-y: auto;
      background: #f7faf6;
      border: 1px solid #e4ece4;
      border-radius: 12px;
      padding: 15px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .rt-message {
      padding: 12px 15px;
      border-radius: 12px;
      max-width: 85%;
      line-height: 1.5;
      font-size: 14px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .rt-bot { background: #e8f1e7; align-self: flex-start; }
    .rt-user { background: #164f35; color: white; align-self: flex-end; }

    .rt-chatrow { display: flex; gap: 10px; margin-top: 14px; }
    .rt-chatrow input { flex: 1; min-width: 0; }
    .rt-note { font-size: 13px; color: #718176; margin-top: 18px; line-height: 1.6; }

    .rt-profile-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 15px;
    }

    .rt-profile-field { min-width: 0; }
    .rt-profile-field.full { grid-column: 1 / -1; }
    .rt-setting-card { margin-top: 17px; }
    .rt-setting-card h3 { margin: 0 0 12px; color: #164f35; }

    .rt-checkbox {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 10px;
    }

    .rt-checkbox input { width: 17px; height: 17px; }
    .rt-chip-row { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 12px; }

    .rt-status {
      display: inline-block;
      padding: 6px 11px;
      border-radius: 20px;
      background: #fff3d9;
      color: #805b16;
      font-size: 12px;
      font-weight: 700;
    }

    .rt-stat {
      font-size: 24px;
      font-weight: 700;
      color: #164f35;
      margin: 8px 0;
    }

    .rt-action-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 15px;
    }

    .rt-action {
      text-align: left;
      background: #edf5ed;
      border: 1px solid #dce9dc;
      color: #164f35;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
    }

    .rt-page.dark { background: #151d19; color: #e6eee8; }
    .rt-page.dark .rt-main { background: #151d19; }
    .rt-page.dark .rt-heading,
    .rt-page.dark .rt-module h1 { color: #b9d9bd; }

    .rt-page.dark .rt-card,
    .rt-page.dark .rt-module {
      background: #202c25;
      border-color: #35463b;
      color: #e6eee8;
    }

    .rt-page.dark .rt-card h3,
    .rt-page.dark .rt-setting-card h3 { color: #c4e2c5; }

    .rt-page.dark .rt-card p,
    .rt-page.dark .rt-muted,
    .rt-page.dark .rt-note { color: #b7c7bb; }

    .rt-page.dark .rt-input {
      background: #29372e;
      border-color: #53665a;
      color: white;
    }

    .rt-page.dark .rt-outline,
    .rt-page.dark .rt-back-home {
      background: #29372e;
      border-color: #53665a;
      color: white;
    }

    .rt-page.dark .rt-chat {
      background: #202c25;
      border-color: #35463b;
    }

    .rt-page.dark .rt-bot { background: #344a39; color: white; }
    .rt-page.dark .rt-result { background: #293d2e; color: white; }
    .rt-page.dark .rt-table th { background: #344a39; color: white; }
    .rt-page.dark .rt-table td { border-color: #35463b; }
    .rt-page.dark .rt-action {
      background: #344a39;
      color: white;
      border-color: #53665a;
    }

    @media(max-width: 900px) {
      .rt-layout { grid-template-columns: 200px 1fr; }
      .rt-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .rt-main { padding: 25px; }
    }

    @media(max-width: 600px) {
      .rt-layout { grid-template-columns: 1fr; }
      .rt-sidebar { padding: 18px; }
      .rt-logo { margin-bottom: 18px; }
      .rt-sidebar-user { margin-bottom: 12px; }
      .rt-grid, .rt-profile-grid, .rt-action-grid { grid-template-columns: 1fr; }
      .rt-profile-field.full { grid-column: auto; }
      .rt-main { padding: 20px; }
      .rt-welcome { padding: 23px; }
      .rt-welcome h1 { font-size: 24px; }
      .rt-ai-float { bottom: 15px; right: 15px; }
      .rt-chatrow { flex-wrap: wrap; }
      .rt-logout-btn { margin-top: 12px; }
    }
  `;

  function openModule(name) {
    setActive(name);
    setShowProfile(false);
    setShowSettings(false);
    setProfitCalculated(false);
    setMandiCalculated(false);
  }

  function openProfile() {
    setProfileForm({
      name: farmer.name || "",
      email: farmer.email || "",
      village: farmer.village || "",
      district: farmer.district || "",
      state: farmer.state || "",
      landSize: farmer.landSize || "",
      soilType: farmer.soilType || "",
      currentCrop: farmer.currentCrop || "",
      irrigation: farmer.irrigation || ""
    });
    setShowProfile(true);
    setShowSettings(false);
    setActive("");
  }

  function saveProfile(e) {
    e.preventDefault();

    const updated = { ...farmer, ...profileForm };

    localStorage.setItem("raintorootFarmer", JSON.stringify(updated));
    setFarmer(updated);
    setSoilType(updated.soilType || "");

    const location = [
      updated.village,
      updated.district,
      updated.state
    ].filter(Boolean).join(", ");

    setWeatherLocation(location);
    setWeatherData(null);
    setWeatherSearched(false);
    setWeatherError("");
    setClimateLocation(location);
    setClimateData(null);
    setClimateChecked(false);
    setClimateError("");
    setShowProfile(false);
  }

  function updateProfileField(e) {
    const { name, value } = e.target;
    setProfileForm(old => ({ ...old, [name]: value }));
  }

  function updateTheme(value) {
    setTheme(value);
    localStorage.setItem("rtTheme", value);
  }

  function updateLanguage(value) {
    setLanguage(value);
    localStorage.setItem("rtLanguage", value);
  }

  function updateNotifications(value) {
    setNotifications(value);
    localStorage.setItem("rtNotifications", String(value));
  }

  async function searchWeather() {
    if (!weatherLocation.trim() || weatherLoading) return;

    setWeatherLoading(true);
    setWeatherError("");
    setWeatherData(null);
    setWeatherSearched(false);

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(weatherLocation)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error("Unable to find the location. Please try again.");
      }

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error(
          "Location not found. Try entering only your city or district name."
        );
      }

      const place = geoData.results[0];

      const response = await fetch(
        `http://127.0.0.1:5000/api/weather?latitude=${place.latitude}&longitude=${place.longitude}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to retrieve weather data.");
      }

      if (!data.weather || !data.weather.current || !data.weather.daily) {
        throw new Error("Weather data is incomplete. Please try again.");
      }

      setWeatherLocation(
        [place.name, place.admin1, place.country]
          .filter(Boolean)
          .join(", ")
      );

      setWeatherData(data.weather);
      setWeatherSearched(true);
    } catch (error) {
      setWeatherError(error.message || "Something went wrong while checking weather.");
    } finally {
      setWeatherLoading(false);
    }
  }

  async function checkClimateRisk() {
    if (!climateLocation.trim() || climateLoading) return;

    setClimateLoading(true);
    setClimateError("");
    setClimateData(null);
    setClimateChecked(false);

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(climateLocation)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error("Unable to find the location. Please try again.");
      }

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("Location not found. Try entering your city or district.");
      }

      const place = geoData.results[0];

      const response = await fetch(
        `http://127.0.0.1:5000/api/weather?latitude=${place.latitude}&longitude=${place.longitude}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to retrieve weather information.");
      }

      if (!data.weather?.current || !data.weather?.daily) {
        throw new Error("Incomplete weather forecast received.");
      }

      if (
        !Array.isArray(data.weather.daily.time) ||
        !Array.isArray(data.weather.daily.precipitation_probability_max) ||
        !Array.isArray(data.weather.daily.temperature_2m_max)
      ) {
        throw new Error("Required forecast information is unavailable.");
      }

      setClimateLocation(
        [place.name, place.admin1, place.country]
          .filter(Boolean)
          .join(", ")
      );

      setClimateData(data.weather);
      setClimateChecked(true);
    } catch (error) {
      setClimateError(
        error.message || "Unable to complete climate analysis."
      );
    } finally {
      setClimateLoading(false);
    }
  }

  async function sendMessage(text = question) {
    const userText = text.trim();

    if (!userText || assistantLoading) return;

    setMessages(old => [
      ...old,
      { from: "user", text: userText }
    ]);

    setQuestion("");
    setAssistantLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ question: userText })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to process your question.");
      }

      setMessages(old => [
        ...old,
        {
          from: "bot",
          text: data.answer || "No answer received from Gemini."
        }
      ]);
    } catch (error) {
      setMessages(old => [
        ...old,
        {
          from: "bot",
          text: "The AI service is temporarily unavailable. Please try again later."
        }
      ]);

      console.error("Assistant error:", error);
    } finally {
      setAssistantLoading(false);
    }
  }

  function calculateProfit(e) {
    e.preventDefault();

    if (
      !profitCrop.trim() ||
      Number(area) <= 0 ||
      Number(yieldPerAcre) < 0 ||
      Number(price) < 0 ||
      [seedCost, fertilizerCost, labourCost, irrigationCost, otherCost]
        .some(value => Number(value) < 0)
    ) return;

    setProfitCalculated(true);
  }

  function calculateMandiTrend(e) {
    e.preventDefault();

    if (
      !mandiCrop.trim() ||
      previousMandiPrice === "" ||
      currentMandiPrice === "" ||
      Number(previousMandiPrice) <= 0 ||
      Number(currentMandiPrice) < 0
    ) {
      setMandiCalculated(false);
      return;
    }

    setMandiCalculated(true);
  }

  function formatWeatherDate(dateString) {
    return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short"
    });
  }

  function renderModule() {
    switch (active) {
      case "Rainfall & Weather":
        return (
          <>
            <h1>Rainfall & Weather</h1>
            <p className="rt-muted">
              Monitor current weather conditions and the upcoming forecast for your farming location.
            </p>

            <div className="rt-card" style={{ marginTop: 20 }}>
              <h3>Search Your Location</h3>
              <label className="rt-label">Village / District / City</label>

              <div className="rt-chatrow">
                <input
                  className="rt-input"
                  value={weatherLocation}
                  onChange={e => {
                    setWeatherLocation(e.target.value);
                    setWeatherSearched(false);
                    setWeatherData(null);
                    setWeatherError("");
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") searchWeather();
                  }}
                  placeholder="Example: Mysuru"
                />

                <button
                  className="rt-btn"
                  onClick={searchWeather}
                  disabled={weatherLoading || !weatherLocation.trim()}
                >
                  {weatherLoading ? "Searching..." : "Search Weather"}
                </button>
              </div>

              {weatherError && (
                <p style={{ color: "#c0392b", marginTop: 12 }}>
                  {weatherError}
                </p>
              )}
            </div>

            {!weatherSearched && !weatherLoading && (
              <div className="rt-result">
                <h3>Weather Monitoring</h3>
                Enter your farming location and select Search Weather to view
                current conditions and the three-day forecast.
              </div>
            )}

            {weatherLoading && (
              <div className="rt-result">
                Retrieving weather information. Please wait...
              </div>
            )}

            {weatherSearched && weatherData && (
              <>
                <div className="rt-result">
                  <h3>Selected Location</h3>
                  <strong>{weatherLocation}</strong>
                  <p>Weather information retrieved from Open-Meteo.</p>
                  <span className="rt-status">Weather data available</span>
                  {weatherData.current?.time && (
                    <p className="rt-note">
                      Last reading: {weatherData.current.time.replace("T", " ")}
                    </p>
                  )}
                </div>

                <h2 className="rt-heading" style={{ marginTop: 28 }}>
                  Current Weather
                </h2>

                <div className="rt-grid">
                  {[
                    ["🌡️", "Temperature", `${weatherData.current.temperature_2m ?? "--"} °C`],
                    ["🌧️", "Rainfall", `${weatherData.current.rain ?? "--"} mm`],
                    ["💨", "Wind Speed", `${weatherData.current.wind_speed_10m ?? "--"} km/h`],
                    ["💧", "Humidity", `${weatherData.current.relative_humidity_2m ?? "--"} %`],
                    ["🌡️", "Feels Like", `${weatherData.current.apparent_temperature ?? "--"} °C`],
                    ["☔", "Precipitation", `${weatherData.current.precipitation ?? "--"} mm`]
                  ].map(item => (
                    <div className="rt-card" key={item[1]}>
                      <div className="rt-icon">{item[0]}</div>
                      <h3>{item[1]}</h3>
                      <div className="rt-stat">{item[2]}</div>
                    </div>
                  ))}
                </div>

                <h2 className="rt-heading" style={{ marginTop: 30 }}>
                  Three-Day Weather Forecast
                </h2>

                <div className="rt-grid">
                  {weatherData.daily.time.map((day, index) => (
                    <div className="rt-card" key={day}>
                      <h3>{formatWeatherDate(day)}</h3>
                      <p>Maximum Temperature</p>
                      <div className="rt-stat">
                        {weatherData.daily.temperature_2m_max[index]} °C
                      </div>
                      <p>Minimum Temperature</p>
                      <div className="rt-stat">
                        {weatherData.daily.temperature_2m_min[index]} °C
                      </div>
                      <p>Rain Probability</p>
                      <div className="rt-stat">
                        {weatherData.daily.precipitation_probability_max?.[index] ?? "--"} %
                      </div>
                    </div>
                  ))}
                </div>

                <p className="rt-note">
                  Forecast values may change. Check updated local conditions
                  before making important farming decisions.
                </p>
              </>
            )}
          </>
        );

      case "Soil & Crop Suitability":
        return (
          <>
            <h1>Soil & Crop Suitability</h1>
            <p className="rt-muted">
              Explore crop options based on soil type and growing season.
            </p>

            <div className="rt-card" style={{ marginTop: 20 }}>
              <label className="rt-label">Select Soil Type</label>
              <select
                className="rt-input"
                value={soilType}
                onChange={e => {
                  setSoilType(e.target.value);
                  setCropSearch("");
                }}
              >
                <option value="">Choose soil type</option>
                {Object.keys(cropSuggestions).map(x => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>

              <label className="rt-label">Select Growing Season</label>
              <select
                className="rt-input"
                value={season}
                onChange={e => {
                  setSeason(e.target.value);
                  setCropSearch("");
                }}
              >
                <option value="Summer">Summer</option>
                <option value="Monsoon">Monsoon</option>
                <option value="Post-Monsoon">Post-Monsoon</option>
                <option value="Winter">Winter</option>
              </select>

              <label className="rt-label">Find a Crop</label>
              <input
                className="rt-input"
                value={cropSearch}
                onChange={e => setCropSearch(e.target.value)}
                placeholder="Search recommended crops..."
              />
            </div>

            <h2 className="rt-heading" style={{ marginTop: 28 }}>
              Recommended Crop Options
            </h2>

            {soilType && (
              <p className="rt-muted">
                Showing crop examples for {soilType} during the {season} season.
              </p>
            )}

            <div className="rt-grid">
              {filteredCrops.map(crop => (
                <div className="rt-card" key={crop}>
                  <div className="rt-icon">🌱</div>
                  <h3>{crop}</h3>
                  <p>{cropDetails[crop]}</p>
                  <span className="rt-status">{season} season selected</span>
                </div>
              ))}

              {filteredCrops.length === 0 && (
                <p className="rt-muted">
                  {!soilType
                    ? "Please select a soil type to view crop recommendations."
                    : "No matching crops found for this soil type and season. Try another selection."}
                </p>
              )}
            </div>

            <div className="rt-result">
              <h3>Important Farming Guidance</h3>
              <p>
                These are general crop examples, not a scientific soil test.
                Actual crop suitability depends on soil pH, nutrients, local
                climate, rainfall, irrigation and recommended varieties.
                Confirm planting decisions with local agricultural experts.
              </p>
            </div>
          </>
        );

      case "Climate Risk Analysis": {
        const daily = climateData?.daily || {};
        const probabilities = daily.precipitation_probability_max || [];
        const temperatures = daily.temperature_2m_max || [];
        const current = climateData?.current || {};

        const validProbabilities = probabilities
          .map(Number)
          .filter(Number.isFinite);

        const validTemperatures = temperatures
          .map(Number)
          .filter(Number.isFinite);

        const maxRainProbability = validProbabilities.length
          ? Math.max(...validProbabilities)
          : null;

        const lowRainDays = validProbabilities.filter(
          value => value <= 20
        ).length;

        const maxTemperature = validTemperatures.length
          ? Math.max(...validTemperatures)
          : null;

        const windSpeed = Number(current.wind_speed_10m);

        function getRisk(value, moderate, high) {
          if (value === null || !Number.isFinite(value)) {
            return "Unavailable";
          }

          if (value >= high) return "High";
          if (value >= moderate) return "Moderate";
          return "Low";
        }

        const rainRisk = getRisk(maxRainProbability, 40, 70);
        const dryRisk = getRisk(lowRainDays, 1, 3);
        const heatRisk = getRisk(maxTemperature, 35, 38);
        const windRisk = getRisk(windSpeed, 25, 40);

        const indicators = [
          {
            icon: "☀️",
            title: "Drought Risk",
            status: "Historical data required",
            description:
              "Long-term drought cannot be determined from a three-day forecast. Historical rainfall records are needed."
          },
          {
            icon: "🌧️",
            title: "Heavy Rainfall Potential",
            status: rainRisk,
            description:
              maxRainProbability === null
                ? "Rain probability information is unavailable."
                : `Highest forecast daily rain probability: ${maxRainProbability}%. This is probability, not rainfall amount.`
          },
          {
            icon: "🌤️",
            title: "Dry Period Indicator",
            status: dryRisk,
            description:
              `${lowRainDays} of ${validProbabilities.length} forecast days have a rain probability of 20% or less. This does not confirm drought.`
          },
          {
            icon: "🌡️",
            title: "Heat Stress Indicator",
            status: heatRisk,
            description:
              maxTemperature === null
                ? "Temperature forecast is unavailable."
                : `Maximum forecast temperature: ${maxTemperature} °C.`
          },
          {
            icon: "💨",
            title: "Strong Wind Indicator",
            status: getRisk(windSpeed, 25, 40),
            description:
              Number.isFinite(windSpeed)
                ? `Current wind speed: ${windSpeed} km/h.`
                : "Current wind speed is unavailable."
          },
          {
            icon: "🌱",
            title: "Crop Impact",
            status:
              rainRisk === "High" ||
              dryRisk === "High" ||
              heatRisk === "High"
                ? "Weather attention needed"
                : "Monitor conditions",
            description:
              "Crop impact depends on crop type, variety, growth stage, soil and irrigation availability."
          }
        ];

        return (
          <>
            <h1>Climate Risk Analysis</h1>

            <p className="rt-muted">
              Analyse short-term weather indicators that may affect farming
              conditions in your selected location.
            </p>

            <div className="rt-card" style={{ marginTop: 20 }}>
              <label className="rt-label">Farming Location</label>

              <input
                className="rt-input"
                value={climateLocation}
                onChange={e => {
                  setClimateLocation(e.target.value);
                  setClimateChecked(false);
                  setClimateData(null);
                  setClimateError("");
                }}
                placeholder="Enter village, district or city"
              />

              <label className="rt-label">Growing Season</label>

              <select
                className="rt-input"
                value={climateSeason}
                onChange={e => {
                  setClimateSeason(e.target.value);
                  setClimateChecked(false);
                  setClimateData(null);
                }}
              >
                <option value="Summer">Summer</option>
                <option value="Monsoon">Monsoon</option>
                <option value="Post-Monsoon">Post-Monsoon</option>
                <option value="Winter">Winter</option>
              </select>

              <button
                className="rt-btn"
                onClick={checkClimateRisk}
                disabled={climateLoading || !climateLocation.trim()}
              >
                {climateLoading ? "Analysing..." : "Check Climate Factors"}
              </button>

              {climateError && (
                <p style={{ color: "#c0392b", marginTop: 12 }}>
                  {climateError}
                </p>
              )}
            </div>

            {climateLoading && (
              <div className="rt-result">
                Retrieving forecast data. Please wait...
              </div>
            )}

            {climateChecked && climateData && (
              <>
                <div className="rt-result">
                  <h3>Analysis Results</h3>
                  <p><strong>Location:</strong> {climateLocation}</p>
                  <p><strong>Growing Season:</strong> {climateSeason}</p>
                  <p><strong>Forecast Period:</strong> Three days</p>
                  <span className="rt-status">
                    Weather analysis completed
                  </span>
                </div>

                <h2 className="rt-heading" style={{ marginTop: 28 }}>
                  Climate Risk Indicators
                </h2>

                <div className="rt-grid">
                  {indicators.map(item => (
                    <div className="rt-card" key={item.title}>
                      <div className="rt-icon">{item.icon}</div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                      <span className="rt-status">{item.status}</span>
                    </div>
                  ))}
                </div>

                <h2 className="rt-heading" style={{ marginTop: 28 }}>
                  Three-Day Weather Indicators
                </h2>

                <div className="rt-grid">
                  {daily.time?.map((day, index) => (
                    <div className="rt-card" key={day}>
                      <h3>{formatWeatherDate(day)}</h3>

                      <p>Maximum Temperature</p>
                      <div className="rt-stat">
                        {daily.temperature_2m_max?.[index] ?? "--"} °C
                      </div>

                      <p>Minimum Temperature</p>
                      <div className="rt-stat">
                        {daily.temperature_2m_min?.[index] ?? "--"} °C
                      </div>

                      <p>Rain Probability</p>
                      <div className="rt-stat">
                        {probabilities[index] ?? "--"}%
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rt-result">
                  <h3>Risk Assessment Information</h3>
                  <p>
                    Rain probability and temperature values come from the
                    retrieved weather forecast. The risk categories use
                    simple demonstration thresholds, not locally validated
                    agricultural standards.
                  </p>
                  <p>
                    A low rain probability is only a short-term forecast
                    indicator. It does not establish a drought. Long-term
                    drought analysis requires historical rainfall data.
                  </p>
                  <p>
                    The growing season is recorded for context. The current
                    assessment does not yet adjust thresholds using seasonal
                    or crop-specific historical data.
                  </p>
                </div>
              </>
            )}

            {!climateChecked && !climateLoading && (
              <div className="rt-result">
                <h3>Climate Monitoring</h3>
                Enter your farming location and select Check Climate Factors
                to retrieve forecast-based indicators.
              </div>
            )}

            <p className="rt-note">
              Data source: Open-Meteo. These are preliminary weather
              indicators, not long-term climate predictions or official
              agricultural warnings.
            </p>
          </>
        );
      }

      case "Mandi Price Tracker":
        return (
          <>
            <h1>Mandi Price Trend Calculator</h1>
            <p className="rt-muted">
              Enter two market prices to calculate how the price of a crop has changed.
            </p>

            <form onSubmit={calculateMandiTrend}>
              <div className="rt-card" style={{ marginTop: 20 }}>
                <label className="rt-label">Crop Name</label>
                <input
                  className="rt-input"
                  value={mandiCrop}
                  onChange={e => {
                    setMandiCrop(e.target.value);
                    setMandiCalculated(false);
                  }}
                  placeholder="Example: Tomato"
                  required
                />

                <label className="rt-label">Market / Location</label>
                <input
                  className="rt-input"
                  value={mandiMarket}
                  onChange={e => setMandiMarket(e.target.value)}
                  placeholder="Example: Mysuru"
                />

                <label className="rt-label">Previous Price per Quintal (₹)</label>
                <input
                  className="rt-input"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={previousMandiPrice}
                  onChange={e => {
                    setPreviousMandiPrice(e.target.value);
                    setMandiCalculated(false);
                  }}
                  placeholder="Example: 2000"
                  required
                />

                <label className="rt-label">Current Price per Quintal (₹)</label>
                <input
                  className="rt-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentMandiPrice}
                  onChange={e => {
                    setCurrentMandiPrice(e.target.value);
                    setMandiCalculated(false);
                  }}
                  placeholder="Example: 2200"
                  required
                />

                <button className="rt-btn" type="submit">
                  Calculate Price Trend
                </button>
              </div>
            </form>

            {mandiCalculated && (
              <div className="rt-result">
                <h3>Market Price Analysis</h3>

                <p><strong>Crop:</strong> {mandiCrop}</p>
                <p><strong>Market:</strong> {mandiMarket || "Not specified"}</p>
                <p>
                  <strong>Previous Price:</strong>{" "}
                  ₹{previousPrice.toLocaleString("en-IN")} per quintal
                </p>
                <p>
                  <strong>Current Price:</strong>{" "}
                  ₹{currentPrice.toLocaleString("en-IN")} per quintal
                </p>
                <p>
                  <strong>Price Difference:</strong>{" "}
                  ₹{Math.abs(priceDifference).toLocaleString("en-IN")}
                </p>
                <p>
                  <strong>Percentage Change:</strong>{" "}
                  {Math.abs(percentageChange).toFixed(2)}%
                </p>

                <h3>
                  Price Trend:{" "}
                  {priceDifference > 0
                    ? "Increased"
                    : priceDifference < 0
                    ? "Decreased"
                    : "Unchanged"}
                </h3>

                <span className="rt-status">
                  {priceDifference > 0
                    ? "Price increased"
                    : priceDifference < 0
                    ? "Price decreased"
                    : "No price change"}
                </span>
              </div>
            )}

            <p className="rt-note">
              This module calculates price changes using the values entered by
              the user. It does not retrieve live mandi prices or predict future
              prices. Enter verified market prices for meaningful comparisons.
            </p>
          </>
        );

      case "Farm Profit Simulator":
        return (
          <>
            <h1>Farm Profit Simulator</h1>
            <p className="rt-muted">
              Estimate farm income, expenses and possible profit or loss.
            </p>

            <form onSubmit={calculateProfit}>
              <div className="rt-profile-grid">
                <div>
                  <label className="rt-label">Crop Name</label>
                  <input
                    className="rt-input"
                    value={profitCrop}
                    onChange={e => setProfitCrop(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="rt-label">Land Area (acres)</label>
                  <input
                    className="rt-input"
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="rt-label">Expected Yield per Acre (kg)</label>
                  <input
                    className="rt-input"
                    type="number"
                    min="0"
                    value={yieldPerAcre}
                    onChange={e => setYieldPerAcre(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="rt-label">Selling Price per kg (₹)</label>
                  <input
                    className="rt-input"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    required
                  />
                </div>
              </div>

              <h2 className="rt-heading" style={{ marginTop: 30 }}>
                Farming Expenses
              </h2>

              <div className="rt-profile-grid">
                {[
                  ["Seed Cost (₹)", seedCost, setSeedCost],
                  ["Fertilizer Cost (₹)", fertilizerCost, setFertilizerCost],
                  ["Labour Cost (₹)", labourCost, setLabourCost],
                  ["Irrigation Cost (₹)", irrigationCost, setIrrigationCost],
                  ["Other Expenses (₹)", otherCost, setOtherCost]
                ].map(([label, value, setter]) => (
                  <div key={label}>
                    <label className="rt-label">{label}</label>
                    <input
                      className="rt-input"
                      type="number"
                      min="0"
                      value={value}
                      onChange={e => setter(e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>

              <button className="rt-btn" type="submit">
                Calculate Farm Profit
              </button>
            </form>

            {profitCalculated && (
              <div className="rt-result">
                <h3>Estimated Farm Summary</h3>
                <p><strong>Crop:</strong> {profitCrop}</p>
                <p><strong>Land Area:</strong> {area} acres</p>
                <p><strong>Total Expected Yield:</strong> {totalYield.toLocaleString("en-IN")} kg</p>
                <p><strong>Expected Income:</strong> ₹{totalIncome.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</p>
                <p><strong>Total Expenses:</strong> ₹{totalExpenses.toLocaleString("en-IN")}</p>
                <h3>
                  Estimated {netProfit >= 0 ? "Profit" : "Loss"}:
                  {" "}₹{Math.abs(netProfit).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                </h3>
                <p className="rt-note">
                  This estimate uses the values you entered. Actual results may
                  vary due to yield, weather, market prices and other expenses.
                </p>
              </div>
            )}

            <p className="rt-note">
              Enter expected yield per acre, not total yield. All expense fields
              are entered as total costs for the selected farm area.
            </p>
          </>
        );

      case "AI Farmer Assistant":
        return (
          <>
            <h1>AI Farmer Assistant</h1>
            <p className="rt-muted">
              Ask questions about farming, crops, soil, rainfall and markets.
            </p>

            <h2 className="rt-heading" style={{ marginTop: 22 }}>
              Suggested Questions
            </h2>

            <div className="rt-action-grid">
              {[
                "Which crops suit red soil?",
                "How can I manage irrigation?",
                "How do I check mandi prices?",
                "How can I estimate farm profit?"
              ].map(item => (
                <button
                  className="rt-action"
                  key={item}
                  onClick={() => sendMessage(item)}
                  disabled={assistantLoading}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="rt-chat" style={{ marginTop: 22 }}>
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`rt-message ${m.from === "bot" ? "rt-bot" : "rt-user"}`}
                >
                  {m.text}
                </div>
              ))}

              {assistantLoading && (
                <div className="rt-message rt-bot">
                  Gemini is preparing your answer...
                </div>
              )}
            </div>

            <div className="rt-chatrow">
              <input
                className="rt-input"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") sendMessage();
                }}
                placeholder="Ask your farming question..."
              />
              <button
                className="rt-btn"
                onClick={() => sendMessage()}
                disabled={assistantLoading || !question.trim()}
              >
                {assistantLoading ? "Thinking..." : "Send"}
              </button>
            </div>

            <p className="rt-note">
              Powered by Google Gemini through the RainToRoot Flask API.
              Responses depend on AI service availability. Verify important
              farming decisions with local agricultural experts.
            </p>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <div className={`rt-page ${theme === "dark" ? "dark" : ""}`}>
      <style>{styles}</style>

      <div className="rt-layout">
        <aside className="rt-sidebar">
          <div className="rt-logo">
            <img src="/raintoroot-logo.png" alt="RainToRoot Logo" />
            <div>Rain<span>To</span>Root</div>
          </div>

          <div className="rt-sidebar-user">
            <div style={{ fontSize: 32 }}>👤</div>
            <h3>{farmer.name || "Farmer"}</h3>
            <p>{farmer.email || "Welcome to RainToRoot"}</p>
          </div>

          <button
            className={`rt-side-btn ${showProfile ? "selected" : ""}`}
            onClick={openProfile}
          >
            👤 My Profile
          </button>

          <button
            className={`rt-side-btn ${showSettings ? "selected" : ""}`}
            onClick={() => {
              setShowSettings(true);
              setShowProfile(false);
              setActive("");
            }}
          >
            ⚙ Settings
          </button>

          <button
            className="rt-side-btn rt-logout-btn"
            onClick={onLogout}
          >
            ↪ Logout
          </button>
        </aside>

        <main className="rt-main">
          {!active && !showProfile && !showSettings && (
            <>
              <section className="rt-welcome">
                <h1>Welcome Back, {farmer.name || "Farmer"}!</h1>
                <p>
                  From every drop of rain to better farming decisions.
                  <br />
                  Your smart farming journey starts here.
                </p>
              </section>

              <h2 className="rt-heading">Explore Farming Modules</h2>

              <div className="rt-grid">
                {features.map(f => (
                  <div className="rt-card" key={f.title}>
                    <div className="rt-icon">{f.icon}</div>
                    <h3>{f.title}</h3>
                    <p>{f.description}</p>
                    <button
                      className="rt-btn"
                      onClick={() => openModule(f.title)}
                    >
                      Explore →
                    </button>
                  </div>
                ))}
              </div>

              <div className="rt-bottom">
                <button className="rt-back-home" onClick={onHome}>
                  ← Back to Home
                </button>
              </div>
            </>
          )}

          {active && (
            <>
              <div className="rt-page-header">
                <button className="rt-outline" onClick={() => setActive("")}>
                  ← Back
                </button>
              </div>
              <section className="rt-module">
                {renderModule()}
              </section>
            </>
          )}

          {showProfile && (
            <>
              <div className="rt-page-header">
                <button
                  className="rt-outline"
                  onClick={() => setShowProfile(false)}
                >
                  ← Back
                </button>
              </div>

              <section className="rt-module">
                <h1>My Profile</h1>
                <p className="rt-muted">
                  Edit your personal and farming information below.
                </p>

                <form onSubmit={saveProfile}>
                  <div className="rt-profile-grid">
                    {[
                      ["Full Name", "name", "Enter your name"],
                      ["Email Address", "email", "Enter your email"],
                      ["Village Name", "village", "Enter village name"],
                      ["District", "district", "Enter district"],
                      ["State", "state", "Enter state"],
                      ["Land Size (acres)", "landSize", "Enter land size"]
                    ].map(([label, name, placeholder]) => (
                      <div className="rt-profile-field" key={name}>
                        <label className="rt-label">{label}</label>
                        <input
                          className="rt-input"
                          type={name === "email" ? "email" : name === "landSize" ? "number" : "text"}
                          min={name === "landSize" ? "0" : undefined}
                          name={name}
                          value={profileForm[name] || ""}
                          onChange={updateProfileField}
                          placeholder={placeholder}
                          required={["name", "email"].includes(name)}
                        />
                      </div>
                    ))}

                    <div className="rt-profile-field">
                      <label className="rt-label">Soil Type</label>
                      <select
                        className="rt-input"
                        name="soilType"
                        value={profileForm.soilType || ""}
                        onChange={updateProfileField}
                      >
                        <option value="">Select soil type</option>
                        {Object.keys(cropSuggestions).map(x => (
                          <option key={x} value={x}>{x}</option>
                        ))}
                      </select>
                    </div>

                    <div className="rt-profile-field">
                      <label className="rt-label">Current Crop</label>
                      <input
                        className="rt-input"
                        name="currentCrop"
                        value={profileForm.currentCrop || ""}
                        onChange={updateProfileField}
                        placeholder="Enter current crop"
                      />
                    </div>

                    <div className="rt-profile-field full">
                      <label className="rt-label">Irrigation Facility</label>
                      <select
                        className="rt-input"
                        name="irrigation"
                        value={profileForm.irrigation || ""}
                        onChange={updateProfileField}
                      >
                        <option value="">Select irrigation type</option>
                        <option value="Drip Irrigation">Drip Irrigation</option>
                        <option value="Sprinkler Irrigation">Sprinkler Irrigation</option>
                        <option value="Canal">Canal</option>
                        <option value="Borewell">Borewell</option>
                        <option value="Rainfed">Rainfed</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <button className="rt-btn" type="submit">
                      Save Changes
                    </button>

                    <button
                      className="rt-btn"
                      type="button"
                      style={{ background: "#a83232" }}
                      onClick={onLogout}
                    >
                      Logout
                    </button>
                  </div>
                </form>
              </section>
            </>
          )}

          {showSettings && (
            <>
              <div className="rt-page-header">
                <button
                  className="rt-outline"
                  onClick={() => setShowSettings(false)}
                >
                  ← Back
                </button>
              </div>

              <section className="rt-module">
                <h1>Settings</h1>
                <p className="rt-muted">
                  Customize your RainToRoot experience.
                </p>

                <div className="rt-card rt-setting-card">
                  <h3>Language</h3>
                  <label className="rt-label">Choose your preferred language</label>
                  <select
                    className="rt-input"
                    value={language}
                    onChange={e => updateLanguage(e.target.value)}
                  >
                    <option value="English">English</option>
                    <option value="Kannada">Kannada</option>
                    <option value="Hindi">Hindi</option>
                  </select>
                </div>

                <div className="rt-card rt-setting-card">
                  <h3>Appearance</h3>
                  <label className="rt-label">Choose your theme</label>
                  <select
                    className="rt-input"
                    value={theme}
                    onChange={e => updateTheme(e.target.value)}
                  >
                    <option value="light">Light Theme</option>
                    <option value="dark">Dark Theme</option>
                  </select>
                </div>

                <div className="rt-card rt-setting-card">
                  <h3>Notifications</h3>
                  <p>Manage your notification preference.</p>
                  <label className="rt-checkbox">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={e => updateNotifications(e.target.checked)}
                    />
                    Enable Notifications
                  </label>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {!active && !showProfile && !showSettings && (
        <button
          className="rt-ai-float"
          onClick={() => openModule("AI Farmer Assistant")}
        >
          ✦ AI Assistant
        </button>
      )}
    </div>
  );
}
