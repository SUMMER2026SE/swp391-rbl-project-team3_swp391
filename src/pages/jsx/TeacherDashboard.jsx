import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css"; // Dùng chung file CSS layout/sidebar của nhóm cho đồng bộ

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [myCourses, setMyCourses] = useState([]);
    const [user, setUser] = useState(null);

    useEffect(() => {
    // =========================================================
    // 🛠️ ĐOẠN CHECK BẢO MẬT: CHƯA ĐĂNG NHẬP LÀ ĐÁ VĂNG RA NGOÀI
    // =========================================================
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    // Nếu không tìm thấy Token hoặc thông tin User trong máy -> Chưa đăng nhập
    if (!token || !storedUser) {
        alert("⚠️ Bạn chưa đăng nhập! Vui lòng đăng nhập để vào hệ thống.");
        navigate("/"); // Đá người dùng về lại trang Login ngay lập tức
        return; // Dừng không cho chạy code bên dưới
    }

    // Nếu đã đăng nhập, kiểm tra xem có phải Giáo viên không
    const userObj = JSON.parse(storedUser);
    if (userObj.role !== "TEACHER") {
        alert("❌ Bạn không có quyền truy cập vào khu vực của Giáo viên!");
        navigate("/home"); // Nếu là Học sinh táy máy gõ link, đá họ về trang chủ Học sinh
        return;
    }

    // =========================================================
    // NẾU HỢP LỆ THÌ MỚI ĐỔ DATA VÀO ĐỂ HIỂN THỊ
    // =========================================================
    setUser(userObj);
    setMyCourses([
        { id: 4, title: "Tuyệt đỉnh Casio - Giải nhanh Toán", status: "DRAFT", students: 0 },
        { id: 1, title: "Mastering Mathematics 12", status: "PUBLISHED", students: 1250 }
    ]);
}, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="home-layout">
            
            {/* 1. SIDEBAR CHUẨN CỦA NHÓM (BÊ TỪ MAIN SANG) */}
            <aside className="sidebar">
                <div className="logo" onClick={() => navigate("/home")} style={{cursor: 'pointer'}}>PrepAce</div>

                <ul className="menu">
                    {/* Giáo viên có thể bấm để quay lại xem trang chủ học sinh nếu muốn */}
                    <li className="active" style={{ background: "#eef3ff", color: "#2747d9", fontWeight: "600" }}>
                        👨‍🏫 Quản lý khóa học
                    </li>
                    
                </ul>

                <div className="sidebar-actions">
                    <button className="profile-btn" onClick={() => navigate("/profile")}>
                        👤 {user?.fullName || "Giáo viên"}
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* 2. PHẦN NỘI DUNG CHÍNH (GIỮ NGUYÊN GIAO DIỆN CŨ CỦA BẠN NHƯNG CHO VÀO KHUNG CÓ SẴN) */}
            <main className="content" style={{ maxWidth: "100%", margin: "0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                    <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                        📚 Quản lý khóa học của tôi
                    </h2>
                    
                    <button 
                        className="register-btn" // Ăn theo hiệu ứng hover đổ bóng xịn của main
                        style={{ padding: "12px 20px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700" }}
                        onClick={() => navigate("/teacher/course/new/edit")}
                    >
                        + Tạo khóa học mới
                    </button>
                </div>

                {/* DANH SÁCH KHÓA HỌC */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {myCourses.map(course => (
                        <div key={course.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", background: "#fff", borderRadius: "18px", boxShadow: "0 6px 20px rgba(20, 40, 120, 0.04)", border: "1px solid #f0f4ff" }}>
                            <div>
                                <h3 style={{ margin: "0 0 10px 0", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                                    {course.title}
                                </h3>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <span style={{ padding: "5px 10px", background: course.status === "PUBLISHED" ? "#e2fbe8" : "#fff3cd", color: course.status === "PUBLISHED" ? "#1e8a3b" : "#b45309", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}>
                                        {course.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                                    </span>
                                    <span style={{ fontSize: "13.5px", color: "#64748b" }}>👥 {course.students} học viên</span>
                                </div>
                            </div>
                            
                            <div>
                                <button 
                                    style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#334155", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s" }}
                                    onClick={() => navigate(`/teacher/course/${course.id}/edit`)}
                                    onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                                    onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
                                >
                                    ✏️ Biên soạn (Edit)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

        </div>
    );
}