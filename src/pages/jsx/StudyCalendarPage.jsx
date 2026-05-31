import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/StudyCalendarPage.css";

export default function StudyCalendarPage() {
    const navigate = useNavigate();

    // Lấy tháng hiện tại (Mock data: Đang set cứng là Tháng 6/2026 - Tháng thi)
    const currentMonth = "Tháng 6, 2026";
    const daysInMonth = 30; // Tháng 6 có 30 ngày
    const firstDayOffset = 0; // Giả sử mùng 1 bắt đầu vào Thứ 2 (index 0)

    // Mock dữ liệu sự kiện (Lịch học/Thi)
    const [events, setEvents] = useState({
        5: [{ id: 1, title: "Luyện đề Toán số 1", type: "math", time: "19:00" }],
        12: [{ id: 2, title: "Kiểm tra Lý 45p", type: "physics", time: "14:00" }],
        15: [{ id: 3, title: "Livestream Tiếng Anh", type: "english", time: "20:00" }],
        28: [{ id: 4, title: "🔥 THI THPT QUỐC GIA", type: "exam", time: "07:00" }]
    });

    const upcomingEvents = [
        { date: "05/06", title: "Luyện đề Toán số 1", type: "math" },
        { date: "12/06", title: "Kiểm tra Lý 45p", type: "physics" },
        { date: "15/06", title: "Livestream Tiếng Anh", type: "english" },
        { date: "28/06", title: "Thi THPT Quốc Gia", type: "exam" }
    ];

    // Tạo mảng ngày để render Grid
    const calendarDays = [];
    for (let i = 0; i < firstDayOffset; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    return (
        <div className="calendar-page">
            <header className="calendar-header">
                <div className="header-left">
                    <span className="back-btn" onClick={() => navigate("/home")}>← Trang chủ</span>
                    <h1>📅 Lịch Học & Nhắc Nhở</h1>
                </div>
                <button className="add-event-btn">+ Thêm lịch học</button>
            </header>

            <div className="calendar-container">
                {/* CỘT TRÁI: DANH SÁCH SỰ KIỆN SẮP TỚI */}
                <div className="sidebar-events">
                    <div className="upcoming-box">
                        <h3>Sắp diễn ra</h3>
                        <div className="upcoming-list">
                            {upcomingEvents.map((ev, idx) => (
                                <div className={`upcoming-item ${ev.type}`} key={idx}>
                                    <div className="event-date">{ev.date}</div>
                                    <div className="event-title">{ev.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="filter-box">
                        <h3>Phân loại</h3>
                        <div className="filter-tags">
                            <span className="tag math">Toán học</span>
                            <span className="tag physics">Vật lý</span>
                            <span className="tag english">Tiếng Anh</span>
                            <span className="tag exam">Kỳ thi</span>
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: LỊCH CHÍNH (CALENDAR GRID) */}
                <div className="main-calendar">
                    <div className="calendar-toolbar">
                        <button className="nav-month-btn">◀</button>
                        <h2>{currentMonth}</h2>
                        <button className="nav-month-btn">▶</button>
                    </div>

                    <div className="calendar-grid">
                        {/* Tiêu đề các ngày trong tuần */}
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                            <div className="weekday-header" key={day}>{day}</div>
                        ))}

                        {/* Các ô ngày trong tháng */}
                        {calendarDays.map((day, index) => (
                            <div className={`day-cell ${!day ? 'empty' : ''}`} key={index}>
                                {day && (
                                    <>
                                        <span className={`day-number ${day === 28 ? 'highlight' : ''}`}>{day}</span>
                                        <div className="day-events">
                                            {events[day]?.map(ev => (
                                                <div className={`event-badge ${ev.type}`} key={ev.id}>
                                                    {ev.time} - {ev.title}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}