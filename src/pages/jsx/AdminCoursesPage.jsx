import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/AdminManagePage.css";

export default function AdminCoursesPage() {
    const navigate = useNavigate();

    // 1. KHỞI TẠO STATE: Giữ nguyên dữ liệu mẫu để demo
    const [courses, setCourses] = useState([
        { id: 1, title: "Mastering Mathematics 12", teacher: "Nguyễn Minh Quân", price: "599,000đ", status: "PUBLISHED" },
        { id: 2, title: "Physics Problem Solving", teacher: "Trần Bảo Châu", price: "499,000đ", status: "PUBLISHED" },
        { id: 4, title: "Tuyệt đỉnh Casio", teacher: "Nguyễn Minh Quân", price: "299,000đ", status: "PENDING" }, 
    ]);

    // 2. GỌI API TRONG USEEFFECT
    useEffect(() => {
        const fetchAllCourses = async () => {
            try {
                const response = await axiosClient.get("/admin/courses");
                if (response.data && response.data.length > 0) {
                    setCourses(response.data);
                }
            } catch (error) {
                console.warn("Hệ thống chưa kết nối Backend. Sử dụng tiếp dữ liệu Mock:", error);
            }
        };
        fetchAllCourses();
    }, []);

    // HÀM XỬ LÝ DUYỆT
    const handleApproveCourse = async (courseId) => {
        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "PUBLISHED" });
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: "PUBLISHED" } : c));
            alert(`Khóa học #${courseId} đã được duyệt và xuất bản!`);
        } catch (error) {
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: "PUBLISHED" } : c));
            alert(`[Demo Mode] Đã duyệt khóa học #${courseId}!`);
        }
    };

    // HÀM XỬ LÝ TỪ CHỐI
    const handleRejectCourse = async (courseId) => {
        const reason = prompt("Nhập lý do yêu cầu giảng viên chỉnh sửa lại:");
        if (!reason) return; 

        try {
            await axiosClient.patch(`/admin/courses/${courseId}/status`, { status: "REJECTED", note: reason });
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: "REJECTED" } : c));
            alert(`Đã gửi yêu cầu chỉnh sửa cho giảng viên.`);
        } catch (error) {
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, status: "REJECTED" } : c));
            alert(`[Demo Mode] Đã gửi yêu cầu sửa khóa #${courseId}. Lý do: ${reason}`);
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
                    <li onClick={() => navigate("/admin")}>📊 Dashboard</li>
                    <li className="active">📚 Quản lý khóa học</li>
                    <li onClick={() => navigate("/admin/users")}>👥 Quản lý người dùng</li>
                    <li onClick={() => navigate("/admin/ui-config")}>🎨 Cấu hình UI</li>
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
                                    {courses.map((c) => (
                                        <tr key={c.id}>
                                            <td>#{c.id}</td>
                                            <td><strong>{c.title}</strong></td>
                                            <td>{c.teacher}</td>
                                            <td>{c.price}</td>
                                            <td>
                                                <span className={`status-badge ${c.status === 'PUBLISHED' ? 'success' : (c.status === 'REJECTED' ? 'banned' : 'pending')}`}>
                                                    {c.status === 'PUBLISHED' ? 'Đã xuất bản' : (c.status === 'REJECTED' ? 'Yêu cầu sửa' : 'Chờ duyệt')}
                                                </span>
                                            </td>
                                            <td>
                                                {/* NÚT XEM TRƯỚC: Mở thẳng sang trang chi tiết khóa học ở một Tab mới */}
                                                <button 
                                                    className="action-btn view" 
                                                    onClick={() => window.open(`/course/${c.id}`, '_blank')}
                                                >
                                                    👁️ Xem giao diện
                                                </button>

                                                {c.status === 'PENDING' && (
                                                    <>
                                                        <button className="action-btn approve" onClick={() => handleApproveCourse(c.id)}>✅ Duyệt</button>
                                                        <button className="action-btn reject" onClick={() => handleRejectCourse(c.id)}>❌ Yêu cầu sửa</button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}