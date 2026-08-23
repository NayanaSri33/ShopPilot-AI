import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./App.css";

// Note: App already wraps itself in <CartProvider>, so it isn't duplicated here.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);