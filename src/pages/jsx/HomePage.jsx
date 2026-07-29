import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import { logout } from "../../services/authService";
import "../css/HomePage.css";
import "../css/skeleton.css";

export default function HomePage() {
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [timeLeft, setTimeLeft] = useState({ years: 0, months: 0, days: 0 });
    const [coursesLoading, setCoursesLoading] = useState(true);

    // State cấu hình Banner động nhận dữ liệu từ DB
    const [bannerData, setBannerData] = useState({
        title: "Bứt phá điểm số cùng PrepAce AI",
        subtitle: "Hệ thống học tập thông minh sử dụng AI để phân tích năng lực, xây dựng lộ trình cá nhân và tối ưu kết quả kỳ thi THPT Quốc Gia.",
        btnText: "Bắt đầu ngay"
    });

    const [allCourses, setAllCourses] = useState([]);
    const [featuredCourses, setFeaturedCourses] = useState([]);

    const getSubjectThumbnail = (subjectName) => {
        const thumbMap = {
            "Toán Học": "http://localhost:8080/uploads/thumbnails/math-course.jpg?v=2",
            "Vật Lý": "http://localhost:8080/uploads/thumbnails/vatli.jpg?v=2",
            "Hóa Học": "http://localhost:8080/uploads/thumbnails/hoa.jpg?v=2",
            "Hoá Học": "http://localhost:8080/uploads/thumbnails/hoa.jpg?v=2",
            "Ngữ Văn": "http://localhost:8080/uploads/thumbnails/van.jpg?v=2",
            "Tiếng Anh": "http://localhost:8080/uploads/thumbnails/english-course.jpg?v=2",
            "Lịch Sử": "http://localhost:8080/uploads/thumbnails/su.jpg?v=2",
            "Địa Lý": "http://localhost:8080/uploads/thumbnails/dia.jpg?v=2",
            "Sinh Học": "https://images.unsplash.com/photo-1530213786676-412f1262d512?auto=format&fit=crop&w=400&q=80",
            "Tin Học": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80",
            "GDCD": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80"
        };
        const translatedName = {
            "Mathematics": "Toán Học", "Physics": "Vật Lý", "Chemistry": "Hóa Học",
            "Literature": "Ngữ Văn", "English": "Tiếng Anh", "Biology": "Sinh Học",
            "History": "Lịch Sử", "Geography": "Địa Lý"
        }[subjectName] || subjectName;
        return thumbMap[translatedName] || "https://images.unsplash.com/photo-1516321310764-9f1e6e8b0c0a?auto=format&fit=crop&w=400&q=80";
    };

    const currentAvatar = user?.avatarUrl || user?.avatar_url || null;

    const updateCountdown = () => {
        const now = new Date();
        const target = new Date(2027, 5, 28); // 28/06/2027

        if (now >= target) {
            setTimeLeft({ years: 0, months: 0, days: 0 });
            return;
        }
        let years = target.getFullYear() - now.getFullYear();
        let months = target.getMonth() - now.getMonth();
        let days = target.getDate() - now.getDate();

        if (days < 0) {
            months--;
            const previousMonth = new Date(target.getFullYear(), target.getMonth(), 0);
            days += previousMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }
        setTimeLeft({ years, months, days });
    };

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Lỗi parse user:", e);
                localStorage.removeItem("user");
            }
        }

        updateCountdown();
        const interval = setInterval(() => {
            updateCountdown();
        }, 1000);

        // Kéo dữ liệu Banner UI động từ API công khai về
        axiosClient.get("/admin/public/ui-config/banner")
            .then(res => {
                if (res.data) {
                    setBannerData({
                        title: res.data.title,
                        subtitle: res.data.subtitle,
                        btnText: res.data.btnText
                    });
                }
            })
            .catch(err => console.log("Sử dụng banner mặc định do chưa kết nối API:", err));

        // Fetch danh sách khóa học
        axiosClient.get("/courses")
            .then(res => {
                console.log(">>> DỮ LIỆU KHÓA HỌC CHUẨN:", res.data);
                const rawCourses = Array.isArray(res.data) ? res.data : (res.data.courses || []);

                // 🔥 Lọc chính xác các khóa học có isPublished = true hoặc status = PUBLISHED
                const publishedCourses = rawCourses.filter(c => 
                    c.isPublished === true || String(c.status || "").toUpperCase() === "PUBLISHED"
                );

                if (publishedCourses.length > 0) {
                    const mappedData = publishedCourses.map(c => {
                        const displayPrice = typeof c.price === "number"
                            ? new Intl.NumberFormat("vi-VN").format(c.price) + "đ"
                            : (c.price || "Miễn phí");

                        let thumbnail = c.thumbnail_url || c.thumbnailUrl || c.thumbnail;

                        if (thumbnail && !thumbnail.startsWith("http")) {
                            thumbnail = `http://localhost:8080${thumbnail}`;
                        }

                        if (!thumbnail) {
                            const sName = c.subject_name || c.subjectName || c.subject?.subjectName || "Chung";
                            thumbnail = getSubjectThumbnail(sName);
                        }

                        return {
                            id: c.course_id || c.courseId || c.id,
                            title: c.course_title || c.courseTitle || c.title || "Khóa học chưa tên",
                            thumbnail: thumbnail,
                            teacher: c.teacher_name || c.teacherName || c.teacher || "Giáo viên",
                            subject: c.subject_name || c.subjectName || c.subject || "Chung",
                            price: displayPrice,
                            students: c.students || c.student_count || c.studentCount || 0,
                            userId: c.teacher_id || c.teacherId || c.userId || 2
                        };
                    });
                    setAllCourses(mappedData)
                    setFeaturedCourses(mappedData.slice(0, 3));
                } else {
                    setFeaturedCourses([]);
                }
                setCoursesLoading(false);
            })
            .catch(err => {
                console.log("Dùng data khóa học mẫu do chưa kết nối Backend hoặc sập API:", err);
                setCoursesLoading(false);
            });

        return () => clearInterval(interval);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/courses?search=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error(err);
        }
        setShowLogoutModal(false);
        navigate("/auth");
    };

    return (
        <div className="home-layout">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="logo" onClick={() => navigate("/home")} style={{ cursor: "pointer" }}>
                    <div className="logo-icon">🎓</div>
                    <div className="logo-text">
                        <h2>PrepAce</h2>
                        <span>AI Learning Platform</span>
                    </div>
                </div>
                {user && (
                    <div className="user-card clickable" onClick={() => navigate("/profile")}>
                        <div className="avatar">
                            {currentAvatar ? (
                                <img src={currentAvatar} alt={user.fullName} />
                            ) : (
                                user.fullName?.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div className="user-info">
                            <h4>{user.fullName}</h4>
                            <span>
                                {user.role === "TEACHER"
                                    ? "Teacher"
                                    : user.role === "ADMIN"
                                    ? "Admin"
                                    : "Student"}
                            </span>
                        </div>
                    </div>
                )}

                <ul className="menu">
                    <li onClick={() => navigate("/home")}><span>🏠</span> Trang chủ</li>
                    <li onClick={() => navigate("/courses")}><span>📚</span> Khóa học</li>
                    <li onClick={() => navigate("/tests")}><span>📄</span> Luyện đề</li>
                    <li onClick={() => navigate("/adaptive-path")}><span>🧠</span> Lộ trình AI</li>
                    <li onClick={() => navigate("/ai/gap-diagnosis")}><span>📈</span> Lỗ hổng kiến thức</li>
                    <li onClick={() => navigate("/ai/score-forecast")}><span>🎯</span> Dự đoán điểm</li>
                    <li onClick={() => navigate("/ai/university-advising")}><span>🎓</span> Tư vấn ngành</li>
                    <li onClick={() => navigate("/calendar")}><span>📅</span> Lịch học</li>
                    <li onClick={() => navigate("/notifications")}><span>🔔</span> Thông báo</li>
                    <li onClick={() => navigate("/report-violation")}><span>🚨</span> Báo cáo vi phạm</li>
                    <li onClick={() => navigate("/request-teacher")}><span>👨‍🏫</span> Đăng ký làm Giáo viên</li>
                </ul>

                <div className="sidebar-actions">
                    {user ? (
                        <button className="logout-btn" onClick={() => setShowLogoutModal(true)}>🚪 Đăng xuất</button>
                    ) : (
                        <>
                            <button className="login-btn" onClick={() => navigate("/auth", { state: { mode: "login" } })}>🔑 Đăng nhập</button>
                            <button className="register-btn" onClick={() => navigate("/auth", { state: { mode: "register" } })}>✨ Đăng ký</button>
                        </>
                    )}
                </div>
            </aside>

            {/* LOGOUT CONFIRMATION MODAL */}
            {showLogoutModal && (
                <div className="modal-overlay">
                    <div className="logout-modal">
                        <div className="logout-icon">🚪</div>
                        <h2>Đăng xuất</h2>
                        <p>Bạn có chắc chắn muốn đăng xuất khỏi <strong>PrepAce</strong>?</p>
                        <span>Bạn sẽ cần đăng nhập lại để tiếp tục sử dụng hệ thống.</span>
                        <div className="modal-actions">
                            <button className="cancel-btn" onClick={() => setShowLogoutModal(false)}>Hủy</button>
                            <button className="confirm-btn" onClick={handleLogout}>Đăng xuất</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MAIN CONTENT */}
            <main className="content">
                <div className="content-header">
                    <div style={{ position: "relative", width: "100%", maxWidth: "600px" }}>
                        <form className="search-bar" onSubmit={handleSearchSubmit}>
                            <div className="search-icon">🔍</div>
                            <input
                                placeholder="Tìm khóa học, giáo viên..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            />
                            <div className="shortcut">⌘K</div>
                            <button type="submit" className="search-icon-btn">Tìm</button>
                        </form>

                        {/* BẢNG TỰ ĐỘNG GỢI Ý TÌM KIẾM */}
                        {showSuggestions && searchQuery.trim().length > 0 && (
                            <div style={{
                                position: "absolute",
                                top: "100%",
                                left: 0,
                                right: 0,
                                marginTop: "8px",
                                backgroundColor: "#1e293b",
                                borderRadius: "12px",
                                boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
                                border: "1px solid #334155",
                                overflow: "hidden",
                                zIndex: 100,
                                maxHeight: "350px",
                                overflowY: "auto"
                            }}>
                                {(() => {
                                    const normalizeText = (text) => String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                                    const searchNorm = normalizeText(searchQuery);
                                    const filtered = allCourses.filter(course => {
                                        const keyword = normalizeText(searchQuery);

                                        return (
                                            normalizeText(course.title).includes(keyword) ||
                                            normalizeText(course.teacher).includes(keyword) ||
                                            normalizeText(course.subject).includes(keyword)
                                        );
                                    });
                                    
                                    return filtered.length > 0 ? (
                                        <ul style={{ listStyle: "none", margin: 0, padding: "8px 0" }}>
                                            {filtered.slice(0, 5).map(course => (
                                                <li
                                                    key={course.id}
                                                    style={{
                                                        padding: "12px 20px",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        cursor: "pointer"
                                                    }}
                                                    onMouseDown={() => navigate(`/course/${course.id}`)}
                                                >
                                                    <img
                                                        src={course.thumbnail}
                                                        alt={course.title}
                                                        style={{
                                                            width: "42px",
                                                            height: "42px",
                                                            borderRadius: "8px",
                                                            objectFit: "cover"
                                                        }}
                                                    />

                                                    <div style={{ flex: 1 }}>
                                                        <div
                                                            style={{
                                                                color: "#fff",
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {course.title}
                                                        </div>

                                                        <div
                                                            style={{
                                                                color: "#94a3b8",
                                                                fontSize: "13px"
                                                            }}
                                                        >
                                                            👨‍🏫 {course.teacher}
                                                        </div>

                                                        <div
                                                            style={{
                                                                color: "#64748b",
                                                                fontSize: "12px"
                                                            }}
                                                        >
                                                            📚 {course.subject}
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div style={{ padding: "16px 20px", color: "#94a3b8", fontSize: "14px", textAlign: "center" }}>
                                            Không tìm thấy kết quả nào cho "{searchQuery}"
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    <div className="countdown-wrapper">
                        <div className="countdown-title">🔥 THPT Quốc gia 2027</div>
                        <div className="countdown-box">
                            <div className="time-card"><h2>{timeLeft.years}</h2><span>Năm</span></div>
                            <div className="time-card"><h2>{timeLeft.months}</h2><span>Tháng</span></div>
                            <div className="time-card"><h2>{timeLeft.days}</h2><span>Ngày</span></div>
                        </div>
                    </div>
                </div>

                {/* HERO BLOCK CẬP NHẬT ĐỘNG BANNER */}
                <section className="hero">
                    <div className="hero-left">
                        <span className="hero-badge">🚀 AI Powered Learning</span>
                        <h1>{bannerData.title}</h1>
                        <p>{bannerData.subtitle}</p>
                        <div className="hero-buttons">
                            <button className="start-btn" onClick={() => navigate("/tests")}>
                                🚀 {bannerData.btnText}
                            </button>
                            <button className="secondary-btn" onClick={() => navigate("/courses")}>
                                📚 Khóa học
                            </button>
                        </div>
                        <div className="hero-stats">
                            <div className="stat-item"><h2>12K+</h2><p>Học viên</p></div>
                            <div className="stat-item"><h2>98%</h2><p>Tỷ lệ đỗ</p></div>
                            <div className="stat-item"><h2>500+</h2><p>Bài học</p></div>
                        </div>
                    </div>
                    <div className="hero-right">
                        <div className="hero-circle"></div>
                        <div className="hero-card">
                            🤖
                            <h3>PrepAce AI</h3>
                            <p>Đang phân tích lộ trình học...</p>
                        </div>
                    </div>
                </section>

                {/* FEATURED COURSES */}
                <div className="section-title-container">
                    <div>
                        <span className="section-badge">📚 Featured Courses</span>
                        <h2>Khóa học nổi bật</h2>
                        <p>Những khóa học được học viên đánh giá cao nhất trên PrepAce.</p>
                    </div>
                    <button className="view-all-btn" onClick={() => navigate("/courses")}>Xem tất cả →</button>
                </div>

                <section className="course-grid">
                    {coursesLoading ? (
                        <>
                            {[1, 2, 3].map((n) => (
                                <div className="course-card-skeleton skeleton-box" key={`sk-${n}`}>
                                    <div className="thumb skeleton-box"></div>
                                    <div className="line1 skeleton-box"></div>
                                    <div className="line2 skeleton-box"></div>
                                </div>
                            ))}
                        </>
                    ) : (
                        featuredCourses.map(course => (
                            <div className="course-card" key={course.id} onClick={() => navigate(`/course/${course.id}`)}>
                                <div className="course-thumb">
                                    <img 
                                        src={course.thumbnail} 
                                        alt={course.title} 
                                        onError={(e) => { 
                                            if (!e.target.dataset.errorHandled) {
                                                e.target.dataset.errorHandled = true;
                                                e.target.src = getSubjectThumbnail(course.subject); 
                                            }
                                        }}
                                    />
                                    <span className="subject-badge">{course.subjectName}</span>
                                    <div className="course-overlay"><button>Xem chi tiết →</button></div>
                                </div>
                                <div className="course-info">
                                    <div className="course-rating">⭐⭐⭐⭐⭐ <span>4.9</span></div>
                                    <h3 className="course-title">{course.title}</h3>
                                    <p className="course-teacher" onClick={(e) => { e.stopPropagation(); navigate(`/instructor/${course.userId}`); }}>
                                        👨‍🏫 {course.teacher}
                                    </p>
                                    <div className="course-features">
                                        <span>👥 {course.students}</span>
                                        <span>🕒 20 giờ</span>
                                        <span>📄 120 bài</span>
                                    </div>
                                    <div className="course-footer">
                                        <span className="price-tag">{course.price}</span>
                                        <button>Mua ngay</button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </section>

                {/* CTA */}
                <section className="cta">
                    <div className="cta-content">
                        <span className="cta-badge">🚀 START TODAY</span>
                        <h2>Chinh phục kỳ thi THPT Quốc Gia cùng PrepAce AI</h2>
                        <p>Hơn 12.000 học sinh đang học tập mỗi ngày với hệ thống AI cá nhân hóa.</p>
                        <div className="cta-buttons">
                            <button className="register-btn" onClick={() => navigate("/auth", { state: { mode: "register" } })}>Đăng ký miễn phí</button>
                            <button className="secondary-btn" onClick={() => navigate("/courses")}>Khám phá khóa học</button>
                        </div>
                    </div>
                    <div className="cta-decoration">🎓</div>
                </section>
            </main>

        </div>
    );
}