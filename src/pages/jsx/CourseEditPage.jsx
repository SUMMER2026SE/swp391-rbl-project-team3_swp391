import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/CourseEditPage.css"; // Lát nữa ta sẽ tạo CSS sau

export default function CourseEditPage() {
    const { id } = useParams(); // ID khóa học đang sửa
    const navigate = useNavigate();

    // Dữ liệu mẫu (giống trang Preview để đồng bộ)
    const mockDatabase = {
        4: {
            id: 4, title: "Tuyệt đỉnh Casio - Giải nhanh trắc nghiệm Toán",
            price: "299000", originalPrice: "500000", status: "DRAFT",
            description: "Bí kíp bấm máy tính Casio Fx-580VNX & Fx-880BTG. Giải quyết nhanh gọn các câu hỏi Toán THPT Quốc gia chỉ trong 30 giây.",
            thumbnail: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?auto=format&fit=crop&w=800&q=80",
            chapters: [
                { id: 1, title: "Chương 1: Kỹ thuật Casio cơ bản", lessons: [{ id: 101, title: "Làm quen thiết lập Fx-880BTG", duration: "15:00" }, { id: 102, title: "Giải phương trình, hệ phương trình", duration: "25:20" }] },
                { id: 2, title: "Chương 2: Ứng dụng Casio giải Tích phân", lessons: [{ id: 201, title: "Tích phân hàm ẩn", duration: "30:10" }] }
            ]
        }
    };

    // State lưu dữ liệu form
    const [formData, setFormData] = useState({
        title: "", description: "", price: "", originalPrice: "", thumbnail: "", chapters: []
    });

    useEffect(() => {
        // Giả lập Fetch Data hoặc lấy Data thật
        const fetchCourse = async () => {
            try {
                // Thử gọi API thật
                const res = await axiosClient.get(`/teacher/courses/${id}`);
                setFormData(res.data);
            } catch (err) {
                // Nếu lỗi, dùng data mock
                setFormData(mockDatabase[id] || mockDatabase[4]);
            }
        };
        if (id !== "new") fetchCourse(); // Nếu id là 'new' thì đây là form tạo mới trắng
    }, [id]);

    // Handle nhập text cơ bản
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Hành động Lưu nháp
    const handleSaveDraft = async () => {
        try {
            await axiosClient.put(`/teacher/courses/${id}`, formData);
            alert("✅ Đã lưu nháp thành công!");
        } catch (err) {
            alert("[Demo] Đã lưu nháp thành công vào Local/Mock!");
        }
    };

    // ===============================================
    // ĐIỂM SÁNG: NÚT NHẢY SANG TRANG PREVIEW
    // ===============================================
    const handleGoToPreview = () => {
        // Lưu tạm data vào LocalStorage (nếu cần) hoặc gọi API lưu trước khi xem
navigate(`/teacher/preview/${id}`);    };

    return (
        <div className="course-edit-layout">
            {/* Header Của Trang Soạn Thảo */}
            <header className="edit-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate("/teacher/dashboard")}>⬅ Trở về Dashboard</button>
                    <h1>{id === "new" ? "Tạo khóa học mới" : `Sửa bài giảng: ${formData.title}`}</h1>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary" onClick={handleSaveDraft}>💾 Lưu nháp</button>
                    {/* NÚT CHUYỂN SANG PREVIEW */}
                    <button className="btn-preview" onClick={handleGoToPreview}>👁️ Xem trước (Preview)</button>
                    <button className="btn-primary" onClick={() => alert("Gửi yêu cầu duyệt lên Admin!")}>🚀 Yêu cầu xuất bản</button>
                </div>
            </header>

            {/* Vùng Làm Việc (Workspace) */}
            <main className="edit-workspace">
                {/* Cột trái: Chỉnh sửa thông tin chung */}
                <div className="edit-general-info">
                    <h2>Thông tin chung</h2>
                    
                    <div className="form-group">
                        <label>Tên khóa học</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="VD: Tuyệt đỉnh Casio 12..." />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Giá bán (VNĐ)</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Giá gốc (VNĐ)</label>
                            <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Mô tả ngắn</label>
                        <textarea name="description" rows="4" value={formData.description} onChange={handleChange} placeholder="Khóa học này sẽ giúp học sinh..."></textarea>
                    </div>

                    <div className="form-group">
                        <label>Đường dẫn Thumbnail (URL ảnh)</label>
                        <input type="text" name="thumbnail" value={formData.thumbnail} onChange={handleChange} />
                        {formData.thumbnail && <img src={formData.thumbnail} alt="Preview" className="thumb-preview" />}
                    </div>
                </div>

                {/* Cột phải: Quản lý Chương / Bài học (Syllabus) */}
                <div className="edit-syllabus">
                    <h2>Nội dung chương trình (Đề cương)</h2>
                    <p className="helper-text">Kéo thả để sắp xếp, hoặc nhấn để sửa tên bài học.</p>
                    
                    <div className="chapters-container">
                        {formData.chapters?.map((chapter, cIdx) => (
                            <div className="chapter-edit-box" key={chapter.id || cIdx}>
                                <div className="chapter-edit-header">
                                    <input type="text" className="chapter-input-title" defaultValue={chapter.title} />
                                    <button className="delete-icon-btn">🗑️</button>
                                </div>
                                
                                <div className="lessons-edit-list">
                                    {chapter.lessons?.map((lesson, lIdx) => (
                                        <div className="lesson-edit-item" key={lesson.id || lIdx}>
                                            <span className="drag-handle">☰</span>
                                            <input type="text" className="lesson-input" defaultValue={lesson.title} />
                                            <input type="text" className="lesson-duration" defaultValue={lesson.duration} />
                                            <button className="settings-icon-btn">⚙️</button>
                                        </div>
                                    ))}
                                    <button className="add-lesson-btn">+ Thêm bài học mới</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button className="add-chapter-btn">+ Thêm Chương Mới</button>
                </div>
            </main>
        </div>
    );
}