import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import '../css/AdminDashboardPage.css';

const AdminQuestionBankPage = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state for quiz
    const [showQuizModal, setShowQuizModal] = useState(false);
    const [editQuiz, setEditQuiz] = useState(null);
    const [quizForm, setQuizForm] = useState({ quizTitle: '', durationMinutes: 60, courseId: '' });

    // State for viewing questions of a quiz
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);

    // Modal state for question
    const [showQuestionModal, setShowQuestionModal] = useState(false);
    const [editQuestion, setEditQuestion] = useState(null);
    const [questionForm, setQuestionForm] = useState({
        questionContent: '',
        correctAnswer: '',
        explanation: '',
        options: ['', '', '', '']
    });

    useEffect(() => {
        const initData = async () => {
            try {
                setLoading(true);
                await fetchCourses();
                await fetchQuizzes();
            } catch (err) {
                console.error("Lỗi khởi tạo trang:", err);
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const res = await axiosClient.get('/quizzes');
            if (res.data) {
                if (Array.isArray(res.data)) {
                    setQuizzes(res.data);
                } else if (res.data.content && Array.isArray(res.data.content)) {
                    setQuizzes(res.data.content);
                } else {
                    setQuizzes([]);
                }
            }
        } catch (err) {
            setError('Không tải được danh sách đề thi');
            setQuizzes([]);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await axiosClient.get('/admin/courses');
            if (res.data && Array.isArray(res.data)) {
                setCourses(res.data);
            } else if (res.data && Array.isArray(res.data.content)) {
                setCourses(res.data.content);
            } else {
                setFallbackCourses();
            }
        } catch (err) {
            setFallbackCourses();
        }
    };

    const setFallbackCourses = () => {
        setCourses([
            { courseId: 1, courseTitle: "Mastering Mathematics 12" },
            { courseId: 2, courseTitle: "Phương pháp giải nhanh bài tập Vật Lý" },
            { courseId: 3, courseTitle: "Ngữ pháp & Từ vựng Tiếng Anh chuyên sâu" }
        ]);
    };

    const handleOpenEditModal = (q) => {
        if (!q) return;
        let targetCourseId = '';
        if (q.course && q.course.courseId) {
            targetCourseId = q.course.courseId;
        } else if (q.courseId) {
            targetCourseId = q.courseId;
        } else if (courses && courses.length > 0) {
            targetCourseId = courses[0].courseId;
        }

        setEditQuiz(q);
        setQuizForm({
            quizTitle: q.quizTitle || '',
            durationMinutes: q.durationMinutes || 60,
            courseId: targetCourseId
        });
        setShowQuizModal(true);
    };

    const handleSaveQuiz = async () => {
        try {
            if (!quizForm.quizTitle.trim()) {
                alert("⚠️ Vui lòng nhập Tên đề thi!");
                return;
            }
            if (!quizForm.courseId) {
                alert("⚠️ Vui lòng chọn Khóa học!");
                return;
            }

            const payload = {
                quizTitle: quizForm.quizTitle.trim(),
                durationMinutes: Number(quizForm.durationMinutes),
                course: {
                    courseId: Number(quizForm.courseId)
                }
            };

            if (editQuiz) {
                await axiosClient.put(`/quizzes/${editQuiz.quizId}`, payload);
                alert("✅ Cập nhật thông tin đề thi thành công!");
            } else {
                await axiosClient.post('/quizzes', payload);
                alert("🎉 Tạo đề thi mới thành công!");
            }
            setShowQuizModal(false);
            fetchQuizzes();
        } catch (err) {
            alert('Lỗi khi lưu đề thi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteQuiz = async (id) => {
        if (!window.confirm("❗ Xóa đề thi sẽ gỡ bỏ toàn bộ câu hỏi liên quan. Tiếp tục?")) return;
        try {
            await axiosClient.delete(`/quizzes/${id}`);
            alert("✅ Đã xóa đề thi thành công!");
            fetchQuizzes();
            if (selectedQuiz?.quizId === id) setSelectedQuiz(null);
        } catch (err) {
            alert("❌ Lỗi khi thực hiện xóa đề thi khỏi hệ thống");
        }
    };

    const handleViewQuestions = async (quiz) => {
        setSelectedQuiz(quiz);
        try {
            const res = await axiosClient.get(`/quizzes/${quiz.quizId}`);
            setQuestions(res.data.questions || []);
        } catch (err) {
            alert("Không tải được danh sách câu hỏi");
        }
    };

    const handleOptionChange = (index, value) => {
        const newOpts = [...questionForm.options];
        newOpts[index] = value;
        setQuestionForm({ ...questionForm, options: newOpts });
    };

    const handleSaveQuestion = async () => {
        try {
            if (!questionForm.questionContent.trim()) {
                alert("⚠️ Vui lòng nhập nội dung câu hỏi!");
                return;
            }
            if (!questionForm.correctAnswer) {
                alert("⚠️ Vui lòng chọn một đáp án đúng!");
                return;
            }

            // 🔥 ĐÃ SỬA: Biến đổi mảng chuỗi phẳng thành danh sách Object cấu trúc QuestionOption tương thích JPA
            const formattedOptions = questionForm.options
                .filter(opt => opt.trim() !== '') // Loại bỏ ô trống
                .map(opt => ({
                    optionContent: opt.trim(),
                    isCorrect: opt.trim() === questionForm.correctAnswer.trim()
                }));

            const payload = {
                questionContent: questionForm.questionContent.trim(),
                correctAnswer: questionForm.correctAnswer.trim(),
                explanation: questionForm.explanation ? questionForm.explanation.trim() : '',
                questionType: "MULTIPLE_CHOICE", // Hoặc loại phù hợp hệ thống của bạn
                options: formattedOptions
            };

            if (editQuestion) {
                await axiosClient.put(`/questions/${editQuestion.questionId}`, payload);
                alert("✅ Cập nhật câu hỏi thành công!");
            } else {
                await axiosClient.post(`/questions/quiz/${selectedQuiz.quizId}`, payload);
                alert("🎉 Thêm câu hỏi vào đề thành công!");
            }
            setShowQuestionModal(false);
            handleViewQuestions(selectedQuiz); // Tải lại danh sách câu hỏi bên cột phải
        } catch (err) {
            alert("❌ Lỗi khi lưu câu hỏi: " + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteQuestion = async (qId) => {
        if (!window.confirm("Xóa câu hỏi này?")) return;
        try {
            await axiosClient.delete(`/questions/${qId}`);
            handleViewQuestions(selectedQuiz);
        } catch (err) {
            alert("Lỗi xóa câu hỏi");
        }
    };

    return (
        <div className="admin-page" style={{ fontFamily: "'Inter', 'Segoe UI', Tahoma, sans-serif" }}>
            <header className="admin-header">
                <h2>Quản lý Thư viện đề (Question Bank)</h2>
                <button onClick={() => navigate('/admin')} className="btn-back">Quay lại Dashboard</button>
            </header>

            <div className="admin-content" style={{ padding: '20px', display: 'flex', gap: '20px' }}>
                {/* Cột trái: Quản lý Quizzes */}
                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Danh sách Đề thi (Quizzes)</h3>
                        <button onClick={() => { setEditQuiz(null); setQuizForm({ quizTitle: '', durationMinutes: 60, courseId: courses[0]?.courseId || '' }); setShowQuizModal(true); }} style={st.btnPrimary}>+ Tạo Đề thi</button>
                    </div>

                    {loading ? <p>Đang tải...</p> : error ? <p style={{ color: 'red' }}>{error}</p> : (
                        <table style={st.table}>
                            <thead>
                                <tr>
                                    <th style={st.th}>ID</th>
                                    <th style={st.th}>Tên đề thi</th>
                                    <th style={st.th}>Thời gian</th>
                                    <th style={st.th}>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Array.isArray(quizzes) && quizzes.map(q => (
                                    <tr key={q?.quizId || Math.random()} style={selectedQuiz?.quizId === q?.quizId ? { background: '#f0f9ff' } : {}}>
                                        <td style={st.td}>#{q?.quizId}</td>
                                        <td style={st.td}>
                                            {/* 🔥 ĐƯỜNG DẪN FIXED CHUẨN XÁC THEO MONG MUỐN */}
                                            <span
                                                onClick={() => navigate(`/tests/${q?.quizId}`)}
                                                style={{ color: '#0284c7', cursor: 'pointer', textDecoration: 'underline', fontWeight: '600' }}
                                                title="Bấm để nhảy tới link đề thi"
                                            >
                                                {q?.quizTitle || 'Chưa có tiêu đề'}
                                            </span>
                                        </td>
                                        <td style={st.td}>{q?.durationMinutes || 0} phút</td>
                                        <td style={st.td}>
                                            <button onClick={() => handleViewQuestions(q)} style={st.btnSmallAction}>Chi tiết</button>
                                            <button onClick={() => handleOpenEditModal(q)} style={{ ...st.btnSmallAction, background: '#f59e0b' }}>Sửa</button>
                                            <button onClick={() => handleDeleteQuiz(q?.quizId)} style={{ ...st.btnSmallAction, background: '#ef4444' }}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Cột phải: Quản lý Questions */}
                {selectedQuiz && (
                    <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ maxWidth: '70%', wordBreak: 'break-word' }}>Câu hỏi: {selectedQuiz.quizTitle}</h3>
                            <button onClick={() => { setEditQuestion(null); setQuestionForm({ questionContent: '', correctAnswer: '', explanation: '', options: ['', '', '', ''] }); setShowQuestionModal(true); }} style={st.btnPrimary}>+ Thêm câu hỏi</button>
                        </div>

                        {questions.length === 0 ? <p>Đề thi này chưa có câu hỏi nào.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {questions.map((q, idx) => (
                                    <div key={q?.questionId || idx} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                                            <strong style={{ wordBreak: 'break-word' }}>Câu {idx + 1}: {q?.questionContent}</strong>
                                            <div style={{ display: 'flex', shrink: 0 }}>
                                                <button onClick={() => {
                                                    setEditQuestion(q);
                                                    let safeOptions = ['', '', '', ''];
                                                    if (q && Array.isArray(q.options)) {
                                                        q.options.forEach((o, index) => {
                                                            if (index < 4) safeOptions[index] = o?.optionContent || '';
                                                        });
                                                    }
                                                    setQuestionForm({
                                                        questionContent: q?.questionContent || '',
                                                        correctAnswer: q?.correctAnswer || '',
                                                        explanation: q?.explanation || '',
                                                        options: safeOptions
                                                    });
                                                    setShowQuestionModal(true);
                                                }} style={{ ...st.btnSmallAction, background: '#f59e0b' }}>Sửa</button>
                                                <button onClick={() => handleDeleteQuestion(q?.questionId)} style={{ ...st.btnSmallAction, background: '#ef4444' }}>Xóa</button>
                                            </div>
                                        </div>
                                        <ul style={{ marginTop: '10px', marginLeft: '20px', color: '#475569', listStyleType: 'disc' }}>
                                            {q?.options?.map((opt, i) => (
                                                <li key={i} style={{ padding: '2px 0', ...(opt?.optionContent === q?.correctAnswer ? { color: '#10b981', fontWeight: 'bold' } : {}) }}>
                                                    {opt?.optionContent || ''}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Quiz */}
            {showQuizModal && (
                <div style={st.modalOverlay}>
                    <div style={st.modalContent}>
                        <h3>{editQuiz ? 'Sửa Đề thi' : 'Thêm Đề thi mới'}</h3>

                        <label style={{ display: 'block', marginTop: '10px', fontWeight: '600' }}>Tên đề thi:</label>
                        <input value={quizForm.quizTitle} onChange={e => setQuizForm({ ...quizForm, quizTitle: e.target.value })} style={st.input} placeholder="(Ví dụ: Kiểm tra đầu vào Toán học)" required />

                        <label style={{ display: 'block', fontWeight: '600' }}>Khóa học áp dụng:</label>
                        <select value={quizForm.courseId} onChange={e => setQuizForm({ ...quizForm, courseId: e.target.value })} style={st.input} required>
                            <option value="">-- Chọn khóa học liên kết --</option>
                            {courses.map(c => (
                                <option key={c?.courseId} value={c?.courseId}>{c?.courseTitle}</option>
                            ))}
                        </select>

                        <label style={{ display: 'block', fontWeight: '600' }}>Thời gian làm bài (phút):</label>
                        <input type="number" value={quizForm.durationMinutes} onChange={e => setQuizForm({ ...quizForm, durationMinutes: e.target.value })} style={st.input} min="1" />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleSaveQuiz} style={st.btnPrimary}>Lưu lại</button>
                            <button onClick={() => setShowQuizModal(false)} style={st.btnCancel}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Question */}
            {showQuestionModal && (
                <div style={st.modalOverlay}>
                    <div style={{ ...st.modalContent, width: '500px' }}>
                        <h3>{editQuestion ? 'Sửa Câu hỏi' : 'Thêm Câu hỏi mới'}</h3>

                        <label style={{ display: 'block', marginTop: '10px', fontWeight: '600' }}>Nội dung câu hỏi:</label>
                        <textarea value={questionForm.questionContent} onChange={e => setQuestionForm({ ...questionForm, questionContent: e.target.value })} style={{ ...st.input, height: '60px', fontFamily: 'inherit' }} />

                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Các đáp án:</label>
                        {questionForm.options.map((opt, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <input type="radio" name="correct" checked={questionForm.correctAnswer === opt && opt !== ''} onChange={() => setQuestionForm({ ...questionForm, correctAnswer: opt })} style={{ cursor: 'pointer' }} />
                                <input value={opt} onChange={e => handleOptionChange(idx, e.target.value)} style={{ ...st.input, margin: 0, flex: 1 }} placeholder={`Đáp án ${idx + 1}`} />
                            </div>
                        ))}
                        <small style={{ color: '#64748b', display: 'block', marginBottom: '15px' }}>* Chọn nút tròn để đánh dấu đáp án đúng</small>

                        <label style={{ display: 'block', fontWeight: '600' }}>Giải thích (nếu có):</label>
                        <textarea value={questionForm.explanation} onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })} style={{ ...st.input, height: '50px', fontFamily: 'inherit' }} />

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button onClick={handleSaveQuestion} style={st.btnPrimary}>Lưu câu hỏi</button>
                            <button onClick={() => setShowQuestionModal(false)} style={st.btnCancel}>Hủy</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const st = {
    btnPrimary: { background: '#0ea5e9', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' },
    btnCancel: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit' },
    btnSmallAction: { background: '#0ea5e9', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginLeft: '6px', fontWeight: 600, fontFamily: 'inherit' },
    table: { width: '100%', borderCollapse: 'collapse', marginTop: '10px' },
    th: { background: '#f8fafc', padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569', fontWeight: '700' },
    td: { padding: '12px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle', color: '#1e293b' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', padding: '25px', borderRadius: '8px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'left' },
    input: { width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '5px', marginBottom: '15px', fontSize: '14px', boxSizing: 'border-box' }
};

export default AdminQuestionBankPage;