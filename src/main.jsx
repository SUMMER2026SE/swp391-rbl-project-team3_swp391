import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google";
// import { NotificationProvider } from "./context/NotificationContext";

import {
  BrowserRouter
} from "react-router-dom";

// Cho phép cấu hình Google Client ID qua biến môi trường (.env: VITE_GOOGLE_CLIENT_ID)
// Để dùng Google Login: tạo OAuth Client ID của BẠN tại Google Cloud Console,
// thêm http://localhost:5173 vào "Authorized JavaScript origins", rồi đặt vào .env.
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "257199987910-2tfe97p674iljqh5uqbgpvqe5b3a55dl.apps.googleusercontent.com";

// Tự động Ghi đè (Override) window.alert thành Custom Toast cực xịn 
window.alert = function(message) {
  // Loại bỏ alert cũ nếu đang hiện
  const oldToast = document.getElementById("prep-toast");
  if (oldToast) oldToast.remove();

  const toast = document.createElement("div");
  toast.id = "prep-toast";
  toast.innerText = message;
  
  // Áp dụng Style cực đẹp chuẩn UI/UX
  Object.assign(toast.style, {
    position: "fixed",
    top: "30px",
    left: "50%",
    transform: "translateX(-50%) translateY(-20px)",
    backgroundColor: "#1e293b",
    color: "#ffffff",
    padding: "16px 24px",
    borderRadius: "12px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
    zIndex: "999999",
    fontFamily: "Inter, sans-serif",
    fontSize: "15px",
    fontWeight: "500",
    opacity: "0",
    transition: "all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)", // Hiệu ứng nảy (bounce)
    pointerEvents: "none",
    textAlign: "center",
    maxWidth: "80%"
  });

  document.body.appendChild(toast);

  // Kích hoạt animation hiện ra
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
  }, 10);

  // Tự động ẩn sau 3.5 giây
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(-50%) translateY(-20px)";
    setTimeout(() => {
      if (document.body.contains(toast)) document.body.removeChild(toast);
    }, 300);
  }, 3500);
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
)