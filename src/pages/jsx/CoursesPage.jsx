import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; // Tự động đính kèm Token từ interceptor của bạn
import "../css/CoursesPage.css";

export default function CoursesPage() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState("");
    const [activeSubject, setActiveSubject] = useState("all");

    // 1. KHỞI TẠO STATE: Đút toàn bộ dữ liệu mẫu cũ vào làm bệ đỡ ban đầu để demo mượt mà
    const [allCourses, setAllCourses] = useState([
    {
        id: 1, title: "Mastering Mathematics 12.", teacher: "Nguyen Minh Quan", userId: 2,
        subject: "math", subjectName: "Toán học", price: "599,000đ", students: 1250,
        thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 2, title: "Physics Problem Solving Techniques.", teacher: "Tran Bao Chau", userId: 3,
        subject: "physics", subjectName: "Vật lý", price: "499,000đ", students: 980,
        thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 3, title: "English Vocabulary & Grammar.", teacher: "Le Hoang Nam", userId: 5,
        subject: "english", subjectName: "Tiếng Anh", price: "399,000đ", students: 2100,
        thumbnail: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80"
    },
    {
        id: 4, title: "Tuyệt đỉnh Casio - Giải nhanh trắc nghiệm.", teacher: "Nguyen Minh Quan", userId: 2,
        subject: "math", subjectName: "Toán học", price: "299,000đ", students: 3100,
        thumbnail: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?auto=format&fit=crop&w=400&q=80"
    }
]);

    // 2. GỌI API TRONG USEEFFECT: Tự động kết nối tới Server khi component được mount
    useEffect(() => {
        const fetchCoursesFromBackend = async () => {
            try {
                const response = await axiosClient.get("/courses");
                
                if (response.data && response.data.length > 0) {
                    // Dịch dữ liệu Database sang giao diện
                    const mappedData = response.data.map(c => {
    // 1. Phân loại lại giá tiền an toàn (Bảo vệ khỏi lỗi NaN)
    let displayPrice = "Miễn phí";
    const rawPrice = c.price || c.Price || 0;
    if (rawPrice && Number(String(rawPrice).replace(/[^0-9]/g, '')) > 0) {
        const cleanNumber = Number(String(rawPrice).replace(/[^0-9]/g, ''));
        displayPrice = `${cleanNumber.toLocaleString('vi-VN')}đ`;
    }

    // 2. GIỮ LẠI LOGIC CHUẨN HÓA MÔN HỌC (Đã cải tiến để nhận diện cả tiếng Việt)
    let subjectTag = c.subject || "other";
    const dbSubjectName = (c.subject_name || c.subjectName || "").toLowerCase();
    
    if (dbSubjectName.includes("math") || dbSubjectName.includes("toán")) {
        subjectTag = "math";
    } else if (dbSubjectName.includes("physic") || dbSubjectName.includes("vật lý")) {
        subjectTag = "physics";
    } else if (dbSubjectName.includes("english") || dbSubjectName.includes("tiếng anh")) {
        subjectTag = "english";
    }

    // 3. Map dữ liệu với cơ chế phòng thủ đầy đủ cho cả snake_case và camelCase
    return {
        id: c.course_id || c.courseId || c.id,
        title: c.course_title || c.courseTitle || c.title || "Khóa học chưa tên",
        thumbnail: c.thumbnail_url || c.thumbnailUrl || c.thumbnail,
        teacher: c.teacher_name || c.teacherName || c.teacher || "Giáo viên",
        subject: subjectTag, // Giúp Sidebar filter chạy mượt mà
        subjectName: c.subject_name || c.subjectName || c.subject || "Chung", // Hiện lên Badge
        price: displayPrice,
        students: c.students || c.student_count || c.studentCount || 0,
        userId: c.teacher_id || c.teacherId || c.userId || 2
    };
});

setAllCourses(mappedData);
                }
            } catch (error) {
                console.warn("Hệ thống chưa kết nối được Backend. Đang giữ luồng dữ liệu Mock:", error);
            }
        };

        fetchCoursesFromBackend();
    }, []);

    // 4. LOGIC LỌC TRÊN GIAO DIỆN: Chạy mượt mà trên cả dữ liệu mẫu lẫn dữ liệu thật
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
                                        <span className="subject-badge">{course.subjectName || course.subject}</span>
                                    </div>
                                    <div className="course-info">
                                        <h3 className="course-title">{course.title}</h3>
                                        <p 
    className="course-teacher" 
    onClick={(e) => {
        e.stopPropagation();
        navigate(`/instructor/${course.userId}`); // Gọi đúng userId đã khai báo ở trên
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