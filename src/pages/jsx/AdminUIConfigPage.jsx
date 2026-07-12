import { useNavigate } from "react-router-dom";
import "../css/AdminUIConfigPage.css";
import React, { useState, useEffect } from "react";
import axiosClient from "../../api/axiosClient";

export default function AdminUIConfigPage() {
    const navigate = useNavigate();
    const [activeMenu] = useState("ui");
    const [loading, setLoading] = useState(false);

    // State cho Cấu hình Banner
    const [bannerConfig, setBannerConfig] = useState({
        title: "",
        subtitle: "",
        btnText: ""
    });

    // State cho Gửi thông báo
    const [announcement, setAnnouncement] = useState({
        target: "all",
        title: "",
        content: ""
    });

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

        // Tải cấu hình Banner hiện tại từ DB lên form
        const fetchBannerConfig = async () => {
            try {
                const res = await axiosClient.get("/public/ui-config/banner");
                if (res.data) {
                    setBannerConfig({
                        title: res.data.title,
                        subtitle: res.data.subtitle,
                        btnText: res.data.btnText
                    });
                }
            } catch (err) {
                console.error("Lỗi tải cấu hình Banner:", err);
            }
        };

        fetchBannerConfig();
    }, [navigate]);

    const handleSaveBanner = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await axiosClient.post("/admin/ui-config/banner", bannerConfig);
            alert("🎉 Đã lưu cấu hình Banner trang chủ xuống Database thành công!");
        } catch (err) {
            alert("Lỗi khi lưu cấu hình: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleSendAnnouncement = async (e) => {
        e.preventDefault();
        try {
            await axiosClient.post("/admin/notifications", {
                title: announcement.title,
                content: announcement.content,
                targetRole: announcement.target.toUpperCase()
            });
            alert(`📢 Đã gửi thông báo hệ thống thành công tới nhóm đối tượng: ${announcement.target}!`);
            setAnnouncement({ target: "all", title: "", content: "" }); // Reset form
        } catch (err) {
            alert("Lỗi khi gửi thông báo: " + (err.response?.data?.message || err.message));
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
                    <li onClick={() => navigate("/admin/courses")}>📚 Quản lý khóa học</li>
                    <li onClick={() => navigate("/admin/users")}>👥 Quản lý người dùng</li>
                    <li onClick={() => navigate("/admin/question-bank")}>📝 Quản lý thư viện đề</li>
                    <li onClick={() => navigate("/admin/violations")}>🚨 Quản lý vi phạm</li>
                    <li className={activeMenu === "ui" ? "active" : ""} onClick={() => navigate("/admin/ui-config")}>🎨 Cấu hình UI</li>
                    <li onClick={() => navigate("/admin/sepay-guide")}>💳 Cấu hình SePay</li>
                    <li onClick={() => navigate("/admin/categories")}>⚙️ Cấu hình danh mục</li>
                </ul>
                <div className="admin-logout">
                    <button onClick={handleLogout}>Đăng xuất</button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Cấu hình Nền tảng</h1>
                        <p>Tùy chỉnh giao diện Trang chủ và Quản lý thông báo hệ thống.</p>
                    </div>
                </header>

                <div className="admin-content ui-config-content">
                    <div className="config-card">
                        <div className="card-header">
                            <h3>🖼️ Cấu hình Banner Trang chủ</h3>
                        </div>
                        <form className="config-form" onSubmit={handleSaveBanner}>
                            <div className="form-group">
                                <label>Tiêu đề chính (H1)</label>
                                <input 
                                    type="text" 
                                    value={bannerConfig.title}
                                    onChange={(e) => setBannerConfig({...bannerConfig, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Mô tả phụ (Subtitle)</label>
                                <textarea 
                                    rows="3"
                                    value={bannerConfig.subtitle}
                                    onChange={(e) => setBannerConfig({...bannerConfig, subtitle: e.target.value})}
                                    required
                                ></textarea>
                            </div>
                            <div className="form-group">
                                <label>Chữ trên Nút bấm (CTA Button)</label>
                                <input 
                                    type="text" 
                                    value={bannerConfig.btnText}
                                    onChange={(e) => setBannerConfig({...bannerConfig, btnText: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" className="primary-btn" disabled={loading}>
                                {loading ? "Đang lưu..." : "Lưu cấu hình UI"}
                            </button>
                        </form>
                    </div>

                    <div className="config-card">
                        <div className="card-header">
                            <h3>📢 Gửi thông báo hệ thống</h3>
                        </div>
                        <form className="config-form" onSubmit={handleSendAnnouncement}>
                            <div className="form-group">
                                <label>Gửi đến (Đối tượng)</label>
                                <select 
                                    value={announcement.target}
                                    onChange={(e) => setAnnouncement({...announcement, target: e.target.value})}
                                >
                                    <option value="all">Tất cả người dùng</option>
                                    <option value="students">Chỉ Học sinh</option>
                                    <option value="teachers">Chỉ Giáo viên</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Tiêu đề thông báo</label>
                                <input 
                                    type="text" 
                                    placeholder="VD: Cập nhật tính năng Lộ trình AI mới..."
                                    value={announcement.title}
                                    onChange={(e) => setAnnouncement({...announcement, title: e.target.value})}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Nội dung chi tiết</label>
                                <textarea 
                                    rows="5"
                                    placeholder="Nhập nội dung thông báo..."
                                    value={announcement.content}
                                    onChange={(e) => setAnnouncement({...announcement, content: e.target.value})}
                                    required
                                ></textarea>
                            </div>
                            <button type="submit" className="primary-btn send-btn">Gửi thông báo ngay</button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}