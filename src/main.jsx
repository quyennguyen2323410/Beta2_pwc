import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App.jsx";
import "./index.css";

// Tự động đăng ký và kích hoạt PWA Service Worker
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log("PWA: Có bản cập nhật mới.");
  },
  onOfflineReady() {
    console.log("PWA: Ứng dụng đã sẵn sàng chạy offline.");
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <App />
    </BrowserRouter>
  </StrictMode>,
);
