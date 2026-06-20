import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { jwtDecode } from "jwt-decode";
import "../css/AdminLoginPage.css";

export default function AdminLoginPage() {
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {

        e.preventDefault();

        try {

            setLoading(true);

            const response = await axiosClient.post("/auth/login", {
                email,
                password
            });

            const token = response.data.token;

            const decoded = jwtDecode(token);
            console.log(decoded);

            // Kiểm tra role lấy từ JWT
            if (decoded.role !== "ROLE_ADMIN") {
                alert("❌ Bạn không có quyền truy cập Admin!");
                return;
            }

            localStorage.setItem("token", token);
            localStorage.setItem(
                "user",
                JSON.stringify({
                    id: decoded.userId,
                    fullName: decoded.fullName,
                    email: decoded.sub,
                    role: decoded.role.replace("ROLE_", "")
                })
            );

            alert("✅ Đăng nhập Admin thành công!");

            navigate("/admin");

        } catch (error) {

            console.error(error);

            alert("Sai email hoặc mật khẩu!");

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="admin-login-container">

            <div className="admin-login-card">

                <h1>PrepAce Admin</h1>

                <form onSubmit={handleLogin}>

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="admin@gmail.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                        />
                    </div>

                    <button
                        className="login-btn"
                        type="submit"
                    >
                        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </button>

                </form>

            </div>

        </div>
    );
}