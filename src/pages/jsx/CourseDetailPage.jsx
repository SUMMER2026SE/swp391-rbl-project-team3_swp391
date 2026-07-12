import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; 
import "../css/CourseDetailPage.css";

const MOCK_COURSE_FALLBACK = {
    title: "Mastering Mathematics 12 kk",
    description: "Khóa học toàn diện bao phủ toàn bộ kiến thức Toán 12. Cung cấp kỹ năng giải nhanh trắc nghiệm, bứt phá điểm 8+ kỳ thi THPT Quốc gia 2026.",
    teacher: "Nguyen Minh Quan",
    subjectName: "Toán học",
    price: "599,000đ",
    originalPrice: "900,000đ",
    rating: 4.8,
    reviews: 320,
    students: 1250,
    thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
    chapters: [
        {
            id: 1,
            title: "Chương 1: Ứng dụng đạo hàm để khảo sát hàm số",
            lessons: [
                { id: 101, title: "Sự đồng biến, nghịch biến của hàm số", duration: "45:00", isPreview: true },
                { id: 102, title: "Cực trị của hàm số", duration: "50:20", isPreview: false }
            ]
        }
    ]
};

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [expandedChapterId, setExpandedChapterId] = useState(null);
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    const [evaluation, setEvaluation] = useState({
        averageRating: 0,
        totalReviews: 0,
        ratingStarsCount: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        reviews: []
    });

    const [userRating, setUserRating] = useState(5);

    const renderStars = (rating) => {
        const safeRating = Math.round(Number(rating) || 0);
        if (safeRating <= 0) return "☆☆☆☆☆";
        if (safeRating >= 5) return "★★★★★";
        return "★".repeat(safeRating) + "☆".repeat(5 - safeRating);
    };

    const getSafeAvatarUrl = (url) => {
        if (!url) return "https://via.placeholder.com/40";
        if (url.startsWith("http")) return url;
        return `http://localhost:8080${url}`;
    };

    const calculatePercent = (count, total) => {
        if (!total || total <= 0) return 0;
        return Math.round((count / total) * 100);
    };

    // 🔥 HÀM XỬ LÝ GHI LOG KHI HỌC SINH ẤN NÚT HỌC THỬ
    const handleFreeTrialLog = async () => {
        try {
            const userObj = JSON.parse(localStorage.getItem("user") || "{}");
            const userId = userObj?.id || userObj?.userId || 0;
            if (userId > 0 && course) {
                await axiosClient.post(`/admin/users/${userId}/activity`, {
                    action: `Đăng ký học thử miễn phí khóa học: [${course.title}]`
                });
            }
        } catch (logErr) { console.error("Lỗi lưu log học thử:", logErr); }
        navigate(`/learn/${course.id}`);
    };

    useEffect(() => {
        const fetchCourseDetail = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get(`/courses/${id}`);                
                if (response.data) {
                    const data = response.data;
                    
                    const cleanPrice = Number(String(data.price || data.Price || 0).replace(/[^0-9]/g, ''));
                    const cleanOriginal = Number(String(data.original_price || data.originalPrice || 0).replace(/[^0-9]/g, ''));

                    const mappedData = {
                        id: data.course_id || data.id || id,
                        title: data.course_title || data.title || "Khóa học không tên",
                        description: data.description || data.course_desc || "",
                        teacher: data.teacher_name || data.teacher || "Giáo viên",
                        
                        // 🔥 ĐÃ CẬP NHẬT: Lấy tên môn học liên kết từ thực thể Backend trả ra
                        subjectName: data.subject?.subjectName || data.subjectName || "Chung",

                        price: cleanPrice > 0 ? `${cleanPrice.toLocaleString('vi-VN')}đ` : "Miễn phí",
                        originalPrice: cleanOriginal > 0 ? `${cleanOriginal.toLocaleString('vi-VN')}đ` : "",
                        rating: data.rating || 5.0,
                        reviews: data.reviews || data.review_count || 0,
                        students: data.students || data.student_count || 0,
                        thumbnail: data.thumbnail_url || data.thumbnail || "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
                        chapters: (data.chapters || []).map(ch => ({
                            id: ch.chapter_id || ch.id,
                            title: ch.chapter_title || ch.title || "Chương mới",
                            lessons: (ch.lessons || []).map(les => ({
                                id: les.lesson_id || les.id,
                                title: les.lesson_title || les.title || "Bài học mới",
                                duration: les.duration || "00:00",
                                isPreview: les.is_preview || les.isPreview || false
                            }))
                        }))
                    };

                    setCourse(mappedData);
                    if (mappedData.chapters.length > 0) {
                        setExpandedChapterId(mappedData.chapters[0].id);
                    }
                }

                const reviewRes = await axiosClient.get(`/courses/${id}/reviews/summary`);
                if (reviewRes.data) {
                    setEvaluation(reviewRes.data);
                }

            } catch (error) {
                console.warn("Lỗi kết nối, nạp dữ liệu mock.", error);
                setCourse({ ...MOCK_COURSE_FALLBACK, id: id });
                if (MOCK_COURSE_FALLBACK.chapters.length > 0) {
                    setExpandedChapterId(MOCK_COURSE_FALLBACK.chapters[0].id);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourseDetail();
    }, [id]);

    const handleSendReview = async () => {
        const commentInput = document.getElementById("student-review-comment");
        const commentValue = commentInput ? commentInput.value.trim() : "";

        if (!commentValue) {
            alert("Vui lòng nhập nội dung đánh giá trước khi gửi nhé!");
            return;
        }

        try {
            await axiosClient.post(`/courses/${id}/reviews`, {
                rating: userRating,
                comment: commentValue
            });

            alert("Gửi đánh giá khóa học thành công! Cảm ơn nhận xét từ bạn.");
            if (commentInput) commentInput.value = ""; 
            setUserRating(5); 

            const reviewRes = await axiosClient.get(`/courses/${id}/reviews/summary`);
            if (reviewRes.data) {
                setEvaluation(reviewRes.data);
            }
        } catch (error) {
            console.error("Lỗi gửi review:", error);
            alert("Gửi đánh giá thất bại. Vui lòng đăng nhập hệ thống để thực hiện!");
        }
    };

    if (loading) {
        return (
            <div className="course-detail-loading">
                <div className="spinner"></div>
                <p>Đang tải thông tin khóa học...</p>
            </div>
        );
    }

    if (!course) return <div className="error-text">Không tìm thấy khóa học yêu cầu!</div>;

    return (
        <div className="course-detail-page">
            <div className="breadcrumb">
                <span onClick={() => navigate("/home")} style={{cursor: 'pointer'}}>Trang chủ</span> 
                <span className="separator">/</span> 
                <span onClick={() => navigate("/courses")} style={{cursor: 'pointer'}}>Khóa học</span> 
                <span className="separator">/</span> 
                <span className="current">{course.title}</span>
            </div>

            <div className="course-detail-container">
                <div className="course-left">
                    <h1 className="course-title">{course.title}</h1>
                    <p className="course-description">{course.description}</p>
                    
                    <div className="course-meta-top" style={{ display: "flex", gap: "15px", alignItems: "center", flexWrap: "wrap" }}>
                        {/* 🔥 HIỂN THỊ BADGE MÔN HỌC ĐỘNG TỪ BACKEND */}
                        <span style={{ backgroundColor: "#e0e7ff", color: "#4f46e5", padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "600" }}>
                            📚 {course.subjectName}
                        </span>
                        <span className="rating">⭐ {evaluation.averageRating || course.rating} ({evaluation.totalReviews || course.reviews} đánh giá)</span>
                        <span className="students">👥 {course.students} học viên</span>
                        <span className="teacher">👨‍🏫 Giảng viên: <strong>{course.teacher}</strong></span>
                    </div>

                    <div className="section-box">
                        <h2>Mục tiêu khóa học</h2>
                        <ul className="learning-objectives">
                            <li>Nắm vững 100% lý thuyết trọng tâm ôn thi Đại học.</li>
                            <li>Kỹ năng ứng dụng Casio giải nhanh các bài toán trắc nghiệm.</li>
                            <li>Tập trung cọ xát tư duy vận dụng và vận dụng cao (8+, 9+).</li>
                            <li>Bám sát cấu trúc form đề thi chuẩn của Bộ Giáo Dục.</li>
                        </ul>
                    </div>

                    <div className="section-box">
                        <h2>Đề cương khóa học (Syllabus)</h2>
                        <div className="syllabus-list">
                            {course.chapters.map((chapter) => (
                                <div className="chapter-item" key={chapter.id}>
                                    <div 
                                        className={`chapter-header ${expandedChapterId === chapter.id ? 'active' : ''}`}
                                        onClick={() => setExpandedChapterId(expandedChapterId === chapter.id ? null : chapter.id)}
                                        style={{cursor: 'pointer'}}
                                    >
                                        <h3>{chapter.title}</h3>
                                        <span className="toggle-icon">{expandedChapterId === chapter.id ? '▲' : '▼'}</span>
                                    </div>
                                    
                                    {expandedChapterId === chapter.id && (
                                        <div className="chapter-body">
                                            {chapter.lessons.map(lesson => (
                                                <div className="lesson-item" key={lesson.id}>
                                                    <div className="lesson-title">
                                                        <span className="play-icon">▶</span>
                                                        {lesson.title}
                                                    </div>
                                                    <div className="lesson-meta">
                                                        {lesson.isPreview && <span className="preview-badge">Học thử</span>}
                                                        <span className="duration">{lesson.duration}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="section-box course-reviews-evaluation" style={{ marginTop: "30px", backgroundColor: "#fff", padding: "25px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
                        <h2 style={{ fontSize: "20px", color: "#0f172a", marginBottom: "20px", borderBottom: "2px solid #f1f5f9", paddingBottom: "10px" }}>
                            Phản hồi từ học viên
                        </h2>

                        <div className="evaluation-layout" style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
                            <div className="evaluation-summary-left" style={{ flex: "1 1 300px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "20px" }}>
                                    <div style={{ fontSize: "44px", fontWeight: "800", color: "#0f172a", lineHeight: "1" }}>
                                        {evaluation.averageRating || course.rating || 0}
                                    </div>
                                    <div>
                                        <div style={{ color: "#eab308", fontSize: "18px", letterSpacing: "2px" }}>
                                            {renderStars(evaluation.averageRating || course.rating)}
                                        </div>
                                        <span style={{ fontSize: "13.5px", color: "#64748b", fontWeight: "500" }}>
                                            Xếp hạng khóa học • {evaluation.totalReviews || course.reviews || 0} lượt
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {[5, 4, 3, 2, 1].map((star) => {
                                        const count = evaluation.ratingStarsCount?.[star] || 0;
                                        const percent = calculatePercent(count, evaluation.totalReviews);
                                        
                                        return (
                                            <div key={star} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                                <span style={{ width: "45px", fontSize: "13px", fontWeight: "500", color: "#475569" }}>{star} sao</span>
                                                <div style={{ flex: 1, height: "8px", backgroundColor: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                                                    <div style={{ 
                                                        width: `${percent}%`, 
                                                        height: "100%", 
                                                        backgroundColor: "#eab308", 
                                                        borderRadius: "4px",
                                                        transition: "width 0.5s ease"
                                                    }}></div>
                                                </div>
                                                <span style={{ width: "35px", fontSize: "13px", color: "#64748b", textAlign: "right", fontWeight: "500" }}>{percent}%</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="evaluation-comments-right" style={{ flex: "1 1 400px", maxHeight: "450px", overflowY: "auto", paddingLeft: "20px", borderLeft: "1px solid #f1f5f9" }}>
                                <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "25px" }}>
                                    <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#1e293b", fontWeight: "700" }}>Đánh giá khóa học của bạn</h4>
                                    
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "12px" }}>
                                        <span style={{ fontSize: "13px", color: "#475569", fontWeight: "500" }}>Mức độ hài lòng:</span>
                                        <div style={{ display: "flex", gap: "4px" }}>
                                            {[1, 2, 3, 4, 5].map((starIdx) => (
                                                <span 
                                                    key={starIdx}
                                                    onClick={() => setUserRating(starIdx)}
                                                    style={{ fontSize: "22px", color: "#eab308", cursor: "pointer", userSelect: "none" }}
                                                >
                                                    {starIdx <= userRating ? "★" : "☆"}
                                                </span>
                                            ))}
                                        </div>
                                        <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "600", marginLeft: "4px" }}>({userRating} sao)</span>
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                        <textarea 
                                            id="student-review-comment"
                                            placeholder="Hãy để lại cảm nhận của bạn về chất lượng bài học tại đây để giảng viên cải thiện nhé..."
                                            rows="3"
                                            style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13.5px", fontFamily: "'Segoe UI', sans-serif", resize: "none" }}
                                        />
                                        <button 
                                            onClick={handleSendReview}
                                            style={{ alignSelf: "flex-end", padding: "8px 20px", backgroundColor: "#2747d9", color: "#fff", border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: "600", cursor: "pointer", transition: "0.2s" }}
                                        >
                                            Gửi đánh giá
                                        </button>
                                    </div>
                                </div>

                                <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#334155", fontWeight: "600" }}>Nhận xét gần đây</h4>
                                
                                {evaluation.reviews && evaluation.reviews.length > 0 ? (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        {evaluation.reviews.map((rev) => (
                                            <div key={rev.id} style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #f1f5f9" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                                                    <img 
                                                        src={getSafeAvatarUrl(rev.userAvatarUrl)} 
                                                        alt="User Avatar" 
                                                        style={{ width: "30px", height: "30px", borderRadius: "50%", objectFit: "cover" }}
                                                    />
                                                    <div>
                                                        <h5 style={{ margin: 0, fontSize: "12.5px", color: "#1e293b", fontWeight: "600" }}>{rev.userFullName}</h5>
                                                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>{new Date(rev.createdAt).toLocaleDateString("vi-VN")}</span>
                                                    </div>
                                                    <div style={{ marginLeft: "auto", color: "#eab308", fontSize: "11px" }}>
                                                        {renderStars(rev.rating)}
                                                    </div>
                                                </div>
                                                <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: "1.4" }}>{rev.comment}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "30px 0", color: "#94a3b8", fontStyle: "italic", fontSize: "13px" }}>
                                        🍃 Khóa học chưa nhận được bài đánh giá chi tiết nào.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="course-right">
                    <div className="floating-card">
                        <div className="preview-video">
                            <img src={course.thumbnail} alt="Course Preview" />
                            <div className="play-overlay">
                                <span>▶ Giới thiệu khóa học</span>
                            </div>
                        </div>

                        <div className="pricing-box">
                            <div className="price-tag">{course.price}</div>
                            {course.originalPrice && <div className="original-price">{course.originalPrice}</div>}
                        </div>

                        <button className="enroll-btn" onClick={() => navigate(`/checkout/${course.id}`)}>
                            Mua khóa học ngay
                        </button>
                        
                        <button
                            className="enroll-btn"
                            style={{ background: "transparent", color: "#3b82f6", border: "1px solid #3b82f6", marginTop: "10px" }}
                            onClick={handleFreeTrialLog}
                        >
                            Học thử miễn phí
                        </button>
                        
                        <div className="course-features">
                            <h4>Khóa học bao gồm:</h4>
                            <ul>
                                <li>🎬 Video bài giảng chất lượng Full HD</li>
                                <li>📄 File tài liệu, bài tập PDF đi kèm từng bài học</li>
                                <li>📱 Tương thích mượt mà trên cả Điện thoại & Máy tính</li>
                                <li>🤖 Tích hợp Lộ trình thích ứng AI bổ trợ điểm yếu</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}