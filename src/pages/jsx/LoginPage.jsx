import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import axiosClient from "../../api/axiosClient";
import "../css/LoginPage.css";

function LoginPage({ switchToRegister }) {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    //---------------------------------------------------
    // Gửi Activity Log
    //---------------------------------------------------
    const sendActivityLog = async (userId, token, action) => {
        try {
            await fetch(
                `http://localhost:8080/api/admin/users/${userId}/activity`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        action,
                    }),
                }
            );
        } catch (err) {
            console.error("Activity Log Error:", err);
        }
    };

    //---------------------------------------------------
    // Điều hướng
    //---------------------------------------------------
    const redirectByRole = (role) => {
        switch (role) {
            case "ADMIN":
                navigate("/admin/courses");
                break;

            case "TEACHER":
                navigate("/teacher/dashboard");
                break;

            default:
                navigate("/home");
        }
    };

    //---------------------------------------------------
    // Login thường
    //---------------------------------------------------
    const handleLogin = async (e) => {
        e.preventDefault();

        setLoading(true);
        setMessage("");

        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                        rememberMe,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Login failed");
                setMessageType("error");
                return;
            }

            //---------------------------------------------------
            // Lưu token
            //---------------------------------------------------

            localStorage.setItem("token", data.token);

            const decoded = jwtDecode(data.token);

            const role =
                data.user?.role ||
                data.user?.roleName ||
                decoded.role ||
                "STUDENT";

            const user = {
                id: decoded.userId || decoded.id || data.user?.id,
                fullName:
                    decoded.fullName ||
                    decoded.name ||
                    data.user?.fullName ||
                    "",
                email:
                    decoded.sub ||
                    decoded.email ||
                    data.user?.email ||
                    email,
                role,
            };

            localStorage.setItem("user", JSON.stringify(user));

            //---------------------------------------------------
            // Activity Log
            //---------------------------------------------------

            if (user.id) {
                await sendActivityLog(
                    user.id,
                    data.token,
                    "Đăng nhập vào hệ thống PrepAce"
                );
            }

            setMessage("Đăng nhập thành công!");
            setMessageType("success");

            setTimeout(() => {
                redirectByRole(role);
            }, 700);
        } catch (err) {
            console.error(err);
            setMessage("Không thể kết nối tới server.");
            setMessageType("error");
        } finally {
            setLoading(false);
        }
    };

    //---------------------------------------------------
    // Google Login
    //---------------------------------------------------
    const handleGoogleLogin = async (credentialResponse) => {
        try {
            const response = await fetch(
                "http://localhost:8080/api/auth/google",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({
                        credential: credentialResponse.credential,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Google Login Failed");
                setMessageType("error");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            const role =
                data.user.role ||
                data.user.roleName ||
                "STUDENT";

            if (data.user.id) {
                await sendActivityLog(
                    data.user.id,
                    data.token,
                    "Đăng nhập Google"
                );
            }

            setMessage("Google Login Success!");
            setMessageType("success");

            setTimeout(() => {
                redirectByRole(role);
            }, 700);
        } catch (err) {
            console.error(err);
            setMessage("Google Login Error");
            setMessageType("error");
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                {/* LEFT */}

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

                {/* RIGHT */}

                <div className="login-right">

                    <div className="login-header">
                        <h2>Login</h2>
                        <p>Login to continue learning with PrepAce.</p>
                    </div>

                    {message && (
                        <div className={`message-box ${messageType}`}>
                            {message}
                        </div>
                    )}

                    <form className="login-form" onSubmit={handleLogin}>

                        <div className="input-group">
                            <label>Email</label>

                            <input
                                type="email"
                                value={email}
                                placeholder="Enter your email"
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>

                            <input
                                type="password"
                                value={password}
                                placeholder="Enter your password"
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <div
                            className="login-options"
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 15,
                            }}
                        >
                            <label
                                style={{
                                    display: "flex",
                                    gap: 6,
                                    alignItems: "center",
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) =>
                                        setRememberMe(e.target.checked)
                                    }
                                />

                                Ghi nhớ đăng nhập
                            </label>

                            <span
                                style={{
                                    cursor: "pointer",
                                }}
                                onClick={() =>
                                    navigate("/forgot-password")
                                }
                            >
                                Forgot Password?
                            </span>
                        </div>

                        <button
                            type="submit"
                            className="login-btn"
                            disabled={loading}
                        >
                            {loading ? "Logging In..." : "Login"}
                        </button>

                        <div className="divider">
                            <span>OR</span>
                        </div>

                        <GoogleLogin
                            onSuccess={handleGoogleLogin}
                            onError={() => {
                                setMessage("Google Login Failed");
                                setMessageType("error");
                            }}
                        />
                    </form>

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

            {message && (
                <div className={`auth-message ${messageType}`}>
                    {messageType === "success" ? "✅" : "⚠️"} {message}
                </div>
            )}

            <form onSubmit={handleLogin}>
                <div className="auth-form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        className="auth-form-input"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="auth-form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        className="auth-form-input"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <div className="auth-form-options">
                    <label className="auth-checkbox-label">
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        Remember me
                    </label>
                    <span onClick={() => navigate("/forgot-password")} className="auth-forgot-link">
                        Forgot Password?
                    </span>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? "Logging In..." : "Login"}
                </button>

                <div className="auth-divider">
                    <span>OR CONTINUE WITH</span>
                </div>

                <div className="auth-google-btn-wrapper">
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => {
                            setMessage("Google Login Failed");
                            setMessageType("error");
                        }}
                        theme="filled_blue"
                        shape="pill"
                    />
                </div>
            </form>

            <div className="auth-switch-text">
                Don't have an account?
                <span onClick={switchToRegister} className="auth-switch-link">
                    Create an account
                </span>
            </div>
        </div>
    );
}

export default LoginPage;