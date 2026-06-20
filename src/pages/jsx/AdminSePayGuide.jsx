import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/AdminDashboardPage.css'; // Reuse dashboard css or create new if needed

const AdminSePayGuide = () => {
    const navigate = useNavigate();
    const webhookUrl = "https://<your-domain>/api/payments/sepay/webhook"; // You can replace <your-domain> later when deployed

    return (
        <div className="admin-page">
            <header className="admin-header">
                <h2>Cấu hình Webhook SePay</h2>
                <button onClick={() => navigate('/admin')} className="btn-back">Quay lại Dashboard</button>
            </header>

            <div className="admin-content" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', background: '#fff', borderRadius: '8px' }}>
                <h3>Hướng dẫn tích hợp tự động duyệt khóa học qua SePay</h3>
                <p>
                    Để hệ thống tự động nhận diện người dùng chuyển khoản và kích hoạt khóa học,
                    bạn cần cấu hình Webhook trên trang quản trị của SePay theo các bước sau:
                </p>

                <div className="guide-step" style={{ marginTop: '20px' }}>
                    <h4>Bước 1: Lấy đường dẫn Webhook</h4>
                    <p>Sao chép đường dẫn Webhook của hệ thống PrepAce dưới đây:</p>
                    <div style={{ background: '#f4f4f4', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: 'monospace' }}>
                        {webhookUrl}
                    </div>
                </div>

                <div className="guide-step" style={{ marginTop: '20px' }}>
                    <h4>Bước 2: Cấu hình trên My.SePay.vn</h4>
                    <ul style={{ lineHeight: '1.8' }}>
                        <li>Đăng nhập vào tài khoản <a href="https://my.sepay.vn" target="_blank" rel="noreferrer">my.sepay.vn</a>.</li>
                        <li>Truy cập menu <strong>Tích hợp (Integrations)</strong> bên tay trái.</li>
                        <li>Chọn mục <strong>Thêm Webhook (Add Webhook)</strong>.</li>
                        <li>Dán đường dẫn Webhook vừa sao chép vào ô <strong>URL Webhook</strong>.</li>
                        <li>Trong mục <strong>Sự kiện kích hoạt (Events)</strong>, chọn <code>Giao dịch nhận tiền (Money In)</code>.</li>
                        <li>Nhấn <strong>Lưu cài đặt (Save)</strong>.</li>
                    </ul>
                </div>

                <div className="guide-step" style={{ marginTop: '20px' }}>
                    <h4>Bước 3: Hiểu luồng hoạt động</h4>
                    <p>
                        Khi học viên tạo giao dịch mua khóa học, hệ thống sẽ sinh ra một mã chuyển khoản có dạng <code>PREPACE 15</code> (ví dụ mã đơn là 15).
                        <br/><br/>
                        Học viên mở ứng dụng ngân hàng và chuyển khoản với nội dung là <code>PREPACE 15</code>.
                        <br/><br/>
                        Ngân hàng báo có ➔ SePay nhận được giao dịch ➔ SePay gửi dữ liệu (POST) qua Webhook ➔ Hệ thống PrepAce đọc nội dung, tìm thấy chữ <code>PREPACE 15</code>, và tự động kích hoạt khóa học cho học viên.
                    </p>
                </div>

                <div className="guide-step" style={{ marginTop: '30px', padding: '15px', background: '#e0f2fe', borderLeft: '4px solid #0284c7' }}>
                    <h4 style={{ color: '#0369a1', margin: '0 0 10px 0' }}>💡 Mẹo: Test Webhook</h4>
                    <p style={{ margin: 0, color: '#0c4a6e' }}>
                        Bạn có thể dùng tính năng "Test Webhook" trên SePay để gửi một giao dịch giả lập chứa nội dung <code>PREPACE &lt;Mã Đơn&gt;</code> để kiểm tra xem hệ thống có nhận được không.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminSePayGuide;
