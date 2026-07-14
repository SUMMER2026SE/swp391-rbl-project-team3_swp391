import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/AdminUsersPage.css"; // Tái sử dụng CSS layout admin hệ thống

export default function AdminViolationsPage() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("violations");
    
    // 🔥 ĐÃ XÓA MOCK: Mặc định ban đầu là mảng rỗng để đợi nạp dữ liệu thật từ Database
    const [reports, setReports] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠️ Bạn chưa đăng nhập quyền Admin!");
            navigate("/");
            return;
        }

        // Tải danh sách báo cáo vi phạm thực tế từ Database thông qua axiosClient
        const fetchViolations = async () => {
            try {
                const response = await axiosClient.get("/admin/violations");
                console.log("📡 DỮ LIỆU VI PHẠM THỰC TẾ TỪ BACKEND:", response.data);
                
                if (response.data && Array.isArray(response.data)) {
                    setReports(response.data);
                }
            } catch (error) {
                console.error("❌ Lỗi kết nối API lấy danh sách vi phạm thật:", error);
            }
        };

        fetchViolations();
    }, [navigate]);

    // HÀM ĐIỀU PHỐI ĐƠN KÈM GỬI LỜI NHẮN THÔNG BÁO (Task 43)
    const handleProcessViolation = async (reportId, actionStatus) => {
        const actionText = actionStatus === "RESOLVED_BAN" ? "XỬ PHẠT mục tiêu" : "BÁC BỎ đơn tố cáo";
        
        const adminNote = prompt(`Xác nhận hành động: ${actionText}.\nNhập phản hồi/thông báo gửi lại cho người dùng:`);
        if (adminNote === null) return; 

        try {
            await axiosClient.put(`/admin/violations/${reportId}`, { 
                status: actionStatus,
                adminNote: adminNote || "Đã phê duyệt xử lý theo quy chuẩn cộng đồng."
            });

            // Cập nhật trạng thái trực tiếp lên màn hình quản trị
            setReports(prev => prev.map(r => {
                const currentId = r.id || r.reportId;
                return currentId === reportId ? { ...r, status: actionStatus, adminNote: adminNote } : r;
            }));
            
            alert(`✅ Đã đóng đơn #${reportId} và gửi thông báo phản hồi thành công!`);
        } catch (error) {
            console.error("Lỗi chi tiết từ hệ thống khi xử lý vi phạm:", error);
            alert("❌ Có lỗi xảy ra trong quá trình cập nhật trạng thái đơn vi phạm.");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const getStatusBadge = (status) => {
        const currentStatus = String(status || "").toUpperCase();
        if (currentStatus === "PENDING") return <span className="status-badge pending">Đang chờ xử lý</span>;
        if (currentStatus === "DISMISSED") return <span className="status-badge deactivated">Đã bác bỏ</span>;
        return <span className="status-badge banned">Đã xử phạt</span>;
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
                     <li className={activeMenu === "categories" ? "active" : ""} onClick={() => navigate("/admin/categories")}>⚙️ Cấu hình danh mục</li>
                </ul>
                <div className="admin-logout">
                    <button onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Trung Tâm Tiếp Nhận & Xử Lý Vi Phạm</h1>
                        <p>Kiểm tra các báo cáo tố cáo từ người dùng, đưa ra quyết định xử phạt nội dung độc hại (Task 43).</p>
                    </div>
                </header>

                <div className="admin-content">
                    <div className="manage-card">
                        <div className="table-responsive">
                            <table className="admin-table">
                                <thead>
                                    <tr>
                                        <th>Mã đơn</th>
                                        <th>ID Người gửi</th>
                                        <th>Đối tượng bị tố cáo</th>
                                        <th>Lý do vi phạm</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động điều phối</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(reports) && reports.length > 0 ? (
                                        reports.map((r) => {
                                            if (!r) return null;
                                            const currentId = r.id || r.reportId;
                                            const currentStatus = String(r.status || "PENDING").toUpperCase();

                                            return (
                                                <tr key={currentId}>
                                                    <td>#{currentId}</td>
                                                    <td>User #{r.reporterId || r.userId}</td>
                                                    <td><strong style={{ color: "#b91c1c" }}>{r.reportedTarget || "Nội dung học liệu"}</strong></td>
                                                    <td style={{ maxWidth: "300px", whiteSpace: "normal" }}>{r.reason || r.content}</td>
                                                    <td>{getStatusBadge(currentStatus)}</td>
                                                    <td>
                                                        {currentStatus === "PENDING" ? (
                                                            <>
                                                                <button 
                                                                    className="action-btn reject" 
                                                                    style={{ backgroundColor: "#dc2626", color: "#fff" }}
                                                                    onClick={() => handleProcessViolation(currentId, "RESOLVED_BAN")}
                                                                >
                                                                    🔨 Xử phạt
                                                                </button>
                                                                <button 
                                                                    className="action-btn disable" 
                                                                    style={{ marginLeft: "8px", backgroundColor: "#6b7280", color: "#fff" }}
                                                                    onClick={() => handleProcessViolation(currentId, "DISMISSED")}
                                                                >
                                                                    🚫 Bác bỏ
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <span style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>
                                                                Đã đóng ({r.adminNote || "Đã xử lý xong"})
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" style={{ textAlign: "center", padding: "30px", color: "#9ca3af" }}>
                                                📭 Hiện tại trung tâm chưa tiếp nhận đơn báo cáo vi phạm nào từ database.
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