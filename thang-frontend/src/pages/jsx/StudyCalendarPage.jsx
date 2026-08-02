import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/StudyCalendarPage.css";
import axiosClient from "../../api/axiosClient";

export default function StudyCalendarPage() {
    const navigate = useNavigate();
    
    // Luồng quản lý ngày tháng và dữ liệu lịch
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState({});
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [refreshTrigger, setRefreshTrigger] = useState(0); 

    // State quản lý đóng/mở Modal THÊM LỊCH
    const [showModal, setShowModal] = useState(false);
    const [title, setTitle] = useState("");
    const [scheduleDate, setScheduleDate] = useState("");
    const [scheduleTime, setScheduleTime] = useState("");
    const [scheduleType, setScheduleType] = useState("math");

    // 🔥 STATE MỚI: Quản lý ngày đang được chọn để XEM CHI TIẾT
    const [selectedDay, setSelectedDay] = useState(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const currentMonthLabel = `Tháng ${month + 1}, ${year}`;

    // Tự động tính toán ma trận lưới lịch
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay(); 
    const firstDayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const calendarDays = [];
    for (let i = 0; i < firstDayOffset; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);

    // Danh sách khóa học để chọn
    const [courses, setCourses] = useState([]);
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await axiosClient.get("/courses");
                setCourses(res.data);
            } catch (err) {
                console.error("Lỗi lấy danh sách khóa học:", err);
            }
        };
        fetchCourses();
    }, []);

    // Hàm xử lý gửi dữ liệu lên Backend để lưu lịch học mới
    const handleAddScheduleSubmit = async (e) => {
        e.preventDefault();
        const storedUser = localStorage.getItem("user");
        if (!storedUser) {
            alert("Vui lòng đăng nhập trước khi thêm lịch học!");
            return;
        }
        const user = JSON.parse(storedUser);
        const userId = user.user_id || user.id;

        const payload = {
            user_id: userId,
            title: title,
            schedule_date: scheduleDate,
            schedule_time: scheduleTime,
            schedule_type: scheduleType
        };

        try {
            await axiosClient.post("/schedules", payload);
            setTitle("");
            setScheduleDate("");
            setScheduleTime("");
            setScheduleType("math");
            setShowModal(false);
            setRefreshTrigger(prev => prev + 1);
            alert("🎉 Thêm lịch học thành công!");
        } catch (error) {
            console.error("Lỗi khi thêm lịch học:", error);
            alert("Có lỗi xảy ra khi lưu lịch học!");
        }
    };

    // Luồng gọi API lấy dữ liệu lịch về hiển thị
    useEffect(() => {
        let isCurrentRequest = true; 

        const fetchSchedules = async () => {
            try {
                const response = await axiosClient.get(`/schedules?month=${month + 1}&year=${year}`);
                if (!isCurrentRequest) return; 

                if (response.data) {
                    const eventMap = {};
                    const upcomingList = [];

                    response.data.forEach(item => {
                        const rawDate = item.schedule_date || item.scheduleDate;
                        const rawId = item.schedule_id || item.scheduleId;
                        const rawTime = item.schedule_time || item.scheduleTime;
                        const rawType = item.schedule_type || item.scheduleType;

                        if (!rawDate) return;

                        const dateParts = rawDate.split("-");
                        if (dateParts.length !== 3) return;
                        const dayNum = parseInt(dateParts[2], 10);

                        if (!eventMap[dayNum]) eventMap[dayNum] = [];
                        eventMap[dayNum].push({
                            id: rawId,
                            title: item.title,
                            time: rawTime,
                            type: rawType || "math"
                        });

                        const eventDate = new Date(rawDate);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        if (eventDate >= today) {
                            upcomingList.push({
                                date: `${dayNum < 10 ? '0' + dayNum : dayNum}/${month + 1 < 10 ? '0' + (month + 1) : month + 1}`,
                                title: item.title,
                                type: rawType || "math"
                            });
                        }
                    });

                    setEvents(eventMap);
                    setUpcomingEvents(upcomingList.slice(0, 5));
                }
            } catch (error) {
                console.error("Lỗi khi tải lịch học:", error);
                setEvents({});
                setUpcomingEvents([]);
            }
        };

        fetchSchedules();

        return () => { isCurrentRequest = false; };
    }, [currentDate, refreshTrigger]);

    return (
        <div className="calendar-page">
            <header className="calendar-header">
                <div className="header-left">
                    <span className="back-btn" onClick={() => navigate("/home")}>← Trang chủ</span>
                    <h1>📅 Lịch Học & Nhắc Nhở</h1>
                </div>
                <button className="add-event-btn" onClick={() => setShowModal(true)}>+ Thêm lịch học</button>
            </header>

            <div className="calendar-container">
                {/* CỘT TRÁI */}
                <div className="sidebar-events">
                    <div className="upcoming-box">
                        <h3>Sắp diễn ra</h3>
                        <div className="upcoming-list">
                            {upcomingEvents.length === 0 ? (
                                <div style={{ color: '#888', padding: '10px' }}>Không có lịch nào sắp tới.</div>
                            ) : (
                                upcomingEvents.map((ev, idx) => (
                                    <div className={`upcoming-item ${ev.type}`} key={idx}>
                                        <div className="event-date">{ev.date}</div>
                                        <div className="event-title">{ev.title}</div>
                                    </div>
                                ))
                            )}
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

                {/* CỘT PHẢI */}
                <div className="main-calendar">
                    <div className="calendar-toolbar">
                        <button className="nav-month-btn" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>◀</button>
                        <h2>{currentMonthLabel}</h2>
                        <button className="nav-month-btn" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>▶</button>
                    </div>

                    <div className="weekday-headers">
                        {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                            <div className="weekday-header" key={day}>{day}</div>
                        ))}
                    </div>

                    <div className="calendar-grid">
                        {calendarDays.map((day, index) => (
                            /* 🔥 ĐÃ THÊM: Sự kiện onClick bấm vào ô ngày để gán ngày đang xem chi tiết */
                            <div 
                                className={`day-cell ${!day ? 'empty' : ''}`} 
                                key={index}
                                onClick={() => day && setSelectedDay(day)}
                                style={{ cursor: day ? "pointer" : "default" }}
                            >
                                {day && (
                                    <>
                                        <span className="day-number">{day}</span>
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

            {/* =========================================================
                🔥 KHUNG FORM NỔI (MODAL) XEM CHI TIẾT LỊCH HỌC TRONG NGÀY
               ========================================================= */}
            {selectedDay && (
                <div className="modal-overlay" onClick={() => setSelectedDay(null)} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ background: "#fff", padding: "24px", borderRadius: "16px", width: "450px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
                            <h3 style={{ fontSize: "20px", color: "#0f172a", margin: 0 }}>📅 Chi tiết ngày {selectedDay < 10 ? '0' + selectedDay : selectedDay}/{month + 1 < 10 ? '0' + (month + 1) : month + 1}/{year}</h3>
                            <span onClick={() => setSelectedDay(null)} style={{ cursor: "pointer", fontSize: "24px", color: "#64748b", fontWeight: "bold" }}>&times;</span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                            {!events[selectedDay] || events[selectedDay].length === 0 ? (
                                <div style={{ textAlign: "center", color: "#64748b", padding: "20px", fontStyle: "italic" }}>Không có lịch học hoặc nhắc nhở nào trong ngày này.</div>
                            ) : (
                                events[selectedDay].map(ev => (
                                    <div className={`upcoming-item ${ev.type}`} key={ev.id} style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "14px", borderRadius: "12px", borderLeft: "5px solid" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <span style={{ fontSize: "12px", fontWeight: "700", opacity: 0.8 }}>⏰ {ev.time}</span>
                                            <span style={{ fontSize: "11px", fontWeight: "600", textTransform: "uppercase" }}>{ev.type === 'math' ? 'Toán' : ev.type === 'physics' ? 'Lý' : ev.type === 'english' ? 'Anh' : 'Kỳ thi'}</span>
                                        </div>
                                        <div style={{ fontSize: "15px", fontWeight: "600", marginTop: "2px" }}>{ev.title}</div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button onClick={() => setSelectedDay(null)} style={{ width: "100%", marginTop: "20px", padding: "10px", borderRadius: "10px", border: "none", background: "#f1f5f9", color: "#475569", fontWeight: "600", cursor: "pointer", transition: "0.2s" }}>
                            Đóng cửa sổ
                        </button>
                    </div>
                </div>
            )}

            {/* MODAL THÊM LỊCH HỌC */}
            {showModal && (
                <div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
                    <div className="modal-content" style={{ background: "#fff", padding: "24px", borderRadius: "12px", width: "400px", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                        <h3 style={{ marginBottom: "16px", fontSize: "20px" }}>📅 Thêm lịch học cá nhân</h3>
                        <form onSubmit={handleAddScheduleSubmit}>
                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>Liên kết khóa học (Tùy chọn):</label>
                                <select 
                                    style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                                    onChange={(e) => {
                                        const c = courses.find(x => x.courseId == e.target.value);
                                        if (c) setTitle("Học " + c.title);
                                    }}
                                >
                                    <option value="">-- Chọn khóa học --</option>
                                    {courses.map(c => (
                                        <option key={c.courseId} value={c.courseId}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: "12px" }}>
                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>Tiêu đề công việc:</label>
                                <input type="text" placeholder="Ví dụ: Ôn tập chương 1 lý" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
                            </div>
                            <div style={{ marginBottom: "12px", display: "flex", gap: "10px" }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>Chọn ngày:</label>
                                    <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>Chọn giờ:</label>
                                    <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} required style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: "20px" }}>
                                <label style={{ display: "block", marginBottom: "4px", fontWeight: "600" }}>Phân loại (Màu sắc):</label>
                                <select value={scheduleType} onChange={(e) => setScheduleType(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}>
                                    <option value="math">Toán học (Xanh dương)</option>
                                    <option value="physics">Vật lý (Tím)</option>
                                    <option value="english">Tiếng Anh (Xanh lá)</option>
                                    <option value="exam">Kỳ thi (Đỏ)</option>
                                </select>
                            </div>
                            <div style={{ display: "flex", justifyContent: "end", gap: "10px" }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid #ccc", background: "#f1f5f9", cursor: "pointer", fontWeight: "600", color: "#475569" }}>Hủy</button>
                                <button type="submit" style={{ padding: "8px 16px", borderRadius: "6px", border: "none", background: "#3b82f6", color: "#fff", fontWeight: "600", cursor: "pointer" }}>Lưu lịch học</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}