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
    const [message, setMessage] = useState("");
    const [otp, setOtp] = useState("");
    const [registeredEmail, setRegisteredEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [showVerifyBox, setShowVerifyBox] = useState(false);

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

        try {
            setLoading(true);

            const response = await fetch(
                "http://localhost:8080/api/auth/register",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(formData)
                }
            );

            let data = {};
            try {
                data = await response.json();
            } catch {
                data = {};
            }

            if (!response.ok) {
                setMessage(data.message || "Register Failed");
                return;
            }

            setRegisteredEmail(formData.email);

            setMessage("Verification Mail Has Send To Your Gmail");

            setShowVerifyBox(true);

            setFormData({
                fullName: "",
                email: "",
                password: "",
                phone: ""
            });

        } catch (error) {
            console.error(error);
            setMessage("❌ Server Error");
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async() => {
        try{
            const response = await axiosClient.post("/auth/verify-email", {
                email: registeredEmail,
                otp: otp
            })

            setMessage("Email Verified Successfully !!!");
            setShowVerifyBox(false);
            setOtp("");
            switchToLogin();
        }catch (error){
            setMessage(
                error.response?.data?.message || "Verify Failed !!!"
            )
        }
    }

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
                            <div className="verify-box">
                                <h3>Email Verification</h3>

                                <input type="text" placeholder="Enter OTP Code" value={otp} onChange={(e) => setOtp(e.target.value)}/>

                                <button onClick={handleVerify} className="verify-btn">
                                    Verify Email
                                </button>
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