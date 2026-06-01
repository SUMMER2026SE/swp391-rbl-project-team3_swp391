import React, { useState, useEffect } from "react"; // Đã thêm useEffect
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; // Đã thêm import axiosClient
import "../css/CourseDetailPage.css";

export default function CourseDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    
    // State quản lý việc đóng/mở các chương học (Accordion)
    const [expandedChapter, setExpandedChapter] = useState(0);

    // 1. KHỞI TẠO STATE: Chuyển dữ liệu mẫu cũ thành giá trị mặc định của State
    const [course, setCourse] = useState({
        id: id || 1,
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
                    { id: 102, title: "Cực trị của hàm số", duration: "50:20", isPreview: false },
                    { id: 103, title: "Giá trị lớn nhất và nhỏ nhất", duration: "35:15", isPreview: false }
                ]
            },
            {
                id: 2,
                title: "Chương 2: Hàm số Lũy thừa, Mũ và Logarit",
                lessons: [
                    { id: 201, title: "Lũy thừa và hàm số lũy thừa", duration: "40:10", isPreview: false },
                    { id: 202, title: "Logarit", duration: "48:00", isPreview: false },
                    { id: 203, title: "Phương trình mũ và logarit", duration: "55:30", isPreview: false }
                ]
            },
            {
                id: 3,
                title: "Chương 3: Nguyên hàm - Tích phân",
                lessons: [
                    { id: 301, title: "Khái niệm Nguyên hàm", duration: "42:15", isPreview: false },
                    { id: 302, title: "Phương pháp tính Tích phân", duration: "60:00", isPreview: false }
                ]
            }
        ]
    });

    // 2. GỌI API TRONG USEEFFECT: Tự động chạy mỗi khi ID trên thanh URL thay đổi
    useEffect(() => {
        const fetchCourseDetail = async () => {
            try {
                const response = await axiosClient.get(`/courses/${id}`);
                
                // 3. XỬ LÝ TRONG .THEN() (THÀNH CÔNG): Đè dữ liệu thật từ DB lên dữ liệu mẫu
                if (response.data) {
                    setCourse(response.data);
                }
            } catch (error) {
                // 3. XỬ LÝ TRONG .CATCH() (THẤT BẠI): Giữ nguyên dữ liệu mẫu ban đầu để chạy tiếp
                console.log(`Chưa bật hệ thống Backend hoặc không tìm thấy Course ID #${id}. Đang chạy dữ liệu Mock để demo giao diện:`, error);
            }
        };

        fetchCourseDetail();
    }, [id]);

    return (
        <div className="course-detail-page">
            {/* Thanh điều hướng quay lại */}
            <div className="breadcrumb">
                <span onClick={() => navigate("/home")}>Trang chủ</span> 
                <span className="separator">/</span> 
                <span onClick={() => navigate("/courses")}>Khóa học</span> 
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
                            <li>Nắm vững 100% lý thuyết SGK Toán 12.</li>
                            <li>Kỹ năng bấm máy tính Casio giải nhanh trắc nghiệm.</li>
                            <li>Tư duy giải quyết các câu phân loại cao (Vận dụng - Vận dụng cao).</li>
                            <li>Làm quen với cấu trúc đề thi mới nhất của Bộ GD&ĐT.</li>
                        </ul>
                    </div>

                    <div className="section-box">
                        <h2>Đề cương khóa học (Syllabus)</h2>
                        <div className="syllabus-list">
                            {course.chapters && course.chapters.map((chapter, index) => (
                                <div className="chapter-item" key={chapter.id}>
                                    <div 
                                        className={`chapter-header ${expandedChapter === index ? 'active' : ''}`}
                                        onClick={() => setExpandedChapter(expandedChapter === index ? null : index)}
                                    >
                                        <h3>{chapter.title}</h3>
                                        <span className="toggle-icon">{expandedChapter === index ? '▲' : '▼'}</span>
                                    </div>
                                    
                                    {expandedChapter === index && (
                                        <div className="chapter-body">
                                            {chapter.lessons && chapter.lessons.map(lesson => (
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
                            <div className="original-price">{course.originalPrice}</div>
                        </div>

                        <button className="enroll-btn" onClick={() => navigate(`/learn/${course.id}`)}>
                            Đăng ký học ngay
                        </button>                        
                        
                        <div className="course-features">
                            <h4>Khóa học bao gồm:</h4>
                            <ul>
                                <li>🎬 45 giờ video bài giảng chất lượng cao</li>
                                <li>📄 120 bài tập thực hành kèm đáp án chi tiết</li>
                                <li>📱 Truy cập mọi lúc, mọi nơi trên thiết bị di động</li>
                                <li>🤖 Lộ trình học thích ứng (AI-powered)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}