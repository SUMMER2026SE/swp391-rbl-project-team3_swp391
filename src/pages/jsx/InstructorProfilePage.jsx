import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/InstructorProfilePage.css";

export default function InstructorProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Mock dữ liệu giáo viên (Dựa trên DB: Thầy Nguyễn Minh Quân - Giáo viên Toán)
    const instructor = {
        id: id || 2,
        name: "Nguyễn Minh Quân",
        subject: "Toán học",
        avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
        bio: "Tốt nghiệp Xuất sắc khoa Toán trường Đại học Sư phạm Hà Nội. Có hơn 5 năm kinh nghiệm luyện thi THPT Quốc gia với phương pháp giải toán tư duy, bấm máy tính Casio thần tốc. Đã giúp hơn 5,000 học sinh đạt điểm 8+.",
        stats: {
            students: "5.2K+",
            courses: 4,
            rating: 4.9,
            reviews: 1250
        },
        social: {
            facebook: "#",
            youtube: "#"
        }
    };

    // Danh sách khóa học của giáo viên này
    const instructorCourses = [
        {
            id: 1,
            title: "Mastering Mathematics 12 - Ôn thi THPT QG",
            price: "599,000đ",
            students: 1250,
            thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 4,
            title: "Tuyệt đỉnh Casio - Giải nhanh trắc nghiệm Toán",
            price: "299,000đ",
            students: 2100,
            thumbnail: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?auto=format&fit=crop&w=400&q=80"
        },
        {
            id: 5,
            title: "Luyện đề thực chiến Toán 12 (Cập nhật 2026)",
            price: "399,000đ",
            students: 850,
            thumbnail: "https://images.unsplash.com/photo-1632559798471-70068ccbce02?auto=format&fit=crop&w=400&q=80"
        }
    ];

    return (
        <div className="instructor-page">
            {/* THANH ĐIỀU HƯỚNG */}
            <div className="top-nav">
                <span className="back-btn" onClick={() => navigate(-1)}>← Quay lại</span>
            </div>

            {/* HEADER: THÔNG TIN GIÁO VIÊN */}
            <div className="instructor-header">
                <div className="instructor-card">
                    <div className="instructor-avatar-box">
                        <img src={instructor.avatar} alt={instructor.name} className="instructor-avatar" />
                        <span className="subject-tag">{instructor.subject}</span>
                    </div>
                    
                    <div className="instructor-info">
                        <h1>Thầy {instructor.name}</h1>
                        <p className="bio">{instructor.bio}</p>
                        
                        <div className="stats-container">
                            <div className="stat-item">
                                <span className="stat-value">{instructor.stats.students}</span>
                                <span className="stat-label">Học viên</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{instructor.stats.courses}</span>
                                <span className="stat-label">Khóa học</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">⭐ {instructor.stats.rating}</span>
                                <span className="stat-label">{instructor.stats.reviews} đánh giá</span>
                            </div>
                        </div>

                        <div className="social-links">
                            <button className="follow-btn">Theo dõi giảng viên</button>
                            <a href={instructor.social.facebook} className="social-icon">FB</a>
                            <a href={instructor.social.youtube} className="social-icon">YT</a>
                        </div>
                    </div>
                </div>
            </div>

            {/* BODY: DANH SÁCH KHÓA HỌC CỦA GIÁO VIÊN */}
            <div className="instructor-body">
                <h2>Khóa học giảng dạy bởi Thầy {instructor.name}</h2>
                <div className="course-grid">
                    {instructorCourses.map((course) => (
                        <div className="course-card" key={course.id} onClick={() => navigate(`/course/${course.id}`)}>
                            <div className="course-thumb">
                                <img src={course.thumbnail} alt={course.title} />
                            </div>
                            <div className="course-content">
                                <h3 className="course-title">{course.title}</h3>
                                <div className="course-meta">
                                    <span className="students">👥 {course.students} học viên</span>
                                    <span className="price">{course.price}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}