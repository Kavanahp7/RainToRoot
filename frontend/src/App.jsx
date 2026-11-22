import React, { useState } from "react";
import Dashboard from "./Dashboard";

const API_URL = "http://127.0.0.1:5000";

function hasValidSession() {
  try {
    const farmer = JSON.parse(
      localStorage.getItem("raintorootFarmer")
    );

    return (
      localStorage.getItem("raintorootAuthenticated") === "true" &&
      Boolean(farmer?.farmer_id)
    );
  } catch {
    return false;
  }
}

export default function App() {
  const [page, setPage] = useState(() =>
    hasValidSession() ? "home" : "login"
  );

  const [isAuthenticated, setIsAuthenticated] = useState(
    hasValidSession()
  );

  const [showDashboard, setShowDashboard] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("raintorootFarmer")) || {};
    } catch {
      return {};
    }
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    village: "",
    district: "",
    state: "",
    landSize: "",
    soilType: "",
    currentCrop: "",
    irrigation: ""
  });

  const features = [
    {
      number: "01",
      title: "Rainfall Intelligence",
      description: "Explore rainfall patterns, weather forecasts and historical rainfall information."
    },
    {
      number: "02",
      title: "Soil & Crop Suitability",
      description: "Discover suitable crops using soil characteristics, location and seasonal conditions."
    },
    {
      number: "03",
      title: "Climate Risk Analysis",
      description: "Understand possible drought, dry spells and excessive rainfall risks."
    },
    {
      number: "04",
      title: "Mandi Price Tracker",
      description: "Explore agricultural market prices and compare crop prices across markets."
    },
    {
      number: "05",
      title: "Farm Profit Simulator",
      description: "Estimate farming expenses, expected revenue and possible profit."
    },
    {
      number: "06",
      title: "AI Farmer Assistant",
      description: "Get simple explanations and useful agricultural guidance."
    }
  ];

  const updateField = (e) => {
    setForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value
    }));
  };

  const saveProfile = (data) => {
    localStorage.setItem("raintorootFarmer", JSON.stringify(data));
    setProfile(data);
  };

  const convertFarmerData = (farmer) => ({
    farmer_id: farmer.id,
    name: farmer.name || "",
    email: farmer.email || "",
    village: farmer.village || "",
    district: farmer.district || "",
    state: farmer.state || "",
    landSize: farmer.land_size ?? "",
    soilType: farmer.soil_type || "",
    currentCrop: farmer.current_crop || "",
    irrigation: farmer.irrigation || ""
  });

  const startSession = (farmerData) => {
    saveProfile(farmerData);
    localStorage.setItem("raintorootAuthenticated", "true");
    setIsAuthenticated(true);
    setShowDashboard(false);
    setPage("home");
    setMessage("");
  };

  // SIGNUP
  const handleSignup = async (e) => {
    e.preventDefault();

    if (form.password.length < 8) {
      setMessage("Password must contain at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    const landSize = form.landSize.trim()
      ? parseFloat(form.landSize)
      : null;

    if (
      landSize !== null &&
      (!Number.isFinite(landSize) || landSize < 0)
    ) {
      setMessage("Please enter a valid land size.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    const farmer = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      village: form.village.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
      land_size: landSize,
      soil_type: form.soilType,
      current_crop: form.currentCrop,
      irrigation: form.irrigation
    };

    try {
      const response = await fetch(`${API_URL}/api/farmers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(farmer)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create account.");
      }

      if (!result.farmer) {
        throw new Error(
          "Account created, but farmer details were not returned."
        );
      }

      const savedFarmer = convertFarmerData(result.farmer);

      startSession(savedFarmer);

      setForm((previous) => ({
        ...previous,
        password: "",
        confirmPassword: ""
      }));
    } catch (error) {
      setMessage(
        error.message || "Backend connection failed. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // LOGIN
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      setMessage("Please enter your email and password.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Login failed. Please check your details."
        );
      }

      if (!result.farmer) {
        throw new Error("Farmer profile was not returned.");
      }

      const savedFarmer = convertFarmerData(result.farmer);

      startSession(savedFarmer);

      setForm((previous) => ({
        ...previous,
        password: "",
        confirmPassword: ""
      }));
    } catch (error) {
      setMessage(
        error.message || "Unable to connect to the server."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // FORGOT PASSWORD
  const handleForgot = (e) => {
    e.preventDefault();
    setMessage(
      "Password reset is not connected yet. We will add a secure password reset feature next."
    );
  };

  const openHome = () => {
    setShowDashboard(false);
  };

  const openDashboard = () => {
    if (!isAuthenticated || !hasValidSession()) {
      setIsAuthenticated(false);
      setShowDashboard(false);
      setPage("login");
      setMessage("Please login to access your dashboard.");
      return;
    }

    setShowDashboard(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("raintorootAuthenticated");
    localStorage.removeItem("raintorootFarmer");

    setProfile({});
    setIsAuthenticated(false);
    setShowDashboard(false);
    setPage("login");
    setMessage("You have been logged out successfully.");

    setForm((previous) => ({
      ...previous,
      password: "",
      confirmPassword: ""
    }));
  };

  const Logo = () => (
    <div className="auth-brand">
      <img src="/raintoroot-logo.png" alt="RainToRoot Logo" />
      <div>
        <h2>Rain<span>To</span>Root</h2>
        <p>From every drop of rain to better farming decisions.</p>
      </div>
    </div>
  );

  // PROTECTED DASHBOARD
  if (showDashboard) {
    if (!isAuthenticated || !hasValidSession()) {
      return (
        <div>
          {setShowDashboard(false)}
          {setIsAuthenticated(false)}
          {setPage("login")}
        </div>
      );
    }

    return (
      <Dashboard
        onHome={openHome}
        onLogout={handleLogout}
      />
    );
  }

  // LOGIN, SIGNUP AND FORGOT PASSWORD
  if (page === "login" || page === "signup" || page === "forgot") {
    return (
      <>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }

          body {
            font-family: Arial, sans-serif;
            background: #f2f7f0;
            color: #183b2a;
          }

          .auth-page {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 35px 18px;
            background: linear-gradient(135deg, #e5f0e2, #f8faf6);
          }

          .auth-card {
            width: 100%;
            max-width: 490px;
            background: white;
            padding: 35px 38px;
            border-radius: 15px;
            box-shadow: 0 12px 40px rgba(22,79,53,0.10);
          }

          .auth-brand {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            margin-bottom: 27px;
          }

          .auth-brand img {
            width: 65px;
            height: 65px;
            object-fit: contain;
          }

          .auth-brand h2 {
            font-size: 25px;
            color: #164f35;
          }

          .auth-brand h2 span { color: #75a94c; }

          .auth-brand p {
            font-size: 10px;
            color: #647468;
            margin-top: 5px;
          }

          .auth-card h1 {
            text-align: center;
            font-size: 26px;
            color: #164f35;
            margin-bottom: 9px;
          }

          .auth-subtitle {
            text-align: center;
            color: #718074;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 25px;
          }

          .auth-form {
            display: flex;
            flex-direction: column;
            gap: 15px;
          }

          .auth-form label {
            display: block;
            color: #244b35;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 7px;
          }

          .auth-form input,
          .auth-form select {
            width: 100%;
            height: 45px;
            border: 1px solid #d6e2d4;
            border-radius: 7px;
            padding: 0 12px;
            background: #fbfdf9;
            color: #183b2a;
            font-size: 14px;
            outline: none;
          }

          .auth-form input:focus,
          .auth-form select:focus {
            border-color: #4d9360;
            box-shadow: 0 0 0 3px rgba(77,147,96,0.10);
          }

          .auth-form input::placeholder { color: #929e94; }

          .auth-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 13px;
          }

          .auth-grid .full { grid-column: 1 / -1; }

          .auth-button {
            width: 100%;
            padding: 14px;
            border: none;
            border-radius: 7px;
            background: #164f35;
            color: white;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: 0.3s;
            margin-top: 5px;
          }

          .auth-button:hover { background: #236b49; }

          .auth-button:disabled {
            opacity: 0.65;
            cursor: not-allowed;
          }

          .auth-links {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
            margin-top: 19px;
          }

          .auth-links button {
            border: none;
            background: none;
            color: #287044;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
          }

          .auth-message {
            background: #edf5e9;
            border: 1px solid #d4e7ce;
            color: #285b37;
            padding: 11px;
            border-radius: 7px;
            font-size: 13px;
            line-height: 1.5;
            margin-bottom: 15px;
          }

          .location-heading {
            color: #164f35;
            font-size: 16px;
            font-weight: 700;
            border-bottom: 1px solid #e5eee2;
            padding-bottom: 9px;
            margin: 8px 0 2px;
          }

          .auth-note {
            text-align: center;
            font-size: 11px;
            color: #879287;
            line-height: 1.6;
            margin-top: 18px;
          }

          @media(max-width: 480px) {
            .auth-card { padding: 28px 20px; }
            .auth-grid { grid-template-columns: 1fr; }
            .auth-grid .full { grid-column: auto; }
          }
        `}</style>

        <div className="auth-page">
          <div className="auth-card">
            <Logo />

            {page === "login" && (
              <>
                <h1>Welcome Back!</h1>
                <p className="auth-subtitle">
                  Login to access your RainToRoot farming dashboard.
                </p>

                {message && <div className="auth-message">{message}</div>}

                <form className="auth-form" onSubmit={handleLogin}>
                  <div>
                    <label>Email Address</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={updateField}
                      required
                    />
                  </div>

                  <div>
                    <label>Password</label>
                    <input
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={updateField}
                      required
                    />
                  </div>

                  <button className="auth-button" type="submit" disabled={isSaving}>
                    {isSaving ? "Logging in..." : "Login"}
                  </button>
                </form>

                <div className="auth-links">
                  <button onClick={() => { setMessage(""); setPage("forgot"); }}>
                    Forgot Password?
                  </button>
                  <button onClick={() => { setMessage(""); setPage("signup"); }}>
                    Create Account
                  </button>
                </div>
              </>
            )}

            {page === "signup" && (
              <>
                <h1>Create Farmer Account</h1>
                <p className="auth-subtitle">
                  Enter your details to get farming information based on your location.
                </p>

                {message && <div className="auth-message">{message}</div>}

                <form className="auth-form" onSubmit={handleSignup}>
                  <div>
                    <label>Full Name *</label>
                    <input
                      name="name"
                      placeholder="Enter your full name"
                      value={form.name}
                      onChange={updateField}
                      required
                    />
                  </div>

                  <div>
                    <label>Email Address *</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="Enter your email"
                      value={form.email}
                      onChange={updateField}
                      required
                    />
                  </div>

                  <div className="auth-grid">
                    <div>
                      <label>Password *</label>
                      <input
                        name="password"
                        type="password"
                        placeholder="Create password"
                        value={form.password}
                        onChange={updateField}
                        minLength="8"
                        required
                      />
                    </div>

                    <div>
                      <label>Confirm Password *</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Confirm password"
                        value={form.confirmPassword}
                        onChange={updateField}
                        minLength="8"
                        required
                      />
                    </div>
                  </div>

                  <div className="location-heading">Your Farm Location</div>

                  <div>
                    <label>Village Name *</label>
                    <input
                      name="village"
                      placeholder="Enter your village name"
                      value={form.village}
                      onChange={updateField}
                      required
                    />
                  </div>

                  <div className="auth-grid">
                    <div>
                      <label>District *</label>
                      <input
                        name="district"
                        placeholder="Enter district"
                        value={form.district}
                        onChange={updateField}
                        required
                      />
                    </div>

                    <div>
                      <label>State *</label>
                      <input
                        name="state"
                        placeholder="Enter state"
                        value={form.state}
                        onChange={updateField}
                        required
                      />
                    </div>
                  </div>

                  <div className="location-heading">
                    Additional Farming Details (Optional)
                  </div>

                  <div className="auth-grid">
                    <div>
                      <label>Land Size (acres)</label>
                      <input
                        name="landSize"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="e.g. 2.5"
                        value={form.landSize}
                        onChange={updateField}
                      />
                    </div>

                    <div>
                      <label>Soil Type</label>
                      <select
                        name="soilType"
                        value={form.soilType}
                        onChange={updateField}
                      >
                        <option value="">Select soil</option>
                        <option>Red Soil</option>
                        <option>Black Soil</option>
                        <option>Alluvial Soil</option>
                        <option>Laterite Soil</option>
                        <option>Sandy Soil</option>
                        <option>Clay Soil</option>
                        <option>Not Sure</option>
                      </select>
                    </div>

                    <div>
                      <label>Current Crop</label>
                      <input
                        name="currentCrop"
                        placeholder="e.g. Rice, Ragi"
                        value={form.currentCrop}
                        onChange={updateField}
                      />
                    </div>

                    <div>
                      <label>Irrigation</label>
                      <select
                        name="irrigation"
                        value={form.irrigation}
                        onChange={updateField}
                      >
                        <option value="">Select option</option>
                        <option>Rainfed</option>
                        <option>Borewell</option>
                        <option>Canal</option>
                        <option>Drip Irrigation</option>
                        <option>Other</option>
                      </select>
                    </div>
                  </div>

                  <button className="auth-button" type="submit" disabled={isSaving}>
                    {isSaving ? "Saving Profile..." : "Create Account"}
                  </button>
                </form>

                <div className="auth-links">
                  <button onClick={() => { setMessage(""); setPage("login"); }}>
                    Already have an account? Login
                  </button>
                </div>
              </>
            )}

            {page === "forgot" && (
              <>
                <h1>Forgot Password?</h1>
                <p className="auth-subtitle">
                  Enter your registered email address to request a password reset.
                </p>

                {message && <div className="auth-message">{message}</div>}

                <form className="auth-form" onSubmit={handleForgot}>
                  <div>
                    <label>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your registered email"
                      value={form.email}
                      onChange={updateField}
                      required
                    />
                  </div>

                  <button className="auth-button" type="submit">
                    Reset Password
                  </button>
                </form>

                <div className="auth-links">
                  <button onClick={() => { setMessage(""); setPage("login"); }}>
                    Back to Login
                  </button>
                </div>
              </>
            )}

            <p className="auth-note">
              RainToRoot — Better information. Smarter farming decisions.
            </p>
          </div>
        </div>
      </>
    );
  }

  // HOMEPAGE
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html { scroll-behavior: smooth; }
        body { font-family: Arial, sans-serif; background: #f7faf6; color: #183b2a; }

        .navbar {
          width: 100%; min-height: 85px; padding: 12px 7%;
          display: flex; align-items: center; justify-content: space-between;
          background: white; box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          position: sticky; top: 0; z-index: 100; gap: 20px;
        }

        .brand { display: flex; align-items: center; gap: 12px; text-decoration: none; flex-shrink: 0; }
        .brand img { width: 65px; height: 65px; object-fit: contain; }
        .brand-text h2 { font-size: 25px; font-weight: 700; color: #164f35; }
        .brand-text h2 span { color: #75a94c; }
        .brand-text p { font-size: 11px; color: #53675a; margin-top: 4px; }

        .nav-links { display: flex; align-items: center; gap: 28px; flex-wrap: wrap; }
        .nav-links a { text-decoration: none; color: #244b35; font-size: 14px; font-weight: 600; }
        .nav-links a:hover { color: #75a94c; }

        .nav-button {
          background: #164f35; color: white; padding: 11px 22px;
          border-radius: 6px; border: none; cursor: pointer;
        }
        .nav-button:hover { background: #236b49; }

        .hero {
          min-height: 540px; padding: 90px 8%; display: flex;
          align-items: center; background: linear-gradient(120deg, #e7f1e6, #f7faf6);
        }
        .hero-content { max-width: 720px; }
        .hero-label {
          display: inline-block; background: #dcebd9; color: #28613e;
          padding: 9px 17px; border-radius: 30px; font-size: 13px;
          font-weight: 600; margin-bottom: 25px;
        }
        .hero h1 { font-size: 54px; line-height: 1.15; color: #123c27; margin-bottom: 22px; }
        .hero h1 span { color: #6d9e48; }
        .hero p { font-size: 17px; line-height: 1.8; color: #53675a; max-width: 600px; margin-bottom: 30px; }

        .primary-button {
          display: inline-block; background: #164f35; color: white;
          padding: 14px 28px; border-radius: 6px; font-size: 15px;
          font-weight: 600; border: none; cursor: pointer; transition: 0.3s;
        }
        .primary-button:hover { background: #236b49; transform: translateY(-2px); }

        .section { padding: 75px 8%; }
        .section-heading { text-align: center; margin-bottom: 45px; }
        .section-heading h2 { font-size: 34px; color: #164f35; margin-bottom: 13px; }
        .section-heading p { color: #68776c; font-size: 15px; line-height: 1.7; }
        .about-section { background: white; }
        .about-content { max-width: 850px; margin: auto; text-align: center; }
        .about-content p { font-size: 16px; line-height: 1.9; color: #586b5d; }

        .features-section { background: #f2f7f0; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px; }
        .feature-card {
          background: white; padding: 30px 25px; border-radius: 12px;
          border: 1px solid #e3ece1; transition: 0.3s;
        }
        .feature-card:hover { transform: translateY(-6px); box-shadow: 0 10px 25px rgba(22,79,53,0.09); }
        .feature-number { font-size: 14px; font-weight: 700; color: #79a957; margin-bottom: 18px; }
        .feature-card h3 { color: #164f35; font-size: 20px; margin-bottom: 13px; }
        .feature-card p { color: #68776c; font-size: 14px; line-height: 1.8; }

        .cta-section { text-align: center; padding: 75px 8%; background: #164f35; color: white; }
        .cta-section h2 { font-size: 32px; margin-bottom: 15px; }
        .cta-section p { font-size: 15px; line-height: 1.8; color: #e0ebdf; margin-bottom: 25px; }
        .cta-section button {
          background: white; color: #164f35; padding: 13px 27px;
          border-radius: 6px; font-weight: 700; border: none; cursor: pointer;
        }
        .cta-section button:hover { background: #e4efdf; }

        footer { background: #082c1d; color: #dce8df; text-align: center; padding: 23px 10px; font-size: 13px; }

        @media(max-width: 900px) {
          .features-grid { grid-template-columns: repeat(2, 1fr); }
          .hero h1 { font-size: 43px; }
          .nav-links { gap: 15px; }
        }

        @media(max-width: 650px) {
          .navbar { flex-direction: column; padding: 15px 5%; }
          .brand-text h2 { font-size: 22px; }
          .brand-text p { font-size: 9px; }
          .nav-links { justify-content: center; gap: 15px; }
          .hero { min-height: 450px; padding: 65px 7%; }
          .hero h1 { font-size: 36px; }
          .hero p { font-size: 15px; }
          .section { padding: 55px 7%; }
          .section-heading h2 { font-size: 28px; }
          .features-grid { grid-template-columns: 1fr; }
          .cta-section h2 { font-size: 27px; }
        }
      `}</style>

      <header className="navbar">
        <a href="#" className="brand">
          <img src="/raintoroot-logo.png" alt="RainToRoot Logo" />
          <div className="brand-text">
            <h2>Rain<span>To</span>Root</h2>
            <p>From every drop of rain to better farming decisions.</p>
          </div>
        </a>

        <nav className="nav-links">
          <a href="#">Home</a>
          <a href="#about">About</a>
          <a href="#features">Features</a>
          <a href="#contact">Contact</a>
          <button className="nav-button" onClick={openDashboard}>
            Dashboard
          </button>
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="hero-label">
              Smart Agriculture & Climate Intelligence
            </span>
            <h1>
              From Every Drop of Rain to <span>Better Farming.</span>
            </h1>
            <p>
              RainToRoot brings rainfall intelligence, soil insights,
              crop recommendations and market information together
              to help farmers make smarter farming decisions.
            </p>
            <button className="primary-button" onClick={openDashboard}>
              Explore Dashboard
            </button>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="section-heading">
            <h2>About RainToRoot</h2>
            <p>Connecting rainfall intelligence with smarter agriculture.</p>
          </div>
          <div className="about-content">
            <p>
              Agriculture depends on many important factors such as
              rainfall, soil conditions, climate and market prices.
              RainToRoot is designed as an integrated agricultural
              information platform that brings these factors together.
              It helps farmers understand weather conditions, explore
              crop suitability, identify potential climate risks and
              estimate farming expenses and returns through one platform.
            </p>
          </div>
        </section>

        <section className="section features-section" id="features">
          <div className="section-heading">
            <h2>Our Key Features</h2>
            <p>Useful information and intelligent tools for better agricultural decisions.</p>
          </div>
          <div className="features-grid">
            {features.map((feature) => (
              <div className="feature-card" key={feature.number}>
                <div className="feature-number">{feature.number}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="cta-section" id="contact">
          <h2>Building a Smarter Future for Farming</h2>
          <p>Better information. Smarter decisions. Stronger agriculture.</p>
          <button onClick={openDashboard}>Get Started</button>
        </section>
      </main>

      <footer>
        © 2026 RainToRoot. From every drop of rain to better farming decisions.
      </footer>
    </>
  );
}