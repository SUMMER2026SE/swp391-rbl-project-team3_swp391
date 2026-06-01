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
            id: 1, title: "Mastering Mathematics 12", teacher: "Nguyen Minh Quan", userId: 2, subject: "Toán học",
            price: "599,000đ", students: 1250, thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 2, title: "Physics Problem Solving Techniques", teacher: "Tran Bao Chau", userId: 3, subject: "Vật lý",
            price: "499,000đ", students: 980, thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 3, title: "English Vocabulary & Grammar", teacher: "Le Hoang Nam", userId: 5, subject: "Tiếng Anh",
            price: "399,000đ", students: 2100, thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80"
        }
    ]);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) setUser(JSON.parse(storedUser));

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

        axiosClient.get("/courses")
            .then(res => setFeaturedCourses(res.data.slice(0, 3)))
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
        navigate("/");
    };

    return (
        <div className="home-layout">
            
            {/* SIDEBAR TỪ NHÁNH MAIN */}
            <aside className="sidebar">
                <div className="logo" onClick={() => navigate("/home")} style={{cursor: 'pointer'}}>PrepAce</div>

                <ul className="menu">
                    <li onClick={() => navigate("/home")}>Trang chủ</li>
                    <li onClick={() => navigate("/courses")}>Khóa học</li>
                    <li>Luyện đề</li>
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

            {/* PHẦN NỘI DUNG CHÍNH */}
            <main className="content">
                
                {/* THANH HEADER CHỨA SEARCH VÀ COUNTDOWN CHẠY ĐỘNG */}
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
                        🔥 THPT QG 2026: <strong>{timeLeft.days}</strong> ngày <strong>{timeLeft.hours}</strong> giờ
                    </div>

                    <div className="action-icons">
    {/* Nút Lịch học dùng SVG */}
    <button className="icon-btn" title="Lịch học" onClick={() => navigate('/calendar')}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{width: '20px', height: '20px', color: '#475569'}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    </button>

    {/* Nút Thông báo dùng SVG */}
    <button className="icon-btn" title="Thông báo" onClick={() => navigate('/notifications')}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" style={{width: '20px', height: '20px', color: '#475569'}}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
    </button>
</div>
                </div>

                {/* HERO BANNER CHUẨN MAIN */}
                <section className="hero">
                    <h1>
                        Nền tảng học tập thích ứng <br />
                        Bứt phá điểm số cùng Lộ trình AI
                    </h1>
                    <p>
                        Hệ thống ôn thi THPT Quốc gia thông minh. Phân tích năng lực chính xác, 
                        tự động cá nhân hóa lộ trình bài tập (Adaptive Path) giúp tối ưu hóa điểm số của bạn.
                    </p>
                    <button className="start-btn" onClick={() => navigate("/courses")}>
                        Khám phá ngay
                    </button>
                </section>

                {/* KHÓA HỌC NỔI BẬT (Đã bọc bằng cấu trúc CSS của main) */}
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

                {/* CTA TỪ NHÁNH MAIN */}
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