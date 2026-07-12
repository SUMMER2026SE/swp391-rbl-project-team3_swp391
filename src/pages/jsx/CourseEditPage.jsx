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
            const lessonRes = await axiosClient.post(`/outlines/chapters/${chapterId}/lessons`, {
                title, description: desc, videoUrl: videoUrl, duration: dur
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
                                                <button onClick={() => { setEditingLessonId(lesson.id); setEditingLessonData({ title: lesson.title, description: lesson.description || "", videoUrl: lesson.videoUrl || "", duration: lesson.duration }); }} className="settings-icon-btn" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Sửa</button>
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
                                
                                <input 
                                    type="text" 
                                    id={`new-lesson-title-${chapter.id}`} 
                                    placeholder="Nhập tiêu đề bài học (Ví dụ: Bài 1: Khái niệm về Khối Đa Diện)..." 
                                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                />
                                
                                <input 
                                    type="text" 
                                    id={`new-lesson-desc-${chapter.id}`} 
                                    placeholder="Nhập mô tả tóm tắt nội dung bài học..." 
                                    style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                />
                                
                                <div style={{ display: "flex", gap: "10px" }}>
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Tải lên Video (Máy tính):</span>
                                        <input 
                                            type="file" 
                                            accept="video/*"
                                            id={`new-lesson-vid-${chapter.id}`} 
                                            onChange={(e) => {
                                                handleVideoSelect(e, chapter.id);
                                                const ytInput = document.getElementById(`new-lesson-yt-${chapter.id}`);
                                                if (ytInput) ytInput.value = ""; 
                                            }}
                                            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                        />
                                    </div>
                                    
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Hoặc gắn link YouTube:</span>
                                        <input 
                                            type="text" 
                                            id={`new-lesson-yt-${chapter.id}`} 
                                            placeholder="https://youtube.com/watch?v=..."
                                            onChange={(e) => {
                                                const fileInput = document.getElementById(`new-lesson-vid-${chapter.id}`);
                                                if (fileInput) fileInput.value = ""; 
                                                handleYouTubeLinkChange(e, chapter.id);
                                            }}
                                            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                        />
                                    </div>
                                    
                                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Tài liệu đính kèm (Có thể chọn nhiều file):</span>
                                        <input 
                                            type="file" 
                                            multiple
                                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                                            id={`new-lesson-mats-${chapter.id}`} 
                                            style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                        />
                                    </div>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                                        <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Thời lượng:</span>
                                        <input 
                                            type="text" 
                                            id={`new-lesson-dur-${chapter.id}`} 
                                            placeholder="25:15" 
                                            defaultValue="15:00" 
                                            style={{ width: "100px", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", textAlign: "center", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
                                        />
                                    </div>
                                </div>

                                <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
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