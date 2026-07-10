import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdminUsersPage.css"; // Tái sử dụng CSS layout admin hệ thống

export default function AdminViolationsPage() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("violations"); // <--- Khai báo activeMenu cho trang Violations
    const [reports, setReports] = useState([
        { id: 1, reporterId: 201, reportedTarget: "Khóa học Casio chuyên sâu", reason: "Nội dung học liệu chứa tài liệu vi phạm bản quyền", status: "PENDING" },
        { id: 2, reporterId: 205, reportedTarget: "Bình luận của User #99", reason: "Sử dụng ngôn từ đả kích, xúc phạm giáo viên", status: "PENDING" }
    ]);

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠️ Bạn chưa đăng nhập quyền Admin!");
            navigate("/");
            return;
        }

        // Tải danh sách báo cáo vi phạm thực tế từ Database
        fetch("http://localhost:8080/api/admin/core/violations", {
            method: "GET",
            headers: { "Authorization": `Bearer ${token}` }
        })
        .then(res => {
            if (res.ok) return res.json();
            throw new Error("Không thể tải dữ liệu");
        })
        .then(data => {
            if (data && data.length > 0) setReports(data);
        })
        .catch(err => console.warn("Sử dụng tiếp dữ liệu cấu trúc local mock:", err));
    }, [navigate]);

    // HÀM XỬ LÝ QUYẾT ĐỊNH BÁO CÁO VI PHẠM (Task 43)
    const handleProcessViolation = async (reportId, actionStatus) => {
        const confirmMsg = actionStatus === "DISMISSED" 
            ? "Bạn có chắc chắn muốn BÁC BỎ và đóng báo cáo này không?" 
            : "Bạn có chắc chắn muốn XỬ PHẠT mục tiêu bị báo cáo này?";
        
        if (!window.confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/admin/core/violations/${reportId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: actionStatus }) // Truyền trạng thái xử lý sang body Map
            });

            if (!response.ok) throw new Error("Xử lý thất bại");

            // Cập nhật trạng thái hiển thị trực tiếp trên UI
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: actionStatus } : r));
            alert(`✅ Đã thực thi xử lý báo cáo #${reportId} thành công!`);
        } catch (error) {
            console.error(error);
            alert("❌ Có lỗi xảy ra khi thực hiện xử lý báo cáo vi phạm.");
        }
    };

    const handleLogout = () => { // <--- Thêm hàm handleLogout bị thiếu ở trang này để tránh lỗi crash nếu nhấn Đăng xuất
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const getStatusBadge = (status) => {
        if (status === "PENDING") return <span className="status-badge pending">Đang chờ xử lý</span>;
        if (status === "DISMISSED") return <span className="status-badge deactivated">Đã bác bỏ</span>;
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
                                    {reports.map((r) => (
                                        <tr key={r.id}>
                                            <td>#{r.id}</td>
                                            <td>User #{r.reporterId || r.userId}</td>
                                            <td><strong style={{ color: "#b91c1c" }}>{r.reportedTarget || "Nội dung học liệu"}</strong></td>
                                            <td style={{ maxWidth: "300px", whiteSpace: "normal" }}>{r.reason || r.content}</td>
                                            <td>{getStatusBadge(r.status?.toUpperCase())}</td>
                                            <td>
                                                {r.status?.toUpperCase() === "PENDING" ? (
                                                    <>
                                                        <button 
                                                            className="action-btn reject" 
                                                            style={{ backgroundColor: "#dc2626", color: "#fff" }}
                                                            onClick={() => handleProcessViolation(r.id, "RESOLVED_BAN")}
                                                        >
                                                            🔨 Xử phạt
                                                        </button>
                                                        <button 
                                                            className="action-btn disable" 
                                                            style={{ marginLeft: "8px", backgroundColor: "#6b7280", color: "#fff" }}
                                                            onClick={() => handleProcessViolation(r.id, "DISMISSED")}
                                                        >
                                                            🚫 Bác bỏ
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: "13px", color: "#9ca3af", fontStyle: "italic" }}>Đã đóng hồ sơ</span>
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