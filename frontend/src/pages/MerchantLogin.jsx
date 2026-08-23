import { useState } from "react";
import { useNavigate } from "react-router-dom";

function MerchantLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // Demo credentials
    if (
      email === "merchant@shoppilot.ai" &&
      password === "shop123"
    ) {
      navigate("/merchant-dashboard");
    } else {
      setError("Invalid email or password.");
    }
  };

  return (
    <div className="merchant-login-page">
      <div className="login-card">
        <h1>🛍️ Merchant Login</h1>
        <p>Welcome back to ShopPilot AI Dashboard</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Merchant Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit">Login</button>
        </form>

        <div className="demo-box">
          <p>**Demo Credentials**</p>
          <small>Email: merchant@shoppilot.ai</small>
          <br />
          <small>Password: shop123</small>
        </div>
      </div>
    </div>
  );
}

export default MerchantLogin;