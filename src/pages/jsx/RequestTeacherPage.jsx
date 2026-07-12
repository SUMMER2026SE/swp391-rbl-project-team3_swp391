import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function RequestTeacherPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // Quản lý các ô nhập liệu mới cho học sinh
    const [education, setEducation] = useState("");
    const [experience, setExperience] = useState("");

    // 🔥 ĐÃ SỬA: Dọn dẹp lồng hàm trùng lặp, đưa về 1 cấu trúc duy nhất
    const handleSendRequest = async (e) => {
        e.preventDefault(); // Chặn hành vi tải lại trang mặc định của thẻ form

        if (!education.trim()) {
            alert("⚠️ Vui lòng điền thông tin học vấn và bằng cấp của bạn!");
            return;
        }
        if (!experience.trim()) {
            alert("⚠️ Vui lòng điền kinh nghiệm giảng dạy hoặc làm việc của bạn!");
            return;
        }

        setSubmitting(true);
        try {
            const storedUser = localStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            const userId = userObj?.userId || userObj?.id || 0;

            // 1. Gửi đơn đăng ký kèm học vấn, kinh nghiệm
            await axiosClient.post(`/admin/users/${userId}/request-teacher`, {
                education: education,
                experience: experience
            });

            // 2. GỬI LOG THỰC TẾ XUỐNG DB: Ghi nhận hành động nộp đơn
            try {
                await axiosClient.post(`/admin/users/${userId}/activity`, {
                    action: "Đã nộp hồ sơ đăng ký làm Giáo viên đồng hành cùng hệ thống"
                });
            } catch (logErr) {
                console.error("Lỗi ghi log tự động:", logErr);
            }

            alert("🎉 Đã gửi đơn ứng tuyển giảng viên cùng hồ sơ năng lực thành công!");
            navigate("/home");
        } catch (error) {
            console.error("Lỗi gửi hồ sơ ứng tuyển giáo viên:", error);
            alert("❌ Gửi yêu cầu thất bại hoặc bạn đã gửi đơn trước đó.");
        } finally {
            setSubmitting(false); // 🔥 Nhả kẹt nút bấm dù thành công hay thất bại
        }
    };

    return (
        // Vùng bao phủ toàn màn hình, căn giữa chiếc Card biểu mẫu
        <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>

            <div style={{ padding: "40px", maxWidth: "650px", width: "100%", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                <h2 style={{ fontSize: "24px", marginBottom: "10px", color: "#1f2937", fontWeight: "bold", textAlign: "center" }}>
                    👨‍🏫 Hồ Sơ Đăng Ký Giáo Viên Đồng Hành
                </h2>
                <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: "25px", fontSize: "14px", textAlign: "center" }}>
                    Cung cấp thông tin năng lực giúp Ban quản trị PrepAce có cơ sở đánh giá hồ sơ và kích hoạt quyền giảng dạy nhanh chóng hơn.
                </p>

                {/* BIẾN THÀNH THẺ FORM ĐỂ QUẢN LÝ SUBMIT VÀ NÚT BẤM */}
                <form onSubmit={handleSendRequest} style={{ textAlign: "left" }}>

                    {/* PHẦN 1: HỌC VẤN */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#374151", fontSize: "14px" }}>
                            🎓 Trình độ học vấn & Bằng cấp chuyên môn:
                        </label>
                        <textarea
                            rows="3"
                            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontFamily: "inherit", resize: "none" }}
                            placeholder="Ví dụ: Cử nhân Sư phạm Toán - Đại học Sư Phạm Hà Nội, Chứng chỉ IELTS 7.5..."
                            value={education}
                            onChange={(e) => setEducation(e.target.value)}
                        />
                    </div>

                    {/* PHẦN 2: KINH NGHIỆM */}
                    <div style={{ marginBottom: "25px" }}>
                        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#374151", fontSize: "14px" }}>
                            💼 Kinh nghiệm làm việc & Giảng dạy:
                        </label>
                        <textarea
                            rows="4"
                            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontFamily: "inherit", resize: "none" }}
                            placeholder="Ví dụ: 2 năm gia sư luyện thi Đại học lớp 12, từng biên soạn đề kiểm tra tư duy tại trung tâm..."
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                        />
                    </div>

                    {/* CỤM NÚT ĐIỀU HƯỚNG */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <button
                            type="button"
                            style={{ backgroundColor: "#9ca3af", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                            onClick={() => navigate(-1)} // Quay lại trang trước đó
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                            disabled={submitting}
                        >
                            {submitting ? "Đang gửi hồ sơ..." : "🚀 Nộp hồ sơ ứng tuyển"}
                        </button>
                    </div>
                </form>
            </div>

        </div>
    );
}