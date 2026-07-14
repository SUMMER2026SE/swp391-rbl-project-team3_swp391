import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/CourseEditPage.css"; 
import LessonEditForm from "./LessonEditForm"; 

export default function CourseEditPage() {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [courseTitle, setCourseTitle] = useState("");
    const [chapters, setChapters] = useState([]);
    
    const [activeChapterId, setActiveChapterId] = useState(null); 
    const [editingChapterId, setEditingChapterId] = useState(null);
    const [editingChapterTitle, setEditingChapterTitle] = useState("");
    
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [editingLessonData, setEditingLessonData] = useState({ title: "", description: "", videoUrl: "", duration: "" });
    const [isUploading, setIsUploading] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Dùng cho tạo bài học mới có câu hỏi tương tác luôn
    const [pendingQuestions, setPendingQuestions] = useState([]);
    const [pendingQuestionInput, setPendingQuestionInput] = useState({ minutes: 0, seconds: 0, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" });

    const handleAddPendingQuestion = () => {
        if (!pendingQuestionInput.questionText || !pendingQuestionInput.optionA) return alert("Nhập đủ thông tin câu hỏi!");
        const totalSeconds = (parseInt(pendingQuestionInput.minutes) || 0) * 60 + (parseInt(pendingQuestionInput.seconds) || 0);
        
        const newQ = {
            id: Date.now(), // ID tạm để render
            timestampSeconds: totalSeconds,
            questionText: pendingQuestionInput.questionText,
            optionA: pendingQuestionInput.optionA,
            optionB: pendingQuestionInput.optionB,
            optionC: pendingQuestionInput.optionC,
            optionD: pendingQuestionInput.optionD,
            correctOption: pendingQuestionInput.correctOption
        };
        setPendingQuestions([...pendingQuestions, newQ]);
        setPendingQuestionInput({ minutes: 0, seconds: 0, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" });
    };

    const handleDeletePendingQuestion = (id) => {
        setPendingQuestions(pendingQuestions.filter(q => q.id !== id));
    };


    const loadCourseOutline = async () => {
        try {
            const response = await axiosClient.get(`/courses/${id}`);
            if (response.data) {
                setCourseTitle(response.data.title || response.data.course_title || "Khóa học");
                setChapters(response.data.chapters || []);
            }
        } catch (error) {
            console.error("Lỗi:", error);
        }
    };

    const isYouTube = (url) => url && typeof url === "string" && (url.includes("youtube.com") || url.includes("youtu.be"));
    const extractYouTubeVideoId = (url) => {
        if (!url || typeof url !== "string") return null;
        let videoId = null;
        if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1]?.split("?")[0];
        } else if (url.includes("watch?v=")) {
            videoId = url.split("watch?v=")[1]?.split("&")[0];
        } else if (url.includes("embed/")) {
            videoId = url.split("embed/")[1]?.split("?")[0];
        }
        return videoId;
    };
    
    const getYouTubeEmbedUrl = (url) => {
        const videoId = extractYouTubeVideoId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : url;
    };

    useEffect(() => { loadCourseOutline(); }, [id]);

    const handleCreateChapter = async (e) => {
        e.preventDefault();
        const inputEl = document.getElementById("input-new-chapter");
        if (!inputEl.value.trim()) return;
        try {
            await axiosClient.post(`/outlines/courses/${id}/chapters`, { title: inputEl.value });
            inputEl.value = ""; 
            loadCourseOutline(); 
        } catch (error) { alert("Lỗi!"); }
    };

    const handleUpdateChapter = async (chapterId) => {
        const newTitle = document.getElementById(`edit-chapter-${chapterId}`).value;
        if (!newTitle.trim()) return;
        try {
            await axiosClient.put(`/outlines/chapters/${chapterId}`, { title: newTitle });
            setEditingChapterId(null);
            loadCourseOutline();
        } catch (error) { 
            const msg = error.response?.data?.error || error.response?.data || error.message || "Lỗi không xác định";
            alert("Lỗi: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg)); 
        }
    };

    // 🔥 XỬ LÝ LƯU LOG KHI TẠO BÀI HỌC MỚI THÀNH CÔNG
    const handleCreateLesson = async (chapterId) => {
        const title = document.getElementById(`new-lesson-title-${chapterId}`).value;
        const desc = document.getElementById(`new-lesson-desc-${chapterId}`).value;
        const fileInput = document.getElementById(`new-lesson-vid-${chapterId}`);
        const ytInput = document.getElementById(`new-lesson-yt-${chapterId}`);
        const dur = document.getElementById(`new-lesson-dur-${chapterId}`).value;
        
        if (!title.trim()) return alert("Vui lòng nhập tiêu đề!");
        
        let videoUrl = ytInput && ytInput.value.trim() ? ytInput.value.trim() : "";
        if (!videoUrl && fileInput.files && fileInput.files[0]) {
            setIsUploading(true);
            const formData = new FormData();
            formData.append("file", fileInput.files[0]);
            try {
                const uploadRes = await axiosClient.post("/upload/video", formData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                videoUrl = uploadRes.data.url;
            } catch (error) {
                setIsUploading(false);
                return alert("Lỗi khi upload video!");
            }
            setIsUploading(false);
        }

        try {
            const isPreview = document.getElementById(`new-lesson-preview-${chapterId}`)?.checked || false;
            const lessonRes = await axiosClient.post(`/outlines/chapters/${chapterId}/lessons`, {
                title, description: desc, videoUrl: videoUrl, duration: dur, isPreview
            });
            const newLessonId = lessonRes.data.id;

            const matInput = document.getElementById(`new-lesson-mats-${chapterId}`);
            if (matInput && matInput.files && matInput.files.length > 0) {
                for (let i = 0; i < matInput.files.length; i++) {
                    const matFile = matInput.files[i];
                    const matFormData = new FormData();
                    matFormData.append("file", matFile);
                    try {
                        const matUploadRes = await axiosClient.post("/upload/file", matFormData, {
                            headers: { "Content-Type": "multipart/form-data" }
                        });
                        const matUrl = matUploadRes.data.url;
                        await axiosClient.post(`/outlines/lessons/${newLessonId}/materials`, {
                            title: matFile.name,
                            fileUrl: matUrl
                        });
                    } catch(err) {
                        console.error("Lỗi upload tài liệu", err);
                    }
                }
            }

            // 🔥 LƯU CÁC CÂU HỎI TƯƠNG TÁC POP-UP NẾU CÓ
            if (pendingQuestions.length > 0) {
                try {
                    for (const q of pendingQuestions) {
                        const payload = {
                            timestampSeconds: q.timestampSeconds,
                            questionText: q.questionText,
                            optionA: q.optionA,
                            optionB: q.optionB,
                            optionC: q.optionC,
                            optionD: q.optionD,
                            correctOption: q.correctOption
                        };
                        await axiosClient.post(`/outlines/lessons/${newLessonId}/in-video-questions`, payload);
                    }
                } catch(err) {
                    console.error("Lỗi lưu câu hỏi popup", err);
                }
            }

            // 🔥 TỰ ĐỘNG LƯU LOG: Ghi nhận Giáo viên/Admin tạo bài giảng thành công
            try {
                const userObj = JSON.parse(localStorage.getItem("user") || "{}");
                const userId = userObj?.id || userObj?.userId || 0;
                if (userId > 0) {
                    await axiosClient.post(`/admin/users/${userId}/activity`, {
                        action: `Tạo bài giảng mới: "${title}" thuộc khóa học [${courseTitle}]`
                    });
                }
            } catch (logErr) { console.error("Lỗi ghi log bài giảng:", logErr); }

            setActiveChapterId(null);
            setPendingQuestions([]); // Reset state
            setPendingQuestionInput({ minutes: 0, seconds: 0, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" });
            loadCourseOutline(); 
        } catch (error) { 
            const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Lỗi không xác định";
            alert("Lỗi: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg)); 
        }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (window.confirm("Xóa chương này sẽ xóa sạch bài học bên trong. Có chắc chắn?")) {
            try {
                await axiosClient.delete(`/outlines/chapters/${chapterId}`);
                loadCourseOutline();
            } catch (error) { 
                const msg = error.response?.data?.error || error.response?.data || error.message || "Lỗi không xác định";
                alert("Lỗi: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg)); 
            }
        }
    };

    const handleUpdateLesson = async (lessonId, updatedData) => {
        if (!updatedData.title.trim()) return;
        try {
            await axiosClient.put(`/outlines/lessons/${lessonId}`, updatedData);
            setEditingLessonId(null);
            loadCourseOutline();
        } catch (error) { 
            const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Lỗi không xác định";
            alert("Lỗi: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg)); 
        }
    };

    const handleTogglePreview = async (lesson) => {
        try {
            const isCurrentlyPreview = lesson.isPreview || lesson.is_preview || false;
            await axiosClient.put(`/outlines/lessons/${lesson.id}`, { 
                title: lesson.title, 
                description: lesson.description || "", 
                videoUrl: lesson.videoUrl || "", 
                duration: lesson.duration || "", 
                order: lesson.order,
                isPreview: !isCurrentlyPreview 
            });
            loadCourseOutline();
        } catch (error) {
            console.error("Lỗi khi đổi trạng thái học thử", error);
            const msg = error.response?.data?.message || error.response?.data?.error || error.message;
            alert("Lỗi khi đổi trạng thái học thử: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg) + "\n\n(Nếu báo lỗi 500, có thể bạn chưa Khởi động lại Backend để tạo cột is_preview trong CSDL)");
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm("Xóa bài học này?")) {
            try {
                await axiosClient.delete(`/outlines/lessons/${lessonId}`);
                loadCourseOutline();
            } catch (error) { 
                const msg = error.response?.data?.error || error.response?.data || error.message || "Lỗi không xác định";
                alert("Lỗi: " + (typeof msg === 'object' ? JSON.stringify(msg) : msg)); 
            }
        }
    };

    const handleVideoSelect = (e, chapterId) => {
        const file = e.target.files[0];
        if (file) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
                const duration = video.duration;
                const minutes = Math.floor(duration / 60);
                const seconds = Math.floor(duration % 60);
                const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
                const durInput = document.getElementById(`new-lesson-dur-${chapterId}`);
                if (durInput) durInput.value = formattedDuration;
            };
            video.src = window.URL.createObjectURL(file);
        }
    };

    const handleYouTubeLinkChange = (e, chapterId) => {
        const newUrl = e.target.value;
        const ytVideoId = extractYouTubeVideoId(newUrl);
        if (!ytVideoId) return;

        const fetchDuration = () => {
            const div = document.createElement('div');
            div.id = 'yt-temp-' + Math.random().toString(36).substr(2, 9);
            div.style.position = 'absolute';
            div.style.width = '1px';
            div.style.height = '1px';
            div.style.opacity = '0';
            div.style.pointerEvents = 'none';
            document.body.appendChild(div);

            const player = new window.YT.Player(div.id, {
                videoId: ytVideoId,
                events: {
                    onReady: (event) => {
                        const duration = event.target.getDuration();
                        if (duration && duration > 0) {
                            const minutes = Math.floor(duration / 60);
                            const seconds = Math.floor(duration % 60);
                            const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                            const durInput = document.getElementById(`new-lesson-dur-${chapterId}`);
                            if (durInput) durInput.value = formattedDuration;
                        }
                        event.target.destroy();
                        div.remove();
                    },
                    onError: (event) => {
                        console.warn("YouTube API Error fetching duration", event);
                        if (event.target && event.target.destroy) event.target.destroy();
                        div.remove();
                    }
                }
            });
        };

        if (!window.YT) {
            const script = document.createElement('script');
            script.src = "https://www.youtube.com/iframe_api";
            document.head.appendChild(script);
            window.onYouTubeIframeAPIReady = fetchDuration;
        } else if (window.YT && window.YT.Player) {
            fetchDuration();
        }
    };

    return (
        <div className="course-edit-layout" style={{ padding: "30px", maxWidth: "850px", margin: "0 auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: "20px", fontFamily: "'Segoe UI', sans-serif" }}>← Quay lại</button>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                <div>
                    <h1 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "5px", fontWeight: 700, fontFamily: "'Segoe UI', sans-serif" }}>Xây dựng khóa học</h1>
                    <p style={{ color: "#64748b", margin: 0, fontFamily: "'Segoe UI', sans-serif" }}>Khóa học: <strong style={{ color: "#0f172a" }}>{courseTitle}</strong></p>
                </div>
                <button 
                    onClick={() => navigate(`/teacher/preview/${id}`)}
                    style={{ padding: "10px 20px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontFamily: "'Segoe UI', sans-serif", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
                >
                    <span style={{ fontSize: "16px" }}>👁️</span> Xem trước (Góc nhìn Học sinh)
                </button>
            </div>

            <div className="edit-general-info" style={{ display: "flex", alignItems: "center", gap: "20px", padding: "20px", borderRadius: "12px", marginBottom: "30px" }}>
                <form onSubmit={handleCreateChapter} style={{ display: "flex", gap: "12px", flex: 1 }}>
                    <input 
                        type="text" 
                        id="input-new-chapter" 
                        placeholder="Nhập tên chương..." 
                        style={{ flex: 1, padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }} 
                    />
                    <button type="submit" className="btn-primary" style={{ padding: "10px 20px", borderRadius: "8px", fontFamily: "'Segoe UI', sans-serif" }}>+ Thêm chương</button>
                </form>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {chapters.map((chapter) => (
                    <div key={chapter.id} className="chapter-edit-box" style={{ borderRadius: "12px", padding: "20px", backgroundColor: "#fff" }}>
                        <div className="chapter-edit-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                            {editingChapterId === chapter.id ? (
                                <div style={{ display: "flex", gap: "10px", flex: 1 }}>
                                    <input 
                                        type="text" 
                                        id={`edit-chapter-${chapter.id}`}
                                        defaultValue={editingChapterTitle} 
                                        style={{ flex: 1, padding: "8px", borderRadius: "6px", border: "1px solid #2747d9", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }} 
                                    />
                                    <button onClick={() => handleUpdateChapter(chapter.id)} className="btn-primary" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Lưu</button>
                                    <button onClick={() => setEditingChapterId(null)} className="btn-secondary" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Hủy</button>
                                </div>
                            ) : (
                                <>
                                    <h2 style={{ fontSize: "16px", color: "#1e293b", margin: 0, fontWeight: 700, fontFamily: "'Segoe UI', sans-serif" }}>📁 {chapter.title}</h2>
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button onClick={() => { setEditingChapterId(chapter.id); setEditingChapterTitle(chapter.title); }} className="settings-icon-btn" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Sửa</button>
                                        <button onClick={() => handleDeleteChapter(chapter.id)} className="delete-icon-btn" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Xóa</button>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="lessons-edit-list" style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "15px" }}>
                            {chapter.lessons && chapter.lessons.map((lesson) => (
                                <div key={lesson.id} className="lesson-edit-item" style={{ backgroundColor: "#ffffff", padding: "12px 15px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                    {editingLessonId === lesson.id ? (
                                        <LessonEditForm 
                                            lesson={lesson}
                                            initialData={editingLessonData}
                                            onCancel={() => setEditingLessonId(null)}
                                            onSave={handleUpdateLesson}
                                        />
                                    ) : (
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155", fontFamily: "'Segoe UI', sans-serif" }}>▶ {lesson.title}</span>
                                                {lesson.description && <span style={{ fontSize: "12px", color: "#64748b", fontFamily: "'Segoe UI', sans-serif" }}>{lesson.description}</span>}
                                                {lesson.videoUrl && lesson.videoUrl.trim() !== "" && (
                                                    <div style={{ marginTop: "5px" }}>
                                                        {isYouTube(lesson.videoUrl) ? (
                                                            <iframe
                                                                width="250"
                                                                height="140"
                                                                src={getYouTubeEmbedUrl(lesson.videoUrl)}
                                                                title="YouTube video player"
                                                                frameBorder="0"
                                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                allowFullScreen
                                                                style={{ borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                                            ></iframe>
                                                        ) : (
                                                            <video 
                                                                src={lesson.videoUrl} 
                                                                controls 
                                                                style={{ width: "250px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#000" }}
                                                            />
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                {lesson.videoUrl && lesson.videoUrl.trim() !== "" && (
                                                    <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Segoe UI', sans-serif" }}>{lesson.duration}</span>
                                                )}
                                                <button 
                                                    onClick={() => handleTogglePreview(lesson)} 
                                                    style={{ 
                                                        background: (lesson.isPreview || lesson.is_preview) ? "#dcfce7" : "#f1f5f9", 
                                                        color: (lesson.isPreview || lesson.is_preview) ? "#166534" : "#64748b", 
                                                        border: `1px solid ${(lesson.isPreview || lesson.is_preview) ? "#bbf7d0" : "#e2e8f0"}`, 
                                                        padding: "5px 12px", 
                                                        borderRadius: "6px", 
                                                        fontSize: "13px", 
                                                        cursor: "pointer", 
                                                        fontWeight: "600",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "5px",
                                                        fontFamily: "'Segoe UI', sans-serif",
                                                        transition: "all 0.2s"
                                                    }}
                                                    title={(lesson.isPreview || lesson.is_preview) ? "Đang cho phép học thử. Bấm để tắt." : "Đang khóa. Bấm để cho phép học thử."}
                                                >
                                                    {(lesson.isPreview || lesson.is_preview) ? "👁️ Đang mở thử" : "🔒 Đã khóa"}
                                                </button>
                                                <button onClick={() => { setEditingLessonId(lesson.id); setEditingLessonData({ title: lesson.title, description: lesson.description || "", videoUrl: lesson.videoUrl || "", duration: lesson.duration, isPreview: lesson.isPreview || lesson.is_preview || false }); }} className="settings-icon-btn" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Sửa</button>
                                                <button onClick={() => handleDeleteLesson(lesson.id)} className="delete-icon-btn" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Xóa</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {activeChapterId === chapter.id ? (
                            <div style={{ marginTop: "15px", padding: "20px", border: "1px dashed #2747d9", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#f8fafc" }}>
                                <h4 style={{ margin: 0, fontSize: "14px", color: "#1e293b", fontWeight: 600 }}>Tạo bài giảng mới:</h4>
                                
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", display: "block", fontWeight: 600, fontFamily: "'Segoe UI', sans-serif" }}>Tiêu đề bài học</label>
                                    <input 
                                        type="text" 
                                        id={`new-lesson-title-${chapter.id}`} 
                                        placeholder="Nhập tiêu đề bài học (Ví dụ: Bài 1: Khái niệm về Khối Đa Diện)..." 
                                        style={{ boxSizing: "border-box", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                    />
                                </div>
                                
                                <div className="form-group" style={{ margin: 0 }}>
                                    <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", display: "block", fontWeight: 600, fontFamily: "'Segoe UI', sans-serif" }}>Mô tả ngắn</label>
                                    <input 
                                        type="text" 
                                        id={`new-lesson-desc-${chapter.id}`} 
                                        placeholder="Nhập mô tả tóm tắt nội dung bài học..." 
                                        style={{ boxSizing: "border-box", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                    />
                                </div>
                                
                                <div style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
                                    <div style={{ display: "flex", gap: "24px" }}>
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, fontFamily: "'Segoe UI', sans-serif" }}>Tải video (Máy tính)</span>
                                            <input 
                                                type="file" 
                                                accept="video/*"
                                                id={`new-lesson-vid-${chapter.id}`} 
                                                onChange={(e) => {
                                                    handleVideoSelect(e, chapter.id);
                                                    const ytInput = document.getElementById(`new-lesson-yt-${chapter.id}`);
                                                    if (ytInput) ytInput.value = ""; 
                                                }}
                                                style={{ boxSizing: "border-box", padding: "7px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontSize: "13px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                            />
                                        </div>
                                        
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, fontFamily: "'Segoe UI', sans-serif" }}>Hoặc gắn link YouTube</span>
                                            <input 
                                                type="text" 
                                                id={`new-lesson-yt-${chapter.id}`} 
                                                placeholder="https://youtube.com/watch?v=..."
                                                onChange={(e) => {
                                                    const fileInput = document.getElementById(`new-lesson-vid-${chapter.id}`);
                                                    if (fileInput) fileInput.value = ""; 
                                                    handleYouTubeLinkChange(e, chapter.id);
                                                }}
                                                style={{ boxSizing: "border-box", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontSize: "13px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                            />
                                        </div>
                                        
                                        <div style={{ width: "110px", display: "flex", flexDirection: "column", gap: "4px" }}>
                                            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, textAlign: "center", fontFamily: "'Segoe UI', sans-serif" }}>Thời lượng</span>
                                            <input 
                                                type="text" 
                                                id={`new-lesson-dur-${chapter.id}`} 
                                                placeholder="15:00" 
                                                defaultValue="15:00" 
                                                style={{ boxSizing: "border-box", padding: "10px 0", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", height: "auto", fontSize: "14px", textAlign: "center", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                            />
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", padding: "15px", border: "1px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}>
                                        <span style={{ fontSize: "13px", color: "#475569", fontWeight: "700", fontFamily: "'Segoe UI', sans-serif", marginBottom: "4px" }}>Tài liệu đính kèm (PDF, Word, PPT...)</span>
                                        <input 
                                            type="file" 
                                            multiple
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                            id={`new-lesson-mats-${chapter.id}`} 
                                            style={{ boxSizing: "border-box", padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", width: "100%", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                        />
                                    </div>
                                    <div style={{ marginTop: "10px", padding: "15px", border: "1px dashed #f59e0b", borderRadius: "8px", background: "#fffbeb" }}>
                                        <label style={{ fontSize: "13px", color: "#b45309", marginBottom: "8px", display: "block", fontWeight: "700", fontFamily: "'Segoe UI', sans-serif" }}>Câu hỏi tương tác Pop-up (In-Video Quizzes)</label>
                                        
                                        {pendingQuestions.length > 0 && (
                                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                                                {pendingQuestions.map(q => (
                                                    <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fde68a" }}>
                                                        <span style={{ fontSize: "13px", color: "#92400e", fontWeight: "600" }}>⏰ {Math.floor(q.timestampSeconds / 60).toString().padStart(2, '0')}:{(q.timestampSeconds % 60).toString().padStart(2, '0')} - {q.questionText}</span>
                                                        <button type="button" onClick={() => handleDeletePendingQuestion(q.id)} style={{ color: "#dc2626", background: "#fee2e2", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Xóa</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #fcd34d" }}>
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                                                    <input type="number" placeholder="Phút" value={pendingQuestionInput.minutes} onChange={e => setPendingQuestionInput({...pendingQuestionInput, minutes: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "60px", textAlign: "center" }} min="0" />
                                                    <span style={{ fontWeight: "bold" }}>:</span>
                                                    <input type="number" placeholder="Giây" value={pendingQuestionInput.seconds} onChange={e => setPendingQuestionInput({...pendingQuestionInput, seconds: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "60px", textAlign: "center" }} min="0" max="59" />
                                                </div>
                                                <input type="text" placeholder="Nhập câu hỏi..." value={pendingQuestionInput.questionText} onChange={e => setPendingQuestionInput({...pendingQuestionInput, questionText: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                                            </div>
                                            <div style={{ display: "flex", gap: "10px" }}>
                                                <input type="text" placeholder="Đáp án A" value={pendingQuestionInput.optionA} onChange={e => setPendingQuestionInput({...pendingQuestionInput, optionA: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                                                <input type="text" placeholder="Đáp án B" value={pendingQuestionInput.optionB} onChange={e => setPendingQuestionInput({...pendingQuestionInput, optionB: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                                                <input type="text" placeholder="Đáp án C" value={pendingQuestionInput.optionC} onChange={e => setPendingQuestionInput({...pendingQuestionInput, optionC: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                                                <input type="text" placeholder="Đáp án D" value={pendingQuestionInput.optionD} onChange={e => setPendingQuestionInput({...pendingQuestionInput, optionD: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                                <div style={{ fontSize: "13px", color: "#475569" }}>
                                                    <strong>Đáp án đúng: </strong>
                                                    <select value={pendingQuestionInput.correctOption} onChange={e => setPendingQuestionInput({...pendingQuestionInput, correctOption: e.target.value})} style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
                                                        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                                    </select>
                                                </div>
                                                <button type="button" onClick={handleAddPendingQuestion} style={{ padding: "8px 16px", borderRadius: "6px", background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                                                    + Thêm Câu Hỏi
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                                    <button disabled={isUploading} onClick={() => handleCreateLesson(chapter.id)} className="btn-primary" style={{ padding: "8px 18px", borderRadius: "6px", fontFamily: "'Segoe UI', sans-serif", cursor: isUploading ? "wait" : "pointer", opacity: isUploading ? 0.7 : 1 }}>
                                        {isUploading ? "Đang tải lên..." : "Lưu bài học"}
                                    </button>
                                    <button onClick={() => setActiveChapterId(null)} className="btn-secondary" style={{ padding: "8px 18px", borderRadius: "6px", fontFamily: "'Segoe UI', sans-serif", cursor: "pointer" }}>
                                        Hủy bỏ
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button onClick={() => setActiveChapterId(chapter.id)} className="add-lesson-btn" style={{ padding: "10px", width: "100%", fontFamily: "'Segoe UI', sans-serif" }}>
                                + Thêm bài giảng vào chương này
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}