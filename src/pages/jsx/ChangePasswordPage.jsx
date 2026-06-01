import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/ChangePasswordPage.css";

export default function ChangePasswordPage() {
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);

            await axiosClient.put("/auth/change-password", {
                oldPassword,
                newPassword,
            });

            setMessage("Password changed successfully!");
            setIsSuccess(true);

            setOldPassword("");
            setNewPassword("");
        } catch (error) {
            setMessage(
                error.response?.data?.message ||
                    "Password change failed!"
            );
            setIsSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-page">
            <div className="change-password-card">
                <h2>Change Password</h2>

                <p className="subtitle">
                    Đổi Mật Khẩu Ở Đây.
                </p>

                {message && (
                    <div
                        className={
                            isSuccess
                                ? "message success"
                                : "message error"
                        }
                    >
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Password Hiện Tại</label>

                        <input
                            type="password"
                            placeholder="Enter current password"
                            value={oldPassword}
                            onChange={(e) =>
                                setOldPassword(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password Mới</label>

                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            required
                        />
                    </div>

                    <div className="password-actions">
                        <button
                            type="button"
                            className="back-btn"
                            onClick={() => navigate("/profile")}
                        >
                            Back
                        </button>

                        <button
                            type="submit"
                            className="update-btn"
                            disabled={loading}
                        >
                            {loading
                                ? "Updating..."
                                : "Update Password"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}