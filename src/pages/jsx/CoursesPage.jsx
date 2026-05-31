import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/CoursesPage.css";

export default function CoursesPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSubject, setActiveSubject] = useState("all");

    // Mock dữ liệu danh sách TẤT CẢ khóa học từ DB
    const allCourses = [
        {
            id: 1, title: "Mastering Mathematics 12", teacher: "Nguyen Minh Quan",
            subject: "math", subjectName: "Toán học", price: "599,000đ", students: 1250,
            thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 2, title: "Physics Problem Solving Techniques", teacher: "Tran Bao Chau",
            subject: "physics", subjectName: "Vật lý", price: "499,000đ", students: 980,
            thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 3, title: "English Vocabulary & Grammar", teacher: "Le Hoang Nam",
            subject: "english", subjectName: "Tiếng Anh", price: "399,000đ", students: 2100,
            thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 4, title: "Tuyệt đỉnh Casio - Giải nhanh trắc nghiệm", teacher: "Nguyen Minh Quan",
            subject: "math", subjectName: "Toán học", price: "299,000đ", students: 3100,
            thumbnail: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?auto=format&fit=crop&w=400&q=80"
        }
    ];

    // Xử lý logic Tìm kiếm và Lọc
    const filteredCourses = allCourses.filter(course => {
        const matchSubject = activeSubject === "all" || course.subject === activeSubject;
        const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSubject && matchSearch;
    });

    return (
        <div className="courses-page">
            {/* Header Tìm kiếm */}
            <div className="courses-header">
                <div className="header-content">
                    <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại Trang chủ</span>
                    <h1>Khám phá Khóa học</h1>
                    <p>Chuẩn bị hành trang tốt nhất cho kỳ thi THPT Quốc gia cùng các chuyên gia.</p>
                    
                    <div className="main-search-bar">
                        <span className="search-icon">🔍</span>
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm theo tên khóa học, giáo viên..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button className="search-btn">Tìm kiếm</button>
                    </div>
                </div>
            </div>

            <div className="courses-container">
                {/* BỘ LỌC (SIDEBAR) */}
                <aside className="filters-sidebar">
                    <div className="filter-box">
                        <h3>Môn học</h3>
                        <ul className="filter-list">
                            <li className={activeSubject === "all" ? "active" : ""} onClick={() => setActiveSubject("all")}>
                                Tất cả môn học
                            </li>
                            <li className={activeSubject === "math" ? "active" : ""} onClick={() => setActiveSubject("math")}>
                                📐 Toán học
                            </li>
                            <li className={activeSubject === "physics" ? "active" : ""} onClick={() => setActiveSubject("physics")}>
                                ⚡ Vật lý
                            </li>
                            <li className={activeSubject === "english" ? "active" : ""} onClick={() => setActiveSubject("english")}>
                                🌍 Tiếng Anh
                            </li>
                        </ul>
                    </div>
                </aside>

                {/* DANH SÁCH KHÓA HỌC */}
                <main className="courses-list-area">
                    <div className="results-info">
                        Hiển thị <strong>{filteredCourses.length}</strong> kết quả phù hợp
                    </div>

                    {filteredCourses.length === 0 ? (
                        <div className="no-results">
                            <h3>Không tìm thấy khóa học nào!</h3>
                            <p>Vui lòng thử lại với từ khóa khác.</p>
                        </div>
                    ) : (
                        <div className="course-grid">
                            {filteredCourses.map((course) => (
                                <div className="course-card" key={course.id} onClick={() => navigate(`/course/${course.id}`)}>
                                    <div className="course-thumb">
                                        <img src={course.thumbnail} alt={course.title} />
                                        <span className="subject-badge">{course.subjectName}</span>
                                    </div>
                                    <div className="course-info">
                                        <h3 className="course-title">{course.title}</h3>
                                        <p className="course-teacher">👨‍🏫 {course.teacher}</p>
                                        <div className="course-meta">
                                            <span className="students">👥 {course.students} học viên</span>
                                            <span className="price">{course.price}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}