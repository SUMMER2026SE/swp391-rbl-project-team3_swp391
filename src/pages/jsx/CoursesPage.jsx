import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/CoursesPage.css";

export default function CoursesPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSubject, setActiveSubject] = useState("all");
    const [subjects, setSubjects] = useState([]); // 🔥 THÊM MỚI: State lưu danh sách môn học cho bộ lọc
    const [allCourses, setAllCourses] = useState([]);

    const DEFAULT_THUMBNAIL = "https://images.unsplash.com/photo-1516321310764-9f1e6e8b0c0a?auto=format&fit=crop&w=400&q=80";

    useEffect(() => {
        // 1. Tải danh sách môn học hoạt động về làm bộ lọc menu sidebar
        const fetchSubjects = async () => {
            try {
                const res = await axiosClient.get("/public/subjects");
                setSubjects(res.data);
            } catch (err) {
                console.error("Lỗi tải môn học:", err);
            }
        };

        // 2. Tải danh sách khóa học
        const fetchCoursesFromBackend = async () => {
            try {
                const response = await axiosClient.get("/courses");
                
                if (response.data && response.data.length > 0) {
                    const mappedData = response.data.map(c => {
                        let displayPrice = "Miễn phí";
                        const rawPrice = c.price || c.Price || 0;
                        if (rawPrice && Number(String(rawPrice).replace(/[^0-9]/g, '')) > 0) {
                            const cleanNumber = Number(String(rawPrice).replace(/[^0-9]/g, ''));
                            displayPrice = `${cleanNumber.toLocaleString('vi-VN')}đ`;
                        }

                        // 🔥 ĐÃ SỬA: Lấy subjectId và subjectName trực tiếp từ quan hệ liên kết ManyToOne của Backend
                        const sId = c.subject?.id || c.subjectId || "other";
                        const sName = c.subject?.subjectName || c.subjectName || "Chung";

                        let thumbnail = c.thumbnail_url || c.thumbnailUrl || c.thumbnail;
                        if (thumbnail && !thumbnail.startsWith("http")) {
                            thumbnail = `http://localhost:8080${thumbnail}`;
                        }
                        if (!thumbnail) {
                            thumbnail = DEFAULT_THUMBNAIL;
                        }

                        return {
                            id: c.course_id || c.courseId || c.id,
                            title: c.course_title || c.courseTitle || c.title || "Khóa học chưa tên",
                            thumbnail: thumbnail,
                            teacher: c.teacher_name || c.teacherName || c.teacher || "Giáo viên",
                            subject: sId, // Dùng ID để lọc cho chính xác
                            subjectName: sName,
                            price: displayPrice,
                            students: c.students || c.student_count || c.studentCount || 0,
                            userId: c.teacher_id || c.teacherId || c.userId || 2
                        };
                    });
                    setAllCourses(mappedData);
                } else {
                    setAllCourses([]);
                }
            } catch (error) {
                console.warn("Không kết nối được Backend, dùng dữ liệu dự phòng.");
                setAllCourses([]);
            }
        };

        fetchSubjects();
        fetchCoursesFromBackend();
    }, []);

    // Lọc khóa học theo ô tìm kiếm và sidebar môn học
    const filteredCourses = allCourses.filter(course => {
        const matchSubject = activeSubject === "all" || String(course.subject) === String(activeSubject);
        const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
        return matchSubject && matchSearch;
    });

    return (
        <div className="courses-page">
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
                {/* Bộ lọc Sidebar sinh tự động dựa trên Database */}
                <aside className="filters-sidebar">
                    <div className="filter-box">
                        <h3>Môn học</h3>
                        <ul className="filter-list">
                            <li className={activeSubject === "all" ? "active" : ""} onClick={() => setActiveSubject("all")}>
                                Tất cả môn học
                            </li>
                            {subjects.map((sub) => (
                                <li 
                                    key={sub.id} 
                                    className={String(activeSubject) === String(sub.id) ? "active" : ""} 
                                    onClick={() => setActiveSubject(sub.id)}
                                >
                                    📚 {sub.subjectName}
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Danh sách khóa học dạng lưới */}
                <main className="courses-list-area">
                    <div className="results-info">
                        Hiển thị <strong>{filteredCourses.length}</strong> kết quả phù hợp
                    </div>

                    {filteredCourses.length === 0 ? (
                        <div className="no-results">
                            <h3>Không tìm thấy khóa học nào!</h3>
                            <p>Vui lòng thử lại với phân hệ môn học khác.</p>
                        </div>
                    ) : (
                        <div className="course-grid">
                            {filteredCourses.map((course) => (
                                <div 
                                    className="course-card" 
                                    key={course.id} 
                                    onClick={() => navigate(`/course/${course.id}`)}
                                >
                                    <div className="course-thumb">
                                        <img src={course.thumbnail} alt={course.title} />
                                        <span className="subject-badge">
                                            {course.subjectName}
                                        </span>
                                    </div>
                                    <div className="course-info">
                                        <h3 className="course-title">{course.title}</h3>
                                        <p 
                                            className="course-teacher" 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/instructor/${course.userId}`);
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
                    )}
                </main>
            </div>
        </div>
    );
}