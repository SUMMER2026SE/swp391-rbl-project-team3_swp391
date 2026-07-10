import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { logout } from "../../services/authService";
import "../css/HomePage.css";

export default function HomePage() {
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ years: 0, months: 0, days: 0});

    const [featuredCourses, setFeaturedCourses] = useState([
        {
            id: 1, title: "Mastering Mathematics 12 kk", teacher: "Nguyen Minh Quan", userId: 2, subject: "Toán học",
            price: "599,000đ", students: 1250, thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 2, title: "Physics Problem Solving Techniques kk", teacher: "Tran Bao Chau", userId: 3, subject: "Vật lý",
            price: "499,000đ", students: 980, thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 3, title: "English Vocabulary & Grammar kk", teacher: "Le Hoang Nam", userId: 5, subject: "Tiếng Anh",
            price: "399,000đ", students: 2100, thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80"
        }
    ]);

    //AVATAR
    const currentAvatar = user?.avatarUrl || user?.avatar_url || null;

    const updateCountdown = () => {
        const now = new Date();
        const target = new Date(2027, 5, 28); // 28/06/2027

        if (now >= target) {
            setTimeLeft({
                years: 0,
                months: 0,
                days: 0
            });
            return;
        }
        let years = target.getFullYear() - now.getFullYear();
        let months = target.getMonth() - now.getMonth();
        let days = target.getDate() - now.getDate();

        // Nếu ngày âm
        if (days < 0) {
            months--;
            const previousMonth = new Date(
                target.getFullYear(),
                target.getMonth(),
                0
            );
            days += previousMonth.getDate();
        }

        // Nếu tháng âm
        if (months < 0) {
            years--;
            months += 12;
        }
        setTimeLeft({
            years,
            months,
            days
        });
    };
   useEffect(() => {
        // 1. SỬA AN TOÀN PHẦN USER
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Lỗi parse user:", e);
                localStorage.removeItem("user");
            }
        }

        // 2. CẬP NHẬT COUNTDOWN CHUẨN ĐỒNG BỘ 2027 (Gọi hàm updateCountdown mỗi giây)
        updateCountdown();
        const interval = setInterval(() => {
            updateCountdown();
        }, 1000);

        // 3. FETCH COURSES VÀ SỬA LỖI HIỂN THỊ ẢNH THUMBNAIL
        axiosClient.get("/courses")
            .then(res => {
                console.log(">>> DỮ LIỆU KHÓA HỌC CHUẨN:", res.data);
                const rawCourses = Array.isArray(res.data) ? res.data : (res.data.courses || []);
                
                if (rawCourses.length > 0) {
                    const mappedData = rawCourses.map(c => {
                        const displayPrice = typeof c.price === "number"
                            ? new Intl.NumberFormat("vi-VN").format(c.price) + "đ"
                            : (c.price || "Miễn phí");

                        // Lấy link ảnh gốc
                        let thumbnail = c.thumbnail_url || c.thumbnailUrl || c.thumbnail;

                        // Nếu là đường dẫn tương đối từ backend -> nối thêm localhost:8080 y chang bên CoursesPage
                        if (thumbnail && !thumbnail.startsWith("http")) {
                            thumbnail = `http://localhost:8080${thumbnail}`;
                        }

                        // Nếu trống hoàn toàn thì lấy ảnh dự phòng từ Unsplash
                        if (!thumbnail) {
                            thumbnail = "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80";
                        }

                        return {
                            id: c.course_id || c.courseId || c.id,
                            title: c.course_title || c.courseTitle || c.title || "Khóa học chưa tên",
                            thumbnail: thumbnail, // Chuỗi URL hoàn chỉnh sau khi xử lý
                            teacher: c.teacher_name || c.teacherName || c.teacher || "Giáo viên",
                            subject: c.subject_name || c.subjectName || c.subject || "Chung",
                            price: displayPrice,
                            students: c.students || c.student_count || c.studentCount || 0,
                            userId: c.teacher_id || c.teacherId || c.userId || 2
                        };
                    });
                    setFeaturedCourses(mappedData.slice(0, 3));
                }
            })
            .catch(err => {
                console.log("Dùng data khóa học mẫu do chưa kết nối Backend hoặc sập API:", err);
            });

        return () => clearInterval(interval);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    // const handleLogout = () => {
    //     localStorage.removeItem("token");
    //     localStorage.removeItem("user");
    //     setUser(null);
    //     navigate("/auth");
    // };

    const handleLogout = async () => {
        if (!window.confirm("Bạn có chắc muốn đăng xuất khỏi PrepAce?")) return;

        try {
            await logout();
        } catch (err) {
            console.error(err);
        }

        navigate("/auth");
    };

    return (
        <div className="home-layout">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div
                    className="logo"
                    onClick={() => navigate("/home")}
                    style={{ cursor: "pointer" }}
                >
                    <div className="logo-icon">🎓</div>

                    <div className="logo-text">
                        <h2>PrepAce</h2>
                        <span>AI Learning Platform</span>
                    </div>
                </div>
                {user && (
                    <div
                        className="user-card clickable"
                        onClick={() => navigate("/profile")}
                    >
                        <div className="avatar">
                            {currentAvatar ? (
                                <img
                                    src={currentAvatar}
                                    alt={user.fullName}
                                />
                            ) : (
                                user.fullName?.charAt(0).toUpperCase()
                            )}
                        </div>

                        <div className="user-info">
                            <h4>{user.fullName}</h4>
                            <span>Student</span>
                        </div>
                    </div>
                )}

                <ul className="menu">
                    <li onClick={()=>navigate("/home")}>
                        <span>🏠</span>
                        Trang chủ
                    </li>

                    <li onClick={()=>navigate("/courses")}>
                        <span>📚</span>
                        Khóa học
                    </li>

                    <li onClick={()=>navigate("/entry-test")}>
                        <span>📝</span>
                        Kiểm tra đầu vào
                    </li>

                    <li onClick={()=>navigate("/tests")}>
                        <span>📄</span>
                        Luyện đề
                    </li>

                    <li onClick={()=>navigate("/adaptive-path")}>
                        <span>🧠</span>
                        Lộ trình AI
                    </li>

                    <li onClick={()=>navigate("/ai/gap-diagnosis")}>
                        <span>📈</span>
                        Lỗ hổng kiến thức
                    </li>

                    <li onClick={()=>navigate("/ai/score-forecast")}>
                        <span>🎯</span>
                        Dự đoán điểm
                    </li>

                    <li onClick={()=>navigate("/ai/university-advising")}>
                        <span>🎓</span>
                        Tư vấn ngành
                    </li>
                    <li onClick={() => navigate("/calendar")}>
                        <span>📅</span>
                        Lịch học
                    </li>
                    <li onClick={() => navigate("/notifications")}>
                        <span>🔔</span>
                        Thông báo
                    </li>
                </ul>
<div className="sidebar-actions">
    {user ? (
        <button className="logout-btn" onClick={handleLogout}>
            🚪 Đăng xuất
        </button>
    ) : (
        <>
            <button
                className="login-btn"
                onClick={() => navigate("/auth", { state: { mode: "login" } })}
            >
                🔑 Đăng nhập
            </button>

                <div className="sidebar-actions">
                    {user ? (
                        <button
                            className="logout-btn"
                            onClick={() => setShowLogoutModal(true)}
                        >
                            Đăng xuất
                        </button>
                    ) : (
                        <>
                            <button
                                className="login-btn"
                                onClick={() => navigate("/auth", { state: { mode: "login" } })}
                            >
                                🔑 Đăng nhập
                            </button>

                            <button
                                className="register-btn"
                                onClick={() => navigate("/auth", { state: { mode: "register" } })}
                            >
                                ✨ Đăng ký
                            </button>
                        </>
                    )}
                </div>
            </aside>
                

            {/* MAIN CONTENT */}
            <main className="content">
                {/* HEADER */}
                <div className="content-header">
                    <form className="search-bar" onSubmit={handleSearchSubmit}>
                        <div className="search-icon">
                        🔍
                        </div>
                        <input
                        placeholder="Tìm khóa học, giáo viên..."
                        value={searchQuery}
                        onChange={(e)=>setSearchQuery(e.target.value)}
                        />

                        <div className="shortcut">
                        ⌘K
                        </div>

                        <button
                        type="submit"
                        className="search-icon-btn"
                        >
                        Tìm
                        </button>
                    </form>

                    <div className="countdown-wrapper">
                        <div className="countdown-title">
                        🔥 THPT Quốc gia 2027
                        </div>
                        <div className="countdown-box">
                            <div className="time-card">
                                <h2>{timeLeft.years}</h2>
                                <span>Năm</span>
                            </div>
                            <div className="time-card">
                                <h2>{timeLeft.months}</h2>
                                <span>Tháng</span>
                            </div>

                            <div className="time-card">
                                <h2>{timeLeft.days}</h2>
                                <span>Ngày</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HERO */}
                <section className="hero">
                    <div className="hero-left">
                        <span className="hero-badge">
                        🚀 AI Powered Learning
                        </span>

                        <h1>Bứt phá điểm số
                            <br/>
                        cùng PrepAce AI
                        </h1>
                        <p>
                        Hệ thống học tập thông minh sử dụng AI
                        để phân tích năng lực, xây dựng lộ trình cá nhân
                        và tối ưu kết quả kỳ thi THPT Quốc Gia.
                        </p>
                        <div className="hero-buttons">
                            <button
                            className="start-btn"
                            onClick={()=>navigate("/tests")}
                            >
                            🚀 Bắt đầu ngay
                            </button>

                            <button
                            className="secondary-btn"
                            onClick={()=>navigate("/courses")}
                            >
                            📚 Khóa học
                            </button>
                        </div>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <h2>12K+</h2>
                            <p>Học viên</p>
                        </div>

                        <div className="stat-item">
                            <h2>98%</h2>
                            <p>Tỷ lệ đỗ</p>
                        </div>
                        <div className="stat-item">
                            <h2>500+</h2>
                            <p>Bài học</p>
                        </div>
                    </div>
                </div>

                <div className="hero-right">
                    <div className="hero-circle"></div>
                        <div className="hero-card">
                            🤖
                            <h3>PrepAce AI</h3>
                            <p>
                            Đang phân tích lộ trình học...
                            </p>
                        </div>
                    </div>
                </section>

                {/* KHÓA HỌC NỔI BẬT */}
                <div className="section-title-container">
                    <div>
                        <span className="section-badge">
                            📚 Featured Courses
                        </span>
                        <h2>Khóa học nổi bật</h2>
                        <p>
                            Những khóa học được học viên đánh giá cao nhất trên PrepAce.
                        </p>
                    </div>

                    <button
                        className="view-all-btn"
                        onClick={() => navigate("/courses")}
                    >
                        Xem tất cả →
                    </button>
                </div>

                <section className="course-grid">
                    {featuredCourses.map(course => (
                        <div
                            className="course-card"
                            key={course.id}
                            onClick={() => navigate(`/course/${course.id}`)}
                        >
                            <div className="course-thumb">
                                <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                />

                                <span className="subject-badge">
                                    {course.subject}
                                </span>

                                <div className="course-overlay">
                                    <button>
                                        Xem chi tiết →
                                    </button>
                                </div>
                            </div>

                            <div className="course-info">
                                <div className="course-rating">
                                    ⭐⭐⭐⭐⭐
                                    <span>4.9</span>
                                </div>

                                <h3 className="course-title">
                                    {course.title}
                                </h3>

                                <p
                                    className="course-teacher"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/instructor/${course.userId}`);

                                    }}
                                >
                                    👨‍🏫 {course.teacher}
                                </p>

                                <div className="course-features">
                                    <span>👥 {course.students}</span>
                                    <span>🕒 20 giờ</span>
                                    <span>📄 120 bài</span>
                                </div>

                                <div className="course-footer">
                                    <span className="price-tag">
                                        {course.price}
                                    </span>

                                    <button>
                                        Mua ngay
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                </section>

                {/* CTA */}
                <section className="cta">
                    <div className="cta-content">
                        <span className="cta-badge">
                            🚀 START TODAY
                        </span>
                        <h2>
                            Chinh phục kỳ thi THPT Quốc Gia cùng PrepAce AI
                        </h2>
                        <p>
                            Hơn 12.000 học sinh đang học tập mỗi ngày với hệ thống AI cá nhân hóa.
                        </p>
                        <div className="cta-buttons">
                            <button
                                className="register-btn"
                                onClick={() =>
                                    navigate("/auth", {
                                        state: {
                                            mode: "register"
                                        }
                                    })
                                }
                            >
                                Đăng ký miễn phí
                            </button>
                            <button
                                className="secondary-btn"
                                onClick={() => navigate("/courses")}
                            >
                                Khám phá khóa học
                            </button>
                        </div>
                    </div>
                    <div className="cta-decoration">
                        🎓
                    </div>
                </section>
            </main>

            {/* Nút trợ lý AI nổi - Consult AI Chatbot (#26) */}
            <button
                className="ai-fab"
                title="PrepAce AI"
                onClick={() => navigate("/ai/chat")}
            >

                <span className="pulse"></span>
                🤖
            </button>
        </div>
    );
}