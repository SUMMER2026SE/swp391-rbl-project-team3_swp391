import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; 
import "../css/CourseDetailPage.css";
import "../css/skeleton.css";

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
    const [isEnrolled, setIsEnrolled] = useState(false);

    // Lấy thông tin user hiện tại
    const [currentUser, setCurrentUser] = useState(() => {
        const stored = localStorage.getItem("user");
        return stored ? JSON.parse(stored) : null;
    });

    const isAdmin = currentUser?.role === "ADMIN" || currentUser?.roleName === "ADMIN" || currentUser?.roleId === 1;

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

    const getSafeAvatarUrl = (url, name) => {
        const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=64748b&color=fff`;
        if (!url || url === "null" || url.trim() === "") return fallbackUrl;
        if (url.startsWith("http")) return url;
        return `http://localhost:8080${url}`;
    };

    const calculatePercent = (count, total) => {
        if (!total || total <= 0) return 0;
        return Math.round((count / total) * 100);
    };

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
                    
                    let cleanPrice = Number(String(data.price || data.Price || data.course_price || data.coursePrice || 0).replace(/[^0-9]/g, ''));
                    let cleanOriginal = Number(String(data.original_price || data.originalPrice || 0).replace(/[^0-9]/g, ''));

                    try {
                        const listRes = await axiosClient.get('/courses');
                        const rawList = Array.isArray(listRes.data) ? listRes.data : (listRes.data?.courses || []);
                        const found = rawList.find(c => String(c.id || c.courseId) === String(id));
                        
                        if (found) {
                            if (cleanPrice === 0 && found.price) {
                                cleanPrice = Number(String(found.price).replace(/[^0-9]/g, ''));
                            }
                            data.teacher_name = data.teacher_name || found.teacherName || found.teacher;
                            data.subjectName = data.subjectName || found.subjectName || found.subject?.subjectName || "Chung";
                        }
                    } catch (e) { console.log("Fallback list fetch failed"); }

                    let thumbnail = data.thumbnail_url || data.thumbnail;
                    if (!thumbnail) {
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
                        thumbnail = getSubjectThumbnail(data.subjectName);
                    }

                    const mappedData = {
                        id: data.course_id || data.id || id,
                        title: data.course_title || data.title || "Khóa học không tên",
                        description: data.description || data.course_desc || "",
                        teacher: data.teacher_name || data.teacher || "Giáo viên",
                        subjectName: data.subjectName,
                        price: cleanPrice > 0 ? `${cleanPrice.toLocaleString('vi-VN')}đ` : "Miễn phí",
                        originalPrice: cleanOriginal > 0 ? `${cleanOriginal.toLocaleString('vi-VN')}đ` : "",
                        rating: data.rating || 5.0,
                        reviews: data.reviews || data.review_count || 0,
                        students: data.students || data.student_count || 0,
                        thumbnail: thumbnail,
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

                // 🔥 TÍNH NĂNG ADMIN: ĐẶC QUYỀN MỞ KHÓA KHÔNG CẦN MUA
                const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                const isAdminUser = userObj?.role === "ADMIN" || userObj?.roleName === "ADMIN" || userObj?.roleId === 1;

                if (isAdminUser) {
                    setIsEnrolled(true); // Admin luôn coi như đã sở hữu khóa học
                } else {
                    try {
                        const token = localStorage.getItem("token");
                        if (token) {
                            const enrollRes = await axiosClient.get(`/courses/${id}/check-enrollment`);
                            if (enrollRes.data && enrollRes.data.isEnrolled) {
                                setIsEnrolled(true);
                            }
                        }
                    } catch (e) {
                        console.log("Chưa đăng nhập hoặc lỗi check enrollment");
                    }
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
            if (error.response?.status === 401) {
                alert("Bạn cần đăng nhập hệ thống để thực hiện gửi đánh giá!");
            } else if (error.response?.status === 500) {
                alert("Lỗi máy chủ (500). Xin hãy khởi động lại Backend theo hướng dẫn của AI!");
            } else {
                alert("Gửi đánh giá thất bại: " + (error.response?.data?.message || error.message));
            }
        }
    };

    const getDisplayChapters = () => {
        return course?.chapters || [];
    };

    const hasAnyPreview = (course?.chapters || []).some(chapter => 
        (chapter.lessons || []).some(lesson => lesson.isPreview || lesson.is_preview)
    );

    if (loading) {
        return (
            <div className="course-detail-page">
                <div className="breadcrumb">
                    <div className="skeleton-box skeleton-text short"></div>
                </div>

                <div className="course-detail-container">
                    <div className="course-left">
                        <div className="skeleton-box skeleton-title"></div>
                        <div className="skeleton-box skeleton-text"></div>
                        <div className="skeleton-box skeleton-text short"></div>
                        
                        <div className="section-box" style={{marginTop: '30px'}}>
                            <div className="skeleton-box skeleton-lesson"></div>
                            <div className="skeleton-box skeleton-lesson"></div>
                            <div className="skeleton-box skeleton-lesson"></div>
                        </div>
                    </div>

                    <div className="course-right">
                        <div className="floating-card">
                            <div className="skeleton-box skeleton-thumbnail"></div>
                            <div className="skeleton-box skeleton-button"></div>
                            <div className="skeleton-box skeleton-button"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!course) return <div className="error-text">Không tìm thấy khóa học yêu cầu!</div>;

    const displayChapters = getDisplayChapters();

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
                            {(() => {
                                const subjectMap = {
                                    "Toán Học": [
                                        "Nắm vững 100% lý thuyết trọng tâm ôn thi Đại học.",
                                        "Kỹ năng ứng dụng Casio giải nhanh các bài toán trắc nghiệm.",
                                        "Tập trung cọ xát tư duy vận dụng và vận dụng cao (8+, 9+).",
                                        "Bám sát cấu trúc form đề thi chuẩn của Bộ Giáo Dục."
                                    ],
                                    "Ngữ Văn": [
                                        "Nắm vững hệ thống luận điểm, nghệ thuật của các tác phẩm trọng tâm.",
                                        "Kỹ năng lập dàn ý và viết bài văn nghị luận xã hội sâu sắc.",
                                        "Rèn luyện kỹ năng đọc hiểu và cảm thụ văn học (điểm 8+, 9+).",
                                        "Bám sát cấu trúc đề thi tự luận của Bộ Giáo Dục."
                                    ],
                                    "Tiếng Anh": [
                                        "Làm chủ hệ thống ngữ pháp và từ vựng trọng tâm thi THPT.",
                                        "Kỹ năng quét thông tin nhanh (Skimming & Scanning) cho bài đọc hiểu.",
                                        "Chinh phục các câu hỏi từ vựng khó, thành ngữ (Idioms) lấy điểm 9, 10.",
                                        "Thực chiến với các bộ đề thi chuẩn hóa bám sát form Bộ Giáo Dục."
                                    ],
                                    "Vật Lý": [
                                        "Nắm vững bản chất hiện tượng vật lý và các công thức cốt lõi.",
                                        "Kỹ năng giải nhanh các bài toán đồ thị và mạch điện xoay chiều.",
                                        "Phát triển tư duy logic xử lý các câu hỏi vận dụng cao.",
                                        "Thực chiến với hệ thống bài tập bám sát ma trận đề thi."
                                    ],
                                    "Hóa Học": [
                                        "Hệ thống hóa toàn bộ kiến thức Hóa vô cơ và Hóa hữu cơ.",
                                        "Kỹ năng bảo toàn khối lượng, bảo toàn electron giải nhanh bài tập.",
                                        "Bí kíp xử lý các bài toán hỗn hợp phức tạp và chuỗi phản ứng.",
                                        "Rèn phản xạ khoanh đáp án nhanh và chính xác nhất."
                                    ],
                                    "Sinh Học": [
                                        "Hiểu sâu bản chất các cơ chế di truyền và biến dị.",
                                        "Kỹ năng phân tích phả hệ và tính xác suất sinh học chính xác.",
                                        "Hệ thống hóa kiến thức tiến hóa và sinh thái học.",
                                        "Tối ưu thời gian làm bài với mẹo giải nhanh trắc nghiệm Sinh."
                                    ],
                                    "Lịch Sử": [
                                        "Hệ thống hóa dòng thời gian lịch sử Việt Nam và Thế giới.",
                                        "Nắm vững nguyên nhân, diễn biến và ý nghĩa các sự kiện trọng tâm.",
                                        "Kỹ năng phân tích, so sánh các giai đoạn lịch sử tránh nhầm lẫn.",
                                        "Luyện tập phản xạ trắc nghiệm với ngân hàng câu hỏi bám sát Bộ."
                                    ],
                                    "Địa Lý": [
                                        "Nắm vững kỹ năng phân tích Atlat Địa lý Việt Nam.",
                                        "Hiểu sâu về địa lý tự nhiên, dân cư và các vùng kinh tế.",
                                        "Kỹ năng đọc biểu đồ, bảng số liệu và nhận dạng biểu đồ.",
                                        "Giải quyết gọn gàng các câu hỏi vận dụng thực tế."
                                    ]
                                };

                                const engMap = {
                                    "Mathematics": "Toán Học", "Literature": "Ngữ Văn", "English": "Tiếng Anh",
                                    "Physics": "Vật Lý", "Chemistry": "Hóa Học", "Biology": "Sinh Học",
                                    "History": "Lịch Sử", "Geography": "Địa Lý"
                                };

                                const defaultObj = [
                                    "Nắm vững 100% kiến thức nền tảng và trọng tâm ôn thi.",
                                    "Phát triển tư duy phân tích và kỹ năng giải quyết vấn đề.",
                                    "Tập trung cọ xát các dạng bài vận dụng và vận dụng cao.",
                                    "Bám sát cấu trúc form đề thi chuẩn của Bộ Giáo Dục."
                                ];

                                let sName = course.subjectName;
                                sName = engMap[sName] || sName;
                                const objs = subjectMap[sName] || defaultObj;

                                return objs.map((obj, idx) => (
                                    <li key={idx}>{obj}</li>
                                ));
                            })()}
                        </ul>
                    </div>

                    <div className="section-box">
                        <h2>Đề cương khóa học (Syllabus)</h2>
                        <div className="syllabus-list">
                            {displayChapters.map((chapter) => (
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
                                                        {((lesson.isPreview || lesson.is_preview) || (!hasAnyPreview && lesson.id === course?.chapters?.[0]?.lessons?.[0]?.id)) && <span className="preview-badge">Học thử</span>}
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

                            <div className="evaluation-comments-right" style={{ flex: "1 1 400px", maxHeight: "450px", overflowY: "auto", overflowX: "hidden", paddingLeft: "20px", borderLeft: "1px solid #f1f5f9" }}>
                                <div style={{ backgroundColor: "#f8fafc", padding: "15px", borderRadius: "10px", border: "1px solid #e2e8f0", marginBottom: "25px", boxSizing: "border-box" }}>
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
                                            style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "13.5px", fontFamily: "'Segoe UI', sans-serif", resize: "none" }}
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
                                                        src={getSafeAvatarUrl(rev.userAvatarUrl, rev.userFullName)} 
                                                        onError={(e) => {
                                                            e.target.onerror = null; 
                                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(rev.userFullName || "User")}&background=64748b&color=fff`;
                                                        }}
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

                        {/* 🔥 HIỂN THỊ NÚT VÀO HỌC CHO CẢ ADMIN VÀ HỌC VIÊN ĐÃ MUA */}
                        {isEnrolled ? (
                            <button className="enroll-btn" onClick={() => navigate(`/learn/${course.id}`)}>
                                Vào Học {isAdmin && "(Quyền Admin)"}
                            </button>
                        ) : (
                            <>
                                {!localStorage.getItem("token") ? (
                                    <button className="enroll-btn" onClick={() => navigate("/auth", { state: { mode: "register" } })}>
                                        Đăng ký ngay
                                    </button>
                                ) : (
                                    <button className="enroll-btn" onClick={() => navigate(`/checkout/${course.id}`)}>
                                        Đăng ký
                                    </button>
                                )}
                                
                                <button
                                    className="enroll-btn"
                                    style={{ background: "transparent", color: "#3b82f6", border: "1px solid #3b82f6", marginTop: "10px" }}
                                    onClick={handleFreeTrialLog}
                                >
                                    Học thử miễn phí
                                </button>
                            </>
                        )}
                        
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