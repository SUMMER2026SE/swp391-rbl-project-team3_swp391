import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/LoginPage.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function LoginPage({ switchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    // NORMAL LOGIN - ĐÃ SỬA
    const handleLogin = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setMessage("");

            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    email: email.trim(), 
                    password 
                })
            });

            const data = await response.json();
            console.log("🔍 Full Response từ backend:", data);   // Debug

            if (!response.ok) {
                setMessage(data.message || "Đăng nhập thất bại");
                setMessageType("error");
                return;
            }

            // Lưu token
            // if (data.token) {
            //     localStorage.setItem("token", data.token);
            // }

            // // Lưu user (xử lý nhiều trường hợp backend trả về)
            // if (data.user) {
            //     localStorage.setItem("user", JSON.stringify(data.user));
            // } else if (data.data && data.data.user) {
            //     localStorage.setItem("user", JSON.stringify(data.data.user));
            // } else {
            //     // Tạo user tạm từ email (vì backend chưa trả user)
            //     const tempUser = {
            //         fullName: email.split('@')[0] || "Người dùng",
            //         email: email,
            //         role: "STUDENT"
            //     };
            //     localStorage.setItem("user", JSON.stringify(tempUser));
            // }

            // setMessage("✅ Đăng nhập thành công!");
            // setMessageType("success");

            // // Redirect về trang chủ
            // setTimeout(() => {
            //     const user = JSON.parse(localStorage.getItem("user"));

            //     if (user?.role === "ADMIN") {
            //         navigate("/admin");
            //     }
            //     else if (user?.role === "TEACHER") {
            //         navigate("/teacher/dashboard");
            //     }
            //     else {
            //         navigate("/home");
            //     }

            // }, 700);
            if (data.token) {
                // Lưu token
                localStorage.setItem("token", data.token);

                // Giải mã JWT
                const decoded = jwtDecode(data.token);

                const user = {
                    id: decoded.userId,
                    fullName: decoded.fullName,
                    email: decoded.sub,
                    role: decoded.role.replace("ROLE_", "")
                };
                // Lưu user
                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );
                console.log("User:", user);

                // Điều hướng theo role
                switch (user.role) {
                    case "ADMIN":
                        navigate("/admin");
                        break;
                    case "TEACHER":
                        navigate("/teacher/dashboard");
                        break;
                    default:
                        navigate("/home");
                }
            } else {
                setError("Đăng nhập thất bại!");
            }

            setMessage("✅ Đăng nhập thành công!");
            setMessageType("success");

            // Redirect về trang chủ
            setTimeout(() => {
                if (data.user?.role === "TEACHER" || data.user?.roleId === 2) {
                    navigate("/teacher/dashboard");
                } else if (data.user?.role === "ADMIN" || data.user?.roleId === 1) {
                    navigate("/admin/courses");
                } else {
                    navigate("/home");
                }
            }, 800);

        } catch (error) {
            console.error("Login error:", error);
            setMessage("❌ Lỗi kết nối với server");
            setMessageType("error");
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
                setMessageType("error");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setMessage("✅ Google Login Success!");
            setMessageType("success");

            setTimeout(() => {
                if (data.user?.role === "TEACHER" || data.user?.roleId === 2) {
                    navigate("/teacher/dashboard");
                } else if (data.user?.role === "ADMIN" || data.user?.roleId === 1) {
                    navigate("/admin/courses");
                } else {
                    navigate("/home");
                }
            }, 800);

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
                        <div className={`message-box ${messageType}`}>
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