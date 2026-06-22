import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/LearningPage.css";

export default function LearningPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState(null);
    const [currentLesson, setCurrentLesson] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [expandedChapter, setExpandedChapter] = useState(0);

    // State quản lý danh sách câu hỏi QnA
    const [questions, setQuestions] = useState([]);
    const [newQuestionContent, setNewQuestionContent] = useState("");

    const videoRef = useRef(null);

    // 1. GỌI API LẤY DỮ LIỆU KHÓA HỌC THẬT
    useEffect(() => {
        const fetchCourseData = async () => {
            try {
                const response = await axiosClient.get(`/courses/${courseId}`);
                setCourse(response.data);

                if (response.data.chapters?.[0]?.lessons?.[0]) {
                    setCurrentLesson(response.data.chapters[0].lessons[0]);
                }
            } catch (error) {
                console.error("Lỗi tải nội dung bài học:", error);
            }
        };
        fetchCourseData();
    }, [courseId]);

    // Tự động tải danh sách câu hỏi khi chuyển bài
    useEffect(() => {
        const fetchQuestions = async () => {
            if (currentLesson?.id) {
                try {
                    const response = await axiosClient.get(`/questions/lesson/${currentLesson.id}`);
                    setQuestions(response.data);
                } catch (error) {
                    console.error("Lỗi tải danh sách câu hỏi thảo luận:", error);
                }
            }
        };
        fetchQuestions();
    }, [currentLesson]);

    // Tự động tua video về mốc cũ
    useEffect(() => {
        if (currentLesson && videoRef.current) {
            const savedTime = localStorage.getItem(`video_progress_lesson_${currentLesson.id}`);
            if (savedTime) {
                videoRef.current.currentTime = parseFloat(savedTime);
            }
        }
    }, [currentLesson]);

    const handleTimeUpdate = () => {
        if (videoRef.current && currentLesson) {
            const currentTime = videoRef.current.currentTime;
            localStorage.setItem(`video_progress_lesson_${currentLesson.id}`, currentTime);
        }
    };

    // 🔥 ĐÃ THAY THẾ: Hàm nhận object material, tự động bốc tách link chuẩn hóa an toàn gửi API kèm Token
    const handleDownload = async (material) => {
        // In log ra màn hình F12 để kiểm soát dữ liệu thực tế từ DB
        console.log("Dữ liệu tài liệu nhận được từ DB:", material);

        // Quét tìm link file bọc trong object (phòng thủ các loại tên cột snake_case / camelCase)
        const pathUrl = material.fileUrl || material.file_url || material.url || material.link || material.path;
        const fileName = material.title || material.name || "tai-lieu.pdf";

        if (!pathUrl) {
            alert("Rất tiếc, không tìm thấy đường dẫn tải file của tài liệu này!");
            return;
        }

        try {
            // 1. Lấy token thật tự động từ localStorage để đi qua cửa chặn của Spring Security
            const token = localStorage.getItem("token");

            // 2. Gọi API GET bốc file Blob nhị phân kèm Header Authorization hợp lệ
            const response = await axiosClient.get(`/materials/download`, {
                params: { fileUrl: pathUrl },
                responseType: "blob",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // 3. Xử lý lưu file nhị phân tải trực tiếp về thiết bị của người dùng
            // 🔥 ĐÃ SỬA: Ép cứng kiểu nội dung là định dạng PDF chuẩn
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");
            link.href = url;

            // 🔥 ĐÃ SỬA: Kiểm tra nếu tên file chưa có đuôi .pdf thì tự động nối thêm vào
            const safeFileName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
            link.setAttribute("download", safeFileName);

            document.body.appendChild(link);
            link.click();

            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Lỗi bảo mật: Bạn không có quyền tải tài liệu này!", error);
            alert("Không thể tải tài liệu. Vui lòng kiểm tra lại quyền hoặc trạng thái đăng nhập!");
        }
    };

    const handlePostQuestion = async () => {
        if (!newQuestionContent.trim()) {
            alert("Vui lòng nhập nội dung câu hỏi thảo luận!");
            return;
        }
        try {
            const response = await axiosClient.post("/questions", {
                content: newQuestionContent,
                lessonId: currentLesson.id
            });
            setQuestions([response.data, ...questions]);
            setNewQuestionContent("");
        } catch (error) {
            console.error("Lỗi khi đăng câu hỏi:", error);
        }
    };

    const totalLessons = course?.chapters?.reduce((acc, ch) => acc + (ch.lessons?.length || 0), 0) || 0;
    const completedLessons = course?.chapters?.reduce((acc, ch) =>
        acc + (ch.lessons?.filter(l => currentLesson && l.id < currentLesson.id).length || 0), 0) || 0;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    if (!course || !currentLesson) {
        return <div className="loading-spinner" style={{ textAlign: "center", paddingTop: "100px", fontSize: "18px" }}>⏳ Đang tải bài giảng...</div>;
    }

    return (
        <div className="learning-page">
            <header className="learning-topbar">
                <div className="topbar-left" onClick={() => navigate(`/course/${courseId || 1}`)} style={{ cursor: 'pointer' }}>
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
                <div className="learning-main">
                    <div className="video-container">
                        {currentLesson.videoUrl ? (

                            currentLesson.videoUrl.includes("youtube.com") ||
                            currentLesson.videoUrl.includes("youtu.be")

                                ? (

                                    <iframe
                                        width="100%"
                                        height="700"
                                        src={
                                            currentLesson.videoUrl
                                                .replace("watch?v=", "embed/")
                                                .replace("youtu.be/", "www.youtube.com/embed/")
                                        }
                                        title={currentLesson.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        style={{ borderRadius: "8px" }}
                                    />

                                ) : (

                                    <video
                                        ref={videoRef}
                                        src={
                                            currentLesson.videoUrl.startsWith("http")
                                                ? currentLesson.videoUrl
                                                : `http://localhost:8080${currentLesson.videoUrl}`
                                        }
                                        controls
                                        onTimeUpdate={handleTimeUpdate}
                                        style={{
                                            width: "100%",
                                            display: "block",
                                            borderRadius: "8px",
                                            backgroundColor: "#000"
                                        }}
                                    />

                                )

                        ) : (
                            <div className="video-placeholder">
                                <div className="play-button-large">▶</div>
                                <p>Đang phát: {currentLesson.title}</p>
                            </div>
                        )}
                    </div>

                    <div className="learning-content">
                        <h1 className="current-lesson-title">{currentLesson.title}</h1>

                        <div className="tabs">
                            <button className={activeTab === "overview" ? "tab active" : "tab"} onClick={() => setActiveTab("overview")}>Tổng quan</button>
                            <button className={activeTab === "materials" ? "tab active" : "tab"} onClick={() => setActiveTab("materials")}>Tài liệu ({currentLesson.materials ? currentLesson.materials.length : 0})</button>
                            <button className={activeTab === "qna" ? "tab active" : "tab"} onClick={() => setActiveTab("qna")}>Hỏi đáp ({questions.length})</button>
                            <button className={activeTab === "notes" ? "tab active" : "tab"} onClick={() => setActiveTab("notes")}>Ghi chú</button>
                        </div>

                        <div className="tab-content">
                            {activeTab === "overview" && (
                                <div className="overview-tab">
                                    <div className="overview-content">
                                        <p>{currentLesson.description || "Bài học này chưa có mô tả chi tiết từ giảng viên."}</p>
                                        <p><strong>Nhiệm vụ:</strong> Xem hết video để mở khóa bài tiếp theo.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === "materials" && (
                                <div className="materials-tab">
                                    {currentLesson.materials && currentLesson.materials.length > 0 ? (
                                        currentLesson.materials.map((material) => (
                                            <div className="material-file" key={material.id}>
                                                📄 <span>{material.title}</span>
                                                {/* 🔥 CHUẨN XÁC: Truyền trọn vẹn object material vào hàm xử lý mới */}
                                                <button
                                                    onClick={() => handleDownload(material)}
                                                    className="download-btn"
                                                    style={{ cursor: "pointer" }}
                                                >
                                                    Tải xuống
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <p style={{ padding: "10px", color: "#666" }}>Bài học này chưa có tài liệu đính kèm.</p>
                                    )}
                                </div>
                            )}

                            {activeTab === "qna" && (
                                <div className="qna-tab" style={{ padding: "15px 0" }}>
                                    <div className="qna-input-box" style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                                        <input
                                            type="text"
                                            placeholder="Đặt câu hỏi thảo luận về bài học này..."
                                            className="qna-input"
                                            value={newQuestionContent}
                                            onChange={(e) => setNewQuestionContent(e.target.value)}
                                            style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                                        />
                                        <button className="ask-btn" onClick={handlePostQuestion} style={{ padding: "10px 20px", borderRadius: "6px", backgroundColor: "#007bff", color: "#fff", border: "none", cursor: "pointer" }}>Gửi câu hỏi</button>
                                    </div>

                                    <div className="questions-list" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                                        {questions.length > 0 ? (
                                            questions.map((q) => (
                                                <div key={q.id} className="question-item" style={{ display: "flex", gap: "12px", padding: "12px", backgroundColor: "#f8f9fa", borderRadius: "8px" }}>
                                                    <img
                                                        src={
                                                            q.userAvatarUrl
                                                                ? (q.userAvatarUrl.startsWith("http") ? q.userAvatarUrl : `http://localhost:8080${q.userAvatarUrl}`)
                                                                : "https://via.placeholder.com/40"
                                                        }
                                                        alt="Avatar"
                                                        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                                                    />
                                                    <div className="question-body">
                                                        <h5 style={{ margin: "0 0 5px 0", fontSize: "14px", color: "#333" }}>{q.userFullName}</h5>
                                                        <p style={{ margin: "0 0 5px 0", fontSize: "15px", color: "#444" }}>{q.content}</p>
                                                        <span style={{ fontSize: "12px", color: "#888" }}>{new Date(q.createdAt).toLocaleString("vi-VN")}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{ color: "#888", textAlign: "center", padding: "20px" }}>Chưa có câu hỏi nào. Hãy là người đầu tiên thảo luận!</p>
                                        )}
                                    </div>
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
                                    style={{ cursor: 'pointer' }}
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
                                                onClick={() => setCurrentLesson(lesson)}
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