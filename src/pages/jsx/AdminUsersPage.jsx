import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminManagePage.css";

export default function AdminUsersPage() {
    const navigate = useNavigate();

    // Mock dữ liệu Học sinh / Giáo viên
    const [users] = useState([
        { id: 1, name: "Phạm Đức Anh", email: "student1@gmail.com", role: "Học sinh", status: "ACTIVE" },
        { id: 2, name: "Nguyễn Minh Quân", email: "teacher.math@learnify.com", role: "Giáo viên", status: "ACTIVE" },
        { id: 3, name: "Trần Bảo Châu", email: "teacher.physics@learnify.com", role: "Giáo viên", status: "DEACTIVATED" },
        { id: 4, name: "Võ Minh Trí", email: "student2@gmail.com", role: "Học sinh", status: "BANNED" },
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
                    <li onClick={() => navigate("/admin/courses")}>📚 Quản lý khóa học</li>
                    <li className="active">👥 Quản lý người dùng</li>
                    <li onClick={() => navigate("/admin/ui-config")}>🎨 Cấu hình UI</li>
                </ul>
                <div className="admin-logout">
                    <button onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Quản lý người dùng</h1>
                        <p>Xem danh sách, phân quyền hoặc khóa/vô hiệu hóa tài khoản hệ thống.</p>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="manage-card">
                        <div className="manage-header">
                            <input type="text" placeholder="Tìm kiếm tên, email..." className="manage-search" />
                            <button className="primary-btn">+ Thêm người dùng</button>
                        </div>
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Họ và tên</th>
                                        <th>Email</th>
                                        <th>Vai trò</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id}>
                                            <td>#{u.id}</td>
                                            <td><strong>{u.name}</strong></td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`role-badge ${u.role === 'Giáo viên' ? 'teacher' : 'student'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${u.status === 'ACTIVE' ? 'success' : (u.status === 'BANNED' ? 'banned' : 'deactivated')}`}>
                                                    {u.status === 'ACTIVE' ? 'Hoạt động' : (u.status === 'BANNED' ? 'Đã khóa' : 'Vô hiệu hóa')}
                                                </span>
                                            </td>
                                            <td>
                                                {/* Đã thêm đủ 3 nút: Sửa, Vô hiệu hóa, Khóa */}
                                                <button className="action-btn edit">Sửa</button>
                                                <button className="action-btn disable">
                                                    {u.status === 'DEACTIVATED' ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                                                </button>
                                                <button className="action-btn delete">
                                                    {u.status === 'BANNED' ? 'Mở khóa' : 'Khóa'}
                                                </button>
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