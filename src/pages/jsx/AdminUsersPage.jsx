import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/AdminUsersPage.css";

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("users");
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // STATE ĐỂ QUẢN LÝ POPUP XEM CHI TIẾT & LOG HOẠT ĐỘNG
    const [selectedUser, setSelectedUser] = useState(null);
    const [userLog, setUserLog] = useState([]);
    const [loadingLog, setLoadingLog] = useState(false);

    // STATE MỚI: QUẢN LÝ FORM VÀ POPUP THÊM NGƯỜI DÙNG MỚI
    const [showAddModal, setShowAddModal] = useState(false);
    const [addFormData, setAddFormData] = useState({
        fullName: "",
        email: "",
        passwordHash: "", 
        phone: "",
        roleId: 3 
    });
    const [addError, setAddError] = useState("");

    const fetchAllUsers = async () => {
        try {
            const response = await axiosClient.get("/admin/users");
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setUsers(response.data);
            } else {
                setDefaultMockData();
            }
        } catch (error) {
            setDefaultMockData();
        }
    };

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

        fetchAllUsers();
    }, [navigate]);

    const setDefaultMockData = () => {
        setUsers([
            { userId: 1, fullName: "System Administrator", email: "admin@learnifyfuture.com", roleName: "ADMIN", accountStatus: "ACTIVE", teacherRequestStatus: null, education: "Thạc sĩ CNTT", experience: "5 năm quản trị hệ thống" },
            { userId: 2, fullName: "Nguyễn Minh Quân", email: "teacher.math@learnify.com", roleName: "TEACHER", accountStatus: "ACTIVE", teacherRequestStatus: null, education: "Đại học Sư Phạm Toán", experience: "3 năm luyện thi THPT" },
            { userId: 3, fullName: "Trần Bảo Châu", email: "teacher.physics@learnify.com", roleName: "TEACHER", accountStatus: "DEACTIVATED", teacherRequestStatus: null, education: "Cử nhân Vật lý lý thuyết", experience: "Chưa có" },
            { userId: 4, fullName: "Võ Minh Trí", email: "student2@gmail.com", roleName: "STUDENT", accountStatus: "BANNED", teacherRequestStatus: "PENDING", education: "Học sinh lớp 12 chuyên Hùng Vương", experience: "Trợ giảng câu lạc bộ Toán học" },
        ]);
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setAddError("");

        if (!addFormData.fullName.trim() || !addFormData.email.trim() || !addFormData.passwordHash.trim()) {
            setAddError("⚠️ Vui lòng điền đầy đủ Họ tên, Email và Mật khẩu khởi tạo!");
            return;
        }

        try {
            const res = await axiosClient.post("/admin/users", {
                fullName: addFormData.fullName.trim(),
                email: addFormData.email.trim(),
                passwordHash: addFormData.passwordHash,
                phone: addFormData.phone.trim(),
                roleId: Number(addFormData.roleId)
            });

            alert(res.data.message || "🎉 Thêm người dùng mới thành công!");
            setShowAddModal(false);
            setAddFormData({ fullName: "", email: "", passwordHash: "", phone: "", roleId: 3 });
            fetchAllUsers(); 
        } catch (err) {
            setAddError(err.response?.data?.message || "❌ Có lỗi xảy ra trong quá trình tạo tài khoản.");
        }
    };

    const handleOpenUserDetail = async (user) => {
        setSelectedUser(user);
        setLoadingLog(true);
        const currentUserId = user.userId || user.id;

        try {
            const response = await axiosClient.get(`/admin/users/${currentUserId}/activity`);
            setSelectedUser(prev => ({
                ...prev,
                education: response.data.education,
                experience: response.data.experience
            }));
            setUserLog(response.data.activities || []);
        } catch (error) {
            setUserLog([
                { id: 1, action: "Đăng nhập vào hệ thống PrepAce", timestamp: "2026-07-11 20:15:22" },
                { id: 2, action: `Thao tác đổi/xem quyền thành viên: ${user.roleName || 'STUDENT'}`, timestamp: "2026-07-11 20:30:00" },
                { id: 3, action: "Xem danh sách khóa học trên hệ thống", timestamp: "2026-07-11 21:05:10" }
            ]);
        } finally {
            setLoadingLog(false);
        }
    };

    // 🔥 ĐÃ SỬA CHUẨN XÁC: Nhận trọn vẹn đối tượng userObj để trích xuất thông tin an toàn
    const handleUpdateUserStatus = async (userObj, newStatus) => {
        const userId = userObj.userId || userObj.id; // Lấy chính xác ID của người dùng đang được chọn

        // 🛡️ Nghiệp vụ BR-UC40-02: Ngăn chặn thao tác làm thay đổi trạng thái hoạt động của Admin tối cao
        if (userId === 1 && (newStatus === "BANNED" || newStatus === "DEACTIVATED")) {
            alert("❌ Lỗi nghiệp vụ (BR-UC40-02):\nHệ thống phải luôn có ít nhất 1 tài khoản Admin hoạt động. Bạn không thể khóa hoặc vô hiệu hóa tài khoản Admin gốc!");
            return;
        }

        // ✍️ Nghiệp vụ BR-UC40-01: Bắt buộc mở hộp thoại nhập lý do tối thiểu 20 ký tự khi thực hiện khóa (BANNED)
        let lockReason = "";
        if (newStatus === "BANNED") {
            const reasonInput = prompt("⚠️ Nhập lý do khóa tài khoản này (Yêu cầu bắt buộc tối thiểu 20 ký tự):");
            if (reasonInput === null) return; // Nhấn hủy prompt sẽ dừng thực thi
            
            if (reasonInput.trim().length < 20) {
                alert(`❌ Thất bại (BR-UC40-01):\nLý do khóa hiện tại quá ngắn (${reasonInput.trim().length} ký tự). Bạn bắt buộc phải nhập tối thiểu từ 20 ký tự trở lên!`);
                return;
            }
            lockReason = reasonInput.trim();
        }

        try {
            // Gửi đồng bộ lên Endpoint xử lý của Backend
            await axiosClient.patch(`/admin/users/${userId}/status`, { 
                status: newStatus,
                reason: lockReason 
            });
            
            setUsers(prevUsers =>
                prevUsers.map(user => {
                    const currentId = user.userId || user.id;
                    return currentId === userId ? { ...user, accountStatus: newStatus, status: newStatus } : user;
                })
            );
            alert(`✅ Đã cập nhật trạng thái thành viên #${userId} sang: ${newStatus}`);
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái tài khoản:", error);
            const errMsg = error.response?.data?.message || "Lỗi kết nối máy chủ.";
            alert(`❌ Không thể cập nhật trạng thái: ${errMsg}`);
        }
    };

    const handleRoleChange = async (userObj, newRoleId) => {
        const userId = userObj.userId || userObj.id;
        const currentRole = String(userObj.roleName || userObj.role || "").toUpperCase();
        const currentStatus = String(userObj.accountStatus || userObj.status || "").toUpperCase();
        
        const roleMapping = { 1: "ADMIN", 2: "TEACHER", 3: "STUDENT" };
        const targetRoleName = roleMapping[newRoleId];

        if (currentRole === "ADMIN" && newRoleId !== 1 && currentStatus === "ACTIVE") {
            if (userId === 1) {
                alert("❌ Lỗi nghiệp vụ (BR-UC40-02):\nKhông thể hạ quyền tài khoản này vì đây là Admin duy nhất đang hoạt động trên hệ thống!");
                return;
            }
        }

        try {
            await axiosClient.put(`/admin/users/${userId}/change-role`, { roleId: newRoleId });
            setUsers(prevUsers =>
                prevUsers.map(user => {
                    const currentId = user.userId || user.id;
                    return currentId === userId ? { ...user, roleId: newRoleId, roleName: targetRoleName, role: targetRoleName } : user;
                })
            );

            const storedUser = localStorage.getItem("user");
            if (storedUser) {
                const userObjLocal = JSON.parse(storedUser);
                const currentLoggedId = userObjLocal.userId || userObjLocal.id;
                
                if (currentLoggedId === userId) {
                    userObjLocal.roleId = newRoleId;
                    userObjLocal.role = targetRoleName;
                    localStorage.setItem("user", JSON.stringify(userObjLocal));
                }
            }
            alert(`✅ Đã đổi vai trò User #${userId} sang: ${getRoleLabel(targetRoleName)}`);
        } catch (error) {
            console.error("❌ Lỗi phân quyền thực tế từ Backend:", error);
            const errorMsg = error.response?.data?.message || "Không thể lưu thay đổi xuống Database.";
            alert(`❌ Đổi vai trò thất bại! Lỗi hệ thống: ${errorMsg}`);
        }
    };

    const handleReviewTeacher = async (userId, decision) => {
        const actionText = decision === "APPROVE" ? "DUYỆT lên làm Giáo viên" : "TỪ CHỐI đơn ứng tuyển";
        if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} cho thành viên này?`)) return;

        try {
            await axiosClient.put(`/admin/users/${userId}/review-teacher`, { decision: decision });
            setUsers(prevUsers =>
                prevUsers.map(user => {
                    const currentId = user.userId || user.id;
                    if (currentId === userId) {
                        return {
                            ...user,
                            teacherRequestStatus: decision === "APPROVE" ? "APPROVED" : "REJECTED",
                            roleName: decision === "APPROVE" ? "TEACHER" : user.roleName,
                            roleId: decision === "APPROVE" ? 2 : user.roleId
                        };
                    }
                    return user;
                })
            );
            alert("✅ Đã xử lý và cập nhật đơn ứng tuyển thành công!");
        } catch (error) {
            console.error("Lỗi xử lý đơn giáo viên:", error);
            alert("[Demo Mode] Thao tác duyệt đơn giả lập thành công!");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const getRoleLabel = (roleName) => {
        const role = String(roleName || "").toUpperCase();
        if (role === "ADMIN") return "Quản trị viên";
        if (role === "TEACHER") return "Giáo viên";
        return "Học sinh";
    };

    const filteredUsers = users.filter((u) => {
        if (!u) return false;
        const currentFullName = String(u.fullName || u.full_name || u.name || "").toLowerCase();
        const currentEmail = String(u.email || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return currentFullName.includes(search) || currentEmail.includes(search);
    });

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
                        <p>Click trực tiếp vào tên bất kỳ người dùng nào để xem Hồ sơ & Nhật ký hoạt động hệ thống chi tiết.</p>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="manage-card">
                        <div className="manage-header">
                            <input 
                                type="text" 
                                placeholder="Tìm kiếm theo tên hoặc email..." 
                                className="manage-search" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <button className="primary-btn" onClick={() => setShowAddModal(true)}>+ Thêm người dùng</button>
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
                                    {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                                        filteredUsers.map((u) => {
                                            if (!u) return null;
                                            const currentUserId = u.userId || u.id;
                                            const currentFullName = u.fullName || u.full_name || u.name || "Chưa đặt tên";
                                            const currentRole = u.roleName || "STUDENT";
                                            const currentStatus = String(u.accountStatus || "ACTIVE").toUpperCase();

                                            return (
                                                <tr key={currentUserId}>
                                                    <td>#{currentUserId}</td>
                                                    <td onClick={() => handleOpenUserDetail(u)} style={{ cursor: "pointer", color: "#1d4ed8" }}>
                                                        <strong style={{ textDecoration: "underline" }}>{currentFullName}</strong>
                                                        {u.teacherRequestStatus === "PENDING" && (
                                                            <div style={{ marginTop: "8px", backgroundColor: "#f0fdf4", padding: "8px", borderRadius: "6px", border: "1px dashed #16a34a" }} onClick={(e) => e.stopPropagation()}>
                                                                <span style={{ fontSize: "11px", color: "#166534", fontWeight: "bold", display: "block", marginBottom: "4px" }}>📬 Đơn ứng tuyển Giáo viên:</span>
                                                                <button onClick={() => handleReviewTeacher(currentUserId, "APPROVE")} style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "4px 10px", fontSize: "11px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>Duyệt</button>
                                                                <button onClick={() => handleReviewTeacher(currentUserId, "REJECT")} style={{ backgroundColor: "#dc2626", color: "#fff", border: "none", padding: "4px 10px", fontSize: "11px", borderRadius: "4px", cursor: "pointer", fontWeight: "bold", marginLeft: "6px" }}>Từ chối</button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <select
                                                            value={currentRole.toUpperCase() === 'ADMIN' ? 1 : (currentRole.toUpperCase() === 'TEACHER' ? 2 : 3)}
                                                            onChange={(e) => handleRoleChange(u, Number(e.target.value))}
                                                            style={{ padding: "6px 10px", borderRadius: "4px", border: "1px solid #d1d5db", fontWeight: "bold", color: "#374151", cursor: "pointer" }}
                                                        >
                                                            <option value={3}>🎓 Học sinh</option>
                                                            <option value={2}>👨‍🏫 Giáo viên</option>
                                                            <option value={1}>🛡️ Quản trị viên</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${currentStatus === 'ACTIVE' ? 'success' : (currentStatus === 'BANNED' ? 'banned' : 'deactivated')}`}>
                                                            {currentStatus === 'ACTIVE' ? 'Hoạt động' : (currentStatus === 'BANNED' ? 'Đã khóa' : 'Vô hiệu hóa')}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="action-btn edit" onClick={() => alert(`Chức năng chỉnh sửa User #${currentUserId}`)}>Sửa</button>
                                                        {/* 🔥 ĐÃ GẮN BIẾN TRUYỀN: Thay đổi từ truyền currentUserId thành truyền nguyên object u */}
                                                        <button
                                                            className="action-btn disable"
                                                            onClick={() => handleUpdateUserStatus(u, currentStatus === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED')}
                                                        >
                                                            {currentStatus === 'DEACTIVATED' ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                                                        </button>
                                                        {/* 🔥 ĐÃ GẮN BIẾN TRUYỀN: Thay đổi từ truyền currentUserId thành truyền nguyên object u */}
                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleUpdateUserStatus(u, currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED')}
                                                        >
                                                            {currentStatus === 'BANNED' ? 'Mở khóa' : 'Khóa'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#9ca3af" }}>
                                                {searchTerm ? "❌ Không tìm thấy thành viên nào khớp từ khóa!" : "Hiện tại chưa có người dùng nào hoặc hệ thống đang tải dữ liệu..."}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>

            {/* POPUP MODAL FORM ĐĂNG KÝ THÀNH VIÊN MỚI */}
            {showAddModal && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
                    <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "480px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px", marginBottom: "15px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>👤 Khởi tạo tài khoản mới</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer", color: "#9ca3af" }}>&times;</button>
                        </div>
                        {addError && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#ef4444", borderRadius: "6px", fontSize: "13px", marginBottom: "15px" }}>{addError}</div>}
                        <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <input type="text" placeholder="Họ và tên *" style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={addFormData.fullName} onChange={(e) => setAddFormData({...addFormData, fullName: e.target.value})} required />
                            <input type="email" placeholder="Địa chỉ Email *" style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={addFormData.email} onChange={(e) => setAddFormData({...addFormData, email: e.target.value})} required />
                            <input type="password" placeholder="Mật khẩu gốc *" style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={addFormData.passwordHash} onChange={(e) => setAddFormData({...addFormData, passwordHash: e.target.value})} required />
                            <input type="text" placeholder="Số điện thoại liên hệ" style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={addFormData.phone} onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})} />
                            <select style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1" }} value={addFormData.roleId} onChange={(e) => setAddFormData({...addFormData, roleId: e.target.value})}>
                                <option value={3}>🎓 Học sinh (STUDENT)</option>
                                <option value={2}>👨‍🏫 Giáo viên (TEACHER)</option>
                                <option value={1}>🛡️ Quản trị viên (ADMIN)</option>
                            </select>
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button type="button" onClick={() => setShowAddModal(false)}>Hủy</button>
                                <button type="submit" style={{ padding: "8px 20px", background: "#2747d9", color: "#fff", border: "none", borderRadius: "6px" }}>Lưu dữ liệu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* POPUP MODAL XEM HỒ SƠ & LOG HOẠT ĐỘNG */}
            {selectedUser && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
                    <div style={{ backgroundColor: "#fff", borderRadius: "12px", width: "90%", maxWidth: "750px", maxHeight: "85vh", overflowY: "auto", padding: "30px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "15px", marginBottom: "20px" }}>
                            <h2>🔍 Hồ Sơ Thành Viên & Lịch Sử Hoạt Động</h2>
                            <button onClick={() => setSelectedUser(null)} style={{ border: "none", background: "none", fontSize: "28px" }}>&times;</button>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px", backgroundColor: "#f9fafb", padding: "15px" }}>
                            <div>
                                <p><strong>Họ và tên:</strong> {selectedUser.fullName || "Chưa cập nhật"}</p>
                                <p><strong>Email tài khoản:</strong> {selectedUser.email}</p>
                            </div>
                            <div>
                                <p><strong>🎓 Trình độ học vấn:</strong> {selectedUser.education || "Chưa cung cấp"}</p>
                                <p><strong>💼 Kinh nghiệm làm việc:</strong> {selectedUser.experience || "Chưa cung cấp"}</p>
                            </div>
                        </div>
                        <div style={{ textAlign: "left" }}>
                            <h3>📋 Log chi tiết thao tác hệ thống:</h3>
                            {loadingLog ? (
                                <p>🔄 Đang truy vấn lịch sử hoạt động...</p>
                            ) : userLog.length > 0 ? (
                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                        <tbody>
                                            {userLog.map((log) => (
                                                <tr key={log.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                    <td style={{ padding: "12px" }}>{log.action}</td>
                                                    <td style={{ padding: "12px", color: "#6b7280" }}>{log.timestamp}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p>Thành viên này chưa có hoạt động nào ghi nhận.</p>
                            )}
                        </div>
                        <button onClick={() => setSelectedUser(null)} style={{ marginTop: "25px" }}>Đóng lại</button>
                    </div>
                </div>
            )}
        </div>
    );
}