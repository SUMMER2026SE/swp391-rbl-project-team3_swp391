import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/AdminUsersPage.css"; // Dùng chung layout css admin có sẵn

export default function AdminCategoriesPage() {
    const navigate = useNavigate();
    const [activeMenu] = useState("categories"); // Định nghĩa trạng thái menu để active sidebar
    const [categories, setCategories] = useState([]);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [error, setError] = useState("");

    const fetchCategories = async () => {
        try {
            const res = await axiosClient.get("/admin/categories/all");
            setCategories(res.data);
        } catch (err) {
            console.error("Lỗi tải danh mục");
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleCreateCategory = async (e) => {
        e.preventDefault();
        setError("");
        if (!newCategoryName.trim()) return;

        try {
            await axiosClient.post("/admin/categories", { categoryName: newCategoryName.trim() });
            setNewCategoryName("");
            fetchCategories();
            alert("🎉 Thêm danh mục môn học thành công!");
        } catch (err) {
            // Hiển thị lỗi E-01 nếu trùng tên danh mục
            setError(err.response?.data?.message || "Có lỗi xảy ra.");
        }
    };

    const handleDeleteOrHide = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa hoặc ẩn danh mục này?")) return;
        try {
            const res = await axiosClient.delete(`/admin/categories/${id}`);
            alert(res.data.message);
            fetchCategories();
        } catch (err) {
            alert("Xử lý thất bại!");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="admin-layout" style={{ fontFamily: "'Inter', 'Segoe UI', Tahoma, sans-serif" }}>
            
            {/* SIDEBAR TÍCH HỢP HOÀN CHỈNH */}
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

            {/* MAIN CONTENT VÙNG HIỂN THỊ ĐƯỢC CHUẨN HÓA LAYOUT */}
            <main className="admin-main">
                <div className="admin-content" style={{ padding: "30px", textAlign: "left" }}>
                    <div className="header-title" style={{ marginBottom: "20px" }}>
                        <h1>⚙️ Cấu hình hệ thống — Danh mục khối thi</h1>
                        <p>Thiết lập danh mục môn học cốt lõi nền tảng và tổ hợp khối thi theo đúng quy chế (BR-UC41-01).</p>
                    </div>

                    <div className="manage-card" style={{ padding: "20px", backgroundColor: "#fff", borderRadius: "12px", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
                        <form onSubmit={handleCreateCategory} style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                            <input 
                                type="text" 
                                placeholder="Nhập tên môn học, tổ hợp khối thi mới (Ví dụ: Khối A01...)" 
                                style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "400px" }}
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                required
                            />
                            <button type="submit" className="primary-btn" style={{ padding: "10px 20px" }}>+ Thêm danh mục</button>
                        </form>

                        {error && <div style={{ color: "#ef4444", fontWeight: "600", marginBottom: "15px" }}>{error}</div>}

                        <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ backgroundColor: "#f8fafc" }}>
                                    <th style={{ padding: "12px" }}>ID</th>
                                    <th style={{ padding: "12px" }}>Tên danh mục / Tổ hợp khối thi</th>
                                    <th style={{ padding: "12px" }}>Trạng thái hiển thị</th>
                                    <th style={{ padding: "12px" }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map((cat) => (
                                    <tr key={cat.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                                        <td style={{ padding: "12px" }}>#{cat.id}</td>
                                        <td style={{ padding: "12px" }}><strong>{cat.categoryName}</strong></td>
                                        <td style={{ padding: "12px" }}>
                                            <span className={`status-badge ${cat.isHidden ? 'deactivated' : 'success'}`}>
                                                {cat.isHidden ? '⛔ Đã ẩn (Khóa học cũ vẫn chạy)' : '🟢 Đang hiển thị công khai'}
                                            </span>
                                        </td>
                                        <td style={{ padding: "12px" }}>
                                            <button 
                                                onClick={() => handleDeleteOrHide(cat.id)}
                                                style={{ backgroundColor: "#ef4444", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "4px", cursor: "pointer" }}
                                            >
                                                Xóa / Ẩn quy chế
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}