import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/NotificationsPage.css";
import axiosClient from "../../api/axiosClient";

export default function NotificationsPage() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    
    // Quản lý tab đang chọn ('all' hoặc 'unread')
    const [activeTab, setActiveTab] = useState("all"); 

    // =========================================================
    // 1. GỌI API ĐỒNG BỘ ĐÚNG CỘT VÀ ÉP VIẾT HOA CHUỖI ROLE
    // =========================================================
    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const storedUser = localStorage.getItem("user");
                if (!storedUser) return;
                const user = JSON.parse(storedUser);
                const userId = user.user_id || user.id;

                // 🔥 ĐÃ SỬA: Check linh hoạt cả user.roleName và user.role để tránh bị rơi vào mặc định 'STUDENT'
                let rawRole = user.roleName || user.role || "STUDENT";
                const userRole = rawRole.toUpperCase();

                // Log ra console để Hưng kiểm tra nhanh xem Frontend đang gửi quyền gì lên Backend
                console.log("➡️ Đang gửi request thông báo với Role:", userRole, "và UserId:", userId);

                const response = await axiosClient.get(`/notifications?role=${userRole}&userId=${userId}`);
                if (response.data) {
                    setNotifications(response.data);
                }
            } catch (error) {
                console.warn("[Offline Mode] Đang dùng data mẫu (Đã chuẩn hóa theo CamelCase của BE):");
                
                setNotifications([
                    { 
                        notificationId: 1, 
                        title: "📢 Cập nhật tính năng Lộ trình AI mới", 
                        content: "Hệ thống vừa nâng cấp thuật toán phân tích năng lực. Truy cập tab Lộ trình AI để xem gợi ý học tập mới nhất dành cho bạn!", 
                        createdAt: "2026-07-10T01:30:00", 
                        is_read: false
                    },
                    { 
                        notificationId: 2, 
                        title: "⏰ Nhắc nhở: Sắp đến giờ học!", 
                        content: "Lịch học 'Luyện đề Toán số 1' của bạn sẽ bắt đầu vào lúc 19:00. Chuẩn bị vào bàn học thôi nào!", 
                        createdAt: "2026-07-10T01:40:00", 
                        is_read: false
                    },
                    { 
                        notificationId: 3, 
                        title: "✅ Kết quả chấm bài", 
                        content: "Giáo viên Nguyễn Minh Quân đã chấm xong bài tập 'Derivative Homework' của bạn. Điểm: 8.5/10.", 
                        createdAt: "2026-07-09T12:00:00", 
                        is_read: true
                    }
                ]);
            }
        };

        fetchNotifications();
    }, []);

    // Định dạng hiển thị thời gian thân thiện
    const formatTime = (dateStr) => {
        if (!dateStr || dateStr.includes("trước") || dateStr.includes("xong")) return dateStr;
        try {
            const d = new Date(dateStr);
            return `${d.getHours()}:${d.getMinutes() < 10 ? '0' + d.getMinutes() : d.getMinutes()} - ${d.getDate()}/${d.getMonth() + 1}`;
        } catch (e) {
            return dateStr;
        }
    };

    // Quét từ khóa tiêu đề để đổi Icon
    const getNotiIcon = (title) => {
        if (!title) return "🔔";
        const text = title.toLowerCase();
        if (text.includes("ai")) return "⚙️";
        if (text.includes("lịch") || text.includes("nhắc")) return "📅";
        if (text.includes("chấm") || text.includes("bài")) return "📝";
        if (text.includes("khuyến mãi") || text.includes("🎉")) return "🎁";
        if (text.includes("từ chối") || text.includes("❌")) return "🚫";
        return "🔔";
    };

    // Hàm cập nhật trạng thái đã đọc
    const handleMarkAsRead = (id) => {
        setNotifications(notifications.map(noti => 
            noti.notificationId === id ? { ...noti, is_read: true } : noti
        ));
    };

    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(noti => ({ ...noti, is_read: true })));
    };

    // Lọc danh sách thông báo theo Tab đang chọn
    const filteredNotifications = notifications.filter(noti => {
        if (activeTab === "unread") return !noti.is_read;
        return true; 
    });

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="notifications-page">
            <header className="noti-header">
                <div className="header-left">
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
                            <span 
                                className={`tab ${activeTab === "all" ? "active" : ""}`} 
                                onClick={() => setActiveTab("all")}
                            >
                                Tất cả {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
                            </span>
                            <span 
                                className={`tab ${activeTab === "unread" ? "active" : ""}`} 
                                onClick={() => setActiveTab("unread")}
                            >
                                Chưa đọc
                            </span>
                        </div>
                        <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                            ✓ Đánh dấu tất cả đã đọc
                        </button>
                    </div>

                    <div className="noti-list">
                        {filteredNotifications.length === 0 ? (
                            <div className="empty-state">
                                {activeTab === "unread" ? "Bạn không có thông báo chưa đọc nào." : "Bạn không có thông báo nào."}
                            </div>
                        ) : (
                            filteredNotifications.map(noti => (
                                <div 
                                    className={`noti-item ${noti.is_read ? 'read' : 'unread'}`} 
                                    key={noti.notificationId}
                                    onClick={() => handleMarkAsRead(noti.notificationId)}
                                >
                                    <div className="noti-icon-box">
                                        {getNotiIcon(noti.title)}
                                    </div>
                                    
                                    <div className="noti-content-box">
                                        <h3>{noti.title}</h3>
                                        <p>{noti.content}</p>
                                        
                                        {noti.title && noti.title.toLowerCase().includes("từ chối") && (
                                            <button 
                                                className="action-btn-small" 
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    navigate("/teacher/dashboard"); 
                                                }}
                                                style={{ marginTop: "10px", padding: "6px 12px", background: "#2747d9", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600" }}
                                            >
                                                📚 Đi đến quản lý khóa học
                                            </button>
                                        )}
                                        
                                        <span className="noti-time">{formatTime(noti.createdAt)}</span>
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