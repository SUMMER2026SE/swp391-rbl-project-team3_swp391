import React, { useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function UserReportModal({ reportedTarget, onClose }) {
    const [reason, setReason] = useState("");

    const handleSubmitReport = async () => {
        if (!reason.trim()) {
            alert("Vui lòng nhập mô tả chi tiết lý do tố cáo!");
            return;
        }

        try {
            const storedUser = localStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            const reporterId = userObj?.userId || userObj?.id || 0;

            await axiosClient.post("/admin/violations/submit", {
                reporterId: reporterId,
                reportedTarget: reportedTarget, // Ví dụ: "Khóa học Tuyệt đỉnh Casio"
                reason: reason
            });

            alert("✅ Đơn tố cáo của bạn đã được gửi tới Ban quản trị hệ thống PrepAce!");
            onClose();
        } catch (error) {
            alert("❌ Không thể gửi đơn báo cáo, vui lòng thử lại sau.");
        }
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "#fff", padding: "24px", borderRadius: "8px", width: "450px" }}>
                <h3>🚨 Báo cáo nội dung vi phạm</h3>
                <p>Đối tượng bị tố cáo: <strong>{reportedTarget}</strong></p>
                
                <textarea 
                    placeholder="Mô tả chi tiết hành vi vi phạm (bản quyền, ngôn từ độc hại...)" 
                    rows="4" 
                    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc", marginTop: "10px" }}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                />

                <div style={{ display: "flex", justifyContent: "end", marginTop: "16px" }}>
                    <button style={{ backgroundColor: "#6b7280", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer", marginRight: "8px" }} onClick={onClose}>Hủy</button>
                    <button style={{ backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "4px", cursor: "pointer" }} onClick={handleSubmitReport}>Gửi đơn báo cáo</button>
                </div>
            </div>
        </div>
    );
}