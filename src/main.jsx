import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from "@react-oauth/google";

import {
  BrowserRouter
} from "react-router-dom";

// Cho phép cấu hình Google Client ID qua biến môi trường (.env: VITE_GOOGLE_CLIENT_ID)
// Để dùng Google Login: tạo OAuth Client ID của BẠN tại Google Cloud Console,
// thêm http://localhost:5173 vào "Authorized JavaScript origins", rồi đặt vào .env.
const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  "257199987910-2tfe97p674iljqh5uqbgpvqe5b3a55dl.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
)