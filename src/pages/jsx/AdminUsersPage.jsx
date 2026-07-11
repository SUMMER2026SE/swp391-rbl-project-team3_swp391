import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/AdminUsersPage.css";

export default function AdminUsersPage() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("users");

    // KHỞI TẠO STATE
    const [users, setUsers] = useState([]);
    
    // 🔥 THÊM STATE ĐỂ QUẢN LÝ TỪ KHÓA TÌM KIẾM NGƯỜI DÙNG
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
            console.log("📡 DỮ LIỆU USER THỰC TẾ TỪ BACKEND:", response.data);
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setUsers(response.data);
            } else {
                console.warn("Backend trả về danh sách trống hoặc sai định dạng.");
                setDefaultMockData();
            }
        } catch (error) {
            console.error("❌ Lỗi kết nối API lấy danh sách User:", error);
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
            console.warn("Chưa đồng bộ được log DB thực tế, đang hiển thị log giả lập...");
            setUserLog([
                { id: 1, action: "Đăng nhập vào hệ thống PrepAce", timestamp: "2026-07-11 20:15:22" },
                { id: 2, action: `Thao tác đổi/xem quyền thành viên: ${user.roleName || 'STUDENT'}`, timestamp: "2026-07-11 20:30:00" },
                { id: 3, action: "Xem danh sách khóa học trên hệ thống", timestamp: "2026-07-11 21:05:10" }
            ]);
        } finally {
            setLoadingLog(false);
        }
    };

    const handleUpdateUserStatus = async (userId, newStatus) => {
        try {
            await axiosClient.patch(`/admin/users/${userId}/status`, { status: newStatus });
            
            setUsers(prevUsers =>
                prevUsers.map(user => {
                    const currentId = user.userId || user.id;
                    return currentId === userId ? { ...user, accountStatus: newStatus, status: newStatus } : user;
                })
            );
            alert(`✅ Đã cập nhật trạng thái thành viên #${userId} sang: ${newStatus}`);
        } catch (error) {
            console.error("Lỗi cập nhật trạng thái tài khoản:", error);
            setUsers(prevUsers =>
                prevUsers.map(user => {
                    const currentId = user.userId || user.id;
                    return currentId === userId ? { ...user, accountStatus: newStatus, status: newStatus } : user;
                })
            );
            alert(`[Demo Mode] Đã đổi trạng thái thành viên #${userId} thành: ${newStatus}`);
        }
    };

    const handleRoleChange = async (userId, newRoleId) => {
        const roleMapping = { 1: "ADMIN", 2: "TEACHER", 3: "STUDENT" };
        const targetRoleName = roleMapping[newRoleId];

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
                const userObj = JSON.parse(storedUser);
                const currentLoggedId = userObj.userId || userObj.id;
                
                if (currentLoggedId === userId) {
                    userObj.roleId = newRoleId;
                    userObj.role = targetRoleName;
                    localStorage.setItem("user", JSON.stringify(userObj));
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

    // 🔥 BỘ LỌC TÌM KIẾM ĐỘNG: Lọc danh sách theo Tên hoặc Email của User[cite: 2]
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
                            {/* 🔥 ĐÃ FIX: Gắn value và onChange kích hoạt lọc từ khóa khi gõ[cite: 2] */}
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
                                    {/* 🔥 ĐÃ ĐỔI: Chuyển sang map mảng phụ filteredUsers đã lọc[cite: 2] */}
                                    {Array.isArray(filteredUsers) && filteredUsers.length > 0 ? (
                                        filteredUsers.map((u) => {
                                            if (!u) return null;
                                            
                                            const currentUserId = u.userId || u.id;
                                            const currentFullName = u.fullName || u.full_name || u.name || "Chưa đặt tên";
                                            const currentRole = u.roleName || u.role_name || u.role || "STUDENT";
                                            const currentStatus = String(u.accountStatus || u.account_status || u.status || "ACTIVE").toUpperCase();

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
                                                            onChange={(e) => handleRoleChange(currentUserId, Number(e.target.value))}
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

                                                        <button
                                                            className="action-btn disable"
                                                            onClick={() => handleUpdateUserStatus(currentUserId, currentStatus === 'DEACTIVATED' ? 'ACTIVE' : 'DEACTIVATED')}
                                                        >
                                                            {currentStatus === 'DEACTIVATED' ? 'Kích hoạt lại' : 'Vô hiệu hóa'}
                                                        </button>

                                                        <button
                                                            className="action-btn delete"
                                                            onClick={() => handleUpdateUserStatus(currentUserId, currentStatus === 'BANNED' ? 'ACTIVE' : 'BANNED')}
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
                    <div style={{ backgroundColor: "#fff", padding: "30px", borderRadius: "12px", width: "100%", maxWidth: "480px", boxShadow: "0 20px 25px rgba(0,0,0,0.15)", textAlign: "left" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px", marginBottom: "15px" }}>
                            <h3 style={{ margin: 0, fontSize: "18px", color: "#0f172a", fontWeight: "700" }}>👤 Khởi tạo tài khoản mới</h3>
                            <button onClick={() => setShowAddModal(false)} style={{ border: "none", background: "none", fontSize: "24px", cursor: "pointer", color: "#9ca3af" }}>&times;</button>
                        </div>
                        
                        {addError && <div style={{ padding: "10px", backgroundColor: "#fee2e2", color: "#ef4444", borderRadius: "6px", fontSize: "13px", marginBottom: "15px", fontWeight: "500" }}>{addError}</div>}
                        
                        <form onSubmit={handleCreateUser} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Họ và tên *</label>
                                <input type="text" placeholder="Nhập họ và tên đầy đủ..." style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={addFormData.fullName} onChange={(e) => setAddFormData({...addFormData, fullName: e.target.value})} required />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Địa chỉ Email *</label>
                                <input type="email" placeholder="example@gmail.com" style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={addFormData.email} onChange={(e) => setAddFormData({...addFormData, email: e.target.value})} required />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Mật khẩu gốc *</label>
                                <input type="password" placeholder="Mật khẩu khởi tạo đăng nhập..." style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={addFormData.passwordHash} onChange={(e) => setAddFormData({...addFormData, passwordHash: e.target.value})} required />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Số điện thoại liên hệ</label>
                                <input type="text" placeholder="Nhập số điện thoại..." style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px" }} value={addFormData.phone} onChange={(e) => setAddFormData({...addFormData, phone: e.target.value})} />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                <label style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Vai trò hệ thống (Role)</label>
                                <select style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#fff", cursor: "pointer" }} value={addFormData.roleId} onChange={(e) => setAddFormData({...addFormData, roleId: e.target.value})}>
                                    <option value={3}>🎓 Học sinh (STUDENT)</option>
                                    <option value={2}>👨‍🏫 Giáo viên (TEACHER)</option>
                                    <option value={1}>🛡️ Quản trị viên (ADMIN)</option>
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px", borderTop: "1px solid #e5e7eb", paddingTop: "12px" }}>
                                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: "8px 16px", background: "#f1f5f9", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#475569" }}>Hủy</button>
                                <button type="submit" style={{ padding: "8px 20px", background: "#2747d9", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", color: "#fff" }}>Lưu dữ liệu</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* POPUP MODAL XEM HỒ SƠ & LOG HOẠT ĐỘNG CHI TIẾT */}
            {selectedUser && (
                <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999 }}>
                    <div style={{ backgroundColor: "#fff", borderRadius: "12px", width: "90%", maxWidth: "750px", maxHeight: "85vh", overflowY: "auto", padding: "30px", boxShadow: "0 10px 25 rgba(0,0,0,0.2)" }}>
                        
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e5e7eb", paddingBottom: "15px", marginBottom: "20px" }}>
                            <h2 style={{ fontSize: "20px", color: "#111827", fontWeight: "bold" }}>🔍 Hồ Sơ Thành Viên & Lịch Sử Hoạt Động</h2>
                            <button onClick={() => setSelectedUser(null)} style={{ border: "none", background: "none", fontSize: "28px", cursor: "pointer", color: "#9ca3af", lineHeight: "1" }}>&times;</button>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "25px", backgroundColor: "#f9fafb", padding: "15px", borderRadius: "8px", border: "1px solid #e5e7eb", textAlign: "left" }}>
                            <div>
                                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Họ và tên:</strong> {selectedUser.fullName || selectedUser.full_name || "Chưa cập nhật"}</p>
                                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Email tài khoản:</strong> {selectedUser.email}</p>
                                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>Quyền hiện tại:</strong> <span style={{ color: "#2563eb", fontWeight: "bold" }}>{getRoleLabel(selectedUser.roleName || selectedUser.role)}</span></p>
                            </div>
                            <div>
                                <p style={{ margin: "6px 0", fontSize: "14px" }}><strong>🎓 Trình độ học văn:</strong></p>
                                <div style={{ color: "#4b5563", fontSize: "13px", paddingLeft: "10px", fontStyle: selectedUser.education ? "normal" : "italic" }}>
                                    {selectedUser.education || "Chưa cung cấp thông tin học vấn"}
                                </div>
                                <p style={{ margin: "6px 0", fontSize: "14px", marginTop: "10px" }}><strong>💼 Kinh nghiệm làm việc:</strong></p>
                                <div style={{ color: "#4b5563", fontSize: "13px", paddingLeft: "10px", fontStyle: selectedUser.experience ? "normal" : "italic" }}>
                                    {selectedUser.experience || "Chưa cung cấp dữ liệu kinh nghiệm"}
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: "left" }}>
                            <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "12px", color: "#374151" }}>📋 Log chi tiết thao tác trên hệ thống PrepAce:</h3>
                            
                            {loadingLog ? (
                                <p style={{ textAlign: "center", padding: "20px", color: "#6b7280", fontSize: "14px" }}>🔄 Đang truy vấn lịch sử hoạt động từ máy chủ...</p>
                            ) : userLog.length > 0 ? (
                                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                        <thead style={{ backgroundColor: "#f3f4f6" }}>
                                            <tr>
                                                <th style={{ padding: "12px 15px", color: "#4b5563", fontWeight: "600" }}>Nội dung hành động hành vi</th>
                                                <th style={{ padding: "12px 15px", color: "#4b5563", width: "200px", fontWeight: "600" }}>Thời gian thực hiện</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {userLog.map((log) => (
                                                <tr key={log.id} style={{ borderBottom: "1px solid #e5e7eb" }}>
                                                    <td style={{ padding: "12px 15px", color: "#1f2937" }}>{log.action}</td>
                                                    <td style={{ padding: "12px 15px", color: "#6b7280" }}>{log.timestamp}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p style={{ textAlign: "center", padding: "20px", color: "#9ca3af", fontStyle: "italic", border: "1px dashed #d1d5db", borderRadius: "8px" }}>
                                    Thành viên này chưa thực hiện thao tác tương tác nào ghi nhận trên hệ thống.
                                </p>
                            )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "25px", borderTop: "1px solid #e5e7eb", paddingTop: "15px" }}>
                            <button onClick={() => setSelectedUser(null)} style={{ backgroundColor: "#4b5563", color: "#fff", border: "none", padding: "8px 22px", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>Đóng lại</button>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}