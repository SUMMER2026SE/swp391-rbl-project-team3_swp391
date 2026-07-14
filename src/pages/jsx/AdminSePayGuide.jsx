import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdminDashboardPage.css'; // Reuse dashboard css or create new if needed

const AdminSePayGuide = () => {
    const navigate = useNavigate();
    const [activeMenu] = useState("sepay"); // Định nghĩa trạng thái menu để active sidebar
    const webhookUrl = "https://<your-domain>/api/payments/sepay/webhook"; // You can replace <your-domain> later when deployed

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
                <header className="admin-header">
                    <div className="header-title">
                        <h1>Cấu hình Webhook SePay</h1>
                        <p>Hướng dẫn tích hợp cổng tự động duyệt khóa học qua SePay ngân hàng.</p>
                    </div>
                </header>

                <div className="admin-content" style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <h3>Hướng dẫn tích hợp tự động duyệt khóa học qua SePay</h3>
                    <p style={{ color: '#475569', lineHeight: '1.6' }}>
                        Để hệ thống tự động nhận diện người dùng chuyển khoản và kích hoạt khóa học,
                        bạn cần cấu hình Webhook trên trang quản trị của SePay theo các bước sau:
                    </p>

                    <div className="guide-step" style={{ marginTop: '20px' }}>
                        <h4>Bước 1: Lấy đường dẫn Webhook</h4>
                        <p>Sao chép đường dẫn Webhook của hệ thống PrepAce dưới đây:</p>
                        <div style={{ background: '#f4f4f4', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', color: '#0f172a', fontWeight: '600' }}>
                            {webhookUrl}
                        </div>
                    </div>

                    <div className="guide-step" style={{ marginTop: '20px' }}>
                        <h4>Bước 2: Cấu hình trên My.SePay.vn</h4>
                        <ul style={{ lineHeight: '2', color: '#334155' }}>
                            <li>Đăng nhập vào tài khoản <a href="https://my.sepay.vn" target="_blank" rel="noreferrer" style={{ color: '#0284c7' }}>my.sepay.vn</a>.</li>
                            <li>Truy cập menu <strong>Tích hợp (Integrations)</strong> bên tay trái.</li>
                            <li>Chọn mục <strong>Thêm Webhook (Add Webhook)</strong>.</li>
                            <li>Dán đường dẫn Webhook vừa sao chép vào ô <strong>URL Webhook</strong>.</li>
                            <li>Trong mục <strong>Sự kiện kích hoạt (Events)</strong>, chọn <code>Giao dịch nhận tiền (Money In)</code>.</li>
                            <li>Nhấn <strong>Lưu cài đặt (Save)</strong>.</li>
                        </ul>
                    </div>

                    <div className="guide-step" style={{ marginTop: '20px' }}>
                        <h4>Bước 3: Hiểu luồng hoạt động</h4>
                        <p style={{ color: '#475569', lineHeight: '1.6' }}>
                            Khi học viên tạo giao dịch mua khóa học, hệ thống sẽ sinh ra một mã chuyển khoản có dạng <code>PREPACE 15</code> (ví dụ mã đơn là 15).
                            <br/><br/>
                            Học viên mở ứng dụng ngân hàng và chuyển khoản với nội dung là <code>PREPACE 15</code>.
                            <br/><br/>
                            Ngân hàng báo có ➔ SePay nhận được giao dịch ➔ SePay gửi dữ liệu (POST) qua Webhook ➔ Hệ thống PrepAce đọc nội dung, tìm thấy chữ <code>PREPACE 15</code>, và tự động kích hoạt khóa học cho học viên.
                        </p>
                    </div>

                    <div className="guide-step" style={{ marginTop: '30px', padding: '15px', background: '#e0f2fe', borderLeft: '4px solid #0284c7', borderRadius: '0 8px 8px 0' }}>
                        <h4 style={{ color: '#0369a1', margin: '0 0 10px 0' }}>💡 Mẹo: Test Webhook</h4>
                        <p style={{ margin: 0, color: '#0c4a6e', fontSize: '14px', lineHeight: '1.5' }}>
                            Bạn có thể dùng tính năng "Test Webhook" trên SePay để gửi một giao dịch giả lập chứa nội dung <code>PREPACE &lt;Mã Đơn&gt;</code> để kiểm tra xem hệ thống có nhận được không.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminSePayGuide;