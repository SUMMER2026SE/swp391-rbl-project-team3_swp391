import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/InstructorProfilePage.css";

export default function InstructorProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Dữ liệu mẫu (Fallback) để trang luôn có cái hiển thị nếu API chưa sẵn sàng
    const [data, setData] = useState({
        info: {
            name: "Đang tải...",
            subject: "",
            avatar: "https://ui-avatars.com/api/?name=Teacher&background=64748b&color=fff",
            bio: "",
            school: "",
            stats: { students: 0, courses: 0, rating: 0, reviews: 0 }
        },
        courses: []
    });

    useEffect(() => {
        setLoading(true);
        setError(null);
        axiosClient.get(`/users/instructor/${id}`)
            .then(res => {
                setData({ info: res.data.info, courses: res.data.courses });
            })
            .catch((err) => {
                console.warn("Lỗi tải hồ sơ giảng viên ID:", id, err);
                setError("Không thể tải thông tin giảng viên.");
            })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="instructor-page">
                <div className="top-nav">
                    <span className="back-btn" onClick={() => navigate(-1)}>← Quay lại</span>
                </div>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                    <div style={{ textAlign: "center", color: "#64748b" }}>
                        <div style={{ fontSize: "40px", marginBottom: "12px" }}>⏳</div>
                        <div style={{ fontWeight: "600" }}>Đang tải hồ sơ giảng viên...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="instructor-page">
            <div className="top-nav">
                <span className="back-btn" onClick={() => navigate(-1)}>← Quay lại</span>
            </div>

            <div className="instructor-header">
                <div className="instructor-card">
                    <div className="instructor-avatar-box">
                        <img
                            src={data.info.avatar}
                            alt={data.info.name}
                            className="instructor-avatar"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.info.name || "Teacher")}&background=64748b&color=fff`;
                            }}
                        />
                        {data.info.subject && (
                            <span className="subject-tag">{data.info.subject}</span>
                        )}
                    </div>
                    
                    <div className="instructor-info">
                        <h1>{data.info.name}</h1>

                        {data.info.school && (
                            <p style={{ color: "#2563eb", fontWeight: "600", fontSize: "14px", margin: "0 0 10px 0" }}>
                                🏫 {data.info.school}
                            </p>
                        )}

                        <p className="bio">{data.info.bio || "Chưa có thông tin giới thiệu."}</p>
                        
                        <div className="stats-container">
                            <div className="stat-item">
                                <span className="stat-value">{data.info.stats.students}</span>
                                <span className="stat-label">Học viên</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-value">{data.info.stats.courses}</span>
                                <span className="stat-label">Khóa học</span>
                            </div>
                            {data.info.stats.rating > 0 && (
                                <div className="stat-item">
                                    <span className="stat-value">⭐ {data.info.stats.rating}</span>
                                    <span className="stat-label">{data.info.stats.reviews} đánh giá</span>
                                </div>
                            )}
                        </div>


                    </div>
                </div>
            </div>

            <div className="instructor-body">
                <h2>Khóa học giảng dạy bởi {data.info.name}</h2>
                {data.courses.length > 0 ? (
                    <div className="course-grid">
                        {data.courses.map((course) => (
                            <div className="course-card" key={course.id} onClick={() => navigate(`/course/${course.id}`)}>
                                <div className="course-thumb">
                                    <img
                                        src={course.thumbnail || "https://placehold.co/600x400?text=PrepAce"}
                                        alt={course.title}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://placehold.co/600x400?text=PrepAce";
                                        }}
                                    />
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
                ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                        <div style={{ fontSize: "48px", marginBottom: "12px", opacity: 0.3 }}>📚</div>
                        <p>Giảng viên chưa có khóa học nào.</p>
                    </div>
                )}
            </div>

            {error && (
                <div style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    background: "#fef2f2",
                    color: "#b91c1c",
                    padding: "12px 20px",
                    borderRadius: "10px",
                    border: "1px solid #fecaca",
                    fontSize: "14px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}>
                    ❌ {error}
                </div>
            )}
        </div>
    );
}