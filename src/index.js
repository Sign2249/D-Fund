import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";   // ✅ 반드시 있어야 함
import App from "./components/App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
