import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
// Import file CSS Sidebar/Layout của bạn để giữ nguyên giao diện khung của hệ thống
import "../css/AdminUsersPage.css"; 

export default function ReportViolationPage() {
    const navigate = useNavigate();
    const [target, setTarget] = useState("");
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmitReport = async (e) => {
        e.preventDefault(); // Chặn reload trang mặc định

        if (!target.trim() || !reason.trim()) {
            alert("Vui lòng nhập đầy đủ thông tin vị trí và mô tả hành vi vi phạm!");
            return;
        }

        setLoading(true);
        try {
            const storedUser = localStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            const reporterId = userObj?.userId || userObj?.id || 0;

            // Gửi dữ liệu thật lên API Backend
            await axiosClient.post("/admin/violations/submit", {
                reporterId: reporterId,
                reportedTarget: target,
                reason: reason
            });

            alert("✅ Đơn tố cáo của bạn đã được gửi thành công tới Ban quản trị PrepAce!");
            navigate("/home"); // Gửi xong điều hướng người dùng về trang chủ
        } catch (error) {
            console.error("Lỗi gửi đơn tố cáo:", error);
            alert("❌ Không thể gửi đơn báo cáo, vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-layout"> {/* Tái sử dụng class layout để có sidebar bên trái (nếu dùng layout chung) */}
            <main className="admin-main" style={{ padding: "30px", maxWidth: "800px", margin: "0 auto" }}>
                <header className="admin-header" style={{ marginBottom: "24px" }}>
                    <div className="header-title">
                        <h1>🚨 Trung tâm Phản hồi & Báo cáo Vi phạm</h1>
                        <p>PrepAce cam kết xây dựng môi trường học tập lành mạnh. Hãy chia sẻ với chúng tôi nếu bạn phát hiện nội dung độc hại hoặc vi phạm bản quyền.</p>
                    </div>
                </header>

                <div className="manage-card" style={{ padding: "24px", backgroundColor: "#fff", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                    <form onSubmit={handleSubmitReport}>
                        <div style={{ marginBottom: "18px" }}>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>
                                Mục tiêu / Vị trí nội dung vi phạm:
                            </label>
                            <input 
                                type="text"
                                className="manage-search"
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                placeholder="Ví dụ: Khóa học Toán 12 (chương 2), Bình luận của User bêu xấu người khác..."
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                            />
                        </div>

                        <div style={{ marginBottom: "20px" }}>
                            <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#374151" }}>
                                Mô tả chi tiết bằng chứng & lý do tố cáo:
                            </label>
                            <textarea 
                                rows="6"
                                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontFamily: "inherit", resize: "vertical" }}
                                placeholder="Vui lòng cung cấp thông tin chi tiết hành vi (ngôn từ xúc phạm, tài liệu vi phạm bản quyền, lỗi link hỏng không học được...)"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                            <button 
                                type="button" 
                                style={{ backgroundColor: "#9ca3af", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                onClick={() => navigate(-1)} // Bấm hủy quay lại trang trước đó
                            >
                                Quay lại
                            </button>
                            <button 
                                type="submit" 
                                style={{ backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "10px 20px", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                disabled={loading}
                            >
                                {loading ? "Đang gửi đơn..." : "Gửi đơn tố cáo"}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}