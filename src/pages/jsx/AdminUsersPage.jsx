import React, { useState, useEffect } from "react"; // 1. Thêm useEffect
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; // 2. Import axiosClient của bạn
import "../css/AdminUsersPage.css";

export default function AdminUsersPage() {
    const navigate = useNavigate();

    // 1. KHỞI TẠO STATE: Giữ nguyên dữ liệu mẫu ban đầu để phục vụ việc demo giao diện không bị trắng
    const [users, setUsers] = useState([
        { id: 1, name: "Phạm Đức Anh", email: "student1@gmail.com", role: "Học sinh", status: "ACTIVE" },
        { id: 2, name: "Nguyễn Minh Quân", email: "teacher.math@learnify.com", role: "Giáo viên", status: "ACTIVE" },
        { id: 3, name: "Trần Bảo Châu", email: "teacher.physics@learnify.com", role: "Giáo viên", status: "DEACTIVATED" },
        { id: 4, name: "Võ Minh Trí", email: "student2@gmail.com", role: "Học sinh", status: "BANNED" },
    ]);

    // 2. GỌI API TRONG USEEFFECT: Tự động chạy để kéo danh sách thành viên thật về khi load trang
    useEffect(() => {
        // 1. KIỂM TRA QUYỀN ADMIN TRƯỚC
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

        // 2. NẾU HỢP LỆ THÌ MỚI GỌI API LẤY USERS
        const fetchAllUsers = async () => {
            try {
                const response = await axiosClient.get("/admin/users");
                if (response.data && response.data.length > 0) {
                    setUsers(response.data);
                }
            } catch (error) {
                console.warn("Hệ thống chưa kết nối được Endpoint Admin lấy Users. Tiếp tục sử dụng danh sách Mock:", error);
            }
        };

        fetchAllUsers();
    }, [navigate]); // <--- Nhớ đổi [] thành [navigate]
    // HÀM XỬ LÝ THAY ĐỔI TRẠNG THÁI NGƯỜI DÙNG (Cập nhật real-time lên database sau này)
    const handleUpdateUserStatus = async (userId, newStatus) => {
        try {
            // Gọi API cập nhật trạng thái người dùng lên database
            await axiosClient.patch(`/admin/users/${userId}/status`, { status: newStatus });

            // Cập nhật trực tiếp State ở Frontend để màn hình đổi màu trạng thái ngay lập tức
            setUsers(prevUsers =>
                prevUsers.map(user => user.id === userId ? { ...user, status: newStatus } : user)
            );
            alert(`Đã cập nhật trạng thái thành viên #${userId} sang: ${newStatus}`);
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái tài khoản:", error);
            // Kịch bản sơ phòng cứu nguy khi đi demo không có backend thực tế:
            setUsers(prevUsers =>
                prevUsers.map(user => user.id === userId ? { ...user, status: newStatus } : user)
            );
            alert(`[Demo Mode] Đã đổi trạng thái thành viên #${userId} thành: ${newStatus}`);
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
                                            <td><strong>{u.fullName || "Chưa đặt tên"}</strong></td>
                                            <td>{u.email}</td>
                                            <td>
                                                <span className={`role-badge ${u.role === 'Giáo viên' ? 'teacher' : 'student'}`}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${u.status?.toUpperCase() === 'ACTIVE' ? 'success' : (u.status?.toUpperCase() === 'BANNED' ? 'banned' : 'deactivated')}`}>
                                                    {u.status?.toUpperCase() === 'ACTIVE' ? 'Hoạt động' : (u.status?.toUpperCase() === 'BANNED' ? 'Đã khóa' : 'Vô hiệu hóa')}
                                                </span>
                                            </td>
                                            <td>
                                                <button className="action-btn edit" onClick={() => alert(`Chức năng chỉnh sửa User #${u.id}`)}>Sửa</button>

                                                {/* Nút Vô hiệu hóa / Kích hoạt lại */}
                                                <button
                                                    className="action-btn disable"
                                                    onClick={() => handleUpdateUserStatus(u.id, u.status === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED')}
                                                >
                                                    {u.status === 'DEACTIVATED' ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                                                </button>

                                                {/* Nút Khóa / Mở khóa tài khoản */}
                                                <button
                                                    className="action-btn delete"
                                                    onClick={() => handleUpdateUserStatus(u.id, u.status === 'BANNED' ? 'ACTIVE' : 'BANNED')}
                                                >
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