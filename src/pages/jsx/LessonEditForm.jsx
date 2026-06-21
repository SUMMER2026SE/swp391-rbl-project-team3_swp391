import React, { useState } from "react";

export default function LessonEditForm({ lesson, initialData, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        title: initialData.title || "",
        description: initialData.description || "",
        videoUrl: initialData.videoUrl || "",
        duration: initialData.duration || ""
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(lesson.id, formData);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
            <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontFamily: "'Segoe UI', sans-serif" }}>Tiêu đề bài học</label>
                <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="Tiêu đề bài học" 
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #2747d9", width: "100%", fontFamily: "'Segoe UI', sans-serif", fontSize: "14px" }} 
                />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
                <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontFamily: "'Segoe UI', sans-serif" }}>Mô tả ngắn</label>
                <input 
                    type="text" 
                    value={formData.description} 
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                    placeholder="Mô tả bài học" 
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontFamily: "'Segoe UI', sans-serif", fontSize: "14px" }} 
                />
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
                <div className="form-group" style={{ margin: 0, flex: 1 }}>
                    <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontFamily: "'Segoe UI', sans-serif" }}>Đường dẫn Video</label>
                    <input 
                        type="text" 
                        value={formData.videoUrl} 
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })} 
                        placeholder="Link Video bài giảng" 
                        style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontFamily: "'Segoe UI', sans-serif", fontSize: "14px" }} 
                    />
                </div>
                <div className="form-group" style={{ margin: 0, width: "130px" }}>
                    <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", textAlign: "center", fontFamily: "'Segoe UI', sans-serif" }}>Thời lượng</label>
                    <input 
                        type="text" 
                        value={formData.duration} 
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })} 
                        placeholder="15:00" 
                        style={{ padding: "10px 0", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", height: "auto", background: "#fff", fontSize: "14px", textAlign: "center", fontFamily: "'Segoe UI', sans-serif" }} 
                    />
                </div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                <button onClick={handleSubmit} style={{ padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", backgroundColor: "#2747d9", color: "#fff", border: "none", fontWeight: "600", fontFamily: "'Segoe UI', sans-serif" }}>Cập nhật</button>
                <button onClick={onCancel} style={{ padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", backgroundColor: "#e2e8f0", color: "#334155", border: "none", fontWeight: "600", fontFamily: "'Segoe UI', sans-serif" }}>Hủy</button>
            </div>
        </div>
    );
}