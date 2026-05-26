import React, {useState} from "react";
import "../css/RegisterPage.css";
import LoginPage from "./LoginPage";
import RegisterPage from "./RegisterPage";

export default function AuthPage(){
    const [isLogin, setIsLogin] = useState(true);

    return(
        <div className="auth-container">
            <div className="auth-card">
                {/* ========================================= */}
                {/* LEFT SIDE */}
                {/* ========================================= */}
                <div className="auth-left">
                    <div className="overlay-circle top"></div>
                    <div className="overlay-circle bottom"></div>
                    <div className="left-content">
                        <h1>
                            Welcome to <br />
                            PrepAce
                        </h1>
                        <p>
                            AI-powered learning platform helping students
                            prepare for university entrance exams with
                            smart quizzes, assignments, and AI support.
                        </p>
                        <div className="feature-list">

                            <div className="feature-item">
                                <span className="dot"></span>
                                <p>AI Learning Assistant</p>
                            </div>

                            <div className="feature-item">
                                <span className="dot"></span>
                                <p>Interactive Quizzes & Assignments</p>
                            </div>

                            <div className="feature-item">
                                <span className="dot"></span>
                                <p>Track Learning Progress</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ========================================= */}
                {/* RIGHT SIDE */}
                {/* ========================================= */}

                <div className="auth-right">
                    {
                        isLogin
                        ?
                        (
                            <LoginPage
                                switchToRegister={() =>
                                    setIsLogin(false)
                                }
                            />
                        )
                        :
                        (
                            <RegisterPage
                                switchToLogin={() =>
                                    setIsLogin(true)
                                }
                            />
                        )
                    }
                </div>
            </div>
        </div>
    );
}