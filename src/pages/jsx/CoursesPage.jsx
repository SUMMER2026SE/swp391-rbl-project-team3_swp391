import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/CoursesPage.css";

export default function CoursesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); //SEARCH ALL COURSES
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [activeSubject, setActiveSubject] = useState("all");
    const [subjects, setSubjects] = useState([]); // 🔥 THÊM MỚI: State lưu danh sách môn học cho bộ lọc
    const [allCourses, setAllCourses] = useState([]);

    const getSubjectThumbnail = (subjectName) => {
        const thumbMap = {
            "Toán Học": "http://localhost:8080/uploads/thumbnails/toan.jpg?v=2",
            "Vật Lý": "http://localhost:8080/uploads/thumbnails/vatli.jpg?v=2",
            "Hóa Học": "http://localhost:8080/uploads/thumbnails/hoa.jpg?v=2",
            "Hoá Học": "http://localhost:8080/uploads/thumbnails/hoa.jpg?v=2",
            "Ngữ Văn": "http://localhost:8080/uploads/thumbnails/van.jpg?v=2",
            "Tiếng Anh": "http://localhost:8080/uploads/thumbnails/anh.jpg?v=2",
            "Lịch Sử": "http://localhost:8080/uploads/thumbnails/lichsu.jpg?v=2",
            "Địa Lý": "http://localhost:8080/uploads/thumbnails/dia.jpg?v=2",
            "Sinh Học": "https://images.unsplash.com/photo-1530213786676-412f1262d512?auto=format&fit=crop&w=400&q=80",
            "Tin Học": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=400&q=80",
            "GDCD": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80"
        };
        return thumbMap[subjectName] || "https://images.unsplash.com/photo-1516321310764-9f1e6e8b0c0a?auto=format&fit=crop&w=400&q=80";
    };
    useEffect(() => {
        setSearchTerm(searchParams.get("search") || "");
    }, [searchParams]);

    useEffect(() => {
        // 1. Tải danh sách môn học hoạt động về làm bộ lọc menu sidebar
        const fetchSubjects = async () => {
            try {
                const res = await axiosClient.get("/public/subjects");
                setSubjects(res.data);
                
                // --- BẢN VÁ TỰ ĐỘNG SỬA DỮ LIỆU CÁC MÔN HỌC BỊ GÁN NHẦM VÀO TOÁN HỌC ---
                try {
                    const coursesRes = await axiosClient.get("/courses");
                    if (coursesRes.data) {
                        for (const c of coursesRes.data) {
                            const title = (c.title || c.courseTitle || c.course_title || "").toLowerCase();
                            let targetSubName = null;
                            if (title.includes("vật lý") || title.includes("vật lí")) targetSubName = "Physics";
                            if (title.includes("hóa học") || title.includes("hoá học")) targetSubName = "Chemistry";
                            if (title.includes("lịch sử") || title.includes("lịch sữ")) targetSubName = "History";
                            if (title.includes("địa lý") || title.includes("địa lí")) targetSubName = "Geography";
                            if (title.includes("ngữ văn")) targetSubName = "Literature";
                            if (title.includes("tiếng anh") || title.includes("anh văn")) targetSubName = "English";
                            if (title.includes("sinh học")) targetSubName = "Biology";
                            
                            if (targetSubName) {
                                const correctSub = res.data.find(s => s.subjectName === targetSubName);
                                const currentSubId = c.subject?.id || c.subjectId || c.subject_id;
                                if (correctSub && String(currentSubId) !== String(correctSub.id)) {
                                    // Sửa lại môn học trên Database
                                    await axiosClient.put(`/courses/${c.id || c.courseId || c.course_id}`, { subjectId: correctSub.id });
                                }
                            }
                        }
                    }
                } catch (e) { console.log("Auto fix error:", e); }
                // --------------------------------------------------------------------
                
            } catch (err) {
                console.error("Lỗi tải môn học:", err);
            }
        };

        // 2. Tải danh sách khóa học
        const fetchCoursesFromBackend = async () => {
            try {
                const response = await axiosClient.get("/courses");
                const rawCourses = Array.isArray(response.data) ? response.data : [];
                
                // Lọc khóa học đã xuất bản
                const publishedCourses = rawCourses.filter(c => 
                    c.isPublished === true || String(c.status || "").toUpperCase() === "PUBLISHED"
                );

                if (publishedCourses.length > 0) {
                    const mappedData = publishedCourses.map(c => {
                        let displayPrice = "Miễn phí";
                        const rawPrice = c.price || c.Price || 0;
                        if (rawPrice && Number(String(rawPrice).replace(/[^0-9]/g, '')) > 0) {
                            const cleanNumber = Number(String(rawPrice).replace(/[^0-9]/g, ''));
                            displayPrice = `${cleanNumber.toLocaleString('vi-VN')}đ`;
                        }

                        // 🔥 ĐÃ SỬA: Lấy subjectId và subjectName trực tiếp từ quan hệ liên kết ManyToOne của Backend
                        const sId = c.subject?.id || c.subjectId || c.subject_id || "other";
                        let sName = c.subject?.subjectName || c.subjectName || c.subject_name || "Chung";

                        const subjectTranslations = {
                            "Mathematics": "Toán Học",
                            "Physics": "Vật Lý",
                            "Chemistry": "Hóa Học",
                            "Literature": "Ngữ Văn",
                            "English": "Tiếng Anh",
                            "History": "Lịch Sử",
                            "Geography": "Địa Lý",
                            "Biology": "Sinh Học",
                            "Civic Education": "GDCD",
                            "Informatics": "Tin Học"
                        };
                        sName = subjectTranslations[sName] || sName;

                        let thumbnail = c.thumbnail_url || c.thumbnailUrl || c.thumbnail;
                        if (thumbnail && !thumbnail.startsWith("http")) {
                            thumbnail = `http://localhost:8080${thumbnail}`;
                        }
                        if (!thumbnail) {
                            thumbnail = getSubjectThumbnail(sName);
                        }

                        return {
                            id: c.course_id || c.courseId || c.id,
                            title: c.course_title || c.courseTitle || c.title || "Khóa học chưa tên",
                            thumbnail: thumbnail,
                            teacher: c.teacher_name ||
                                    c.teacherName ||
                                    c.teacher?.fullName ||
                                    c.teacher?.name ||
                                    c.instructorName ||
                                    "Giáo viên",
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

    const normalizeText = (text) => {
        return String(text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredCourses = allCourses.filter(course => {
        const matchSubject = activeSubject === "all" || String(course.subject) === String(activeSubject);
        
        const searchNorm = normalizeText(searchTerm);
        const titleNorm = normalizeText(course.title);
        const teacherNorm = normalizeText(course.teacher);
        
        const matchSearch = titleNorm.includes(searchNorm) || teacherNorm.includes(searchNorm);
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
                            {subjects.map((sub) => {
                                const subjectTranslations = {
                                    "Mathematics": "Toán Học",
                                    "Physics": "Vật Lý",
                                    "Chemistry": "Hóa Học",
                                    "Literature": "Ngữ Văn",
                                    "English": "Tiếng Anh",
                                    "History": "Lịch Sử",
                                    "Geography": "Địa Lý",
                                    "Biology": "Sinh Học",
                                    "Civic Education": "GDCD",
                                    "Informatics": "Tin Học"
                                };
                                const translatedName = subjectTranslations[sub.subjectName] || sub.subjectName;
                                
                                return (
                                    <li 
                                        key={sub.id} 
                                        className={String(activeSubject) === String(sub.id) ? "active" : ""} 
                                        onClick={() => setActiveSubject(sub.id)}
                                    >
                                        📚 {translatedName}
                                    </li>
                                );
                            })}
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
                                        <img 
                                            src={course.thumbnail} 
                                            alt={course.title} 
                                            onError={(e) => { 
                                                if (!e.target.dataset.errorHandled) {
                                                    e.target.dataset.errorHandled = true;
                                                    e.target.src = getSubjectThumbnail(course.subjectName); 
                                                }
                                            }}
                                        />
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