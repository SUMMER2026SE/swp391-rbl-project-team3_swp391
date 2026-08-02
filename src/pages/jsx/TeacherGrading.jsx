import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from "../../api/axiosClient";
import "../css/TeacherGrading.css"


const TeacherGrading = () => {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [pendingSessions, setPendingSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState(null);
    const [essayAnswers, setEssayAnswers] = useState([]);
    const [gradingData, setGradingData] = useState({});
    const [loading, setLoading] = useState(true);



    // ============================
    // CHECK ROLE
    // ============================
    useEffect(() => {

        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            navigate("/auth");
            return;
        }


        const userObj = JSON.parse(storedUser);

        console.log("Current user:", userObj);


        const isTeacher =
            userObj.role === "TEACHER" ||
            userObj.roleName === "TEACHER" ||
            userObj.roleId === 2;


        if (!isTeacher) {
            navigate("/home");
            return;
        }


        setUser(userObj);

        fetchPendingSessions();


    }, [navigate]);





    // ============================
    // GET BÀI CHỜ CHẤM
    // ============================
    const fetchPendingSessions = async () => {

        try {

            const res = await axiosClient.get(
                "/teacher/grading/pending-sessions"
            );


            setPendingSessions(
                Array.isArray(res.data)
                    ? res.data
                    : []
            );


        } catch(error){

            console.error(
                "Không tải được danh sách chờ chấm:",
                error
            );


        } finally {

            setLoading(false);
        }
    };
    // ============================
    // CHỌN BÀI THI
    // ============================
    const handleSelectSession = async(session)=>{
        setSelectedSession(session);
        try {
            const res = await axiosClient.get(
                `/teacher/grading/session/${session.sessionsId}/essay-answers`
            );
            setEssayAnswers(
                Array.isArray(res.data)
                ? res.data
                : []
            );
        }catch(error){
            console.error(error);
            alert(
                "Lỗi khi tải chi tiết bài làm"
            );
        }
    };
    // ============================
    // LƯU ĐIỂM
    // ============================
    const handleSaveGrade = async(
        answerId,
        questionId
    )=>{
        const current = gradingData[questionId];
        const score = current?.score;
        const comment = current?.comment || "";
        if(score === undefined){
            alert(
                "Vui lòng chọn Được hoặc Không được"
            );
            return;
        }
        try{
            await axiosClient.put(
                `/teacher/grading/answer/${answerId}`,
                {
                    score,
                    teacher_comment: comment
                }
            );



            alert(
                "Lưu điểm thành công!"
            );


            fetchPendingSessions();



        }catch(error){

            console.error(
                "Save grade error:",
                error
            );


            alert(
                "Lỗi khi lưu điểm"
            );

        }
    };
    const handleLogout = ()=>{
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/auth");
    };

    if(loading)
        return (
            <div className="loading">
                Đang tải dữ liệu chấm bài...
            </div>
        );
    return (
        <div className="home-layout">
            <aside className="sidebar">

                <div 
                    className="logo"
                    onClick={()=>navigate("/home")}
                >
                    PrepAce
                </div>
                <ul className="menu">
                    <li
                        onClick={()=>navigate("/teacher/dashboard")}
                    >
                        👨‍🏫 Quản lý khóa học
                    </li>
                    <li className="active">
                        📝 Chấm bài tự luận
                    </li>
                </ul>
                <div className="sidebar-actions">
                    <button
                        className="profile-btn"
                        onClick={()=>navigate("/profile")}
                    >
                        👤 {user?.fullName || "Giáo viên"}
                    </button>
                    <button
                        className="logout-btn"
                        onClick={handleLogout}
                    >
                        Đăng xuất
                    </button>
                </div>
            </aside>

            <main 
                className="content"
                style={{
                    maxWidth:"100%",
                    margin:0,
                    display:"flex",
                    gap:"24px"
                }}
            >
            {/* LEFT */}
            <div
                style={{
                    flex:1,
                    background:"#fff",
                    padding:"24px",
                    borderRadius:"18px"
                }}
            >
                <h3>
                    📝 Danh sách bài chờ chấm
                </h3>
                {
                pendingSessions.length===0

                ?

                <p>
                    Hiện tại không có bài thi nào cần chấm.
                </p>


                :

                pendingSessions.map(session=>(

                    <div

                    key={session.sessionsId}

                    onClick={()=>handleSelectSession(session)}

                    style={{
                        padding:"14px",
                        marginBottom:"10px",
                        cursor:"pointer",
                        borderRadius:"10px",
                        background:
                        selectedSession?.sessionsId===session.sessionsId
                        ?
                        "#eef3ff"
                        :
                        "#f8fafc"
                    }}

                    >


                        Mã lượt thi:
                        #{session.sessionsId}

                        <br/>

                        <small>
                            Đề:
                            {session.quizTitle}
                        </small>


                    </div>


                ))

                }

            </div>
            {/* RIGHT */}

            <div
            style={{
                flex:2,
                background:"#fff",
                padding:"24px",
                borderRadius:"18px"
            }}
            >



            {
            selectedSession ?

            essayAnswers.map((q,index)=>(


            <div className="grading-card" key={q.questionId}>
                <h4 className="grading-title">
                    Câu {index + 1}: {q.content}
                </h4>

                <div className="grading-section">
                    <b>Bài làm:</b>
                    <p>{q.selectedAnswer || "Bỏ trống"}</p>
                </div>

                <div className="grading-section">
                    <b>Đáp án:</b>
                    <p>{q.correctedAnswer}</p>
                </div>

                <div className="grading-actions">
                    <button
                        className={`pass-btn ${
                            gradingData[q.questionId]?.score === 1
                                ? "selected"
                                : ""
                        }`}
                        onClick={() =>
                            setGradingData({
                                ...gradingData,
                                [q.questionId]: {
                                    ...gradingData[q.questionId],
                                    score: 1,
                                },
                            })
                        }
                    >
                        ✓ Được
                    </button>

                    <button
                        className={`fail-btn ${
                            gradingData[q.questionId]?.score === 0
                                ? "selected"
                                : ""
                        }`}
                        onClick={() =>
                            setGradingData({
                                ...gradingData,
                                [q.questionId]: {
                                    ...gradingData[q.questionId],
                                    score: 0,
                                },
                            })
                        }
                    >
                        ✗ Không được
                    </button>

                    <input
                        className="grading-input"
                        placeholder="Nhập nhận xét..."
                        value={gradingData[q.questionId]?.comment || ""}
                        onChange={(e) =>
                            setGradingData({
                                ...gradingData,
                                [q.questionId]: {
                                    ...gradingData[q.questionId],
                                    comment: e.target.value,
                                },
                            })
                        }
                    />

                    <button
                        className="save-btn"
                        onClick={() =>
                            handleSaveGrade(q.answerId, q.questionId)
                        }
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
            ))
            :
            <p>
                ← Chọn bài thi để chấm
            </p>
            }
            </div>
            </main>
        </div>
    );
};
export default TeacherGrading;