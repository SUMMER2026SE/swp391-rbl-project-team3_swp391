import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient"; // 🔥 ĐÃ THÊM AXIOS CLIENT
import "../css/LearningPage.css";

export default function LearningPage() {
    const { courseId } = useParams(); 
    const navigate = useNavigate();
    
    const [course, setCourse] = useState(null); // 🔥 Chuyển thành State để nhận dữ liệu từ API
    const [currentLesson, setCurrentLesson] = useState(null); // 🔥 Khởi tạo null để chờ API load xong
    const [activeTab, setActiveTab] = useState("overview");
    const [expandedChapter, setExpandedChapter] = useState(0);

    // 1. GỌI API LẤY DỮ LIỆU KHÓA HỌC THẬT
    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                // Gọi tới endpoint lấy chi tiết khóa học (Đường dẫn này json-server đã hỗ trợ sẵn)
                const response = await axiosClient.get(`/courses/${courseId}`);
                setCourse(response.data);

                // Tự động chọn bài học đầu tiên của chương đầu tiên để phát khi mới vào trang
                if (response.data.chapters?.[0]?.lessons?.[0]) {
                    setCurrentLesson(response.data.chapters[0].lessons[0]);
                }
            } catch (error) {
                console.error("Lỗi tải nội dung bài học:", error);
            }
        };
        fetchCourseData();
    }, [courseId]);

    // 2. TÍNH TOÁN TIẾN ĐỘ HỌC TẬP (Đặt sau khi đã có cấu trúc dữ liệu an toàn)
    const totalLessons = course?.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0;
    
    // Giả lập logic tiến độ: Bài nào có ID nhỏ hơn bài đang xem thì coi như đã hoàn thành
    const completedLessons = course?.chapters?.reduce((acc, ch) => 
        acc + (ch.lessons?.filter(l => currentLesson && l.id < currentLesson.id).length || 0), 0) || 0;
        
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Lớp phòng thủ: Nếu chưa load xong dữ liệu từ db.json thì hiện loading chứ không làm sập trang
    if (!course || !currentLesson) {
        return <div className="loading-spinner" style={{ textAlign: "center", paddingTop: "100px", fontSize: "18px" }}>⏳ Đang tải bài giảng...</div>;
    }

    return (
        <div className="learning-page">
            <header className="learning-topbar">
                <div className="topbar-left" onClick={() => navigate(`/course/${courseId || 1}`)} style={{cursor: 'pointer'}}>
                    <span className="back-arrow">←</span>
                    <h2 className="course-nav-title">{course.title || course.course_title}</h2>
                </div>
                <div className="topbar-right">
                    <div className="progress-box">
                        <span>Tiến độ: <strong>{progress}%</strong></span>
                        <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="learning-workspace">
                {/* TRÁI: VIDEO & TABS */}
                <div className="learning-main">
                    <div className="video-container">
                        <div className="video-placeholder">
                            <div className="play-button-large">▶</div>
                            <p>Đang phát: {currentLesson.title}</p>
                        </div>
                    </div>

                    <div className="learning-content">
                        <h1 className="current-lesson-title">{currentLesson.title}</h1>
                        
                        <div className="tabs">
                            <button className={activeTab === "overview" ? "tab active" : "tab"} onClick={() => setActiveTab("overview")}>Tổng quan</button>
                            <button className={activeTab === "materials" ? "tab active" : "tab"} onClick={() => setActiveTab("materials")}>Tài liệu (2)</button>
                            <button className={activeTab === "qna" ? "tab active" : "tab"} onClick={() => setActiveTab("qna")}>Hỏi đáp</button>
                            <button className={activeTab === "notes" ? "tab active" : "tab"} onClick={() => setActiveTab("notes")}>Ghi chú</button>
                        </div>

                        <div className="tab-content">
                            {activeTab === "overview" && (
                                <div className="overview-tab">
                                    <p>{currentLesson.description || "Bài học này chưa có mô tả chi tiết từ giảng viên."}</p>
                                    <p><strong>Nhiệm vụ:</strong> Xem hết video để mở khóa bài tiếp theo.</p>
                                </div>
                            )}
                            
                            {activeTab === "materials" && (
                                <div className="materials-tab">
                                    <div className="material-file">
                                        📄 <span>Slide_BaiHoc_{currentLesson.id}.pdf</span>
                                        <button className="download-btn">Tải xuống</button>
                                    </div>
                                    <div className="material-file">
                                        📝 <span>BaiTap_TuLuyen.docx</span>
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
                                    <p className="note-hint">Ghi chú sẽ được lưu theo mốc thời gian của video.</p>
                                    <textarea placeholder="Thêm ghi chú mới..." rows="4" className="note-input"></textarea>
                                    <button className="save-note-btn">Lưu ghi chú</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* PHẢI: PLAYLIST DỮ LIỆU ĐỘNG */}
                <div className="learning-sidebar">
                    <div className="sidebar-header">
                        <h3>Nội dung bài học</h3>
                    </div>
                    <div className="playlist">
                        {course.chapters && course.chapters.map((chapter, index) => (
                            <div className="chapter-group" key={chapter.id || index}>
                                <div 
                                    className="chapter-title-box" 
                                    onClick={() => setExpandedChapter(expandedChapter === index ? null : index)}
                                    style={{cursor: 'pointer'}}
                                >
                                    <h4>{chapter.title}</h4>
                                    <span>{expandedChapter === index ? '▲' : '▼'}</span>
                                </div>

                                {expandedChapter === index && (
                                    <div className="chapter-lessons">
                                        {chapter.lessons && chapter.lessons.map(lesson => (
                                            <div 
                                                className={`playlist-item ${currentLesson.id === lesson.id ? 'current' : ''}`} 
                                                key={lesson.id}
                                                onClick={() => setCurrentLesson(lesson)} // Click để chuyển video bài giảng bài đó
                                                style={{ cursor: "pointer" }}
                                            >
                                                <div className="checkbox-wrapper">
                                                    <input type="checkbox" checked={lesson.id < currentLesson.id} readOnly />
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