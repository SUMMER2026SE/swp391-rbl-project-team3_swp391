import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/NotificationsPage.css";
import axiosClient from "../../api/axiosClient";

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);

    // =========================================================
    // 1. GỌI API THEO ĐÚNG CÁC CỘT TRONG CƠ SỞ DỮ LIỆU CỦA BẠN
    // =========================================================
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // Đọc thông tin user từ máy để lấy quyền (role)
                const storedUser = localStorage.getItem("user");
                if (!storedUser) return;
                const user = JSON.parse(storedUser);

                // Gọi API lấy thông tin thông báo từ Backend đổ về
                const response = await axiosClient.get(`/notifications?role=${user.role}`);
                if (response.data) {
                    setNotifications(response.data);
                }
            } catch (error) {
                console.warn("[Offline Mode] Đang dùng data mẫu khớp 100% với cấu hình DB của bạn:");
                
                // DATA MẪU: Chỉ dùng các cột: notification_id, title, content, is_read, created_at
                setNotifications([
                    { 
                        notification_id: 1, 
                        title: "📢 Cập nhật tính năng Lộ trình AI mới", 
                        content: "Hệ thống vừa nâng cấp thuật toán phân tích năng lực. Truy cập tab Lộ trình AI để xem gợi ý học tập mới nhất dành cho bạn!", 
                        created_at: "10 phút trước", 
                        is_read: false
                    },
                    { 
                        notification_id: 2, 
                        title: "⏰ Nhắc nhở lịch học", 
                        content: "Bạn có lịch Luyện đề Toán số 1 vào lúc 19:00 tối nay. Nhớ chuẩn bị giấy nháp và máy tính Casio nhé!", 
                        created_at: "2 giờ trước", 
                        is_read: false
                    },
                    { 
                        notification_id: 3, 
                        title: "✅ Kết quả chấm bài", 
                        content: "Giáo viên Nguyễn Minh Quân đã chấm xong bài tập 'Derivative Homework' của bạn. Điểm: 8.5/10.", 
                        created_at: "1 ngày trước", 
                        is_read: true
                    },
                    { 
                        notification_id: 5, 
                        title: "❌ Khóa học bị từ chối xuất bản", 
                        content: "Admin đã từ chối xuất bản khóa học của bạn. Lý do: Thiếu video giới thiệu chương 2. Vui lòng kiểm tra và chỉnh sửa lại.", 
                        created_at: "Vừa xong", 
                        is_read: false
                    }
                ]);
            }
        };

        fetchNotifications();
    }, []);

    // =========================================================
    // MẸO THÔNG MINH: TỰ QUÉT TỪ KHÓA ĐỂ ĐỔI ICON (Bypass cột type)
    // =========================================================
    const getNotiIcon = (title) => {
        const text = title.toLowerCase();
        if (text.includes("ai")) return "⚙️";
        if (text.includes("lịch") || text.includes("nhắc")) return "📅";
        if (text.includes("chấm") || text.includes("bài")) return "📝";
        if (text.includes("khuyến mãi") || text.includes("🎉")) return "🎁";
        if (text.includes("từ chối") || text.includes("❌")) return "🚫";
        return "🔔"; // Icon mặc định
    };

    // Hàm cập nhật trạng thái đã đọc
    const handleMarkAsRead = (id) => {
        setNotifications(notifications.map(noti => 
            noti.notification_id === id ? { ...noti, is_read: true } : noti
        ));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(noti => ({ ...noti, is_read: true })));
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="notifications-page">
            <header className="noti-header">
                <div className="header-left">
                    {/* Quay lại trang trước đó thông minh */}
                    <span className="back-btn" onClick={() => navigate(-1)} style={{ cursor: "pointer" }}>
                        ← Quay lại
                    </span>
                    <h1>Thông báo của bạn</h1>
                </div>
            </header>

            <div className="noti-container">
                <div className="noti-panel">
                    <div className="panel-header">
                        <div className="tab-group">
                            <span className="tab active">Tất cả {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</span>
                            <span className="tab">Chưa đọc</span>
                        </div>
                        <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                            ✓ Đánh dấu tất cả đã đọc
                        </button>
                    </div>

                    <div className="noti-list">
                        {notifications.length === 0 ? (
                            <div className="empty-state">Bạn không có thông báo nào.</div>
                        ) : (
                            notifications.map(noti => (
                                <div 
                                    className={`noti-item ${noti.is_read ? 'read' : 'unread'}`} 
                                    key={noti.notification_id}
                                    onClick={() => handleMarkAsRead(noti.notification_id)}
                                >
                                    {/* Gọi hàm quét từ khóa tiêu đề để hiển thị icon */}
                                    <div className="noti-icon-box">
                                        {getNotiIcon(noti.title)}
                                    </div>
                                    
                                    <div className="noti-content-box">
                                        <h3>{noti.title}</h3>
                                        <p>{noti.content}</p>
                                        
                                        {/* LUỒNG ĐI THÔNG MINH: Quét chữ "từ chối" để hiện nút, và đẩy về Dashboard */}
                                        {noti.title.toLowerCase().includes("từ chối") && (
                                            <button 
                                                className="action-btn-small" 
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Chặn hành động click lan ra ngoài
                                                    navigate("/teacher/dashboard"); // Đẩy về trang danh sách khóa học của giáo viên
                                                }}
                                                style={{ marginTop: "10px", padding: "6px 12px", background: "#2747d9", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                            >
                                                📚 Đi đến quản lý khóa học
                                            </button>
                                        )}
                                        
                                        <span className="noti-time">{noti.created_at}</span>
                                    </div>
                                    {!noti.is_read && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}