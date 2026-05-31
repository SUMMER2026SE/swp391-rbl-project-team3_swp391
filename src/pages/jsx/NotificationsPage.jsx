import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/NotificationsPage.css";
import axiosClient from "../../api/axiosClient"; // Nhớ import axiosClient của bạn
export default function NotificationsPage() {
    const navigate = useNavigate();

    // Mock dữ liệu thông báo (Dựa trên bảng Notifications trong DB)
    const [notifications, setNotifications] = useState([
        { 
            id: 1, 
            title: "📢 Cập nhật tính năng Lộ trình AI mới", 
            content: "Hệ thống vừa nâng cấp thuật toán phân tích năng lực. Truy cập tab Lộ trình AI để xem gợi ý học tập mới nhất dành cho bạn!", 
            time: "10 phút trước", 
            isRead: false,
            type: "system"
        },
        { 
            id: 2, 
            title: "⏰ Nhắc nhở lịch học", 
            content: "Bạn có lịch Luyện đề Toán số 1 vào lúc 19:00 tối nay. Nhớ chuẩn bị giấy nháp và máy tính Casio nhé!", 
            time: "2 giờ trước", 
            isRead: false,
            type: "reminder"
        },
        { 
            id: 3, 
            title: "✅ Kết quả chấm bài", 
            content: "Giáo viên Nguyễn Minh Quân đã chấm xong bài tập 'Derivative Homework' của bạn. Điểm: 8.5/10. Xem lại nhận xét chi tiết.", 
            time: "1 ngày trước", 
            isRead: true,
            type: "academic"
        },
        { 
            id: 4, 
            title: "🎉 Khuyến mãi khóa học mới", 
            content: "Giảm giá 20% khóa Luyện đề thực chiến môn Vật lý chỉ trong hôm nay. Đăng ký ngay!", 
            time: "3 ngày trước", 
            isRead: true,
            type: "promotion"
        },{ 
    id: 5, 
    title: "❌ Khóa học bị từ chối", 
    content: "Admin đã từ chối xuất bản khóa học 'Tuyệt đỉnh Casio'. Lý do: Thiếu video giới thiệu chương 2.", 
    time: "Vừa xong", 
    isRead: false,
    type: "admin_reject" // Loại thông báo mới
}

        
    ]);
    //khi nao can phan biet la teacher hay student thi dung


    // useEffect(() => {
    //     const user = JSON.parse(localStorage.getItem("user"));
    //     const role = user?.role || "STUDENT"; 

    //     axiosClient.get(`/notifications?role=${role}`)
    //         .then(res => setNotifications(res.data))
    //         .catch(err => console.log("Lỗi tải thông báo:", err));
    // }, []);

    // Hàm đánh dấu 1 thông báo là đã đọc
    const handleMarkAsRead = (id) => {
        setNotifications(notifications.map(noti => 
            noti.id === id ? { ...noti, isRead: true } : noti
        ));
    };

    // Hàm đánh dấu tất cả là đã đọc
    const handleMarkAllAsRead = () => {
        setNotifications(notifications.map(noti => ({ ...noti, isRead: true })));
    };

    // Đếm số thông báo chưa đọc
    const unreadCount = notifications.filter(n => !n.isRead).length;


    
    return (
        <div className="notifications-page">
            <header className="noti-header">
                <div className="header-left">
                    <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại</span>
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
                                    className={`noti-item ${noti.isRead ? 'read' : 'unread'}`} 
                                    key={noti.id}
                                    onClick={() => handleMarkAsRead(noti.id)}
                                >
                                    <div className="noti-icon-box">
                                        {noti.type === 'system' && '⚙️'}
                                        {noti.type === 'reminder' && '📅'}
                                        {noti.type === 'academic' && '📝'}
                                        {noti.type === 'promotion' && '🎁'}
                                        {noti.type === 'admin_reject' && '🚫'}
                                    </div>
                                    <div className="noti-content-box">
    <h3>{noti.title}</h3>
    <p>{noti.content}</p>
    
    {/* Nút hành động cho thông báo bị từ chối */}
    {noti.type === 'admin_reject' && (
        <button 
            className="action-btn-small" 
            onClick={(e) => {
                e.stopPropagation(); // Ngăn chặn sự kiện click của thẻ cha
                navigate("/teacher/edit-course/4"); // Điều hướng đến trang sửa khóa học
            }}
        >
            ✏️ Sửa khóa học ngay
        </button>
    )}
    
    <span className="noti-time">{noti.time}</span>
</div>
                                    {!noti.isRead && <div className="unread-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}