import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./ThemeContext";
import "./index.css";
import "./i18n";

// Telegram ichida ochilganda ilovani to'liq ekranga yoyish
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);
