import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/TeacherDashboard.css"; // 🔥 MỚI: CSS cao cấp dành riêng cho Giáo viên
import axiosClient from "../../api/axiosClient";
import { logout } from "../../services/authService";

export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [myCourses, setMyCourses] = useState([]);
    const [user, setUser] = useState(null);
    
    // State cho việc hiển thị Modal báo cáo tiến độ học viên
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedCourseForReport, setSelectedCourseForReport] = useState(null);
    const [courseReports, setCourseReports] = useState([]);
    
    // Cấu hình State quản lý danh sách môn học, danh mục & đóng mở Modal tạo khóa học
    const [subjects, setSubjects] = useState([]); 
    const [categories, setCategories] = useState([]); // State lưu danh sách danh mục
    const [createCourseModalOpen, setCreateCourseModalOpen] = useState(false);
    const [newCourseData, setNewCourseData] = useState({
        title: "",
        subjectId: "",
        categoryId: "" // Trường categoryId trong Form dữ liệu
    });

    // State cho tab quản lý hỏi đáp
    const [activeTab, setActiveTab] = useState("COURSES"); 
    const [qaList, setQaList] = useState([]);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [selectedQa, setSelectedQa] = useState(null);
    const [replyContent, setReplyContent] = useState("");

    useEffect(() => {
        // Check bảo mật đăng nhập
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            alert("⚠️ Bạn chưa đăng nhập!");
            navigate("/");
            return;
        }

        const userObj = JSON.parse(storedUser);
        if (userObj.role !== "TEACHER" && userObj.roleId !== 2) {
            alert("❌ Bạn không có quyền truy cập!");
            navigate("/home");
            return;
        }

        setUser(userObj);

        // Tải danh sách môn học về hệ thống trước để phục vụ ô chọn Dropdown
        const fetchSubjects = async () => {
            try {
                const res = await axiosClient.get("/public/subjects");
                setSubjects(res.data);
            } catch (err) {
                console.error("Lỗi tải danh sách môn học:", err);
            }
        };

        // Hàm gọi API lấy danh sách danh mục hệ thống
        const fetchCategories = async () => {
            try {
                const res = await axiosClient.get("/public/categories");
                setCategories(res.data);
            } catch (err) {
                console.error("Lỗi tải danh sách danh mục:", err);
            }
        };

        const fetchCourses = async () => {
            try {
                const resCourses = await axiosClient.get("/courses");        
                setMyCourses(resCourses.data);
            } catch (error) {
                console.error("Lỗi tải khóa học:", error);
            }
        };

        fetchSubjects();
        fetchCategories(); // Thực thi tải danh mục
        fetchCourses();
    }, [navigate]);

    const handleLogout = async () => {
        if (!window.confirm("Bạn có chắc muốn đăng xuất khỏi PrepAce?")) return;
        try {
            await logout();
        } catch (err) {
            console.error(err);
        }
        navigate("/auth");
    };

    const handleOpenReport = async (course) => {
        setSelectedCourseForReport(course);
        setReportModalOpen(true);
        try {
            const response = await axiosClient.get(`/reports/courses/${course.id}`);
            setCourseReports(response.data);
        } catch (error) {
            console.error("Lỗi tải báo cáo:", error);
            alert("Lỗi tải báo cáo tiến độ");
        }
    };

    const handleExportExcel = async () => {
        if (!selectedCourseForReport) return;
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/reports/courses/${selectedCourseForReport.id}/export`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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
            alert("Không thể xuất file Excel");
        }
    };

    const fetchQaList = async () => {
        try {
            const response = await axiosClient.get("/questions/teacher/all");
            setQaList(response.data);
        } catch (error) {
            console.error("Lỗi tải danh sách Q&A:", error);
        }
    };

    useEffect(() => {
        if (activeTab === "QA") {
            fetchQaList();
        }
    }, [activeTab]);

    const handleOpenReplyModal = (qa) => {
        setSelectedQa(qa);
        setReplyContent("");
        setReplyModalOpen(true);
    };

    // Hàm xử lý gửi dữ liệu lên Backend tạo khóa học
    const handleCreateCourseSubmit = async (e) => {
        e.preventDefault();
        if (!newCourseData.title.trim()) return alert("Vui lòng nhập tên khóa học!");
        if (!newCourseData.categoryId) return alert("Vui lòng chọn danh mục khóa học!"); 
        if (!newCourseData.subjectId) return alert("Vui lòng chọn môn học chỉ định!");

        try {
            const response = await axiosClient.post("/courses", { 
                title: newCourseData.title,
                teacher_id: user?.id,
                subjectId: parseInt(newCourseData.subjectId), 
                categoryId: parseInt(newCourseData.categoryId) 
            });
            
            setCreateCourseModalOpen(false);
            setNewCourseData({ title: "", subjectId: "", categoryId: "" }); // Reset form
            
            // Điều hướng thẳng sang trang biên soạn đề cương
            navigate(`/teacher/course/${response.data.courseId || response.data.id}/edit`);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi tạo khóa học mới: " + (error.response?.data?.message || error.message));
        }
    };

    const handleSendReply = async () => {
        if (!replyContent.trim()) return alert("Vui lòng nhập nội dung trả lời");
        const questionIdToUse = selectedQa?.questionId || selectedQa?.id;
        
        if (!questionIdToUse || questionIdToUse === 'undefined') {
            return alert("❌ Lỗi: Không tìm thấy ID của câu hỏi để gửi câu trả lời!");
        }

        try {
            await axiosClient.post(`/questions/${questionIdToUse}/answers`, {
                content: replyContent
            });
            setReplyModalOpen(false);
            fetchQaList();
            alert("🎉 Đã gửi câu trả lời thành công!");
        } catch (error) {
            console.error("Lỗi chi tiết từ hệ thống:", error);
            const serverErrorMessage = error.response?.data?.message || error.message;
            alert("❌ Lỗi từ hệ thống: " + serverErrorMessage);
        }
    };
    
    return (
        <div className="home-layout">
            
            {/* 1. SIDEBAR CHUẨN CỦA NHÓM */}
            <aside className="sidebar">
                <div className="logo" onClick={() => navigate("/home")} style={{cursor: 'pointer'}}>PrepAce</div>

                <ul className="menu">
                    <li 
                        className={activeTab === "COURSES" ? "active" : ""} 
                        onClick={() => setActiveTab("COURSES")}
                        style={activeTab === "COURSES" ? { background: "#eef3ff", color: "#2747d9", fontWeight: "600", cursor: "pointer" } : { cursor: "pointer" }}
                    >
                        👨‍🏫 Quản lý khóa học
                    </li>
                    <li onClick={() => navigate("/teacher/grading")} style={{ cursor: "pointer", marginTop: "10px" }}>
                        📝 Chấm bài tự luận
                    </li>
                    <li 
                        className={activeTab === "QA" ? "active" : ""} 
                        onClick={() => setActiveTab("QA")}
                        style={activeTab === "QA" ? { background: "#eef3ff", color: "#2747d9", fontWeight: "600", cursor: "pointer" } : { cursor: "pointer" }}
                    >
                        💬 Hỏi đáp Học viên
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
                            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                                📚 Quản lý khóa học của tôi
                            </h2>
                            
                            <button 
                                className="register-btn" 
                                style={{ padding: "12px 20px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700", background: "#2747d9", color: "#fff" }}
                                onClick={() => setCreateCourseModalOpen(true)}
                            >
                                + Tạo khóa học mới
                            </button>
                        </div>

                        {/* DANH SÁCH KHÓA HỌC */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            {myCourses.map(course => (
                                <div key={course.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px", background: "#fff", borderRadius: "18px", boxShadow: "0 6px 20px rgba(20, 40, 120, 0.04)", border: "1px solid #f0f4ff" }}>
                                    <div>
                                        <h3 style={{ margin: "0 0 10px 0", fontSize: "17px", fontWeight: "700", color: "#0f172a" }}>
                                            {course.title}
                                        </h3>
                                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                            <span style={{ padding: "5px 10px", background: course.status === "PUBLISHED" ? "#e2fbe8" : "#fff3cd", color: course.status === "PUBLISHED" ? "#1e8a3b" : "#b45309", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}>
                                                {course.status === "PUBLISHED" ? "Đã xuất bản" : "Bản nháp"}
                                            </span>
                                            {/* Hiển thị tên Môn học của khóa học tại Dashboard nếu có */}
                                            {course.subject?.subjectName && (
                                                <span style={{ padding: "5px 10px", background: "#e0e7ff", color: "#4f46e5", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}>
                                                    📐 {course.subject.subjectName}
                                                </span>
                                            )}
                                            {/* Hiển thị tên Danh mục của khóa học cạnh tên môn học nếu tồn tại */}
                                            {course.category?.categoryName && (
                                                <span style={{ padding: "5px 10px", background: "#fef3c7", color: "#d97706", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}>
                                                    📁 {course.category.categoryName}
                                                </span>
                                            )}
                                            <span style={{ fontSize: "13.5px", color: "#64748b" }}>👥 {course.students || 0} học viên</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#334155" }}
                                            onClick={() => navigate(`/teacher/course/${course.id}/edit`)}
                                        >
                                            ✏️ Biên soạn
                                        </button>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#f0fdf4", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#166534" }}
                                            onClick={() => handleOpenReport(course)}
                                        >
                                            📊 Báo cáo
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* HỎI ĐÁP HỌC VIÊN TAB */}
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
                                                        <img src={qa.userAvatarUrl || "https://ui-avatars.com/api/?name=" + qa.userFullName} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%" }} />
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
                                                        style={{ padding: "6px 12px", background: isAnswered ? "#f1f5f9" : "#2747d9", color: isAnswered ? "#475569" : "#fff", border: "none", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: "600" }}
                                                    >
                                                        {isAnswered ? "Xem / Sửa" : "Trả lời"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }) : (
                                        <tr>
                                            <td colSpan="5" style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Chưa có câu hỏi nào từ học viên.</td>
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

                            {/* Ô chọn Danh mục tổng quan */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>📁 Lựa chọn danh mục hệ thống:</label>
                                <select
                                    required
                                    value={newCourseData.categoryId}
                                    onChange={(e) => setNewCourseData({ ...newCourseData, categoryId: e.target.value })}
                                    style={{ padding: "11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#fff" }}
                                >
                                    <option value="">-- Click chọn danh mục --</option>
                                    {categories.map(cat => (
                                        <option key={cat.id || cat.categoryId} value={cat.id || cat.categoryId}>{cat.categoryName}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", textAlign: "left" }}>
                                <label style={{ fontWeight: "600", fontSize: "14px", color: "#334155" }}>📐 Lựa chọn môn học chỉ định:</label>
                                <select
                                    required
                                    value={newCourseData.subjectId}
                                    onChange={(e) => setNewCourseData({ ...newCourseData, subjectId: e.target.value })}
                                    style={{ padding: "11px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#fff" }}
                                >
                                    <option value="">-- Click chọn môn học --</option>
                                    {subjects.map(sub => (
                                        <option key={sub.id} value={sub.id}>{sub.subjectName}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "15px" }}>
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
                                    Tiếp tục thiết lập
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL BÁO CÁO TIẾN ĐỘ */}
            {reportModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "800px", maxWidth: "90%", borderRadius: "16px", padding: "30px", position: "relative" }}>
                        <button onClick={() => setReportModalOpen(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>&times;</button>
                        <h2 style={{ margin: "0 0 20px 0", fontSize: "22px" }}>📊 Báo cáo tiến độ: {selectedCourseForReport?.title}</h2>
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                            <button onClick={handleExportExcel} style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer" }}>📥 Tải báo cáo Excel</button>
                        </div>
                        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                <thead style={{ background: "#f8fafc" }}>
                                    <tr>
                                        <th style={{ padding: "12px 16px" }}>Học sinh</th>
                                        <th style={{ padding: "12px 16px" }}>Đã học</th>
                                        <th style={{ padding: "12px 16px" }}>Tiến độ</th>
                                        <th style={{ padding: "12px 16px" }}>Điểm TB</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courseReports.map(report => (
                                        <tr key={report.userId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px 16px" }}>{report.userFullName}</td>
                                            <td style={{ padding: "12px 16px" }}>{report.completedLessons} / {report.totalLessons}</td>
                                            <td style={{ padding: "12px 16px" }}><div style={{ width: `${report.progressPercentage}%`, background: "#3b82f6", height: "8px" }}></div> {report.progressPercentage}%</td>
                                            <td style={{ padding: "12px 16px" }}>{report.averageScore || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL PHẢN HỒI HỎI ĐÁP */}
            {replyModalOpen && selectedQa && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "600px", borderRadius: "16px", padding: "30px", position: "relative" }}>
                        <button onClick={() => setReplyModalOpen(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer" }}>&times;</button>
                        <h2 style={{ margin: "0 0 20px 0", fontSize: "20px" }}>Phản hồi Câu hỏi</h2>
                        <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Nhập câu trả lời..." rows="4" style={{ width: "100%", padding: "12px", borderRadius: "8px" }} />
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                            <button onClick={() => setReplyModalOpen(false)} style={{ padding: "10px 16px", background: "#f1f5f9", border: "none", borderRadius: "6px" }}>Hủy</button>
                            <button onClick={handleSendReply} style={{ padding: "10px 20px", background: "#2747d9", color: "#fff", border: "none", borderRadius: "6px" }}>Gửi câu trả lời</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}