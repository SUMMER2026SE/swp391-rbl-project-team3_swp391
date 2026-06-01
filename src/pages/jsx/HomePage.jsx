import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; // Nhớ kiểm tra lại đường dẫn import này nhé
import "../css/HomePage.css";

export default function HomePage() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    // State cho đồng hồ đếm ngược (Task 12)
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

    // Đút ngay 3 khóa học mẫu cũ của bạn vào đây làm giá trị mặc định ban đầu
    const [featuredCourses, setFeaturedCourses] = useState([
    {
        id: 1,
        title: "Mastering Mathematics 12",
        teacher: "Nguyen Minh Quan",
        userId: 2, // <-- Thêm trường userId của thầy Quân (Ví dụ ID là 2)
        subject: "Toán học",
        price: "599,000đ",
        students: 1250,
        thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 2,
        title: "Physics Problem Solving Techniques",
        teacher: "Tran Bao Chau",
        userId: 3, // <-- Thêm trường userId của cô Châu (Ví dụ ID là 3)
        subject: "Vật lý",
        price: "499,000đ",
        students: 980,
        thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 3,
        title: "English Vocabulary & Grammar",
        teacher: "Le Hoang Nam",
        userId: 5, // <-- Thêm trường userId của thầy Nam (Ví dụ ID là 5)
        subject: "Tiếng Anh",
        price: "399,000đ",
        students: 2100,
        thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80"
    }
]);

    useEffect(() => {
        // Lấy thông tin user từ LocalStorage
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }

        // Logic đếm ngược đến ngày thi THPT QG (28/06/2026)
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

        // KÍCH HOẠT GỌI BACKEND: 
        axiosClient.get("/courses")
            .then(res => {
                // Nếu lấy được data thật từ Backend, nó sẽ ghi đè lên dữ liệu mẫu cũ ngay!
                setFeaturedCourses(res.data.slice(0, 3)); 
            })
            .catch(err => {
                console.log("Chưa bật server Backend, hệ thống tự động dùng data mẫu để chạy tiếp:", err);
            });

        return () => clearInterval(interval);
    }, []);

    // HÀM XỬ LÝ ĐIỀU HƯỚNG TÌM KIẾM
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Đá người dùng sang trang khám phá khóa học kèm từ khóa query trên URL
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <div className="home-page">
            {/* NAVBAR */}
            <nav className="home-navbar">
                <div className="nav-left">
                    <h2 className="logo" onClick={() => navigate("/home")}>PrepAce</h2>
                    
                    {/* ĐỔI THÀNH THẺ <form> ĐỂ CHẠY ĐƯỢC TÌM KIẾM ĐỘNG */}
                    <form className="search-bar" onSubmit={handleSearchSubmit}>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm khóa học, giáo viên..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="search-btn">🔍</button>
                    </form>
                </div>

                <div className="nav-right">
                    <div className="exam-countdown">
                        🔥 THPT QG 2026: <strong>{timeLeft.days}</strong> ngày <strong>{timeLeft.hours}</strong> giờ
                    </div>
                    <div className="action-icons">
                        <button className="icon-btn" title="Lộ trình AI" onClick={() => navigate('/adaptive-path')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                            </svg>
                        </button>
                        <button className="icon-btn" title="Lịch học" onClick={() => navigate('/calendar')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                        </button>
                        <button className="icon-btn" title="Thông báo" onClick={() => navigate('/notifications')}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            <span className="noti-badge">3</span>
                        </button>
                    </div>
                    
                    {user ? (
                        <div className="user-menu" onClick={() => navigate("/profile")}>
                            <img 
                                src={user.avatarUrl || "https://i.pravatar.cc/100?img=12"} 
                                alt="Avatar" 
                                className="nav-avatar"
                            />
                            <span className="user-name">{user.fullName || "Học sinh"}</span>
                        </div>
                    ) : (
                        <button className="login-nav-btn" onClick={() => navigate("/")}>Đăng nhập</button>
                    )}
                </div>
            </nav>

            <main className="home-main">
                {/* HERO BANNER */}
                <section className="hero-banner">
                    <div className="hero-content">
                        <h1>Bứt phá điểm số cùng Lộ trình AI</h1>
                        <p>Hệ thống ôn thi THPT Quốc gia thông minh. Phân tích năng lực, cá nhân hóa lộ trình học tập để tối ưu hóa điểm số của bạn.</p>
                        <button className="cta-btn" onClick={() => navigate("/courses")}>Khám phá ngay</button>
                    </div>
                    <div className="hero-illustration">
                        <div className="glass-card">
                            <h3>Lộ trình thích ứng</h3>
                            <p>Hệ thống tự động điều chỉnh bài tập dựa trên lịch sử làm bài (Adaptive Path).</p>
                        </div>
                    </div>
                </section>

                {/* FEATURED COURSES */}
                <section className="courses-section">
                    <div className="section-header">
                        <h2>Khóa học Nổi bật</h2>
                        <span className="view-all" onClick={() => navigate("/courses")}>
                            Xem tất cả ➔
                        </span>
                    </div>

                    <div className="course-grid">
                        {featuredCourses.map((course) => (
                            <div className="course-card" key={course.id} onClick={() => navigate(`/course/${course.id}`)}>
                                <div className="course-thumb">
                                    <img src={course.thumbnail} alt={course.title} />
                                    <span className="subject-badge">{course.subject}</span>
                                </div>
                                <div className="course-info">
                                    <h3 className="course-title">{course.title}</h3>
                                    <p 
    className="course-teacher" 
    onClick={(e) => {
        e.stopPropagation(); // Chặn việc nhảy vào chi tiết khóa học
        navigate(`/instructor/${course.userId}`); // Nhảy động theo đúng userId của từng giáo viên
    }}
    style={{ cursor: "pointer", color: "#4f46e5" }}
>
    👨‍🏫 {course.teacher}
</p>
                                    <div className="course-meta">
                                        <span className="students">👥 {course.students} học viên</span>
                                        <span className="price">{course.price}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}