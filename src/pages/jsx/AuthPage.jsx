import React, {useState} from "react";
import "../css/AuthPage.css";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);

    return (
        <div className="auth-page-container">
            <div className="auth-bg-circle auth-bg-circle-1"></div>
            <div className="auth-bg-circle auth-bg-circle-2"></div>

            <div className="auth-card-wrapper">
                {/* Dynamic Form */}
                <div className="auth-form-panel">
                    {isLogin ? (
                        <LoginPage switchToRegister={() => setIsLogin(false)} />
                    ) : (
                        <RegisterPage switchToLogin={() => setIsLogin(true)} />
                    )}
                </div>
            </div>
        </div>
    );
}