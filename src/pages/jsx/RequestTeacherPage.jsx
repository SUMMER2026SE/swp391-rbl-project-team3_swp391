import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";

export default function RequestTeacherPage() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);

    // 🟢 ĐÃ CẤU HÌNH CHÍNH XÁC CLOUDINARY CỦA BẠN
    const CLOUD_NAME = "xgt0tsc3";
    const UPLOAD_PRESET = "prepace_proofs";

    // Form State
    const [education, setEducation] = useState("");
    const [experience, setExperience] = useState("");
    const [proofFile, setProofFile] = useState(null);
    const [uploadProgress, setUploadProgress] = useState("");

    // Hàm Upload File lên Cloudinary
    const uploadFileToCloudinary = async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", UPLOAD_PRESET);

        setUploadProgress("⏳ Đang tải file minh chứng lên Cloudinary...");

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`,
            {
                method: "POST",
                body: formData
            }
        );

        if (!response.ok) {
            throw new Error("Lỗi khi tải file lên Cloudinary");
        }

        const data = await response.json();
        return data.secure_url; // Trả về URL đường dẫn an toàn
    };

    const handleSendRequest = async (e) => {
        e.preventDefault();

        if (!education.trim()) {
            alert("⚠️ Vui lòng điền thông tin học vấn và bằng cấp của bạn!");
            return;
        }
        if (!experience.trim()) {
            alert("⚠️ Vui lòng điền kinh nghiệm giảng dạy hoặc làm việc!");
            return;
        }

        setSubmitting(true);
        try {
            const storedUser = localStorage.getItem("user");
            const userObj = storedUser ? JSON.parse(storedUser) : null;
            const userId = userObj?.userId || userObj?.id || 0;

            let uploadedProofUrl = "";

            // 1. Tải file lên Cloudinary nếu người dùng chọn file
            if (proofFile) {
                uploadedProofUrl = await uploadFileToCloudinary(proofFile);
                console.log("✅ File đã upload thành công lên Cloudinary:", uploadedProofUrl);
            }

            // 2. Gửi thông tin hồ sơ kèm URL file về Backend
            await axiosClient.post(`/admin/users/${userId}/request-teacher`, {
                education: education,
                experience: experience,
                proofUrl: uploadedProofUrl
            });

            // 3. Ghi log hoạt động hệ thống
            try {
                await axiosClient.post(`/admin/users/${userId}/activity`, {
                    action: "Đã nộp hồ sơ đăng ký làm Giáo viên kèm file minh chứng năng lực"
                });
            } catch (logErr) {
                console.error("Lỗi ghi log:", logErr);
            }

            alert("🎉 Đã gửi đơn ứng tuyển giảng viên cùng hồ sơ năng lực thành công!");
            navigate("/home");
        } catch (error) {
            console.error("Lỗi gửi hồ sơ ứng tuyển:", error);
            alert("❌ Nộp hồ sơ thất bại: " + (error.message || "Vui lòng thử lại"));
        } finally {
            setSubmitting(false);
            setUploadProgress("");
        }
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#f3f4f6", display: "flex", justifyContent: "center", alignItems: "center", padding: "20px" }}>
            <div style={{ padding: "40px", maxWidth: "650px", width: "100%", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                
                <h2 style={{ fontSize: "24px", marginBottom: "10px", color: "#1f2937", fontWeight: "bold", textAlign: "center" }}>
                    👨‍🏫 Hồ Sơ Đăng Ký Giáo Viên Đồng Hành
                </h2>
                <p style={{ color: "#6b7280", lineHeight: "1.6", marginBottom: "25px", fontSize: "14px", textAlign: "center" }}>
                    Cung cấp thông tin năng lực và bằng cấp giúp Ban quản trị PrepAce xét duyệt quyền giảng dạy.
                </p>

                <form onSubmit={handleSendRequest} style={{ textAlign: "left" }}>

                    {/* PHẦN 1: HỌC VẤN */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#374151", fontSize: "14px" }}>
                            🎓 Trình độ học vấn & Bằng cấp chuyên môn:
                        </label>
                        <textarea
                            rows="3"
                            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontFamily: "inherit", resize: "none" }}
                            placeholder="Ví dụ: Cử nhân Sư phạm Toán - Đại học Sư Phạm Hà Nội..."
                            value={education}
                            onChange={(e) => setEducation(e.target.value)}
                            required
                        />
                    </div>

                    {/* PHẦN 2: KINH NGHIỆM */}
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#374151", fontSize: "14px" }}>
                            💼 Kinh nghiệm làm việc & Giảng dạy:
                        </label>
                        <textarea
                            rows="3"
                            style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", fontFamily: "inherit", resize: "none" }}
                            placeholder="Ví dụ: 2 năm gia sư luyện thi Đại học..."
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            required
                        />
                    </div>

                    {/* PHẦN 3: ĐÍNH KÈM TẬP TIN MINH CHỨNG */}
                    <div style={{ marginBottom: "25px", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "8px", border: "1px dashed #cbd5e1" }}>
                        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#1e293b", fontSize: "14px" }}>
                            📎 Đính kèm Minh chứng (Bằng cấp / CV / Chứng chỉ):
                        </label>
                        <input
                            type="file"
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={(e) => setProofFile(e.target.files[0])}
                            style={{ marginTop: "6px", fontSize: "14px" }}
                        />
                        <small style={{ display: "block", color: "#64748b", marginTop: "6px" }}>
                            Chấp nhận ảnh (.jpg, .png) hoặc file tài liệu (.pdf, .doc, .docx)
                        </small>
                    </div>

                    {uploadProgress && (
                        <div style={{ color: "#2563eb", fontWeight: "600", marginBottom: "15px", fontSize: "14px" }}>
                            {uploadProgress}
                        </div>
                    )}

                    {/* CỤM NÚT ĐIỀU HƯỚNG */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                        <button
                            type="button"
                            style={{ backgroundColor: "#9ca3af", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                            onClick={() => navigate(-1)}
                        >
                            Quay lại
                        </button>
                        <button
                            type="submit"
                            style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
                            disabled={submitting}
                        >
                            {submitting ? "Đang xử lý..." : "🚀 Nộp hồ sơ ứng tuyển"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}