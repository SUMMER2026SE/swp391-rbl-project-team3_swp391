import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import axiosClient from "../../api/axiosClient";
import { login, register, resendOtp } from "../../services/authService";

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

    const handleResendOtp = async () => {
        try {
            await resendOtp(formData.email);

            alert("Đã gửi lại mã OTP.");
        } catch (err) {
            alert(err.response?.data?.message || "Không gửi được OTP.");
        }
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

    // 🔥 XÁC THỰC EMAIL THÀNH CÔNG VÀ LƯU LOG QUA AXIOS
    const handleVerify = async() => {
        try{
            const response = await axiosClient.post("/auth/verify-email", {
                email: registeredEmail,
                otp: otp
            });

            const data = response.data;
            setMessage("✅ Xác thực thành công! Đang tự động đăng nhập...");
            setShowVerifyBox(false);
            setOtp("");

            // Ghi nhận log sau khi kích hoạt tài khoản thành công qua OTP
            try {
                // Do mới verify xong chưa đăng nhập, ta có thể kéo ID từ data response của API verify nếu có
                const userId = response.data?.user?.id || response.data?.userId || 0;
                if (userId > 0) {
                    await axiosClient.post(`/admin/users/${userId}/activity`, {
                        action: "Đăng ký tài khoản thành viên mới thành công thông qua kích hoạt OTP Email"
                    });
                }
            } catch (logErr) {
                console.log("Bỏ qua log nếu API verify không trả kèm thông tin đối tượng user.");
            }

            switchToLogin();
        }catch (error){
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

            // 🔥 TỰ ĐỘNG GHI LOG: Đăng ký nhanh qua Google thành công
            const currentUserId = data.user?.id || data.user?.userId;
            if (currentUserId) {
                try {
                    await fetch(`http://localhost:8080/api/admin/users/${currentUserId}/activity`, {
                        method: "POST",
                        headers: { 
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${data.token}`
                        },
                        body: JSON.stringify({ action: "Đăng ký tài khoản thành viên mới bằng liên kết Google" })
                    });
                } catch(e) { console.error(e); }
            }

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
        <>
            <div className="auth-form-header">
                <h2>Create Account</h2>
                <p>Join PrepAce and start your learning journey.</p>
            </div>

            {message && (
                <div className={`auth-message ${message.includes("✅") ? "success" : "error"}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleRegister}>
                <div className="auth-form-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="fullName"
                        className="auth-form-input"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                    />
                </div>

                <div className="auth-form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        className="auth-form-input"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                    />
                </div>

                <div className="auth-form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        className="auth-form-input"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                    />
                </div>

                <div className="auth-form-group">
                    <label>Phone Number</label>
                    <input
                        type="text"
                        name="phone"
                        className="auth-form-input"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter your phone number"
                        required
                    />
                </div>

                <div className="auth-form-group">
                    <label>Register as</label>
                    <select 
                        value={role} 
                        onChange={(e) => setRole(e.target.value)}
                        className="auth-form-input"
                    >
                        <option value="STUDENT">Student (Prepare for exams)</option>
                        <option value="TEACHER">Teacher (Pending approval)</option>
                    </select>
                </div>

                <div className="auth-form-options" style={{marginBottom: "15px"}}>
                    <label className="auth-checkbox-label" htmlFor="agreeToTerms">
                        <input
                            type="checkbox"
                            id="agreeToTerms"
                            checked={agreeToTerms}
                            onChange={(e) => setAgreeToTerms(e.target.checked)}
                        />
                        I agree to the Terms of Service and Privacy Policy.
                    </label>
                </div>

                <button type="submit" className="auth-submit-btn" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                </button>
            </form>
            
            {showVerifyBox && (
                <div style={{marginTop: '20px', padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc'}}>
                    <h3 style={{fontSize: '1.1rem', marginBottom: '10px', color: '#1e293b'}}>Email Verification</h3>
                    <input 
                        type="text" 
                        placeholder="Enter OTP Code" 
                        className="auth-form-input"
                        value={otp} 
                        onChange={(e) => setOtp(e.target.value)} 
                        style={{marginBottom: '10px'}}
                    />
                    <div style={{display: 'flex', gap: '10px'}}>
                        <button onClick={handleVerify} className="auth-submit-btn" style={{padding: '10px', flex: 1}}>
                            Verify Email
                        </button>
                        <button 
                            type="button" 
                            onClick={handleResendOtp} 
                            disabled={otpResendCount >= 3}
                            style={{
                                flex: 1, 
                                backgroundColor: '#e2e8f0', 
                                color: '#334155',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: otpResendCount >= 3 ? 'not-allowed' : 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            Resend OTP ({3 - otpResendCount})
                        </button>
                    </div>
                </div>
            )}

            <div className="auth-divider">
                <span>OR CONTINUE WITH</span>
            </div>

            <div className="auth-google-btn-wrapper">
                <GoogleLogin
                    onSuccess={handleGoogleRegister}
                    onError={() => {
                        setMessage("❌ Google Register Failed");
                    }}
                    theme="filled_blue"
                    shape="pill"
                />
            </div>

            <div className="auth-switch-text">
                Already have an account?
                <span onClick={switchToLogin} className="auth-switch-link">
                    Login
                </span>
            </div>
        </>
    );
}