import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminManagePage.css"; 

export default function AdminCoursesPage() {
    const navigate = useNavigate();

    // Mock dữ liệu Khóa học (Thêm trạng thái PENDING - Chờ duyệt)
    const [courses] = useState([
        { id: 1, title: "Mastering Mathematics 12", teacher: "Nguyễn Minh Quân", price: "599,000đ", status: "PUBLISHED" },
        { id: 2, title: "Physics Problem Solving", teacher: "Trần Bảo Châu", price: "499,000đ", status: "PUBLISHED" },
        { id: 4, title: "Tuyệt đỉnh Casio", teacher: "Nguyễn Minh Quân", price: "299,000đ", status: "PENDING" }, // Đang chờ duyệt
    ]);

    const handleLogout = () => {
        localStorage.removeItem("token");
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
                        <p>Kiểm duyệt, xem trước và quyết định xuất bản khóa học.</p>
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
                                                <span className={`status-badge ${c.status === 'PUBLISHED' ? 'success' : 'pending'}`}>
                                                    {c.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Chờ duyệt'}
                                                </span>
                                            </td>
                                            <td>
    <button 
        className="action-btn view" 
        onClick={() => navigate(`/teacher/preview/${c.id}`)}
    >
        👁️ Xem trước
    </button>

    {c.status === 'PENDING' && (
        <>
            <button className="action-btn approve" onClick={() => alert("Đã duyệt khóa học!")}>
                ✅ Duyệt
            </button>
            <button 
                className="action-btn reject" 
                onClick={() => {
                    const reason = prompt("Nhập lý do yêu cầu chỉnh sửa:");
                    if (reason) alert(`Đã gửi thông báo cho Teacher: "${reason}"`);
                }}
            >
                ❌ Yêu cầu sửa
            </button>
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