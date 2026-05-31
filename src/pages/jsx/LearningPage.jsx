import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/LearningPage.css";

export default function LearningPage() {
    const { courseId, lessonId } = useParams();
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState("overview");
    const [expandedChapter, setExpandedChapter] = useState(0);

    // Mock dữ liệu bài giảng
    const course = {
        title: "Mastering Mathematics 12",
        chapters: [
            {
                id: 1,
                title: "Chương 1: Ứng dụng đạo hàm",
                lessons: [
                    { id: 101, title: "Sự đồng biến, nghịch biến", duration: "45:00", isCompleted: true },
                    { id: 102, title: "Cực trị của hàm số", duration: "50:20", isCompleted: false, isCurrent: true },
                    { id: 103, title: "Giá trị lớn nhất và nhỏ nhất", duration: "35:15", isCompleted: false }
                ]
            },
            {
                id: 2,
                title: "Chương 2: Hàm số Lũy thừa, Mũ",
                lessons: [
                    { id: 201, title: "Lũy thừa và hàm số lũy thừa", duration: "40:10", isCompleted: false },
                    { id: 202, title: "Logarit", duration: "48:00", isCompleted: false }
                ]
            }
        ]
    };

    return (
        <div className="learning-page">
            {/* TOP BAR */}
            <header className="learning-topbar">
                <div className="topbar-left" onClick={() => navigate(`/course/${courseId || 1}`)}>
                    <span className="back-arrow">←</span>
                    <h2 className="course-nav-title">{course.title}</h2>
                </div>
                <div className="topbar-right">
                    <div className="progress-box">
                        <span>Tiến độ: <strong>20%</strong></span>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: "20%" }}></div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="learning-workspace">
                {/* CỘT TRÁI: VIDEO & TABS */}
                <div className="learning-main">
                    <div className="video-container">
                        {/* Thay thế bằng thẻ <video> hoặc iframe YouTube khi có dữ liệu thật */}
                        <div className="video-placeholder">
                            <div className="play-button-large">▶</div>
                            <p>Video Bài Giảng: Cực trị của hàm số</p>
                        </div>
                    </div>

                    <div className="learning-content">
                        <h1 className="current-lesson-title">Bài 2: Cực trị của hàm số</h1>
                        
                        <div className="tabs">
                            <button className={activeTab === "overview" ? "tab active" : "tab"} onClick={() => setActiveTab("overview")}>Tổng quan</button>
                            <button className={activeTab === "materials" ? "tab active" : "tab"} onClick={() => setActiveTab("materials")}>Tài liệu (2)</button>
                            <button className={activeTab === "qna" ? "tab active" : "tab"} onClick={() => setActiveTab("qna")}>Hỏi đáp</button>
                            <button className={activeTab === "notes" ? "tab active" : "tab"} onClick={() => setActiveTab("notes")}>Ghi chú</button>
                        </div>

                        <div className="tab-content">
                            {activeTab === "overview" && (
                                <div className="overview-tab">
                                    <p>Trong bài học này, chúng ta sẽ tìm hiểu về các điểm cực đại, cực tiểu của đồ thị hàm số và cách sử dụng bảng biến thiên để xác định chúng.</p>
                                    <p><strong>Nhiệm vụ:</strong> Xem hết video và hoàn thành bài Quiz cuối giờ để mở khóa bài tiếp theo.</p>
                                </div>
                            )}
                            
                            {activeTab === "materials" && (
                                <div className="materials-tab">
                                    <div className="material-file">
                                        📄 <span>Slide_Bai2_CucTri.pdf</span>
                                        <button className="download-btn">Tải xuống</button>
                                    </div>
                                    <div className="material-file">
                                        📝 <span>BaiTap_TuLuyen_Bai2.docx</span>
                                        <button className="download-btn">Tải xuống</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === "qna" && (
                                <div className="qna-tab">
                                    <input type="text" placeholder="Đặt câu hỏi cho giáo viên hoặc AI..." className="qna-input"/>
                                    <button className="ask-btn">Gửi câu hỏi</button>
                                </div>
                            )}

                            {activeTab === "notes" && (
                                <div className="notes-tab">
                                    <p className="note-hint">Ghi chú lại những ý quan trọng. Ghi chú sẽ được lưu theo mốc thời gian của video.</p>
                                    <textarea placeholder="Thêm ghi chú mới tại 12:05..." rows="4" className="note-input"></textarea>
                                    <button className="save-note-btn">Lưu ghi chú</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* CỘT PHẢI: PLAYLIST (SYLLABUS) */}
                <div className="learning-sidebar">
                    <div className="sidebar-header">
                        <h3>Nội dung bài học</h3>
                    </div>
                    <div className="playlist">
                        {course.chapters.map((chapter, index) => (
                            <div className="chapter-group" key={chapter.id}>
                                <div 
                                    className="chapter-title-box" 
                                    onClick={() => setExpandedChapter(expandedChapter === index ? null : index)}
                                >
                                    <h4>{chapter.title}</h4>
                                    <span>{expandedChapter === index ? '▲' : '▼'}</span>
                                </div>

                                {expandedChapter === index && (
                                    <div className="chapter-lessons">
                                        {chapter.lessons.map(lesson => (
                                            <div className={`playlist-item ${lesson.isCurrent ? 'current' : ''}`} key={lesson.id}>
                                                <div className="checkbox-wrapper">
                                                    <input type="checkbox" checked={lesson.isCompleted} readOnly />
                                                </div>
                                                <div className="lesson-details">
                                                    <span className="title">{lesson.title}</span>
                                                    <span className="duration">▶ {lesson.duration}</span>
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
        </div>
    );
}