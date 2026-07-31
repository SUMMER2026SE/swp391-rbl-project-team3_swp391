import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../css/TeacherDashboard.css";
import axiosClient from "../../api/axiosClient";
import { logout } from "../../services/authService";
import wordImportService from "../../services/wordImportService";
import TeacherProfileEdit from "./TeacherProfileEdit";
import Swal from "sweetalert2";

export default function TeacherDashboard() {
    const navigate = useNavigate();
    
    // State chính
    const [user, setUser] = useState(null);
    const [myCourses, setMyCourses] = useState([]);
    const [qaList, setQaList] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [categories, setCategories] = useState([]); // 🔥 State lưu danh sách Danh mục
    const [activeTab, setActiveTab] = useState("COURSES");

    // Modal Báo cáo
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedCourseForReport, setSelectedCourseForReport] = useState(null);
    const [courseReports, setCourseReports] = useState([]);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    // Modal Trả lời Q&A
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedQa, setSelectedQa] = useState(null);
    const [replyContent, setReplyContent] = useState("");

    // Modal Tạo khóa học (có thêm chọn danh mục optional)
    const [createCourseModalOpen, setCreateCourseModalOpen] = useState(false);
    const [newCourseData, setNewCourseData] = useState({
        title: "",
        subjectId: "1",
        categoryId: "", // 🔥 Mặc định rỗng (Optional)
        price: ""
    });

    // ─── State cho tab WORD_IMPORT ───────────────────────────────────────────────
    const [wiFile, setWiFile] = useState(null);               // File .docx đã chọn
    const [wiDragging, setWiDragging] = useState(false);     // Đang kéo thả
    const [wiPreviewing, setWiPreviewing] = useState(false); // Đang gọi API preview
    const [wiSaving, setWiSaving] = useState(false);         // Đang gọi API confirm
    const [wiPreview, setWiPreview] = useState(null);        // Kết quả preview từ server
    const [wiPreviewModalOpen, setWiPreviewModalOpen] = useState(false); // Modal xem trước toàn màn hình
    const [wiSaved, setWiSaved] = useState(false);           // Đã lưu thành công
    const [wiError, setWiError] = useState("");              // Lỗi
    const [wiMeta, setWiMeta] = useState({                   // Metadata giáo viên nhập
        quizTitle: "",
        subject: "math",
        duration: 90,
        courseId: ""
    });
    const wiFileInputRef = useRef(null);

    // Kiểm tra quyền truy cập và load dữ liệu ban đầu
    useEffect(() => {
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/home");
            return;
        }

        const userObj = JSON.parse(storedUser);
        if (userObj.role !== "TEACHER" && userObj.roleId !== 2) {
            alert("❌ Bạn không có quyền truy cập trang này!");
            navigate("/home");
            return;
        }

        setUser(userObj);
        fetchCourses(userObj);
        
        // Lấy danh sách môn học cho dropdown
        axiosClient.get("/public/subjects").then(res => setSubjects(res.data)).catch(() => {});

        // 🔥 Lấy danh sách danh mục cho dropdown
        axiosClient.get("/public/categories")
            .then(res => setCategories(res.data))
            .catch(() => {
                axiosClient.get("/categories").then(res => setCategories(res.data)).catch(() => {});
            });
    }, [navigate]);

    // Load danh sách Q&A khi chuyển tab
    useEffect(() => {
        if (activeTab === "QA") {
            fetchQaList();
        }
    }, [activeTab]);

    const fetchCourses = async (userObj) => {
        try {
            const response = await axiosClient.get("/courses");
            // Lọc danh sách chỉ lấy khóa học do chính giáo viên này tạo/dạy
            const teacherCourses = response.data.filter(course => 
                course.teacherId === userObj.id || course.teacher_id === userObj.id
            );
            setMyCourses(teacherCourses);
        } catch (error) {
            console.error("Lỗi tải danh sách khóa học:", error);
            const serverErrorMessage = error.response?.data?.message || error.message;
            alert("❌ Lỗi từ hệ thống: " + serverErrorMessage);
        }
    };

    const fetchQaList = async () => {
        try {
            const response = await axiosClient.get("/questions/teacher/all");
            setQaList(response.data);
        } catch (error) {
            console.error("Lỗi tải danh sách Q&A:", error);
            alert("Không thể tải danh sách hỏi đáp.");
        }
    };

    const handleCreateCourseSubmit = async (e) => {
        e.preventDefault();
        if (!newCourseData.title.trim()) return alert("Vui lòng nhập tên khóa học!");

        try {
            const payload = {
                title: newCourseData.title,
                teacher_id: user?.id,
                subjectId: parseInt(newCourseData.subjectId) || 1,
                price: parseFloat(newCourseData.price) || 0
            };

            // 🔥 Chỉ truyền categoryId nếu người dùng chọn
            if (newCourseData.categoryId) {
                payload.categoryId = parseInt(newCourseData.categoryId);
            }

            const response = await axiosClient.post("/courses", payload);
            alert("✅ Tạo khóa học thành công!");
            setCreateCourseModalOpen(false);
            setNewCourseData({ title: "", subjectId: "1", categoryId: "", price: "" });
            // Chuyển sang trang biên soạn
            navigate(`/teacher/course/${response.data.id || response.data.courseId}/edit`);
            fetchCourses(user); // Refresh danh sách
        } catch (error) {
            console.error(error);
            alert("❌ Lỗi khi tạo khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (courseId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này? Hành động này không thể hoàn tác!")) return;
        
        try {
            await axiosClient.delete(`/courses/${courseId}`);
            setMyCourses(prev => prev.filter(c => c.id !== courseId));
            alert("✅ Đã xóa khóa học.");
        } catch (error) {
            alert("❌ Lỗi khi xóa khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    const handleRename = async (courseId, oldTitle) => {
        const { value: newTitle } = await Swal.fire({
            title: "Đổi tên khóa học",
            input: "text",
            inputValue: oldTitle,
            inputLabel: "Tên khóa học mới",
            inputPlaceholder: "Nhập tên khóa học",
            showCancelButton: true,
            confirmButtonText: "Lưu",
            cancelButtonText: "Hủy",
            confirmButtonColor: "#0ea5e9",
            cancelButtonColor: "#94a3b8",
            inputValidator: (value) => {
                if (!value.trim()) {
                    return "Tên khóa học không được để trống!";
                }
            }
        });

        if (!newTitle || newTitle === oldTitle) {
            return;
        }

        try {
            await axiosClient.put(`/courses/${courseId}`, {
                title: newTitle.trim()
            });

            setMyCourses((prev) =>
                prev.map((course) =>
                    course.id === courseId
                        ? { ...course, title: newTitle.trim() }
                        : course
                )
            );

            Swal.fire({
                icon: "success",
                title: "Thành công",
                text: "Tên khóa học đã được cập nhật."
            });
        } catch (error) {
            Swal.fire({
                icon: "error",
                title: "Lỗi",
                text:
                    error.response?.data?.message ||
                    "Không thể đổi tên khóa học."
            });
        }
    };

    const handleOpenReport = async (course) => {
        setSelectedCourseForReport(course);
        setReportModalOpen(true);
        
        try {
            const response = await axiosClient.get(`/reports/courses/${course.id}`);
            setCourseReports(response.data);
        } catch (error) {
            console.error("Lỗi tải báo cáo:", error);
            setCourseReports([]);
        }
    };

    const handleExportExcel = async () => {
        if (!selectedCourseForReport) return;
        
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/reports/courses/${selectedCourseForReport.id}/export`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("Lỗi tải file");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Bao_Cao_Tien_Do_${selectedCourseForReport.id}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Lỗi xuất Excel:", error);
            alert("❌ Không thể xuất file Excel.");
        }
    };

    const handleOpenReplyModal = (qa) => {
        setSelectedQa(qa);
        setReplyContent("");
        setReplyModalOpen(true);
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error(err);
        }
        setShowLogoutModal(false);
        navigate("/auth");
    };

    const handleDeleteCourse = async (courseId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác!")) return;
        try {
            await axiosClient.delete(`/courses/${courseId}`);
            setMyCourses(myCourses.filter(c => c.id !== courseId));
            alert("Đã xóa khóa học thành công!");
        } catch (error) {
            console.error(error);
            alert("Lỗi khi xóa khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    const handleSendReply = async () => {
        if (!replyContent.trim()) {
            alert("Vui lòng nhập nội dung trả lời!");
            return;
        }

        const questionId = selectedQa?.questionId || selectedQa?.id;
        if (!questionId) {
            alert("❌ Không tìm thấy ID câu hỏi!");
            return;
        }

        try {
            await axiosClient.post(`/questions/${questionId}/answers`, {
                content: replyContent
            });
            setReplyModalOpen(false);
            fetchQaList(); // Refresh danh sách
            alert("🎉 Đã gửi câu trả lời thành công!");
        } catch (error) {
            console.error("Lỗi gửi trả lời:", error);
            alert("❌ Lỗi khi gửi trả lời: " + (error.response?.data?.message || error.message));
        }
    };
    
    return (
        <div className="teacher-dashboard-layout">
            <aside className="teacher-sidebar">
                <div className="teacher-brand" onClick={() => navigate("/teacher/dashboard")}>
                    PrepAce <span>Teacher</span>
                </div>
                <ul className="teacher-menu">
                    <li className={activeTab === "COURSES" ? "active" : ""} onClick={() => setActiveTab("COURSES")}>
                        📚 Khóa học của tôi
                    </li>
                    <li className={activeTab === "QA" ? "active" : ""} onClick={() => setActiveTab("QA")}>
                        💬 Quản lý Hỏi & Đáp
                    </li>
                    <li className={activeTab === "WORD_IMPORT" ? "active" : ""} onClick={() => setActiveTab("WORD_IMPORT")}>
                        📄 Tạo Đề Từ File Word
                    </li>
                    <li className={activeTab === "PROFILE" ? "active" : ""} onClick={() => setActiveTab("PROFILE")}>
                        👤 Hồ sơ giảng viên
                    </li>
                    <li onClick={() => navigate("/teacher/grading")}>
                        ✍️ Chấm điểm Tự luận
                    </li>
                    {/* 🔥 THÊM MỤC THÔNG BÁO Ở SIDEBAR */}
                    <li onClick={() => navigate("/notifications")}>
                        🔔 Thông báo
                    </li>
                    <li style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)' }} onClick={handleLogout}>
                        🚪 Đăng xuất
                    </li>
                </ul>
            </aside>

            <main className="teacher-main">
                <header className="teacher-header">
                    <div>
                        <h1>Xin chào, Giảng viên {user?.fullName || "Khách"}! 🎓</h1>
                        <p>Quản lý toàn bộ tiến độ, báo cáo học tập và khóa học của bạn tại đây.</p>
                    </div>
                    {activeTab === "COURSES" && (
                        <button className="teacher-create-btn" onClick={() => setCreateCourseModalOpen(true)}>
                            ✨ + Tạo Khóa Học Mới
                        </button>
                    )}
                </header>

                {activeTab === "COURSES" && (
                    <>
                        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "20px" }}>
                            📚 Quản lý khóa học của tôi
                        </h2>

                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {myCourses.length > 0 ? myCourses.map(course => (
                                <div key={course.id} style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    padding: "24px",
                                    background: "#fff",
                                    borderRadius: "18px",
                                    boxShadow: "0 6px 20px rgba(20, 40, 120, 0.04)",
                                    border: "1px solid #f0f4ff"
                                }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 10px 0", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                                            {course.title}
                                        </h3>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            {course.status === "PUBLISHED" && (
                                                <span style={{
                                                    padding: "5px 10px",
                                                    background: "#e2fbe8",
                                                    color: "#1e8a3b",
                                                    borderRadius: "8px",
                                                    fontSize: "12px",
                                                    fontWeight: "600"
                                                }}>
                                                    Đã xuất bản
                                                </span>
                                            )}
                                            <span style={{ fontSize: "13.5px", color: "#64748b" }}>
                                                👥 {course.students || 0} học viên
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "nowrap", justifyContent: "flex-end" }}>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#334155" }}
                                            onClick={() => handleRename(course.id, course.title)}
                                        >
                                            📝 Đổi tên
                                        </button>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#334155" }}
                                            onClick={() => navigate(`/teacher/course/${course.id}/edit`)}
                                            title="Biên soạn nội dung khóa học"
                                        >
                                            ✏️ Biên soạn
                                        </button>

                                        <button 
                                            style={{ padding: "10px 18px", background: "#f0fdf4", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#166534" }}
                                            onClick={() => handleOpenReport(course)}
                                            title="Xem báo cáo học tập"
                                        >
                                            📊 Báo cáo
                                        </button>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#fef2f2", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#b91c1c" }}
                                            onClick={() => handleDeleteCourse(course.id)}
                                            title="Xóa khóa học"
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            )) : (
                                <p>Chưa có khóa học nào. Hãy tạo khóa học mới!</p>
                            )}
                        </div>
                    </>
                )}

                {activeTab === "QA" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                            💬 Hỏi đáp Học viên
                        </h2>
                        <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 6px 20px rgba(20, 40, 120, 0.04)", border: "1px solid #e2e8f0" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead style={{ background: "#f8fafc" }}>
                                    <tr>
                                        <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "14px" }}>Học viên</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "14px" }}>Khóa học / Bài học</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "14px" }}>Nội dung câu hỏi</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "14px" }}>Trạng thái</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "2px solid #e2e8f0", color: "#475569", fontWeight: "600", fontSize: "14px" }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {qaList.length > 0 ? qaList.map(qa => {
                                        const isAnswered = qa.answers && qa.answers.length > 0;
                                        return (
                                            <tr key={qa.questionId || qa.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "16px", verticalAlign: "top" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                        <img 
                                                            src={
                                                                qa.userAvatarUrl && qa.userAvatarUrl !== "null" && qa.userAvatarUrl.trim() !== ""
                                                                    ? (qa.userAvatarUrl.startsWith("http") ? qa.userAvatarUrl : `http://localhost:8080${qa.userAvatarUrl}`)
                                                                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(qa.userFullName || "User")}&background=64748b&color=fff`
                                                            }
                                                            onError={(e) => {
                                                                e.target.onerror = null; 
                                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(qa.userFullName || "User")}&background=64748b&color=fff`;
                                                            }}
                                                            alt="" 
                                                            style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} 
                                                        />
                                                        <div>
                                                            <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>{qa.userFullName}</div>
                                                            <div style={{ color: "#94a3b8", fontSize: "12px" }}>{new Date(qa.createdAt).toLocaleDateString("vi-VN")}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px", verticalAlign: "top" }}>
                                                    <div style={{ color: "#2747d9", fontWeight: "600", fontSize: "13.5px", marginBottom: "4px" }}>{qa.courseTitle}</div>
                                                    <div style={{ color: "#64748b", fontSize: "12.5px" }}>▶ {qa.lessonTitle}</div>
                                                </td>
                                                <td style={{ padding: "16px", verticalAlign: "top", maxWidth: "300px" }}>
                                                    <div style={{ background: "#f8fafc", padding: "10px", borderRadius: "8px", fontSize: "13px", color: "#334155", border: "1px solid #e2e8f0" }}>
                                                        {qa.content}
                                                    </div>
                                                </td>
                                                <td style={{ padding: "16px", verticalAlign: "top" }}>
                                                    {isAnswered ? (
                                                        <span style={{ padding: "4px 8px", background: "#dcfce7", color: "#166534", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>Đã trả lời</span>
                                                    ) : (
                                                        <span style={{ padding: "4px 8px", background: "#fef3c7", color: "#b45309", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>Chưa trả lời</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: "16px", verticalAlign: "top" }}>
                                                    <button 
                                                        onClick={() => handleOpenReplyModal(qa)}
                                                        style={{
                                                            padding: "6px 12px",
                                                            background: isAnswered ? "#f1f5f9" : "#2747d9",
                                                            color: isAnswered ? "#475569" : "#fff",
                                                            border: "none",
                                                            borderRadius: "6px",
                                                            fontSize: "13px",
                                                            cursor: "pointer",
                                                            fontWeight: "600"
                                                        }}
                                                    >
                                                        {isAnswered ? "Xem / Sửa" : "Trả lời"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                                                Chưa có câu hỏi nào từ học viên.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: TẠO ĐỀ TỪ FILE WORD */}
                {activeTab === "WORD_IMPORT" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
                            <div>
                                <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                                    📄 Tạo Đề Luyện Thi Từ File Word
                                </h2>
                                <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "14px" }}>
                                    Upload file <strong>.docx</strong> chứa đề thi — hệ thống sẽ tự động phân tích câu hỏi trắc nghiệm, đúng/sai, trả lời ngắn và lưu vào ngân hàng câu hỏi.
                                </p>
                            </div>
                            {wiSaved && (
                                <div style={{ background: "#dcfce7", color: "#166534", padding: "10px 18px", borderRadius: "10px", fontWeight: "700", fontSize: "15px" }}>
                                    ✅ Đã lưu vào hệ thống!
                                </div>
                            )}
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>

                            {/* Cột trái: Upload + Form */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                                <div
                                    id="wi-dropzone"
                                    onClick={() => wiFileInputRef.current?.click()}
                                    onDragOver={(e) => { e.preventDefault(); setWiDragging(true); }}
                                    onDragLeave={() => setWiDragging(false)}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        setWiDragging(false);
                                        const f = e.dataTransfer.files[0];
                                        if (f && f.name.endsWith(".docx")) {
                                            setWiFile(f);
                                            setWiPreview(null);
                                            setWiSaved(false);
                                            setWiError("");
                                        } else {
                                            setWiError("Chỉ hỗ trợ file .docx (Word 2007+)");
                                        }
                                    }}
                                    style={{
                                        border: `2px dashed ${wiDragging ? "#2747d9" : wiFile ? "#16a34a" : "#cbd5e1"}`,
                                        borderRadius: "16px",
                                        padding: "40px 20px",
                                        textAlign: "center",
                                        background: wiDragging ? "#eff3ff" : wiFile ? "#f0fdf4" : "#f8fafc",
                                        cursor: "pointer",
                                        transition: "all 0.2s ease",
                                        userSelect: "none"
                                    }}
                                >
                                    <input
                                        ref={wiFileInputRef}
                                        type="file"
                                        accept=".docx"
                                        style={{ display: "none" }}
                                        onChange={(e) => {
                                            const f = e.target.files[0];
                                            if (f) {
                                                setWiFile(f);
                                                setWiPreview(null);
                                                setWiSaved(false);
                                                setWiError("");
                                            }
                                        }}
                                    />
                                    {wiFile ? (
                                        <>
                                            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📝</div>
                                            <div style={{ fontWeight: "700", fontSize: "16px", color: "#166534" }}>{wiFile.name}</div>
                                            <div style={{ fontSize: "13px", color: "#64748b", marginTop: "6px" }}>
                                                {(wiFile.size / 1024).toFixed(1)} KB — Click để đổi file
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div style={{ fontSize: "48px", marginBottom: "12px" }}>📤</div>
                                            <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>Kéo thả hoặc click để chọn file</div>
                                            <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "8px" }}>Hỗ trợ định dạng .docx (Word 2007+)</div>
                                        </>
                                    )}
                                </div>

                                {/* Form Metadata */}
                                <div style={{ background: "#fff", borderRadius: "16px", padding: "24px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
                                    <h3 style={{ margin: "0 0 18px", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>⚙️ Thông tin đề thi</h3>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                        <div>
                                            <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                                                Tên đề thi *
                                            </label>
                                            <input
                                                id="wi-title"
                                                type="text"
                                                placeholder="VD: Đề Thi Thử Toán THPT 2026 - Đề 1"
                                                value={wiMeta.quizTitle}
                                                onChange={(e) => setWiMeta({ ...wiMeta, quizTitle: e.target.value })}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                            />
                                        </div>

                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                            <div>
                                                <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                                                    Môn học *
                                                </label>
                                                <select
                                                    id="wi-subject"
                                                    value={wiMeta.subject}
                                                    onChange={(e) => setWiMeta({ ...wiMeta, subject: e.target.value })}
                                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#fff" }}
                                                >
                                                    <option value="math">Toán Học</option>
                                                    <option value="physics">Vật Lý</option>
                                                    <option value="chemistry">Hóa Học</option>
                                                    <option value="literature">Ngữ Văn</option>
                                                    <option value="english">Tiếng Anh</option>
                                                    <option value="history">Lịch Sử</option>
                                                    <option value="geography">Địa Lý</option>
                                                    <option value="general">Môn khác</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                                                    Thời gian (phút) *
                                                </label>
                                                <input
                                                    id="wi-duration"
                                                    type="number"
                                                    min="10"
                                                    max="300"
                                                    value={wiMeta.duration}
                                                    onChange={(e) => setWiMeta({ ...wiMeta, duration: parseInt(e.target.value) || 90 })}
                                                    style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", boxSizing: "border-box" }}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontWeight: "600", fontSize: "13px", color: "#475569", marginBottom: "6px" }}>
                                                Gắn vào khóa học (không bắt buộc)
                                            </label>
                                            <select
                                                id="wi-course"
                                                value={wiMeta.courseId}
                                                onChange={(e) => setWiMeta({ ...wiMeta, courseId: e.target.value })}
                                                style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#fff" }}
                                            >
                                                <option value="">-- Đề thi độc lập (không gắn khóa học) --</option>
                                                {myCourses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <button
                                        id="wi-btn-preview"
                                        disabled={!wiFile || !wiMeta.quizTitle.trim() || wiPreviewing || wiSaving}
                                        onClick={async () => {
                                            if (!wiFile || !wiMeta.quizTitle.trim()) {
                                                setWiError("Vui lòng chọn file và nhập tên đề thi.");
                                                return;
                                            }
                                            setWiPreviewing(true);
                                            setWiError("");
                                            setWiPreview(null);
                                            setWiSaved(false);
                                            try {
                                                const result = await wordImportService.preview(wiFile);
                                                setWiPreview(result);
                                            } catch (err) {
                                                setWiError(
                                                    err.response?.data?.error ||
                                                    err.message ||
                                                    "Lỗi khi phân tích file. Vui lòng thử lại."
                                                );
                                            } finally {
                                                setWiPreviewing(false);
                                            }
                                        }}
                                        style={{
                                            width: "100%",
                                            marginTop: "18px",
                                            padding: "13px",
                                            background: wiPreviewing ? "#94a3b8" : "#2747d9",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "10px",
                                            fontWeight: "700",
                                            fontSize: "15px",
                                            cursor: wiPreviewing ? "not-allowed" : "pointer",
                                            transition: "background 0.2s"
                                        }}
                                    >
                                        {wiPreviewing ? "⏳ Đang phân tích..." : "🔍 Phân tích File"}
                                    </button>

                                    {wiError && (
                                        <div style={{ marginTop: "12px", padding: "12px", background: "#fef2f2", borderRadius: "8px", color: "#b91c1c", fontSize: "14px", border: "1px solid #fecaca" }}>
                                            ❌ {wiError}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Cột phải: Kết quả Preview */}
                            <div>
                                {!wiPreview ? (
                                    <div style={{
                                        background: "#f8fafc",
                                        borderRadius: "16px",
                                        padding: "48px 32px",
                                        textAlign: "center",
                                        border: "1px dashed #cbd5e1"
                                    }}>
                                        <div style={{ fontSize: "56px", marginBottom: "16px", opacity: 0.3 }}>📊</div>
                                        <div style={{ color: "#94a3b8", fontSize: "15px" }}>Kết quả phân tích sẽ hiển thị ở đây</div>
                                    </div>
                                ) : (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                                        <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0" }}>
                                            <h3 style={{ margin: "0 0 16px", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>📊 Kết quả phân tích</h3>
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                                <div style={{ background: "#eff3ff", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#2747d9" }}>{wiPreview.totalQuestions}</div>
                                                    <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>Tổng câu hỏi</div>
                                                </div>
                                                <div style={{ background: "#f0fdf4", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#16a34a" }}>{wiPreview.multipleChoiceCount}</div>
                                                    <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>Trắc nghiệm</div>
                                                </div>
                                                <div style={{ background: "#fefce8", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#ca8a04" }}>{wiPreview.trueFalseCount}</div>
                                                    <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>Đúng / Sai</div>
                                                </div>
                                                <div style={{ background: "#fff1f2", borderRadius: "12px", padding: "16px", textAlign: "center" }}>
                                                    <div style={{ fontSize: "28px", fontWeight: "800", color: "#be123c" }}>{wiPreview.shortAnswerCount}</div>
                                                    <div style={{ fontSize: "12px", color: "#475569", fontWeight: "600" }}>Trả lời ngắn</div>
                                                </div>
                                            </div>

                                            {wiPreview.warnings && wiPreview.warnings.length > 0 && (
                                                <div style={{ marginTop: "14px", padding: "12px", background: "#fffbeb", borderRadius: "8px", border: "1px solid #fde68a" }}>
                                                    {wiPreview.warnings.map((w, i) => (
                                                        <div key={i} style={{ fontSize: "13px", color: "#92400e" }}>⚠️ {w}</div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {wiPreview.previewQuestions && wiPreview.previewQuestions.length > 0 && (
                                            <div style={{ background: "#fff", borderRadius: "16px", padding: "20px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", border: "1px solid #e2e8f0", textAlign: "center" }}>
                                                <h3 style={{ margin: "0 0 14px", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>👁️ Xem trước toàn bộ đề</h3>
                                                <p style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>Mở rộng để kiểm tra lại toàn bộ {wiPreview.previewQuestions.length} câu hỏi đã được quét.</p>
                                                <button
                                                    onClick={() => setWiPreviewModalOpen(true)}
                                                    style={{
                                                        padding: "12px 24px",
                                                        background: "#f1f5f9",
                                                        color: "#0f172a",
                                                        border: "1px solid #cbd5e1",
                                                        borderRadius: "10px",
                                                        fontSize: "14px",
                                                        fontWeight: "600",
                                                        cursor: "pointer",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "8px",
                                                        transition: "all 0.2s ease"
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                                                    onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
                                                >
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                                                    Xem chi tiết toàn màn hình
                                                </button>
                                            </div>
                                        )}

                                        {wiPreview.totalQuestions > 0 && !wiSaved && (
                                            <button
                                                id="wi-btn-confirm"
                                                disabled={wiSaving}
                                                onClick={async () => {
                                                    setWiSaving(true);
                                                    setWiError("");
                                                    try {
                                                        await wordImportService.confirm(wiFile, {
                                                            quizTitle: wiMeta.quizTitle,
                                                            subject: wiMeta.subject,
                                                            duration: wiMeta.duration,
                                                            courseId: wiMeta.courseId ? parseInt(wiMeta.courseId) : null
                                                        });
                                                        setWiSaved(true);
                                                        setWiFile(null);
                                                        setWiPreview(null);
                                                        setWiMeta({ quizTitle: "", subject: "math", duration: 90, courseId: "" });
                                                    } catch (err) {
                                                        setWiError(
                                                            err.response?.data?.error ||
                                                            err.message ||
                                                            "Lỗi khi lưu đề thi. Vui lòng thử lại."
                                                        );
                                                    } finally {
                                                        setWiSaving(false);
                                                    }
                                                }}
                                                style={{
                                                    width: "100%",
                                                    padding: "14px",
                                                    background: wiSaving ? "#94a3b8" : "#16a34a",
                                                    color: "#fff",
                                                    border: "none",
                                                    borderRadius: "12px",
                                                    fontWeight: "700",
                                                    fontSize: "16px",
                                                    cursor: wiSaving ? "not-allowed" : "pointer",
                                                    transition: "background 0.2s",
                                                    boxShadow: "0 4px 12px rgba(22, 163, 74, 0.3)"
                                                }}
                                            >
                                                {wiSaving ? "⏳ Đang lưu vào hệ thống..." : `✅ Xác nhận lưu ${wiPreview.totalQuestions} câu hỏi vào DB`}
                                            </button>
                                        )}

                                        {wiSaved && (
                                            <div style={{ background: "#dcfce7", border: "1px solid #86efac", borderRadius: "12px", padding: "20px", textAlign: "center" }}>
                                                <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎉</div>
                                                <div style={{ fontWeight: "700", color: "#166534", fontSize: "16px" }}>Đề thi đã được lưu thành công!</div>
                                                <div style={{ color: "#166534", fontSize: "13px", marginTop: "6px" }}>Học sinh có thể vào Luyện Đề để làm bài với câu hỏi ngẫu nhiên.</div>
                                                <button
                                                    onClick={() => { setWiSaved(false); setWiError(""); }}
                                                    style={{ marginTop: "14px", padding: "8px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                                                >
                                                    + Nhập đề khác
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Hướng dẫn định dạng */}
                        <div style={{ background: "#eff3ff", borderRadius: "16px", padding: "20px", border: "1px solid #c7d2fe" }}>
                            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: "700", color: "#2747d9" }}>📋 Định dạng file Word được hỗ trợ</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", fontSize: "13px", color: "#334155" }}>
                                <div>
                                    <strong style={{ color: "#2747d9" }}>🔵 Trắc nghiệm</strong>
                                    <pre style={{ margin: "8px 0 0", fontSize: "12px", lineHeight: 1.7, background: "#fff", padding: "10px", borderRadius: "8px" }}>{`Câu 1. Nội dung câu hỏi...
A. Lựa chọn A
B. Lựa chọn B
C. Lựa chọn C
D. Lựa chọn D`}</pre>
                                </div>
                                <div>
                                    <strong style={{ color: "#ca8a04" }}>🟡 Đúng / Sai</strong>
                                    <pre style={{ margin: "8px 0 0", fontSize: "12px", lineHeight: 1.7, background: "#fff", padding: "10px", borderRadius: "8px" }}>{`Câu 17. Cho hàm số...
a) Phát biểu 1
b) Phát biểu 2
c) Phát biểu 3
d) Phát biểu 4`}</pre>
                                </div>
                                <div>
                                    <strong style={{ color: "#be123c" }}>🔴 Trả lời ngắn</strong>
                                    <pre style={{ margin: "8px 0 0", fontSize: "12px", lineHeight: 1.7, background: "#fff", padding: "10px", borderRadius: "8px" }}>{`Câu 21. Tính giá trị
của biểu thức...
(Không có lựa chọn)`}</pre>
                                </div>
                            </div>
                            <div style={{ marginTop: "12px", fontSize: "12px", color: "#6366f1" }}>💡 <strong>Mẹo:</strong> Đáp án in đậm trong file Word sẽ được tự động nhận diện là đáp án đúng.</div>
                        </div>

                        {/* Modal Xem Trước Toàn Bộ Đề (Full-screen) */}
                        {wiPreviewModalOpen && wiPreview && (
                            <div style={{
                                position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
                                background: "rgba(15, 23, 42, 0.75)", backdropFilter: "blur(4px)",
                                zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center",
                                padding: "24px"
                            }}>
                                <div style={{
                                    background: "#fff", width: "100%", maxWidth: "1000px", height: "100%", maxHeight: "90vh",
                                    borderRadius: "20px", display: "flex", flexDirection: "column",
                                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                                    overflow: "hidden"
                                }}>
                                    <div style={{
                                        padding: "20px 24px", borderBottom: "1px solid #e2e8f0",
                                        display: "flex", justifyContent: "space-between", alignItems: "center",
                                        background: "#f8fafc"
                                    }}>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>Chi tiết đề thi đã quét</h2>
                                            <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#64748b" }}>
                                                {wiPreview.totalQuestions} câu hỏi • {wiPreview.multipleChoiceCount} trắc nghiệm • {wiPreview.trueFalseCount} đúng/sai • {wiPreview.shortAnswerCount} trả lời ngắn
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setWiPreviewModalOpen(false)}
                                            style={{
                                                width: "40px", height: "40px", borderRadius: "50%", border: "none",
                                                background: "#e2e8f0", color: "#475569", fontSize: "20px",
                                                display: "flex", justifyContent: "center", alignItems: "center",
                                                cursor: "pointer", transition: "all 0.2s"
                                            }}
                                            onMouseOver={(e) => { e.currentTarget.style.background = "#cbd5e1"; e.currentTarget.style.color = "#0f172a"; }}
                                            onMouseOut={(e) => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#475569"; }}
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div style={{ padding: "24px", overflowY: "auto", flex: 1, background: "#f1f5f9" }}>
                                        <div style={{ display: "grid", gap: "16px" }}>
                                            {wiPreview.previewQuestions.map((q, idx) => (
                                                <div key={idx} style={{
                                                    background: "#fff", padding: "20px", borderRadius: "12px",
                                                    border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                                }}>
                                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                                                        <span style={{ fontWeight: "700", color: "#2563eb", fontSize: "15px" }}>Câu {q.number}</span>
                                                        <span style={{
                                                            fontSize: "12px", padding: "4px 10px", borderRadius: "20px", fontWeight: "600",
                                                            background: q.type === "MULTIPLE_CHOICE" ? "#e0e7ff" : q.type === "TRUE_FALSE" ? "#fef3c7" : "#ffe4e6",
                                                            color: q.type === "MULTIPLE_CHOICE" ? "#3730a3" : q.type === "TRUE_FALSE" ? "#92400e" : "#9f1239"
                                                        }}>
                                                            {q.type === "MULTIPLE_CHOICE" ? "Trắc nghiệm" : q.type === "TRUE_FALSE" ? "Đúng / Sai" : "Trả lời ngắn"}
                                                        </span>
                                                    </div>
                                                    <div
                                                        style={{ fontSize: "15px", color: "#1e293b", lineHeight: 1.6, fontWeight: "500" }}
                                                        dangerouslySetInnerHTML={{ __html: q.content }}
                                                    />

                                                    {q.options && q.options.length > 0 ? (
                                                        <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr", gap: "8px" }}>
                                                            {q.options.map((opt) => {
                                                                const isTF = q.type === "TRUE_FALSE";
                                                                const tfLabel = isTF ? (opt.isCorrect ? "ĐÚNG" : "SAI") : null;
                                                                const tfColor = isTF ? (opt.isCorrect ? "#22c55e" : "#ef4444") : null;
                                                                const tfBg = isTF ? (opt.isCorrect ? "#f0fdf4" : "#fef2f2") : null;
                                                                const borderColor = isTF ? tfColor : (opt.isCorrect ? "#22c55e" : "#cbd5e1");
                                                                const bgColor = isTF ? tfBg : (opt.isCorrect ? "#f0fdf4" : "#fff");
                                                                const textColor = isTF ? tfColor : (opt.isCorrect ? "#166534" : "#475569");
                                                                const fontWeight = (isTF || opt.isCorrect) ? "600" : "400";
                                                                const labelBg = isTF ? tfColor : (opt.isCorrect ? "#22c55e" : "#f1f5f9");
                                                                const labelTextCol = isTF ? "#fff" : (opt.isCorrect ? "#fff" : "#64748b");

                                                                return (
                                                                    <div key={opt.label} style={{
                                                                        fontSize: "14px", padding: "10px 14px", borderRadius: "8px",
                                                                        border: `2px solid ${borderColor}`,
                                                                        background: bgColor,
                                                                        color: textColor,
                                                                        fontWeight: fontWeight,
                                                                        display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between"
                                                                    }}>
                                                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                                            <div style={{
                                                                                width: "24px", height: "24px", borderRadius: "4px",
                                                                                background: labelBg,
                                                                                color: labelTextCol,
                                                                                display: "flex", justifyContent: "center", alignItems: "center",
                                                                                fontWeight: "700", fontSize: "13px"
                                                                            }}>
                                                                                {opt.label}
                                                                            </div>
                                                                            <span dangerouslySetInnerHTML={{ __html: opt.content }} />
                                                                        </div>
                                                                        {isTF && (
                                                                            <div style={{
                                                                                padding: "4px 8px", borderRadius: "6px",
                                                                                background: labelBg, color: "#fff",
                                                                                fontSize: "12px", fontWeight: "bold"
                                                                            }}>
                                                                                [{tfLabel}]
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        q.correctAnswer && (
                                                            <div style={{
                                                                marginTop: "16px", padding: "12px 16px", borderRadius: "8px",
                                                                background: "#f0fdf4", border: "1px dashed #22c55e",
                                                                color: "#166534", fontSize: "14px", fontWeight: "600"
                                                            }}>
                                                                Đáp án đúng: {q.correctAnswer}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div style={{ padding: "16px 24px", borderTop: "1px solid #e2e8f0", background: "#fff", display: "flex", justifyContent: "flex-end" }}>
                                        <button
                                            onClick={() => setWiPreviewModalOpen(false)}
                                            style={{
                                                padding: "10px 24px", background: "#3b82f6", color: "#fff",
                                                border: "none", borderRadius: "8px", fontWeight: "600", fontSize: "14px",
                                                cursor: "pointer", boxShadow: "0 2px 4px rgba(59,130,246,0.2)"
                                            }}
                                        >
                                            Đóng
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "PROFILE" && (
                    <TeacherProfileEdit user={user} setUser={setUser} />
                )}
            </main>

            {/* MODAL KHỞI TẠO KHÓA HỌC (TÊN + MÔN HỌC + DANH MỤC TÙY CHỌN + GIÁ) */}
            {createCourseModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                    <div style={{ background: "#fff", width: "500px", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                        <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>🚀 Khởi tạo khóa học mới</h3>
                        
                        <form onSubmit={handleCreateCourseSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Tên khóa học *:</label>
                                <input 
                                    type="text"
                                    required
                                    placeholder="Nhập tên khóa học (Ví dụ: Toán nâng cao 12...)"
                                    value={newCourseData.title}
                                    onChange={(e) => setNewCourseData({ ...newCourseData, title: e.target.value })}
                                    style={{ padding: "11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                                />
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Môn học *:</label>
                                <select 
                                    value={newCourseData.subjectId}
                                    onChange={(e) => setNewCourseData({ ...newCourseData, subjectId: e.target.value })}
                                    style={{ padding: "11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                                >
                                    {subjects.map(sub => (
                                        <option key={sub.id} value={sub.id}>
                                            {{"Mathematics": "Toán Học", "Physics": "Vật Lý", "Chemistry": "Hóa Học", "Literature": "Ngữ Văn", "English": "Tiếng Anh", "Biology": "Sinh Học", "History": "Lịch Sử", "Geography": "Địa Lý", "Civic Education": "GDCD", "Informatics": "Tin Học"}[sub.subjectName] || sub.subjectName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 🔥 FIELD CHỌN DANH MỤC KHÓA HỌC (OPTIONAL) */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>
                                    Danh mục khóa học <span style={{ color: "#94a3b8", fontWeight: "normal" }}>(Không bắt buộc)</span>:
                                </label>
                                <select 
                                    value={newCourseData.categoryId}
                                    onChange={(e) => setNewCourseData({ ...newCourseData, categoryId: e.target.value })}
                                    style={{ padding: "11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", background: "#fff" }}
                                >
                                    <option value="">-- Chọn danh mục (Tùy chọn) --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id || cat.categoryId} value={cat.id || cat.categoryId}>
                                            {cat.name || cat.categoryName || cat.title || `Danh mục ${cat.id || cat.categoryId}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Giá tiền (VNĐ):</label>
                                <input 
                                    type="number"
                                    min="0"
                                    placeholder="Nhập giá khóa học (bỏ trống nếu miễn phí)"
                                    value={newCourseData.price}
                                    onChange={(e) => setNewCourseData({ ...newCourseData, price: e.target.value })}
                                    style={{ padding: "11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
                                />
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "15px" }}>
                                <button 
                                    type="button" 
                                    onClick={() => { setCreateCourseModalOpen(false); setNewCourseData({ title: "", subjectId: "1", categoryId: "", price: "" }); }}
                                    style={{ padding: "10px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    Hủy bỏ
                                </button>
                                <button 
                                    type="submit"
                                    style={{ padding: "10px 20px", background: "#2747d9", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    Tạo mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BÁO CÁO TIẾN ĐỘ */}
            {reportModalOpen && selectedCourseForReport && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "800px", maxWidth: "90%", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", position: "relative" }}>
                        <button 
                            onClick={() => setReportModalOpen(false)}
                            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b" }}
                        >
                            &times;
                        </button>
                        <h2 style={{ margin: "0 0 20px 0", fontSize: "22px", color: "#0f172a" }}>
                            📊 Báo cáo tiến độ: {selectedCourseForReport.title}
                        </h2>
                        
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                            <button 
                                onClick={handleExportExcel}
                                style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}
                            >
                                📥 Tải báo cáo Excel
                            </button>
                        </div>

                        <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                                    <tr>
                                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Học sinh</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Đã học</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Tiến độ</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0" }}>Điểm TB</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courseReports.length > 0 ? courseReports.map(report => (
                                        <tr key={report.userId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px 16px" }}>{report.userFullName}</td>
                                            <td style={{ padding: "12px 16px" }}>{report.completedLessons} / {report.totalLessons}</td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{ flex: 1, background: "#e2e8f0", height: "8px", borderRadius: "4px" }}>
                                                        <div style={{ width: `${report.progressPercentage}%`, background: report.progressPercentage === 100 ? "#16a34a" : "#3b82f6", height: "100%" }}></div>
                                                    </div>
                                                    <span>{report.progressPercentage}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px" }}>
                                                {report.averageScore != null ? report.averageScore : "-"}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>
                                                Chưa có dữ liệu học viên.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TRẢ LỜI Q&A */}
            {replyModalOpen && selectedQa && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "600px", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", position: "relative" }}>
                        <button 
                            onClick={() => setReplyModalOpen(false)}
                            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b" }}
                        >
                            &times;
                        </button>
                        
                        <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", color: "#0f172a" }}>Phản hồi câu hỏi</h2>
                        
                        <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: "600", marginBottom: "5px" }}>{selectedQa.userFullName} hỏi:</div>
                            <div>{selectedQa.content}</div>
                        </div>

                        {selectedQa.answers && selectedQa.answers.length > 0 && (
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{ fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>Các câu trả lời trước:</div>
                                {selectedQa.answers.map(ans => (
                                    <div key={ans.id} style={{ background: "#eef2ff", padding: "12px", borderRadius: "8px", marginBottom: "8px" }}>
                                        <strong>{ans.userFullName}</strong> ({new Date(ans.createdAt).toLocaleDateString()}):<br />
                                        {ans.content}
                                    </div>
                                ))}
                            </div>
                        )}

                        <textarea 
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder="Nhập câu trả lời của bạn..."
                            rows="5"
                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", marginBottom: "15px" }}
                        />

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                            <button 
                                onClick={() => setReplyModalOpen(false)}
                                style={{ padding: "10px 20px", background: "#f1f5f9", border: "none", borderRadius: "8px", cursor: "pointer" }}
                            >
                                Hủy
                            </button>
                            <button 
                                onClick={handleSendReply}
                                style={{ padding: "10px 20px", background: "#2747d9", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" }}
                            >
                                Gửi trả lời
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}