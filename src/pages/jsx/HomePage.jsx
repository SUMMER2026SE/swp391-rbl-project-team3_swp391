import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; 
import "../css/HomePage.css";

export default function HomePage() {
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

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

    useEffect(() => {
        // ===== SỬA AN TOÀN PHẦN USER =====
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Lỗi parse user:", e);
                localStorage.removeItem("user");
            }
        }

        // Countdown
        const examDate = new Date("2026-06-28T00:00:00").getTime();
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = examDate - now;
            if (distance > 0) {
                setTimeLeft({
                    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
                });
            }
        }, 1000);

        // Fetch courses
        axiosClient.get("/courses")
            .then(res => {
                console.log(">>> DỮ LIỆU KHÓA HỌC:", res.data);
                // ... (giữ nguyên code xử lý courses của bạn)
            })
            .catch(err => console.log("Dùng data mẫu", err));

            return {
                id: c.course_id || c.courseId || c.id,
                title: c.course_title || c.courseTitle || c.title || "Khóa học chưa tên",
                thumbnail: c.thumbnail_url || c.thumbnailUrl || c.thumbnail,
                teacher: c.teacher_name || c.teacherName || c.teacher || "Giáo viên",
                subject: c.subject_name || c.subjectName || c.subject || "Chung",
                price: displayPrice,
                students: c.students || c.student_count || c.studentCount || 0,
                userId: c.teacher_id || c.teacherId || c.userId || 2
            };
        });
        
        // Đẩy thẳng 3 khóa học xịn từ Database lên màn hình
        setFeaturedCourses(mappedData.slice(0, 3));
    }
})
.catch(err => console.log("Dùng data mẫu do chưa kết nối Backend", err));
        return () => clearInterval(interval);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        navigate("/home");
    };

    return (
        <div className="home-layout">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="logo" onClick={() => navigate("/home")} style={{cursor: 'pointer'}}>PrepAce</div>

                <ul className="menu">
                    <li onClick={() => navigate("/home")}>Trang chủ</li>
                    <li onClick={() => navigate("/courses")}>Khóa học</li>
                    <li onClick={() => navigate("/tests")}>Luyện đề</li>
                    <li onClick={() => navigate("/adaptive-path")}>Tiến độ</li>
                    <li>Tư vấn ngành</li>
                </ul>

                <div className="sidebar-actions">
                    {user ? (
                        <>
                            <button className="profile-btn" onClick={() => navigate("/profile")}>
                                👤 {user?.fullName || "Profile"}
                            </button>
                            <button className="logout-btn" onClick={handleLogout}>
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => navigate("/auth", { state: { mode: "login" } })}>Login</button>
                            <button className="register-btn" onClick={() => navigate("/auth", { state: { mode: "register" } })}>Register</button>
                        </>
                    )}
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="content">
                {/* HEADER */}
                <div className="content-header">
                    <form className="search-bar" onSubmit={handleSearchSubmit}>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm khóa học, giáo viên..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="search-icon-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{width: '18px', height: '18px'}}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </button>
                    </form>

                    <div className="exam-countdown">
                        🔥 THPT QG 2026: <strong>{timeLeft.days}</strong> ngày <strong>{timeLeft.hours}</strong> giờ <strong>{timeLeft.minutes}</strong> phút
                    </div>
                </div>

                {/* HERO */}
                <section className="hero">
                    <h1>
                        Nền tảng học tập thích ứng <br />
                        Bứt phá điểm số cùng Lộ trình AI
                    </h1>
                    <p>
                        Hệ thống ôn thi THPT Quốc gia thông minh. Phân tích năng lực chính xác, 
                        tự động cá nhân hóa lộ trình bài tập.
                    </p>
                    <button className="start-btn" onClick={() => navigate("/tests")}>
                        Bắt đầu luyện đề ngay
                    </button>
                </section>

                {/* KHÓA HỌC NỔI BẬT */}
                <div className="section-title-container">
                    <h2>Khóa học Nổi bật</h2>
                    <span className="view-all-link" onClick={() => navigate("/courses")}>Xem tất cả ➔</span>
                </div>

                <section className="course-grid">
                    {featuredCourses.map((course) => (
                        <div className="course-card" key={course.id} onClick={() => navigate(`/course/${course.id}`)}>
                            <div className="course-thumb">
                                <img src={course.thumbnail} alt={course.title} />
                                <span className="subject-badge">{course.subject}</span>
                            </div>
                            <div className="course-info">
                                <h3 className="course-title">{course.title}</h3>
                                <p className="course-teacher" onClick={(e) => { e.stopPropagation(); navigate(`/instructor/${course.userId}`); }}>
                                    👨‍🏫 {course.teacher}
                                </p>
                                <div className="course-meta">
                                    <span className="students">👥 {course.students} học viên</span>
                                    <span className="price-tag">{course.price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* CTA */}
                <section className="cta">
                    <h2>Sẵn sàng cho kỳ thi Đại học?</h2>
                    <p>Đăng ký miễn phí và bắt đầu ngay hôm nay.</p>
                    <button className="register-btn" onClick={() => navigate("/auth", { state: { mode: "register" } })}>
                        Đăng Ký Miễn Phí
                    </button>
                </section>
            </main>
        </div>
    );
}