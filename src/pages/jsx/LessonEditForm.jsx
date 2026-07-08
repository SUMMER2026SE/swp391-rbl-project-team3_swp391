import React, { useState } from "react";
import axiosClient from "../../api/axiosClient";

export default function LessonEditForm({ lesson, initialData, onSave, onCancel }) {
    const [formData, setFormData] = useState({
        title: initialData.title || "",
        description: initialData.description || "",
        videoUrl: initialData.videoUrl || "",
        duration: initialData.duration || ""
    });
    const [videoFile, setVideoFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        let finalVideoUrl = formData.videoUrl;
        if (videoFile) {
            setIsUploading(true);
            const uploadData = new FormData();
            uploadData.append("file", videoFile);
            try {
                const uploadRes = await axiosClient.post("/upload/video", uploadData, {
                    headers: { "Content-Type": "multipart/form-data" }
                });
                finalVideoUrl = uploadRes.data.url;
            } catch (error) {
                setIsUploading(false);
                return alert("Lỗi khi upload video mới!");
            }
            setIsUploading(false);
        }

        onSave(lesson.id, { ...formData, videoUrl: finalVideoUrl });
    };

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        setVideoFile(file);
        if (file) {
            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = function() {
                window.URL.revokeObjectURL(video.src);
                const duration = video.duration;
                const minutes = Math.floor(duration / 60);
                const seconds = Math.floor(duration % 60);
                const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                setFormData(prev => ({ ...prev, duration: formattedDuration }));
            };
            video.src = window.URL.createObjectURL(file);
        }
    };

    const [materialFile, setMaterialFile] = useState(null);
    const [materialTitle, setMaterialTitle] = useState("");
    const [isUploadingMaterial, setIsUploadingMaterial] = useState(false);

    // QUẢN LÝ CÂU HỎI IN-VIDEO
    const [questions, setQuestions] = useState([]);
    const [newQuestion, setNewQuestion] = useState({
        minutes: 0,
        seconds: 0,
        questionText: "",
        optionA: "", optionB: "", optionC: "", optionD: "",
        correctOption: "A"
    });

    // Hàm lấy Video ID từ URL YouTube
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

    // Hàm tự động lấy thời lượng YouTube bằng IFrame API
    const fetchYouTubeDuration = (videoId) => {
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
                videoId: videoId,
                events: {
                    onReady: (event) => {
                        const duration = event.target.getDuration();
                        if (duration && duration > 0) {
                            const minutes = Math.floor(duration / 60);
                            const seconds = Math.floor(duration % 60);
                            const formattedDuration = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                            setFormData(prev => ({ ...prev, duration: formattedDuration }));
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

    // Tự động kiểm tra thời lượng nếu form mở lên đã có link YouTube
    React.useEffect(() => {
        if (initialData.videoUrl) {
            const ytVideoId = extractYouTubeVideoId(initialData.videoUrl);
            if (ytVideoId) {
                fetchYouTubeDuration(ytVideoId);
            }
        }
    }, []);

    React.useEffect(() => {
        if (!lesson.id) return;
        const fetchQuestions = async () => {
            try {
                const res = await axiosClient.get(`/outlines/lessons/${lesson.id}/in-video-questions`);
                setQuestions(res.data || []);
            } catch (err) {
                console.error("Lỗi lấy câu hỏi popup", err);
            }
        };
        fetchQuestions();
    }, [lesson.id]);

    const handleAddQuestion = async () => {
        if (!newQuestion.questionText || !newQuestion.optionA) return alert("Nhập đủ thông tin câu hỏi!");
        const totalSeconds = (parseInt(newQuestion.minutes) || 0) * 60 + (parseInt(newQuestion.seconds) || 0);

        const targetLessonId = lesson.id || lesson.lesson_id;
        if (!targetLessonId) return alert("Lỗi: Không tìm thấy ID bài học!");

        const payload = {
            timestampSeconds: totalSeconds,
            questionText: newQuestion.questionText,
            optionA: newQuestion.optionA,
            optionB: newQuestion.optionB,
            optionC: newQuestion.optionC,
            optionD: newQuestion.optionD,
            correctOption: newQuestion.correctOption
        };

        try {
            const res = await axiosClient.post(`/outlines/lessons/${targetLessonId}/in-video-questions`, payload);
            setQuestions([...questions, res.data]);
            setNewQuestion({ minutes: 0, seconds: 0, questionText: "", optionA: "", optionB: "", optionC: "", optionD: "", correctOption: "A" });
            alert("Thêm câu hỏi thành công!");
        } catch (err) {
            console.error("Add question error:", err.response?.data || err);
            alert("Lỗi khi thêm câu hỏi: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteQuestion = async (id) => {
        if (!window.confirm("Xóa câu hỏi này?")) return;
        try {
            await axiosClient.delete(`/outlines/in-video-questions/${id}`);
            setQuestions(questions.filter(q => q.id !== id));
        } catch (err) {
            alert("Lỗi xóa câu hỏi");
        }
    };

    const handleUploadMaterial = async (e) => {
        e.preventDefault();
        if (!materialFile || !materialTitle.trim()) return alert("Vui lòng nhập tên tài liệu và chọn file!");
        setIsUploadingMaterial(true);
        const uploadData = new FormData();
        uploadData.append("file", materialFile);
        try {
            const uploadRes = await axiosClient.post("/upload/file", uploadData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            const fileUrl = uploadRes.data.url;
            await axiosClient.post(`/outlines/lessons/${lesson.id}/materials`, {
                title: materialTitle,
                fileUrl: fileUrl
            });
            alert("Tải tài liệu lên thành công!");
            onSave(lesson.id, formData); // Gọi onSave ảo để reload danh sách
        } catch (error) {
            alert("Lỗi khi upload tài liệu!");
        }
        setIsUploadingMaterial(false);
        setMaterialFile(null);
        setMaterialTitle("");
    };

    const handleDeleteMaterial = async (e, materialId) => {
        e.preventDefault();
        if(!window.confirm("Xóa tài liệu này?")) return;
        try {
            await axiosClient.delete(`/outlines/materials/${materialId}`);
            onSave(lesson.id, formData); // Gọi onSave ảo để reload danh sách
        } catch (error) {
            alert("Lỗi khi xóa tài liệu!");
        }
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
            <div style={{ display: "flex", gap: "12px", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: "12px" }}>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontFamily: "'Segoe UI', sans-serif" }}>Tải video (Máy tính)</label>
                        <input 
                            type="file" 
                            accept="video/*"
                            onChange={handleVideoSelect} 
                            style={{ padding: "7px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontFamily: "'Segoe UI', sans-serif", fontSize: "13px", background: "#fff" }} 
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0, flex: 1 }}>
                        <label style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px", fontFamily: "'Segoe UI', sans-serif" }}>Hoặc gắn link YouTube</label>
                        <input 
                            type="text" 
                            value={formData.videoUrl} 
                            onChange={(e) => {
                                const newUrl = e.target.value;
                                setFormData({ ...formData, videoUrl: newUrl });
                                setVideoFile(null); // Ưu tiên link nếu vừa gõ link
                                
                                // Nếu là YouTube, tự động lấy thời lượng
                                const ytVideoId = extractYouTubeVideoId(newUrl);
                                if (ytVideoId) {
                                    fetchYouTubeDuration(ytVideoId);
                                }
                            }} 
                            placeholder="https://youtube.com/watch?v=..." 
                            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", width: "100%", fontFamily: "'Segoe UI', sans-serif", fontSize: "13px" }} 
                        />
                    </div>
                    <div className="form-group" style={{ margin: 0, width: "110px" }}>
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
            </div>
            
            <div style={{ marginTop: "10px", padding: "15px", border: "1px dashed #cbd5e1", borderRadius: "8px", background: "#f8fafc" }}>
                <label style={{ fontSize: "13px", color: "#475569", marginBottom: "8px", display: "block", fontWeight: "700", fontFamily: "'Segoe UI', sans-serif" }}>Tài liệu đính kèm (PDF, Word, PPT...)</label>
                {lesson.materials && lesson.materials.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                        {lesson.materials.map(mat => (
                            <div key={mat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "13px", color: "#334155", fontWeight: "600" }}>📄 {mat.title}</span>
                                <button type="button" onClick={(e) => handleDeleteMaterial(e, mat.id)} style={{ color: "#dc2626", background: "#fee2e2", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Xóa</button>
                            </div>
                        ))}
                    </div>
                )}
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <input type="text" placeholder="Tên tài liệu (VD: Bài tập tự luyện)..." value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1, fontFamily: "'Segoe UI', sans-serif" }} />
                    <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={e => setMaterialFile(e.target.files[0])} style={{ fontSize: "13px", width: "190px", background: "#fff", padding: "5px", borderRadius: "6px", border: "1px solid #cbd5e1" }} />
                    <button type="button" disabled={isUploadingMaterial} onClick={handleUploadMaterial} style={{ padding: "8px 16px", borderRadius: "6px", background: "#10b981", color: "#fff", border: "none", cursor: isUploadingMaterial ? "wait" : "pointer", fontSize: "13px", fontWeight: "600", opacity: isUploadingMaterial ? 0.7 : 1 }}>
                        {isUploadingMaterial ? "Đang tải..." : "+ Tải lên"}
                    </button>
                </div>
            </div>

            <div style={{ marginTop: "10px", padding: "15px", border: "1px dashed #f59e0b", borderRadius: "8px", background: "#fffbeb" }}>
                <label style={{ fontSize: "13px", color: "#b45309", marginBottom: "8px", display: "block", fontWeight: "700", fontFamily: "'Segoe UI', sans-serif" }}>Câu hỏi tương tác Pop-up (In-Video Quizzes)</label>
                
                {questions.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "12px" }}>
                        {questions.map(q => (
                            <div key={q.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #fde68a" }}>
                                <span style={{ fontSize: "13px", color: "#92400e", fontWeight: "600" }}>⏰ {Math.floor(q.timestampSeconds / 60).toString().padStart(2, '0')}:{(q.timestampSeconds % 60).toString().padStart(2, '0')} - {q.questionText}</span>
                                <button type="button" onClick={() => handleDeleteQuestion(q.id)} style={{ color: "#dc2626", background: "#fee2e2", padding: "4px 8px", borderRadius: "4px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>Xóa</button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #fcd34d" }}>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                            <input type="number" placeholder="Phút" value={newQuestion.minutes} onChange={e => setNewQuestion({...newQuestion, minutes: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "60px", textAlign: "center" }} min="0" />
                            <span style={{ fontWeight: "bold" }}>:</span>
                            <input type="number" placeholder="Giây" value={newQuestion.seconds} onChange={e => setNewQuestion({...newQuestion, seconds: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", width: "60px", textAlign: "center" }} min="0" max="59" />
                        </div>
                        <input type="text" placeholder="Nhập câu hỏi..." value={newQuestion.questionText} onChange={e => setNewQuestion({...newQuestion, questionText: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <input type="text" placeholder="Đáp án A" value={newQuestion.optionA} onChange={e => setNewQuestion({...newQuestion, optionA: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                        <input type="text" placeholder="Đáp án B" value={newQuestion.optionB} onChange={e => setNewQuestion({...newQuestion, optionB: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                        <input type="text" placeholder="Đáp án C" value={newQuestion.optionC} onChange={e => setNewQuestion({...newQuestion, optionC: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                        <input type="text" placeholder="Đáp án D" value={newQuestion.optionD} onChange={e => setNewQuestion({...newQuestion, optionD: e.target.value})} style={{ padding: "8px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px", flex: 1 }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontSize: "13px", color: "#475569" }}>
                            <strong>Đáp án đúng: </strong>
                            <select value={newQuestion.correctOption} onChange={e => setNewQuestion({...newQuestion, correctOption: e.target.value})} style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #cbd5e1" }}>
                                <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                            </select>
                        </div>
                        <button type="button" onClick={handleAddQuestion} style={{ padding: "8px 16px", borderRadius: "6px", background: "#f59e0b", color: "#fff", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}>
                            + Thêm Câu Hỏi
                        </button>
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px", paddingTop: "15px", borderTop: "1px solid #e2e8f0" }}>
                <button disabled={isUploading} onClick={handleSubmit} style={{ padding: "6px 16px", borderRadius: "6px", cursor: isUploading ? "wait" : "pointer", fontSize: "13px", backgroundColor: "#2747d9", color: "#fff", border: "none", fontWeight: "600", fontFamily: "'Segoe UI', sans-serif", opacity: isUploading ? 0.7 : 1 }}>
                    {isUploading ? "Đang tải..." : "Cập nhật"}
                </button>
                <button disabled={isUploading} onClick={onCancel} style={{ padding: "6px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px", backgroundColor: "#e2e8f0", color: "#334155", border: "none", fontWeight: "600", fontFamily: "'Segoe UI', sans-serif" }}>Hủy</button>
            </div>
        </div>
    );
}