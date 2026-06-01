import { useState } from "react";
import "../css/ForgotPasswordPage.css";
import axiosClient from "../../api/axiosClient";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        if (!email) {
            setError("Nhập Email Vào Đây");
            return;
        }

        try {
            setLoading(true);

            await axiosClient.post("/auth/forgot-password", {
                email,
            });

            setMessage("📩 Check email để sắp đặt lại mật khẩu nhé!");
            setEmail("");
        } catch (err) {
            setError(
                err.response?.data?.message || "Something went wrong. Try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="forgot-container">
            <div className="forgot-card">
                <h2>Forgot Password</h2>
                <p>Nhập Email Để Nhận Link Reset Password</p>

                {message && <div className="success-msg">{message}</div>}
                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <button disabled={loading}>
                        {loading ? "Sending..." : "Send Reset Link"}
                    </button>
                </form>
            </div>
        </div>
    );
}