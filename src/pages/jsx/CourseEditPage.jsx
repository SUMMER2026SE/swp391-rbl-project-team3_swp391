import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/CourseEditPage.css"; 
// GỌI FILE CON Ở ĐÂY CHO PHẦN BÀI GIẢNG ĐÃ HOẠT ĐỘNG TỐT
import LessonEditForm from "./LessonEditForm"; 

export default function CourseEditPage() {
    const { id } = useParams(); 
    const navigate = useNavigate();

    const [courseTitle, setCourseTitle] = useState("");
    const [chapters, setChapters] = useState([]);
    
    // UI Toggles (Chỉ dùng để bật/tắt giao diện, không dính dáng đến bộ gõ chữ)
    const [activeChapterId, setActiveChapterId] = useState(null); 
    const [editingChapterId, setEditingChapterId] = useState(null);
    const [editingChapterTitle, setEditingChapterTitle] = useState("");
    
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [editingLessonData, setEditingLessonData] = useState({ title: "", description: "", videoUrl: "", duration: "" });

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

    useEffect(() => { loadCourseOutline(); }, [id]);

    // 🔥 FIX 1: THÊM CHƯƠNG (Dùng Uncontrolled input để Unikey không bị lag)
    const handleCreateChapter = async (e) => {
        e.preventDefault();
        const inputEl = document.getElementById("input-new-chapter");
        if (!inputEl.value.trim()) return;
        try {
            await axiosClient.post(`/outlines/courses/${id}/chapters`, { title: inputEl.value });
            inputEl.value = ""; // Xóa trắng ô sau khi thêm xong
            loadCourseOutline(); 
        } catch (error) { alert("Lỗi!"); }
    };

    // 🔥 FIX 2: SỬA CHƯƠNG (Lấy dữ liệu trực tiếp khi bấm nút Lưu)
    const handleUpdateChapter = async (chapterId) => {
        const newTitle = document.getElementById(`edit-chapter-${chapterId}`).value;
        if (!newTitle.trim()) return;
        try {
            await axiosClient.put(`/outlines/chapters/${chapterId}`, { title: newTitle });
            setEditingChapterId(null);
            loadCourseOutline();
        } catch (error) { alert("Lỗi!"); }
    };

    // 🔥 FIX 3: THÊM BÀI HỌC
    const handleCreateLesson = async (chapterId) => {
        const title = document.getElementById(`new-lesson-title-${chapterId}`).value;
        const desc = document.getElementById(`new-lesson-desc-${chapterId}`).value;
        const vid = document.getElementById(`new-lesson-vid-${chapterId}`).value;
        const dur = document.getElementById(`new-lesson-dur-${chapterId}`).value;
        
        if (!title.trim()) return alert("Vui lòng nhập tiêu đề!");
        try {
            await axiosClient.post(`/outlines/chapters/${chapterId}/lessons`, {
                title, description: desc, videoUrl: vid, duration: dur
            });
            setActiveChapterId(null);
            loadCourseOutline(); 
        } catch (error) { alert("Lỗi!"); }
    };

    const handleDeleteChapter = async (chapterId) => {
        if (window.confirm("Xóa chương này sẽ xóa sạch bài học bên trong. Có chắc chắn?")) {
            try {
                await axiosClient.delete(`/outlines/chapters/${chapterId}`);
                loadCourseOutline();
            } catch (error) { alert("Lỗi!"); }
        }
    };

    const handleUpdateLesson = async (lessonId, updatedData) => {
        if (!updatedData.title.trim()) return;
        try {
            await axiosClient.put(`/outlines/lessons/${lessonId}`, updatedData);
            setEditingLessonId(null);
            loadCourseOutline();
        } catch (error) { alert("Lỗi!"); }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (window.confirm("Xóa bài học này?")) {
            try {
                await axiosClient.delete(`/outlines/lessons/${lessonId}`);
                loadCourseOutline();
            } catch (error) { alert("Lỗi!"); }
        }
    };

    return (
        <div className="course-edit-layout" style={{ padding: "30px", maxWidth: "850px", margin: "0 auto", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
            <button onClick={() => navigate(-1)} className="back-btn" style={{ marginBottom: "20px", fontFamily: "'Segoe UI', sans-serif" }}>← Quay lại</button>

            <h1 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "5px", fontWeight: 700, fontFamily: "'Segoe UI', sans-serif" }}>Xây dựng Đề cương</h1>
            <p style={{ color: "#64748b", marginBottom: "30px", fontFamily: "'Segoe UI', sans-serif" }}>Khóa học: <strong style={{ color: "#0f172a" }}>{courseTitle}</strong></p>

            <div className="edit-general-info" style={{ padding: "20px", borderRadius: "12px", marginBottom: "30px" }}>
                <form onSubmit={handleCreateChapter} style={{ display: "flex", gap: "12px" }}>
                    {/* KHÔNG DÙNG value/onChange nữa -> Dùng id để trị dứt điểm Unikey */}
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
                                    {/* SỬA CHƯƠNG: ÉP FONT SẠCH VÀ UNCONTROLLED */}
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
                                            <div style={{ display: "flex", flexDirection: "column" }}>
                                                <span style={{ fontSize: "14px", fontWeight: "600", color: "#334155", fontFamily: "'Segoe UI', sans-serif" }}>▶ {lesson.title}</span>
                                                {lesson.description && <span style={{ fontSize: "12px", color: "#64748b", fontFamily: "'Segoe UI', sans-serif" }}>{lesson.description}</span>}
                                            </div>
                                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                                                <span style={{ background: "#f1f5f9", padding: "4px 10px", borderRadius: "6px", fontSize: "13px", fontFamily: "'Segoe UI', sans-serif" }}>{lesson.duration}</span>
                                                <button onClick={() => { setEditingLessonId(lesson.id); setEditingLessonData({ title: lesson.title, description: lesson.description || "", videoUrl: lesson.videoUrl || "", duration: lesson.duration }); }} className="settings-icon-btn" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Sửa</button>
                                                <button onClick={() => handleDeleteLesson(lesson.id)} className="delete-icon-btn" style={{ fontFamily: "'Segoe UI', sans-serif" }}>Xóa</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
{/* PHẦN FORM ĐỘNG ĐỂ THÊM BÀI HỌC VÀO CHƯƠNG NÀY (ĐÃ BUNG ĐẦY ĐỦ Ô NHẬP VIDEO) */}
{activeChapterId === chapter.id ? (
    <div style={{ marginTop: "15px", padding: "20px", border: "1px dashed #2747d9", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#f8fafc" }}>
        <h4 style={{ margin: 0, fontSize: "14px", color: "#1e293b", fontWeight: 600 }}>Tạo bài giảng mới:</h4>
        
        {/* 1. Ô nhập Tiêu đề */}
        <input 
            type="text" 
            id={`new-lesson-title-${chapter.id}`} 
            placeholder="Nhập tiêu đề bài học (Ví dụ: Bài 1: Khái niệm về Khối Đa Diện)..." 
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
        />
        
        {/* 2. Ô nhập Mô tả */}
        <input 
            type="text" 
            id={`new-lesson-desc-${chapter.id}`} 
            placeholder="Nhập mô tả tóm tắt nội dung bài học..." 
            style={{ padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
        />
        
        <div style={{ display: "flex", gap: "10px" }}>
            {/* 3. Ô NHẬP VIDEO (Đây chính là nơi bạn dán đường dẫn video vào) */}
            <input 
                type="text" 
                id={`new-lesson-vid-${chapter.id}`} 
                placeholder="Dán đường dẫn Video vào đây (Ví dụ: /videos/toan12-bai1.mp4 hoặc link youtube)..." 
                style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
            />
            
            {/* 4. Ô nhập Thời lượng */}
            <input 
                type="text" 
                id={`new-lesson-dur-${chapter.id}`} 
                placeholder="Thời lượng (Ví dụ: 25:15)..." 
                defaultValue="15:00" 
                style={{ width: "160px", padding: "10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13.5px", textAlign: "center", background: "#fff", fontFamily: "'Segoe UI', sans-serif" }} 
            />
        </div>

        {/* Cặp nút điều hướng thao tác */}
        <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
            <button onClick={() => handleCreateLesson(chapter.id)} className="btn-primary" style={{ padding: "8px 18px", borderRadius: "6px", fontFamily: "'Segoe UI', sans-serif", cursor: "pointer" }}>
                Lưu bài học
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