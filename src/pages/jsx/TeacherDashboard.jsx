import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../css/HomePage.css"; // Dùng chung file CSS layout/sidebar của nhóm cho đồng bộ
import axiosClient from "../../api/axiosClient"; // <--- BẠN ĐANG THIẾU DÒNG NÀY
export default function TeacherDashboard() {
    const navigate = useNavigate();
    const [myCourses, setMyCourses] = useState([]);
    const [user, setUser] = useState(null);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [selectedCourseForReport, setSelectedCourseForReport] = useState(null);
    const [courseReports, setCourseReports] = useState([]);
    
    // State cho tab
    const [activeTab, setActiveTab] = useState("COURSES"); // COURSES hoặc QA
    const [qaList, setQaList] = useState([]);
    const [replyModalOpen, setReplyModalOpen] = useState(false);
    const [selectedQa, setSelectedQa] = useState(null);
    const [replyContent, setReplyContent] = useState("");

    useEffect(() => {
    // 1. Check bảo mật (giữ nguyên logic cũ của bạn)
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

    const fetchCourses = async () => {
    try {
        // Gọi link có chữ teacher như bạn muốn
        const response = await axiosClient.get("/teacher/dashboard", {
            headers: {
                "X-Teacher-Id": userObj.id
            }
        });

        setMyCourses(response.data.courses);
        
        // // Dữ liệu vẫn lọc theo ID như cũ
        // const filtered = response.data.filter(c => String(c.teacher_id) === String(userObj.id)); 
        // setMyCourses(filtered);
        const response = await axiosClient.get("/courses"); 
        
        // Vì Model Course hiện tại không lưu teacher_id, tạm thời hiển thị tất cả các khóa học
        // Trong tương lai nếu có teacher_id, mở lại filter này
        // const filtered = response.data.filter(c => String(c.teacher_id) === String(userObj.id)); 
        setMyCourses(response.data);
    } catch (error) {
        console.error("Lỗi tải khóa học:", error);
    }
};

    fetchCourses();
}, [navigate]);

    const handleDelete = async (courseId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa khóa học này không? Hành động này không thể hoàn tác!")) return;
        try {
            await axiosClient.delete(`/courses/${courseId}`);
            setMyCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (error) {
            alert("Lỗi khi xóa khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    const handleRename = async (courseId, oldTitle) => {
        const newTitle = window.prompt("Nhập tên mới cho khóa học:", oldTitle);
        if (!newTitle || newTitle === oldTitle) return;
        try {
            await axiosClient.put(`/courses/${courseId}`, { title: newTitle });
            setMyCourses(prev => prev.map(c => c.id === courseId ? { ...c, title: newTitle } : c));
        } catch (error) {
            alert("Lỗi khi đổi tên khóa học: " + (error.response?.data?.message || error.message));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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

    const handleSendReply = async () => {
    if (!replyContent.trim()) return alert("Vui lòng nhập nội dung trả lời");
    
    // Tự động lấy Id đúng (thử questionId trước, nếu không có thì lấy id)
    const questionIdToUse = selectedQa?.questionId || selectedQa?.id;
    
    // Khóa chốt an toàn tại Frontend
    if (!questionIdToUse || questionIdToUse === 'undefined') {
        return alert("❌ Lỗi: Không tìm thấy ID của câu hỏi để gửi câu trả lời!");
    }

    try {
        await axiosClient.post(`/questions/${questionIdToUse}/answers`, {
            content: replyContent
        });
        setReplyModalOpen(false);
        fetchQaList(); // Tải lại danh sách để cập nhật trạng thái
        alert("🎉 Đã gửi câu trả lời thành công!");
    } catch (error) {
        console.error("Lỗi chi tiết từ hệ thống:", error);
        const serverErrorMessage = error.response?.data?.message || error.message;
        alert("❌ Lỗi từ hệ thống: " + serverErrorMessage);
    }
};

    return (
        <div className="home-layout">
            
            {/* 1. SIDEBAR CHUẨN CỦA NHÓM (BÊ TỪ MAIN SANG) */}
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
                    </li>
                </ul>

                <div className="sidebar-actions">
                    <button className="profile-btn" onClick={() => navigate("/profile")}>
                        👤 {user?.fullName || "Giáo viên"}
                    </button>
                    <button className="logout-btn" onClick={handleLogout}>
                        Đăng xuất
                    </button>
                </div>
            </aside>

            {/* 2. PHẦN NỘI DUNG CHÍNH (GIỮ NGUYÊN GIAO DIỆN CŨ CỦA BẠN NHƯNG CHO VÀO KHUNG CÓ SẴN) */}
            <main className="content" style={{ maxWidth: "100%", margin: "0" }}>
                {activeTab === "COURSES" && (
                    <>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
                            <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", margin: 0 }}>
                                📚 Quản lý khóa học của tôi
                            </h2>
                            
                            <button 
                                className="register-btn" 
                                style={{ padding: "12px 20px", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "700" }}
                                onClick={async () => {
                                    const customTitle = window.prompt("Nhập tên khóa học mới:", "Khóa học mới");
                                    if (!customTitle) return; // Nếu người dùng bấm Hủy (Cancel) thì không làm gì cả
                                    
                                    try {
                                        const response = await axiosClient.post("/courses", { 
                                            title: customTitle,
                                            teacher_id: user?.id 
                                        });
                                        navigate(`/teacher/course/${response.data.id}/edit`);
                                    } catch (error) {
                                        alert("Lỗi khi tạo khóa học mới: " + (error.response?.data?.message || error.message));
                                    }
                                }}
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
                                            <span style={{ fontSize: "13.5px", color: "#64748b" }}>👥 {course.students} học viên</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ display: "flex", gap: "10px" }}>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#334155", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s" }}
                                            onClick={() => handleRename(course.id, course.title)}
                                            onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                                            onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
                                        >
                                            📝 Đổi tên
                                        </button>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#f0fdf4", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#166534", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s" }}
                                            onClick={() => handleOpenReport(course)}
                                            onMouseOver={(e) => e.currentTarget.style.background = "#dcfce7"}
                                            onMouseOut={(e) => e.currentTarget.style.background = "#f0fdf4"}
                                        >
                                            📊 Báo cáo
                                        </button>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#f1f5f9", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#334155", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s" }}
                                            onClick={() => navigate(`/teacher/course/${course.id}/edit`)}
                                            onMouseOver={(e) => e.currentTarget.style.background = "#e2e8f0"}
                                            onMouseOut={(e) => e.currentTarget.style.background = "#f1f5f9"}
                                        >
                                            ✏️ Biên soạn
                                        </button>
                                        <button 
                                            style={{ padding: "10px 18px", background: "#fee2e2", border: "none", borderRadius: "10px", cursor: "pointer", fontWeight: "600", color: "#b91c1c", display: "flex", alignItems: "center", gap: "6px", transition: "0.2s" }}
                                            onClick={() => handleDelete(course.id)}
                                            onMouseOver={(e) => e.currentTarget.style.background = "#fecaca"}
                                            onMouseOut={(e) => e.currentTarget.style.background = "#fee2e2"}
                                        >
                                            🗑️ Xóa
                                        </button>
                                    </div>
                                </div>
                            ))}
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

            {reportModalOpen && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "800px", maxWidth: "90%", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", position: "relative" }}>
                        <button 
                            onClick={() => setReportModalOpen(false)}
                            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b" }}
                        >
                            &times;
                        </button>
                        <h2 style={{ margin: "0 0 20px 0", fontSize: "22px", color: "#0f172a" }}>
                            📊 Báo cáo tiến độ: {selectedCourseForReport?.title}
                        </h2>
                        
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                            <button 
                                onClick={handleExportExcel}
                                style={{ padding: "10px 20px", background: "#16a34a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "bold", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                            >
                                📥 Tải báo cáo Excel
                            </button>
                        </div>

                        <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                                <thead style={{ background: "#f8fafc", position: "sticky", top: 0 }}>
                                    <tr>
                                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontWeight: "600" }}>Học sinh</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontWeight: "600" }}>Đã học</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontWeight: "600" }}>Tiến độ</th>
                                        <th style={{ padding: "12px 16px", borderBottom: "1px solid #e2e8f0", color: "#334155", fontWeight: "600" }}>Điểm TB</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courseReports.length > 0 ? courseReports.map(report => (
                                        <tr key={report.userId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                            <td style={{ padding: "12px 16px", color: "#0f172a", fontWeight: "500" }}>{report.userFullName}</td>
                                            <td style={{ padding: "12px 16px", color: "#64748b" }}>{report.completedLessons} / {report.totalLessons}</td>
                                            <td style={{ padding: "12px 16px" }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                                    <div style={{ flex: 1, background: "#e2e8f0", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                                                        <div style={{ width: `${report.progressPercentage}%`, background: report.progressPercentage === 100 ? "#16a34a" : "#3b82f6", height: "100%" }}></div>
                                                    </div>
                                                    <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155", width: "40px" }}>{report.progressPercentage}%</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: "12px 16px", color: "#0f172a", fontWeight: "600" }}>
                                                {report.averageScore != null ? report.averageScore : "-"}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>Chưa có dữ liệu học viên cho khóa học này.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            {replyModalOpen && selectedQa && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
                    <div style={{ background: "#fff", width: "600px", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", position: "relative" }}>
                        <button 
                            onClick={() => setReplyModalOpen(false)}
                            style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#64748b" }}
                        >
                            &times;
                        </button>
                        <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", color: "#0f172a" }}>Phản hồi Câu hỏi</h2>
                        
                        <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #e2e8f0" }}>
                            <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b", marginBottom: "5px" }}>{selectedQa.userFullName} hỏi:</div>
                            <div style={{ color: "#334155", fontSize: "14px" }}>{selectedQa.content}</div>
                        </div>

                        {selectedQa.answers && selectedQa.answers.length > 0 && (
                            <div style={{ marginBottom: "20px" }}>
                                <div style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", marginBottom: "10px" }}>Các câu trả lời trước đó:</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "150px", overflowY: "auto" }}>
                                    {selectedQa.answers.map(ans => (
                                        <div key={ans.id} style={{ background: "#eef2ff", padding: "12px", borderRadius: "8px", border: "1px solid #c7d2fe" }}>
                                            <div style={{ fontWeight: "600", fontSize: "13px", color: "#3730a3", marginBottom: "4px" }}>{ans.userFullName} <span style={{color:"#818cf8", fontWeight:"normal", fontSize:"12px"}}>({new Date(ans.createdAt).toLocaleDateString()})</span></div>
                                            <div style={{ fontSize: "13.5px", color: "#312e81" }}>{ans.content}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <textarea 
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Nhập câu trả lời của bạn..."
                                rows="4"
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", resize: "none", fontSize: "14px", fontFamily: "'Segoe UI', sans-serif" }}
                            />
                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                                <button 
                                    onClick={() => setReplyModalOpen(false)}
                                    style={{ padding: "10px 16px", background: "#f1f5f9", color: "#475569", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    ✏️ Biên soạn
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleSendReply}
                                    style={{ padding: "10px 20px", background: "#2747d9", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                                >
                                    Gửi câu trả lời
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}