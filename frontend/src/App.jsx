import "./App.css";
import Checkout from "./pages/Checkout";
import { useEffect, useState } from "react";

import AIChat from "./components/AIChat";
import AgentLedger from "./components/AgentLedger";
import Cart from "./components/Cart";
import MerchantDashboard from "./components/MerchantDashboard";
import Products from "./pages/Products";
import { CartProvider } from "./context/CartContext";
import { getOrderStats } from "./api";

function formatRupees(paise) {
  return `₹${Math.round((paise || 0) / 100).toLocaleString("en-IN")}`;
}

function App() {
  // Merchant Login Popup
  const [showLogin, setShowLogin] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  // Merchant Details
  const [merchantName, setMerchantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);

  // Hero stats — pulled from the same aggregated /api/orders/stats/summary
  // endpoint the merchant dashboard uses, so the homepage never claims a
  // number the audit trail can't back up.
  const [heroStats, setHeroStats] = useState(null);
  useEffect(() => {
    getOrderStats()
      .then(setHeroStats)
      .catch(() => setHeroStats(null));
  }, []);

  // ================= REGISTER =================
  const handleRegister = () => {
    if (!merchantName || !email || !password) {
      setError("Please fill all the fields.");
      setSuccess("");
      return;
    }

    const merchant = {
      name: merchantName,
      email,
      password,
    };

    localStorage.setItem("merchantAccount", JSON.stringify(merchant));

    setSuccess("✅ Account created successfully! Please login.");
    setError("");

    setMerchantName("");
    setEmail("");
    setPassword("");

    setIsRegister(false);
  };

  // ================= LOGIN =================
  const handleMerchantLogin = () => {
    const savedMerchant = JSON.parse(
      localStorage.getItem("merchantAccount")
    );

    if (!savedMerchant) {
      setError("No merchant account found. Please register first.");
      setSuccess("");
      return;
    }

    if (
      email === savedMerchant.email &&
      password === savedMerchant.password
    ) {
      setLoggedIn(true);
      setShowLogin(false);

      setEmail("");
      setPassword("");

      setError("");
      setSuccess("");
    } else {
      setError("Incorrect email or password.");
      setSuccess("");
    }
  };

  // ================= LOGOUT =================
  const handleLogout = () => {
    setLoggedIn(false);
  };

  return (
    <CartProvider>
      <div className="home">
        {/* ================= NAVBAR ================= */}
        <nav className="navbar">
          <h2>ShopPilot AI</h2>

          {loggedIn ? (
            <button className="login-btn" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button
              className="login-btn"
              onClick={() => {
                setShowLogin(true);
                setError("");
                setSuccess("");
              }}
            >
              Merchant Login
            </button>
          )}
        </nav>

        {/* ================= CUSTOMER APP ================= */}
{!loggedIn && (
  <>
    {showCheckout ? (
      <Checkout />
    ) : (
      <>
        <section className="hero">
          <div className="hero-grid">
            <div className="hero-left">
              <p className="tag">Razorpay AI Buildathon · Track 01 — Agentic Commerce</p>

              <h1>
                A shopping agent that <span>explains every move</span> it makes with your money.
              </h1>

              <p className="subtitle">
                ShopPilot AI recommends, bundles and checks buyers out over
                Razorpay's rails — and logs a reason for every action, so
                merchants and shoppers can see exactly why it did what it did.
              </p>

              <div className="trust-pills">
                <span className="pill">
                  <i className="pill-dot pill-dot-explained" />
                  Explainable
                </span>
                <span className="pill">
                  <i className="pill-dot pill-dot-bounded" />
                  Bounded
                </span>
                <span className="pill">
                  <i className="pill-dot pill-dot-gated" />
                  Gated
                </span>
              </div>

              <div className="stats">
                <div className="card">
                  <h3>
                    {heroStats ? formatRupees(heroStats.totalRevenuePaise) : "₹0"}
                  </h3>
                  <p>Verified revenue (this demo instance)</p>
                </div>

                <div className="card">
                  <h3>{heroStats ? heroStats.totalOrders : 0}</h3>
                  <p>Orders processed, audit-logged</p>
                </div>

                <div className="card">
                  <h3>
                    {heroStats
                      ? formatRupees(heroStats.totalDiscountPaise)
                      : "₹0"}
                  </h3>
                  <p>Discounts, capped server-side</p>
                </div>
              </div>
            </div>

            <div className="hero-right">
              <AgentLedger />
            </div>
          </div>
        </section>

        <AIChat />
        <Products />

        <Cart openCheckout={() => setShowCheckout(true)} />
      </>
    )}
  </>
)}

        {/* ================= MERCHANT DASHBOARD ================= */}
        {loggedIn && <MerchantDashboard />}

        {/* ================= LOGIN / REGISTER POPUP ================= */}
        {showLogin && (
          <div className="login-overlay">
            <div className="login-modal">
              <button
                className="close-btn"
                onClick={() => {
                  setShowLogin(false);
                  setError("");
                  setSuccess("");
                }}
              >
                ✕
              </button>

              <h2>
                {isRegister ? "Create merchant account" : "Merchant login"}
              </h2>

              <p className="login-subtitle">
                {isRegister
                  ? "Create your ShopPilot merchant account."
                  : "Login to access your AI Merchant Dashboard."}
              </p>

              {/* Register Only */}
              {isRegister && (
                <input
                  type="text"
                  placeholder="Merchant Name"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                />
              )}

              {/* Email */}
              <input
                type="email"
                placeholder="Merchant Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Password */}
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {/* Error */}
              {error && <p className="login-error">{error}</p>}

              {/* Success */}
              {success && <p className="login-success">{success}</p>}

              {/* Button */}
              {isRegister ? (
                <button
                  className="merchant-login-btn"
                  onClick={handleRegister}
                >
                  Create account
                </button>
              ) : (
                <button
                  className="merchant-login-btn"
                  onClick={handleMerchantLogin}
                >
                  Log in to dashboard
                </button>
              )}

              {/* Switch */}
              <p className="switch-auth">
                {isRegister
                  ? "Already have an account?"
                  : "Don't have an account?"}

                <span
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {isRegister ? " Login" : " Register"}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </CartProvider>
  );
}

export default App;