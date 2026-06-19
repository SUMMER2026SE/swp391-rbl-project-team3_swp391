import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; 
import "../css/CourseDetailPage.css";

// Tách dữ liệu Mock ra ngoài component để tránh khởi tạo lại lãng phí RAM mỗi lần re-render
const MOCK_COURSE_FALLBACK = {
    title: "Mastering Mathematics 12",
    description: "Khóa học toàn diện bao phủ toàn bộ kiến thức Toán 12. Cung cấp kỹ năng giải nhanh trắc nghiệm, bứt phá điểm 8+ kỳ thi THPT Quốc gia 2026.",
    teacher: "Nguyen Minh Quan",
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
    
    // Quản lý trạng thái mở chương bằng ID (Thay vì Index) để tránh lỗi lệch dòng dữ liệu
    const [expandedChapterId, setExpandedChapterId] = useState(null);
    
    // FIX lỗi nhấp nháy: Khởi tạo state ban đầu là null để hiển thị màn hình chờ (Loading)
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourseDetail = async () => {
            setLoading(true);
            try {
                const response = await axiosClient.get(`/courses/${id}`);                
                if (response.data) {
                    const data = response.data;
                    
                    // FIX lỗi vỡ định dạng giá tiền từ API đổ về
                    const cleanPrice = Number(String(data.price || data.Price || 0).replace(/[^0-9]/g, ''));
                    const cleanOriginal = Number(String(data.original_price || data.originalPrice || 0).replace(/[^0-9]/g, ''));

                    // Map dữ liệu phòng thủ đồng bộ tên biến snake_case từ DB
                    const mappedData = {
                        id: data.course_id || data.id || id,
                        title: data.course_title || data.title || "Khóa học không tên",
                        description: data.description || data.course_desc || "",
                        teacher: data.teacher_name || data.teacher || "Giáo viên",
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
                    // Tự động mở chương đầu tiên sau khi load xong dữ liệu thật
                    if (mappedData.chapters.length > 0) {
                        setExpandedChapterId(mappedData.chapters[0].id);
                    }
                }
            } catch (error) {
                console.warn("Đang dùng dữ liệu Mock do không kết nối được Backend hoặc ID không tồn tại.", error);
                // Nếu lỗi, lôi dữ liệu Mock dự phòng ra hiển thị để demo không bị sập màn hình
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

    // Giao diện loading chuyên nghiệp, ngăn chặn hoàn toàn hiện tượng nhấp nháy đổi chữ
    if (loading) {
        return (
            <div className="course-detail-loading">
                <div className="spinner"></div>
                <p>Đang tải thông tin khóa học...</p>
            </div>
        );
    }

    // Trường hợp xấu nhất không có dữ liệu
    if (!course) return <div className="error-text">Không tìm thấy khóa học yêu cầu!</div>;

    return (
        <div className="course-detail-page">
            {/* BREADCRUMB */}
            <div className="breadcrumb">
                <span onClick={() => navigate("/home")} style={{cursor: 'pointer'}}>Trang chủ</span> 
                <span className="separator">/</span> 
                <span onClick={() => navigate("/courses")} style={{cursor: 'pointer'}}>Khóa học</span> 
                <span className="separator">/</span> 
                <span className="current">{course.title}</span>
            </div>

            <div className="course-detail-container">
                {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
                <div className="course-left">
                    <h1 className="course-title">{course.title}</h1>
                    <p className="course-description">{course.description}</p>
                    
                    <div className="course-meta-top">
                        <span className="rating">⭐ {course.rating} ({course.reviews} đánh giá)</span>
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
                </div>

                {/* CỘT PHẢI: WIDGET ĐĂNG KÝ (STICKY) */}
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

                        <button className="enroll-btn" onClick={() => navigate(`/learn/${course.id}`)}>
                            Đăng ký học ngay
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