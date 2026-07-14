import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

function LoginPage({ switchToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");

    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // 🔥 HÀM HELPER: Gửi yêu cầu lưu log hoạt động xuống cơ sở dữ liệu
    const sendActivityLog = async (userId, token, actionText) => {
        try {
            await fetch(`http://localhost:8080/api/admin/users/${userId}/activity`, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ action: actionText })
            });
        } catch (err) {
            console.error("❌ Không thể ghi nhận nhật ký hoạt động:", err);
        }
    };

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
                    password,
                    rememberMe 
                }),
                credentials: "include" // 🔥 Gửi cookie httpOnly
            });

            const data = await response.json();
            console.log("🔍 Full Response từ backend:", data);

            if (!response.ok) {
                setMessage(data.message || "Đăng nhập thất bại");
                setMessageType("error");
                return;
            }

            if (data.token) {
                localStorage.setItem("token", data.token);

                // Giải mã JWT
                const decoded = jwtDecode(data.token);
                console.log("🔍 Decoded JWT:", decoded);   // ← Debug quan trọng

                // Xử lý role an toàn (phòng trường hợp backend chưa có role hoặc tên field khác)
                let role = "STUDENT"; // Mặc định

                if (decoded.role) {
                    role = decoded.role.replace("ROLE_", "");
                } else if (decoded.roles) {
                    role = Array.isArray(decoded.roles) ? decoded.roles[0].replace("ROLE_", "") : "STUDENT";
                } else if (decoded.authorities) {
                    role = decoded.authorities[0]?.replace("ROLE_", "") || "STUDENT";
                }
const currentUserId = decoded.userId || decoded.id;
                const user = {
                    id: currentUserId,
                    fullName: decoded.fullName || decoded.name || email.split('@')[0] || "Người dùng", 
                    email: decoded.sub || decoded.email || email,
                    role: role
                };

                localStorage.setItem("user", JSON.stringify(user));
                console.log("✅ User đã lưu:", user);

                // 🔥 TỰ ĐỘNG GHI LOG: Đăng nhập thường thành công
                if (currentUserId) {
                    await sendActivityLog(currentUserId, data.token, "Đăng nhập vào hệ thống PrepAce");
                }

                // Điều hướng theo role
                setTimeout(() => {
                    if (role === "ADMIN") {
                        navigate("/admin");
                    } else if (role === "TEACHER") {
                        navigate("/teacher/dashboard");
                    } else {
                        navigate("/home");
                    }
                }, 800);
            } else {
                setMessage("Đăng nhập thất bại! (Không nhận được thông tin User)");
                setMessageType("error");
            }
        } catch (error) {
            console.error("Login error:", error);
            setMessage("❌ Lỗi kết nối với server hoặc tài khoản bị khóa");
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
                    }),
                    credentials: "include" // 🔥
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

            // 🔥 TỰ ĐỘNG GHI LOG: Đăng nhập bằng tài khoản Google thành công
             const currentUserId = data.user?.id || data.user?.userId;
             if (currentUserId) {
                await sendActivityLog(currentUserId, data.token, "Đăng nhập hệ thống thông qua tài khoản Google");
             }

            // setTimeout(() => {
            //     if (data.user?.role === "TEACHER" || data.user?.roleId === 2) {
//         navigate("/teacher/dashboard");
            //     } else if (data.user?.role === "ADMIN" || data.user?.roleId === 1) {
            //         navigate("/admin/courses");
            //     } else {
            //         navigate("/home");
            //     }
            // }, 800);

            const role = data.user.roleName || data.user.role || "STUDENT";
                setTimeout(() => {
                    if (role === "ADMIN") {
                        navigate("/admin");
                    } else if (role === "TEACHER") {
                        navigate("/teacher/dashboard");
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
        <>
            <div className="auth-form-header">
                <h2>Welcome Back</h2>
                <p>Login to continue learning with PrepAce.</p>
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
        </>
    );
}

export default LoginPage;