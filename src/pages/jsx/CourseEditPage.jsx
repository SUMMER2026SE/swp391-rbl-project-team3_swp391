import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/CourseEditPage.css";

export default function CourseEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: "", description: "", price: "", originalPrice: "", thumbnail: "", chapters: []
    });

    useEffect(() => {
        const fetchCourse = async () => {
            try {
                const res = await axiosClient.get(`/teacher/courses/${id}`);
                setFormData(res.data);
            } catch (err) {
                // Mock dữ liệu nếu không có API
                setFormData({
                    title: "Tuyệt đỉnh Casio - Giải nhanh trắc nghiệm Toán",
                    description: "Bí kíp bấm máy tính Casio...",
                    price: "299000", originalPrice: "500000",
                    thumbnail: "https://images.unsplash.com/photo-1596496050827-8299e0220de1",
                    chapters: [{ id: 1, title: "Chương 1: Cơ bản", lessons: [{ id: 101, title: "Làm quen Fx-880BTG", duration: "15:00" }] }]
                });
            }
        };
        if (id !== "new") fetchCourse();
    }, [id]);

    // --- CÁC HÀM XỬ LÝ DỮ LIỆU ĐỘNG ---
    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSyllabusChange = (type, cIdx, lIdx, field, value) => {
        const newData = { ...formData };
        if (type === 'chapter') newData.chapters[cIdx].title = value;
        else newData.chapters[cIdx].lessons[lIdx][field] = value;
        setFormData(newData);
    };

    const addChapter = () => {
        setFormData({ ...formData, chapters: [...formData.chapters, { id: Date.now(), title: "Chương mới", lessons: [] }] });
    };

    const addLesson = (cIdx) => {
        const newData = { ...formData };
        newData.chapters[cIdx].lessons.push({ id: Date.now(), title: "Bài mới", duration: "00:00" });
        setFormData(newData);
    };

    const handleSave = async () => {
    // Lấy thông tin user hiện tại từ localStorage
    const storedUser = localStorage.getItem("user");
    const userObj = storedUser ? JSON.parse(storedUser) : null;

    if (!userObj) {
        alert("⚠️ Lỗi: Không tìm thấy thông tin giáo viên!");
        return;
    }

    // TẠO DỮ LIỆU CHUẨN (KHÔNG GÁN CỨNG)
    const payload = {
        ...formData, // Lấy title, description, price, thumbnail, chapters từ form
        teacher_id: userObj.id,// Lấy ID giáo viên từ chính thông tin đăng nhập
        teacher_name: userObj.fullName, 
        status: id === "new" ? "DRAFT" : formData.status, // Nếu tạo mới thì mặc định là DRAFT
        students: formData.students || 0 // Mặc định 0 học viên nếu chưa có
    };

    try {
        if (id === "new") {
            // Backend sẽ tự tạo ID khi nhận POST
            await axiosClient.post(`/teacher/courses`, payload);
            alert("✅ Tạo khóa học thành công!");
        } else {
            // Update khóa học hiện tại
            await axiosClient.put(`/teacher/courses/${id}`, payload);
            alert("✅ Lưu thay đổi thành công!");
        }
        navigate("/teacher/dashboard");
    } catch (err) {
        console.error("Lỗi:", err);
        alert("❌ Có lỗi xảy ra khi lưu!");
    }
};
    return (
        <div className="course-edit-layout">
            <header className="edit-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate("/teacher/dashboard")}>⬅ Trở về</button>
                    <h1>{id === "new" ? "Tạo khóa học" : `Sửa: ${formData.title}`}</h1>
                </div>
                <div className="header-actions">
                    
                    <button className="btn-secondary" onClick={handleSave}>💾 Lưu nháp</button>

                    <button className="btn-primary" onClick={() => navigate(`/teacher/preview/${id}`)}>👁️ Xem trước</button>
                </div>
            </header>

            <main className="edit-workspace">
                <div className="edit-general-info">
                    <h2>Thông tin chung</h2>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="Tên khóa học" />
                    <div className="form-row">
                        <input type="number" name="price" value={formData.price} onChange={handleChange} placeholder="Giá bán" />
                        <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleChange} placeholder="Giá gốc" />
                    </div>
                    <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả khóa học"></textarea>
                </div>

                <div className="edit-syllabus">
                    <h2>Nội dung chương trình</h2>
                    {formData.chapters.map((chapter, cIdx) => (
                        <div className="chapter-edit-box" key={chapter.id || cIdx}>
                            <input type="text" value={chapter.title} onChange={(e) => handleSyllabusChange('chapter', cIdx, null, 'title', e.target.value)} />
                            <div className="lessons-edit-list">
                                {chapter.lessons.map((lesson, lIdx) => (
                                    <div className="lesson-edit-item" key={lesson.id || lIdx}>
                                        <input type="text" value={lesson.title} onChange={(e) => handleSyllabusChange('lesson', cIdx, lIdx, 'title', e.target.value)} />
                                        <input type="text" value={lesson.duration} onChange={(e) => handleSyllabusChange('lesson', cIdx, lIdx, 'duration', e.target.value)} />
                                    </div>
                                ))}
                                <button onClick={() => addLesson(cIdx)}>+ Thêm bài học</button>
                            </div>
                        </div>
                    ))}
                    <button className="add-chapter-btn" onClick={addChapter}>+ Thêm Chương Mới</button>
                </div>
            </main>
        </div>
    );
}