import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/TeacherDashboard.css"; // 🔥 MỚI: CSS cao cấp dành riêng cho Giáo viên
import axiosClient from "../../api/axiosClient";

export default function TeacherDashboard() {
    const navigate = useNavigate();
    
    // State chính
    const [user, setUser] = useState(null);
    const [myCourses, setMyCourses] = useState([]);
    const [qaList, setQaList] = useState([]);
    const [subjects, setSubjects] = useState([]);
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

    // Modal Tạo khóa học (nếu dùng form đầy đủ)
    const [createCourseModalOpen, setCreateCourseModalOpen] = useState(false);
    const [newCourseData, setNewCourseData] = useState({
        title: "",
        subjectId: "1",
        categoryId: "1"
    });



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
            // Hiện tại hiển thị tất cả (sẽ filter theo teacher_id sau khi backend cập nhật)
            setMyCourses(response.data);
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
            const response = await axiosClient.post("/courses", {
                title: newCourseData.title,
                teacher_id: user?.id,
                categoryId: parseInt(newCourseData.categoryId) || 1,
                subjectId: parseInt(newCourseData.subjectId) || 1
            });
            alert("✅ Tạo khóa học thành công!");
            setCreateCourseModalOpen(false);
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
        const newTitle = window.prompt("Nhập tên mới cho khóa học:", oldTitle);
        if (!newTitle || newTitle === oldTitle) return;

        try {
            await axiosClient.put(`/courses/${courseId}`, { title: newTitle });
            setMyCourses(prev => prev.map(c => 
                c.id === courseId ? { ...c, title: newTitle } : c
            ));
            alert("✅ Đổi tên thành công!");
        } catch (error) {
            alert("❌ Lỗi khi đổi tên: " + (error.response?.data?.message || error.message));
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
                    <li onClick={() => navigate("/teacher/grading")}>
                        ✍️ Chấm điểm Tự luận
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
                                                            src={qa.userAvatarUrl || `https://ui-avatars.com/api/?name=${qa.userFullName}`} 
                                                            alt="" 
                                                            style={{ width: "32px", height: "32px", borderRadius: "50%" }} 
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
            </main>


            {/* MODAL KHỞI TẠO KHÓA HỌC (TÊN + DANH MỤC + MÔN HỌC) */}
            {createCourseModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100 }}>
                    <div style={{ background: "#fff", width: "500px", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                        <h3 style={{ margin: "0 0 20px 0", fontSize: "20px", fontWeight: "700", color: "#0f172a" }}>🚀 Khởi tạo khóa học mới</h3>
                        
                        <form onSubmit={handleCreateCourseSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Tên khóa học:</label>
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
                                <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>Môn học:</label>
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
                            </div>                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "15px" }}>
                                <button 
                                    type="button" 
                                    onClick={() => { setCreateCourseModalOpen(false); setNewCourseData({ title: "", subjectId: "", categoryId: "" }); }}
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