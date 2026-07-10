import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/AdminUsersPage.css";

export default function AdminCoursesPage() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("courses");
    const [courses, setCourses] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            alert("⚠️ Bạn chưa đăng nhập quyền Admin!");
            navigate("/");
            return;
        }

        const userObj = JSON.parse(storedUser);
        if (userObj.role !== "ADMIN" && userObj.roleId !== 1) {
            alert("❌ Bạn không có quyền truy cập vào phân hệ Quản trị!");
            navigate("/home");
            return;
        }

        const fetchAllCourses = async () => {
            try {
                const response = await axiosClient.get("/admin/courses");
                console.log("📡 DỮ LIỆU THỰC TẾ TỪ BACKEND TRẢ VỀ:", response.data);
                
                if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                    setCourses(response.data);
                } else {
                    console.warn("Backend trả về mảng rỗng [] hoặc sai cấu trúc.");
                    // Nếu mảng rỗng, kích hoạt dữ liệu Mock dự phòng để test giao diện
                    setCourses([
                        { courseId: 1, courseTitle: "Mastering Mathematics 12", teacher_id: 2, price: 599000, status: "PUBLISHED" },
                        { courseId: 2, courseTitle: "Physics Problem Solving", teacher_id: 3, price: 499000, status: "PUBLISHED" },
                        { courseId: 4, courseTitle: "Tuyệt đỉnh Casio", teacher_id: 2, price: 299000, status: "PENDING" }
                    ]);
                }
            } catch (error) {
                console.error("❌ LỖI GỌI API BACKEND (Có thể do Token/URL):", error);
                
                // 🔥 NẾU API LỖI: Đổ dữ liệu Mock ra ngay lập tức để không bị trắng màn hình
                setCourses([
                    { courseId: 1, courseTitle: "Mastering Mathematics 12 (Mock)", teacher_id: 2, price: 599000, status: "PUBLISHED" },
                    { courseId: 2, courseTitle: "Physics Problem Solving (Mock)", teacher_id: 3, price: 499000, status: "PUBLISHED" },
                    { courseId: 4, courseTitle: "Tuyệt đỉnh Casio (Mock)", teacher_id: 2, price: 299000, status: "PENDING" }
                ]);
            }
        };

        fetchAllCourses();
    }, [navigate]);

    const handleApproveCourse = async (courseId) => {
        if (!courseId || !window.confirm(`Bạn có chắc chắn muốn duyệt khóa học #${courseId}?`)) return;
        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "PUBLISHED" });
            setCourses(prev => prev.map(c => (c.courseId === courseId || c.id === courseId) ? { ...c, status: "PUBLISHED" } : c));
            alert(`✅ Khóa học #${courseId} đã được duyệt và xuất bản!`);
        } catch (error) {
            alert("Lỗi kết nối hoặc không thể duyệt khóa học này.");
        }
    };

    const handleRejectCourse = async (courseId) => {
        if (!courseId) return;
        const reason = prompt("Nhập lý do yêu cầu giảng viên chỉnh sửa lại:");
        if (!reason) return; 

        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "REJECTED", note: reason });
            setCourses(prev => prev.map(c => (c.courseId === courseId || c.id === courseId) ? { ...c, status: "REJECTED" } : c));
            alert(`Đã gửi yêu cầu chỉnh sửa cho giảng viên.`);
        } catch (error) {
            alert("Lỗi kết nối hoặc không thể từ chối khóa học này.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="admin-layout">
            <aside className="admin-sidebar">
                <div className="admin-brand" onClick={() => navigate("/admin")}>
                    <h2>PrepAce <span>Admin</span></h2>
                </div>
                <ul className="admin-menu">
                    <li className={activeMenu === "dashboard" ? "active" : ""} onClick={() => navigate("/admin")}>📊 Dashboard</li>
                    <li className={activeMenu === "courses" ? "active" : ""} onClick={() => navigate("/admin/courses")}>📚 Quản lý khóa học</li>
                    <li className={activeMenu === "users" ? "active" : ""} onClick={() => navigate("/admin/users")}>👥 Quản lý người dùng</li>
                    <li className={activeMenu === "question-bank" ? "active" : ""} onClick={() => navigate("/admin/question-bank")}>📝 Quản lý thư viện đề</li>
                    <li className={activeMenu === "violations" ? "active" : ""} onClick={() => navigate("/admin/violations")}>🚨 Quản lý vi phạm</li>
                    <li className={activeMenu === "ui" ? "active" : ""} onClick={() => navigate("/admin/ui-config")}>🎨 Cấu hình UI</li>
                    <li className={activeMenu === "sepay" ? "active" : ""} onClick={() => navigate("/admin/sepay-guide")}>💳 Cấu hình SePay</li>
                </ul>
                <div className="admin-logout">
                    <button onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Quản lý khóa học</h1>
                        <p>Kiểm duyệt, xem trước giao diện và quyết định xuất bản khóa học.</p>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="manage-card">
                        <div className="manage-header">
                            <input type="text" placeholder="Tìm kiếm khóa học..." className="manage-search" />
                        </div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Tên khóa học</th>
                                        <th>Giáo viên</th>
                                        <th>Giá bán</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(courses) && courses.length > 0 ? (
                                        courses.map((c) => {
                                            if (!c) return null;
                                            const currentId = c.courseId || c.id;
                                            if (!currentId) return null;

                                            const currentTitle = c.courseTitle || c.title || "Khóa học chưa đặt tên";
                                            const currentStatus = c.status ? String(c.status).toUpperCase() : "PENDING";
                                            
                                            let formattedPrice = "0đ";
                                            if (c.price !== undefined && c.price !== null) {
                                                formattedPrice = typeof c.price === "number" 
                                                    ? c.price.toLocaleString() + "đ" 
                                                    : String(c.price) + "đ";
                                            }

                                            return (
                                                <tr key={currentId}>
                                                    <td>#{currentId}</td>
                                                    <td><strong>{currentTitle}</strong></td>
                                                    <td>{c.teacherName || c.teacher_name || `ID Giáo viên: ${c.teacherId || c.teacher_id || "Chưa rõ"}`}</td>
                                                    <td>{formattedPrice}</td>
                                                    <td>
                                                        <span className={`status-badge ${currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED' ? 'success' : (currentStatus === 'REJECTED' ? 'banned' : 'pending')}`}>
                                                            {currentStatus === 'PUBLISHED' || currentStatus === 'APPROVED' ? 'Đã xuất bản' : (currentStatus === 'REJECTED' ? 'Yêu cầu sửa' : 'Chờ duyệt')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button 
                                                            className="action-btn view" 
                                                            onClick={() => navigate(`/admin/preview/${currentId}`)}
                                                        >
                                                            👁️ Thẩm định bài giảng
                                                        </button>

                                                        {currentStatus === 'PENDING' && (
                                                            <>
                                                                <button className="action-btn approve" style={{ marginLeft: "6px" }} onClick={() => handleApproveCourse(currentId)}>✅ Duyệt</button>
                                                                <button className="action-btn reject" style={{ marginLeft: "6px" }} onClick={() => handleRejectCourse(currentId)}>❌ Yêu cầu sửa</button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
                                                Hệ thống đang tải dữ liệu...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}