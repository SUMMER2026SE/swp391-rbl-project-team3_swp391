import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/HomePage.css'; // Dùng chung file css layout sidebar 

const TeacherGrading = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [pendingSessions, setPendingSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [essayAnswers, setEssayAnswers] = useState([]);
    const [gradingData, setGradingData] = useState({}); 
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Bảo mật phân quyền tương tự Dashboard
        const token = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (!token || !storedUser) {
            navigate("/");
            return;
        }

        const userObj = JSON.parse(storedUser);
        if (userObj.role !== "TEACHER") {
            navigate("/home");
            return;
        }
        setUser(userObj);

        fetchPendingSessions();
    }, [navigate]);

    const fetchPendingSessions = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/teacher/grading/pending-sessions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setPendingSessions(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Không tải được danh sách chờ chấm", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectSession = async (session) => {
        setSelectedSession(session);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/teacher/grading/session/${session.sessionsId}/essay-answers`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            setEssayAnswers(data);
        } catch (err) {
            alert("Lỗi khi tải chi tiết bài làm");
        }
    };

    const handleSaveGrade = async (answerId, questionId) => {
        const score = gradingData[questionId]?.score;
        const comment = gradingData[questionId]?.comment || "";

        if (score === undefined || score === "") {
            alert("Vui lòng nhập điểm trước khi lưu!");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/teacher/grading/answer/${answerId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ score, teacher_comment: comment })
            });

            if (res.ok) {
                alert("Lưu điểm câu hỏi thành công!");
                fetchPendingSessions();
            }
        } catch (err) {
            alert("Lỗi khi lưu điểm");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    if (loading) return <div className="loading">Đang tải dữ liệu chấm bài...</div>;

    return (
        <div className="home-layout">
            
            {/* SIDEBAR CHUẨN - TRANG CHẤM BÀI ACTIVE */}
            <aside className="sidebar">
                <div className="logo" onClick={() => navigate("/home")} style={{cursor: 'pointer'}}>PrepAce</div>

                <ul className="menu">
                    <li onClick={() => navigate("/teacher/dashboard")} style={{ cursor: "pointer" }}>
                        👨‍🏫 Quản lý khóa học
                    </li>
                    <li className="active" style={{ background: "#eef3ff", color: "#2747d9", fontWeight: "600", cursor: "pointer", marginTop: "10px" }}>
                        📝 Chấm bài tự luận
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

            {/* PHẦN NỘI DUNG CHÍNH ĐƯỢC CHÈN VÀO KHUNG CHUẨN */}
            <main className="content" style={{ maxWidth: "100%", margin: "0", display: "flex", gap: "24px" }}>
                
                {/* BÊN TRÁI: DANH SÁCH BÀI CHỜ CHẤM */}
                <div style={{ flex: 1, background: "#fff", padding: "24px", borderRadius: "18px", boxShadow: "0 6px 20px rgba(20, 40, 120, 0.04)", border: "1px solid #f0f4ff", height: "fit-content" }}>
                    <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>📝 Danh sách bài chờ chấm</h3>
                    {pendingSessions.length === 0 ? <p style={{ color: "#64748b" }}>Hiện tại không có bài thi nào cần chấm.</p> : (
                        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                            {pendingSessions.map(session => (
                                <li 
                                    key={session.sessionsId} 
                                    onClick={() => handleSelectSession(session)}
                                    style={{ 
                                        padding: "14px", 
                                        borderRadius: "10px",
                                        border: "1px solid #f0f4ff", 
                                        cursor: "pointer", 
                                        transition: "0.2s",
                                        background: selectedSession?.sessionsId === session.sessionsId ? "#eef3ff" : "#f8fafc",
                                        color: selectedSession?.sessionsId === session.sessionsId ? "#2747d9" : "#334155",
                                        fontWeight: selectedSession?.sessionsId === session.sessionsId ? "600" : "500"
                                    }}
                                >
                                    Mã lượt thi: #{session.sessionsId} <br/>
                                    <span style={{ fontSize: "13px", color: "#64748b", fontWeight: "400" }}>Đề: {session.quizTitle}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* BÊN PHẢI: KHU VỰC CHẤM ĐIỂM CHI TIẾT */}
                <div style={{ flex: 2, background: "#fff", padding: "24px", borderRadius: "18px", boxShadow: "0 6px 20px rgba(20, 40, 120, 0.04)", border: "1px solid #f0f4ff" }}>
                    {selectedSession ? (
                        <div>
                            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
                                Chấm bài cho lượt thi #{selectedSession.sessionsId}
                            </h3>
                            {essayAnswers.map((q, idx) => (
                                <div key={q.questionId} style={{ border: "1px solid #cbd5e1", padding: "20px", borderRadius: "12px", marginBottom: "20px" }}>
                                    <h4 style={{ margin: "0 0 15px 0", color: "#0f172a" }}>Câu {idx + 1}: {q.content}</h4>
                                    
                                    <div style={{ background: "#f8fafc", padding: "15px", borderRadius: "8px", marginBottom: "12px", border: "1px solid #f1f5f9" }}>
                                        <strong style={{ color: "#475569", fontSize: "14px" }}>Bài làm của học sinh:</strong>
                                        <p style={{ margin: "8px 0 0 0", color: "#0f172a", whiteSpace: "pre-line" }}>
                                            {q.selectedAnswer || <i style={{color:"#ef4444"}}>Học sinh bỏ trống câu này</i>}
                                        </p>
                                    </div>
                                    
                                    <div style={{ background: "#f0fdf4", padding: "15px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #dcfce7" }}>
                                        <strong style={{ color: "#166534", fontSize: "14px" }}>Đáp án mẫu / Hướng dẫn chấm:</strong>
                                        <p style={{ margin: "8px 0 0 0", color: "#14532d", whiteSpace: "pre-line" }}>{q.correctedAnswer}</p>
                                    </div>

                                    {/* Ô CHỌN TRẠNG THÁI CHẤM & LỜI PHÊ MỚI */}
<div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
    
    {/* 2 Nút chọn Được / Không được thay cho ô nhập số */}
    <div style={{ display: "flex", gap: "6px" }}>
        <button
            type="button"
            onClick={() => setGradingData({
                ...gradingData,
                [q.questionId]: { ...gradingData[q.questionId], score: 1 } // Được thì tính 1 điểm
            })}
            style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                cursor: "pointer",
                fontWeight: "600",
                transition: "0.2s",
                background: gradingData[q.questionId]?.score === 1 ? "#22c55e" : "#f8fafc",
                color: gradingData[q.questionId]?.score === 1 ? "#fff" : "#334155",
                borderColor: gradingData[q.questionId]?.score === 1 ? "#22c55e" : "#cbd5e1"
            }}
        >
            ✓ Được
        </button>
        <button
            type="button"
            onClick={() => setGradingData({
                ...gradingData,
                [q.questionId]: { ...gradingData[q.questionId], score: 0 } // Không được tính 0 điểm
            })}
            style={{
                padding: "10px 16px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                cursor: "pointer",
                fontWeight: "600",
                transition: "0.2s",
                background: gradingData[q.questionId]?.score === 0 ? "#ef4444" : "#f8fafc",
                color: gradingData[q.questionId]?.score === 0 ? "#fff" : "#334155",
                borderColor: gradingData[q.questionId]?.score === 0 ? "#ef4444" : "#cbd5e1"
            }}
        >
            ✗ Không được
        </button>
    </div>

    {/* Ô viết lời phê giữ nguyên */}
    <input 
        type="text" 
        placeholder="Nhập nhận xét, lời phê của thầy cô..." 
        value={gradingData[q.questionId]?.comment || ""}
        onChange={(e) => setGradingData({
            ...gradingData,
            [q.questionId]: { ...gradingData[q.questionId], comment: e.target.value }
        })}
        style={{ flex: 1, padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", minWidth: "200px" }}
    />
    
    {/* Nút lưu kết quả câu này */}
    <button 
        onClick={() => handleSaveGrade(q.answerId, q.questionId)}
        className="register-btn"
        style={{ border: "none", padding: "11px 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}
    >
        Xác nhận câu này
    </button>
</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: "center", color: "#64748b", marginTop: "150px", fontSize: "15px" }}>
                            ← Chọn một bài thi bên danh sách để tiến hành chấm điểm
                        </p>
                    )}
                </div>
            </main>

        </div>
    );
};

export default TeacherGrading;