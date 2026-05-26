import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginPage.css";
import { GoogleLogin } from "@react-oauth/google";

function LoginPage({ switchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // NORMAL LOGIN
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:8080/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: email.trim(),
                        password
                    })
                }
            );

            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                setMessage(data.message || "Login Failed");
                return;
            }

            localStorage.setItem("token", data.token);

            setMessage("✅ Login Successfully!");

            setTimeout(() => {
                navigate("/home");
            }, 800);

        } catch (error) {
            console.error(error);
            setMessage("❌ Server Error");
        } finally {
            setLoading(false);
        }
    };

    // GOOGLE LOGIN
    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const res = await fetch(
                "http://localhost:8080/api/auth/google",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        credential: credentialResponse.credential
                    })
                }
            );

            const data = await res.json();

            if (!res.ok) {
                setMessage(data.message || "Google Login Failed");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setMessage("✅ Google Login Success!");

            navigate("/home");

        } catch (error) {
            console.error(error);
            setMessage("❌ Google Login Error");
        }

        console.log("GOOGLE RESPONSE:", credentialResponse);
        console.log("CREDENTIAL:", credentialResponse?.credential);
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {/* LEFT SIDE */}
                <div className="login-left">
                    <div className="overlay-circle top"></div>
                    <div className="overlay-circle bottom"></div>

                    <div className="left-content">
                        <h1>
                            Welcome Back <br />
                            to PrepAce
                        </h1>

                        <p>
                            Continue your learning journey with AI-powered
                            university preparation, quizzes, assignments,
                            and smart learning tools.
                        </p>

                        <div className="feature-list">
                            <div className="feature-item">
                                <span className="dot"></span>
                                <p>AI Learning Assistant</p>
                            </div>
                            <div className="feature-item">
                                <span className="dot"></span>
                                <p>Track Study Progress</p>
                            </div>
                            <div className="feature-item">
                                <span className="dot"></span>
                                <p>Practice Exams & Quizzes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="login-right">
                    <div className="login-header">
                        <h2>Login</h2>
                        <p>Login to continue learning with PrepAce.</p>
                    </div>

                    {message && (
                        <div className="message-box">
                            {message}
                        </div>
                    )}

                    {/* FORM */}
                    <form className="login-form" onSubmit={handleLogin}>

                        {/* EMAIL */}
                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        {/* PASSWORD */}
                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="forgot-password">
                            <span onClick={() => navigate("/forgot-password")}>
                                Forgot Password?
                            </span>
                        </div>

                        {/* LOGIN BUTTON */}
                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading ? "Logging In..." : "Login"}
                        </button>

                        {/* DIVIDER */}
                        <div className="divider">
                            <span>OR</span>
                        </div>

                        {/* GOOGLE LOGIN */}
                        <div className="google-login">
                            <GoogleLogin
                                onSuccess={handleGoogleLogin}
                                onError={() => {
                                    setMessage("❌ Google Login Failed");
                                }}
                            />
                        </div>

                    </form>

                    {/* REGISTER LINK */}
                    <div className="register-link">
                        <p>
                            Don't have an account?
                            <span onClick={switchToRegister}>
                                Register
                            </span>
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default LoginPage;