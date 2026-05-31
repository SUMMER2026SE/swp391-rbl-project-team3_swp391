import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/TeacherPreviewPage.css";

export default function TeacherPreviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [expandedChapter, setExpandedChapter] = useState(0);

    // Mock dữ liệu khóa học mà giáo viên đang soạn thảo
    const course = {
        id: id || 4,
        title: "Tuyệt đỉnh Casio - Giải nhanh trắc nghiệm Toán",
        description: "Bí kíp bấm máy tính Casio Fx-580VNX & Fx-880BTG. Giải quyết nhanh gọn các câu hỏi Toán THPT Quốc gia chỉ trong 30 giây.",
        status: "DRAFT", // Trạng thái: Bản nháp (chưa xuất bản)
        price: "299,000đ",
        originalPrice: "500,000đ",
        thumbnail: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?auto=format&fit=crop&w=800&q=80",
        chapters: [
            {
                id: 1,
                title: "Chương 1: Kỹ thuật Casio cơ bản",
                lessons: [
                    { id: 101, title: "Làm quen thiết lập Fx-880BTG", duration: "15:00", isPreview: true },
                    { id: 102, title: "Giải phương trình, hệ phương trình", duration: "25:20", isPreview: false }
                ]
            },
            {
                id: 2,
                title: "Chương 2: Ứng dụng Casio giải Tích phân",
                lessons: [
                    { id: 201, title: "Tích phân hàm ẩn", duration: "30:10", isPreview: false },
                    { id: 202, title: "Chống Casio và cách hóa giải", duration: "45:00", isPreview: false }
                ]
            }
        ]
    };

    return (
        <div className="teacher-preview-page">
            {/* THANH PREVIEW MODE (Dành riêng cho Giáo viên) */}
            <div className="preview-mode-banner">
                <div className="banner-info">
                    <span className="eye-icon">👁️</span>
                    <span>Bạn đang xem trước khóa học dưới góc nhìn <strong>Học sinh</strong></span>
                    <span className={`status-badge ${course.status === 'DRAFT' ? 'draft' : 'published'}`}>
                        {course.status === 'DRAFT' ? 'Bản nháp' : 'Đã xuất bản'}
                    </span>
                </div>
                <div className="banner-actions">
                    <button className="edit-btn" onClick={() => alert("Chuyển về trang Trình soạn thảo (Trang chỉnh sửa)!")}>
                        ✏️ Tiếp tục chỉnh sửa
                    </button>
                    <button className="publish-btn" onClick={() => alert("Khóa học đã được xuất bản lên hệ thống!")}>
                        🚀 Xuất bản ngay
                    </button>
                </div>
            </div>

            {/* GIAO DIỆN MÔ PHỎNG GIỐNG HỆT HỌC SINH */}
            <div className="course-detail-container preview-container">
                <div className="course-left">
                    <h1 className="course-title">{course.title}</h1>
                    <p className="course-description">{course.description}</p>
                    
                    <div className="section-box">
                        <h2>Đề cương khóa học (Preview)</h2>
                        <div className="syllabus-list">
                            {course.chapters.map((chapter, index) => (
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

                <div className="course-right">
                    <div className="floating-card">
                        <div className="preview-video">
                            <img src={course.thumbnail} alt="Course Preview" />
                            <div className="play-overlay">
                                <span>▶ Video Intro</span>
                            </div>
                        </div>

                        <div className="pricing-box">
                            <div className="price-tag">{course.price}</div>
                            <div className="original-price">{course.originalPrice}</div>
                        </div>

                        <button className="enroll-btn disabled-preview">Đăng ký học ngay (Vô hiệu hóa)</button>
                    </div>
                </div>
            </div>
        </div>
    );
}