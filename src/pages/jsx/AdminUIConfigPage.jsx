import { useNavigate } from "react-router-dom";
import "../css/AdminUIConfigPage.css";
import React, { useState, useEffect } from "react"; // <--- Thêm useEffect vào đây

export default function AdminUIConfigPage() {
    const navigate = useNavigate();
    const [activeMenu, setActiveMenu] = useState("ui"); // <--- Khai báo activeMenu cho trang UI Config

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
}, [navigate]);
    
    // State cho Cấu hình Banner
    const [bannerConfig, setBannerConfig] = useState({
        title: "Bứt phá điểm số cùng Lộ trình AI",
        subtitle: "Hệ thống ôn thi THPT Quốc gia thông minh. Phân tích năng lực, cá nhân hóa lộ trình học tập để tối ưu hóa điểm số của bạn.",
        btnText: "Khám phá ngay"
    });

    // State cho Gửi thông báo
    const [announcement, setAnnouncement] = useState({
        target: "all",
        title: "",
        content: ""
    });

    const handleSaveBanner = (e) => {
        e.preventDefault();
        alert("Đã lưu cấu hình Banner thành công! (Dữ liệu này sẽ được gọi API lưu vào DB)");
    };

    const handleSendAnnouncement = (e) => {
        e.preventDefault();
        alert(`Đã gửi thông báo "${announcement.title}" tới: ${announcement.target}`);
        setAnnouncement({ target: "all", title: "", content: "" }); // Reset form
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    return (
        <div className="admin-layout">
            {/* SIDEBAR (Tương tự Dashboard nhưng Active ở mục UI) */}
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

            {/* MAIN CONTENT */}
            <main className="admin-main">
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Cấu hình Nền tảng</h1>
                        <p>Tùy chỉnh giao diện Trang chủ và Quản lý thông báo hệ thống.</p>
                    </div>
                </header>

                <div className="admin-content ui-config-content">
                    
                    {/* CỘT TRÁI: FORM CẤU HÌNH BANNER */}
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
                            <div className="form-group">
                                <label>Cập nhật ảnh minh họa</label>
                                <input type="file" accept="image/*" className="file-input" />
                            </div>
                            
                            <button type="submit" className="primary-btn">Lưu cấu hình UI</button>
                        </form>
                    </div>

                    {/* CỘT PHẢI: FORM GỬI THÔNG BÁO (ANNOUNCEMENTS) */}
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