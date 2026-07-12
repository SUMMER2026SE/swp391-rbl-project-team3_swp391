import React, { useState } from "react";
import "../css/RegisterPage.css";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axiosClient from "../../api/axiosClient";

export default function RegisterPage({ switchToLogin }) {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        phone: "",
    });
    const [role, setRole] = useState("STUDENT");
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [message, setMessage] = useState("");
    const [otp, setOtp] = useState("");
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [showVerifyBox, setShowVerifyBox] = useState(false);
    const [otpResendCount, setOtpResendCount] = useState(0);

    const navigate = useNavigate();

    // HANDLE INPUT
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // NORMAL REGISTER
    const handleRegister = async (e) => {
        e.preventDefault();

        if (!agreeToTerms) {
            setMessage("⚠️ Bạn phải đồng ý với Điều khoản dịch vụ để đăng ký.");
            return;
        }

        // Kiểm tra độ mạnh mật khẩu tại Client (BR-UC03-03)
        if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
            setMessage("❌ Mật khẩu tối thiểu 8 ký tự, phải bao gồm cả chữ hoa, chữ thường và chữ số.");
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            const response = await fetch(
                "http://localhost:8080/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        ...formData,
                        role,
                        agreeToTerms
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
                setMessage("❌ " + (data.message || "Đăng ký thất bại"));
                return;
            }

            setRegisteredEmail(formData.email);
            setMessage("📩 Mã xác thực OTP đã được gửi về Gmail của bạn!");
            setShowVerifyBox(true);
            setOtpResendCount(0); // Reset số lần gửi lại OTP

        } catch (error) {
            console.error(error);
            setMessage("❌ Lỗi kết nối server");
        } finally {
            setLoading(false);
        }
    };

    // Gửi lại mã OTP (BR-UC03-02)
    const handleResendOtp = async () => {
        if (otpResendCount >= 3) {
            setMessage("❌ Bạn đã vượt quá giới hạn gửi lại mã OTP (tối đa 3 lần).");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/auth/resend-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: registeredEmail })
            });
            const data = await response.json();

            if (!response.ok) {
                setMessage("❌ " + (data.message || "Gửi lại OTP thất bại"));
                return;
            }

            setOtpResendCount(prev => prev + 1);
            setMessage("✅ Đã gửi lại mã OTP mới. Vui lòng kiểm tra hòm thư.");
        } catch (err) {
            setMessage("❌ Không thể kết nối tới server.");
        }
    };

    // Xác thực OTP và tự động đăng nhập (UC-03)
    const handleVerify = async () => {
        try {
            const response = await axiosClient.post("/auth/verify-email", {
                email: registeredEmail,
                otp: otp
            });

            const data = response.data;
            setMessage("✅ Xác thực thành công! Đang tự động đăng nhập...");
            setShowVerifyBox(false);
            setOtp("");

            // Lưu user vào local storage để hiển thị UI
            if (data.user) {
                localStorage.setItem("user", JSON.stringify(data.user));
            }

            // Gợi ý làm bài kiểm tra đầu vào (UC-03 / UC-13)
            setTimeout(() => {
                const userRole = data.user?.roleName || data.user?.role || "STUDENT";
                if (userRole === "STUDENT") {
                    if (window.confirm("Chúc mừng bạn đăng ký thành công! Bạn có muốn làm bài Kiểm tra đầu vào (Entry Test) để hệ thống thiết lập lộ trình học tập cá nhân hóa luôn không?")) {
                        navigate("/entry-test");
                    } else {
                        navigate("/home");
                    }
                } else {
                    navigate("/home");
                }
            }, 1200);

        } catch (error) {
            setMessage(
                "❌ " + (error.response?.data?.message || "Xác thực thất bại !!!")
            );
        }
    };

    // GOOGLE REGISTER
    const handleGoogleRegister = async (credentialResponse) => {
        try {
            const response = await fetch(
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

            const data = await response.json();

            if (!response.ok) {
                setMessage(data.message || "Google Register Failed");
                return;
            }

            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            setMessage("✅ Google Register Success!");

            navigate("/");

            console.log(data);

        } catch (error) {
            console.error(error);
            setMessage("❌ Google Register Error");
        }

        console.log("GOOGLE RESPONSE:", credentialResponse);
        console.log("TOKEN:", credentialResponse.credential);
    };

    return (
        <div className="register-container">
            <div className="register-card">

                {/* LEFT SIDE */}
                <div className="register-left">
                    <div className="overlay-circle top"></div>
                    <div className="overlay-circle bottom"></div>

                    <div className="left-content">
                        <h1>
                            Welcome to <br />
                            PrepAce
                        </h1>

                        <p>
                            Smart learning platform powered by AI to help students
                            prepare for university entrance exams effectively.
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
                                <p>Track Your Learning Progress</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE */}
                <div className="register-right">

                    <div className="register-header">
                        <h2>Create Account</h2>
                        <p>Join PrepAce and start your learning journey.</p>
                    </div>

                    {message && (
                        <div className="message-box">
                            {message}
                        </div>
                    )}

                    {/* FORM */}
                    <form className="register-form" onSubmit={handleRegister}>

                        <div className="input-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label>Phone Number</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter your phone number"
                                required
                            />
                        </div>

                        <div className="input-group" style={{marginBottom: '15px'}}>
                            <label style={{display: 'block', marginBottom: '8px', fontWeight: '500'}}>Bạn đăng ký với tư cách</label>
                            <select 
                                value={role} 
                                onChange={(e) => setRole(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    fontSize: '15px',
                                    outline: 'none',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <option value="STUDENT">Học sinh (Chuẩn bị ôn thi)</option>
                                <option value="TEACHER">Giáo viên (Chờ phê duyệt)</option>
                            </select>
                        </div>

                        <div className="input-group checkbox-group" style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', marginBottom: '15px'}}>
                            <input
                                type="checkbox"
                                id="agreeToTerms"
                                checked={agreeToTerms}
                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                style={{cursor: 'pointer', width: '16px', height: '16px'}}
                            />
                            <label htmlFor="agreeToTerms" style={{cursor: 'pointer', fontSize: '14px', color: '#4b5563'}}>
                                Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="register-btn"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Create Account"}
                        </button>
                    </form>
                    {
                        showVerifyBox && (
                            <div className="verify-box" style={{marginTop: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px'}}>
                                <h3>Email Verification</h3>

                                <input type="text" placeholder="Enter OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)} style={{width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '6px', border: '1px solid #d1d5db'}}/>

                                <div style={{display: 'flex', gap: '10px'}}>
                                    <button onClick={handleVerify} className="verify-btn" style={{flex: 1}}>
                                        Verify Email
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={handleResendOtp} 
                                        className="resend-btn" 
                                        disabled={otpResendCount >= 3}
                                        style={{
                                            flex: 1, 
                                            backgroundColor: '#f3f4f6', 
                                            color: '#374151',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '8px',
                                            cursor: otpResendCount >= 3 ? 'not-allowed' : 'pointer',
                                            fontSize: '14px'
                                        }}
                                    >
                                        Gửi lại OTP ({3 - otpResendCount} lần)
                                    </button>
                                </div>
                            </div>
                        )
                    }

                    {/* DIVIDER */}
                    <div className="divider">
                        <div className="line"></div>
                        <p>OR CONTINUE WITH</p>
                        <div className="line"></div>
                    </div>

                    {/* GOOGLE REGISTER */}
                    <div className="google-login-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleRegister}
                            onError={() => {
                                setMessage("❌ Google Register Failed");
                            }}
                        />
                    </div>

                    {/* LOGIN LINK */}
                    <div className="login-link">
                        <p>
                            Already have an account?
                            <span onClick={switchToLogin}>
                                Login
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}