import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosClient from "../../api/axiosClient";
import "../css/CoursePreviewPage.css"; // Dùng chung file CSS preview hiện tại của bạn

export default function CoursePreviewPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [expandedChapter, setExpandedChapter] = useState(0);
    
    // Khởi tạo thông tin User để phân quyền giao diện banner
    const [currentUser, setCurrentUser] = useState({ role: "TEACHER" }); // Mặc định nếu chưa đăng nhập

    // BỘ KHO DỮ LIỆU MẪU: Tự động đổi nội dung theo ID trên URL khi chạy demo offline
    const mockDatabase = {
        1: {
            id: 1, title: "Mastering Mathematics 12", teacher: "Nguyễn Minh Quân", price: "599,000đ", originalPrice: "900,000đ", status: "PENDING",
            description: "Khóa học toàn diện bao phủ toàn bộ kiến thức Toán 12, luyện thi THPT QG.",
            thumbnail: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80",
            chapters: [{ id: 1, title: "Chương 1: Ứng dụng đạo hàm", lessons: [{ id: 101, title: "Sự đồng biến, nghịch biến", duration: "45:00" }] }]
        },
        2: {
            id: 2, title: "Physics Problem Solving", teacher: "Trần Bảo Châu", price: "499,000đ", originalPrice: "700,000đ", status: "PENDING",
            description: "Phương pháp giải nhanh các bài tập Vật Lý khó, bứt phá điểm số thi đại học.",
            thumbnail: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80",
            chapters: [{ id: 1, title: "Chương 1: Dao động cơ học", lessons: [{ id: 101, title: "Dao động điều hòa", duration: "40:00" }] }]
        },
        4: {
            id: 4, title: "Tuyệt đỉnh Casio - Giải nhanh trắc nghiệm Toán",
            teacher: "Nguyễn Minh Quân", price: "299,000đ", originalPrice: "500,000đ", status: "DRAFT",
            description: "Bí kíp bấm máy tính Casio Fx-580VNX & Fx-880BTG. Giải quyết nhanh gọn các câu hỏi Toán THPT Quốc gia chỉ trong 30 giây.",
            thumbnail: "https://images.unsplash.com/photo-1596496050827-8299e0220de1?auto=format&fit=crop&w=800&q=80",
            chapters: [
                { id: 1, title: "Chương 1: Kỹ thuật Casio cơ bản", lessons: [{ id: 101, title: "Làm quen thiết lập Fx-880BTG", duration: "15:00" }, { id: 102, title: "Giải phương trình, hệ phương trình", duration: "25:20" }] },
                { id: 2, title: "Chương 2: Ứng dụng Casio giải Tích phân", lessons: [{ id: 201, title: "Tích phân hàm ẩn", duration: "30:10" }] }
            ]
        }
    };

    // 1. KHỞI TẠO STATE: Lấy chuẩn dữ liệu theo ID trên thanh link URL
    const [course, setCourse] = useState(mockDatabase[id] || mockDatabase[4]);

    useEffect(() => {
        // Lấy thông tin vai trò (Role) từ hệ thống để bật ẩn/hiện banner tương ứng
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        // 2. GỌI API THEO PHƯƠNG ÁN LAI:
        const fetchPreviewData = async () => {
            try {
                // Endpoint dùng chung cho xem trước bản nháp: GET /api/courses/:id/preview
                const response = await axiosClient.get(`/courses/${id}/preview`);
                if (response.data) {
                    setCourse(response.data);
                }
            } catch (error) {
                console.warn(`[Preview Mode] Đang xem trước Khóa học ID #${id} bằng hạ tầng dữ liệu mẫu.`);
            }
        };

        fetchPreviewData();
    }, [id]);

    // ==========================================
    // CÁC HÀM XỬ LÝ HÀNH ĐỘNG CHO BANNER TRÊN ĐỈNH
    // ==========================================
    const handleAdminApprove = async () => {
        try {
            await axiosClient.patch(`/admin/courses/${id}/status`, { status: "PUBLISHED" });
            alert("👑 [Admin] Đã duyệt xuất bản khóa học này thành công!");
            navigate("/admin/courses");
        } catch (error) {
            alert(`[Demo Mode] Admin phê duyệt thành công khóa học #${id}!`);
            navigate("/admin/courses");
        }
    };

    const handleAdminReject = async () => {
        const reason = prompt("Nhập lý do từ chối yêu cầu giảng viên sửa đổi:");
        if (!reason) return;
        try {
            await axiosClient.patch(`/admin/courses/${id}/status`, { status: "REJECTED", note: reason });
            alert(`👑 [Admin] Đã từ chối và gửi yêu cầu sửa đổi với lý do: "${reason}"`);
            navigate("/admin/courses");
        } catch (error) {
            alert(`[Demo Mode] Đã chuyển trạng thái khóa học sang yêu cầu sửa đổi. Lý do: "${reason}"`);
            navigate("/admin/courses");
        }
    };

    return (
        <div className="teacher-preview-page" style={{ paddingTop: "60px" }}>
            {/* ========================================================= */}
            {/* THÀNH PHẦN ẨN HIỆN LINH HOẠT THEO VAI TRÒ (CONDITIONAL RENDERING) */}
            {/* ========================================================= */}
            
            {/* KỊCH BẢN 1: NẾU NGƯỜI XEM LÀ ADMIN */}
            {currentUser.role === "ADMIN" && (
                <div className="preview-mode-banner" style={{ background: "#fff3cd", borderBottom: "1px solid #ffeeba" }}>
                    <div className="banner-info" style={{ color: "#856404" }}>
                        <span className="eye-icon">👑</span>
                        <span>[HỘI ĐỒNG KIỂM DUYỆT] Đang thẩm định bài giảng của Giáo viên (Mã khóa: #{course.id})</span>
                    </div>
                    <div className="banner-actions">
                        <button className="edit-btn" style={{ background: "#6c757d" }} onClick={() => navigate("/admin/courses")}>
                            🔀 Thoát ra ngoài
                        </button>
                        <button className="edit-btn" style={{ background: "#dc3545", color: "#fff" }} onClick={handleAdminReject}>
                            ❌ Từ chối & Yêu cầu sửa
                        </button>
                        <button className="publish-btn" style={{ background: "#28a745" }} onClick={handleAdminApprove}>
                            ✅ Duyệt xuất bản
                        </button>
                    </div>
                </div>
            )}

            {/* KỊCH BẢN 2: NẾU NGƯỜI XEM LÀ GIÁO VIÊN */}
            {currentUser.role === "TEACHER" && (
                <div className="preview-mode-banner">
                    <div className="banner-info">
                        <span className="eye-icon">👁️</span>
                        <span>Bạn đang xem trước khóa học dưới góc nhìn <strong>Học sinh</strong></span>
                        <span className="status-badge draft">
                            {course.status === "DRAFT" ? "Bản nháp" : "Chờ kiểm duyệt"}
                        </span>
                    </div>
                    <div className="banner-actions">
                        <button className="edit-btn" onClick={() => alert("Quay lại màn hình biên soạn bài học.")}>
                            ✏️ Tiếp tục chỉnh sửa
                        </button>
                        <button className="publish-btn" onClick={() => alert("Đã gửi yêu cầu phê duyệt lên hệ thống Ban quản trị Admin!")}>
                            🚀 Gửi yêu cầu duyệt
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* KHU VỰC GIAO DIỆN HIỂN THỊ CHI TIẾT BÀI GIẢNG (DÙNG CHUNG) */}
            {/* ========================================================= */}
            <div className="course-detail-container preview-container">
                <div className="course-left">
                    <h1 className="course-title">{course.title}</h1>
                    <p className="course-description">{course.description}</p>
                    <p style={{ margin: "10px 0", color: "#666" }}>👨‍🏫 Biên soạn: <strong>{course.teacher}</strong></p>
                    
                    <div className="section-box">
                        <h2>Đề cương khóa học chính thức</h2>
                        <div className="syllabus-list">
                            {course.chapters && course.chapters.map((chapter, index) => (
                                <div className="chapter-item" key={chapter.id || index}>
                                    <div 
                                        className={`chapter-header ${expandedChapter === index ? "active" : ""}`}
                                        onClick={() => setExpandedChapter(expandedChapter === index ? null : index)}
                                    >
                                        <h3>{chapter.title}</h3>
                                        <span className="toggle-icon">{expandedChapter === index ? "▲" : "▼"}</span>
                                    </div>
                                    
                                    {expandedChapter === index && (
                                        <div className="chapter-body">
                                            {chapter.lessons && chapter.lessons.map((lesson, lIdx) => (
                                                <div className="lesson-item" key={lesson.id || lIdx}>
                                                    <div className="lesson-title">
                                                        <span className="play-icon">▶</span>
                                                        {lesson.title || lesson}
                                                    </div>
                                                    <div className="lesson-meta">
                                                        <span className="duration">{lesson.duration || "N/A"}</span>
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

                <div className="course-right">
                    <div className="floating-card">
                        <div className="preview-video">
                            <img src={course.thumbnail} alt="Course Preview" />
                            <div className="play-overlay">
                                <span>▶ Video Intro giới thiệu</span>
                            </div>
                        </div>

                        <div className="pricing-box">
                            <div className="price-tag">{course.price}</div>
                            <div className="original-price">{course.originalPrice}</div>
                        </div>

                        <button className="enroll-btn disabled-preview" style={{ background: "#ccc", cursor: "not-allowed" }} disabled>
                            Nút Đăng ký đã bị khóa khi xem trước
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}