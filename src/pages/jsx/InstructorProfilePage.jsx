import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/InstructorProfilePage.css";

export default function InstructorProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Dữ liệu mẫu (Fallback) để trang luôn có cái hiển thị nếu API chưa sẵn sàng
    const [data, setData] = useState({
        info: {
            name: "Nguyễn Minh Quân",
            subject: "Toán học",
            avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=400&q=80",
            bio: "Tốt nghiệp Xuất sắc khoa Toán trường Đại học Sư phạm Hà Nội. Có hơn 5 năm kinh nghiệm luyện thi THPT Quốc gia...",
            stats: { students: "5.2K+", courses: 4, rating: 4.9, reviews: 1250 },
            social: { facebook: "#", youtube: "#" }
        },
        courses: [
            { id: 1, title: "Mastering Mathematics 12 - Ôn thi THPT QG", price: "599,000đ", students: 1250, thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80" },
            { id: 4, title: "Tuyệt đỉnh Casio - Giải nhanh trắc nghiệm Toán", price: "299,000đ", students: 2100, thumbnail: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?auto=format&fit=crop&w=400&q=80" }
        ]
    });

    useEffect(() => {
        axiosClient.get(`/users/instructor/${id}`)
            .then(res => setData({ info: res.data.info, courses: res.data.courses }))
            .catch(() => console.warn("Đang dùng dữ liệu mẫu cho giảng viên ID:", id));
    }, [id]);

    return (
        <div className="instructor-page">
            <div className="top-nav">
                <span className="back-btn" onClick={() => navigate(-1)}>← Quay lại</span>
            </div>

            <div className="instructor-header">
                <div className="instructor-card">
                    <div className="instructor-avatar-box">
                        <img src={data.info.avatar} alt={data.info.name} className="instructor-avatar" />
                        <span className="subject-tag">{data.info.subject}</span>
                    </div>
                    
                    <div className="instructor-info">
                        <h1>Thầy {data.info.name}</h1>
                        <p className="bio">{data.info.bio}</p>
                        
                        <div className="stats-container">
                            <div className="stat-item">
                                <span className="stat-value">{data.info.stats.students}</span>
                                <span className="stat-label">Học viên</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{data.info.stats.courses}</span>
                                <span className="stat-label">Khóa học</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">⭐ {data.info.stats.rating}</span>
                                <span className="stat-label">{data.info.stats.reviews} đánh giá</span>
                            </div>
                        </div>

                        <div className="social-links">
                            <button className="follow-btn">Theo dõi giảng viên</button>
                            <a href={data.info.social.facebook} className="social-icon">FB</a>
                            <a href={data.info.social.youtube} className="social-icon">YT</a>
                        </div>
                    </div>
                </div>
            </div>

            <div className="instructor-body">
                <h2>Khóa học giảng dạy bởi Thầy {data.info.name}</h2>
                <div className="course-grid">
                    {data.courses.map((course) => (
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