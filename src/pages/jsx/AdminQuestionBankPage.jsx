import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import '../css/AdminDashboardPage.css';

const AdminQuestionBankPage = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
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
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const res = await axiosClient.get('/quizzes');
            setQuizzes(res.data || []);
        } catch (err) {
            setError('Không tải được danh sách đề thi');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveQuiz = async () => {
        try {
            if (editQuiz) {
                await axiosClient.put(`/quizzes/${editQuiz.quizId}`, quizForm);
            } else {
                await axiosClient.post('/quizzes', quizForm);
            }
            setShowQuizModal(false);
            fetchQuizzes();
        } catch (err) {
            alert('Lỗi lưu đề thi: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleDeleteQuiz = async (id) => {
        if (!window.confirm("Xóa đề thi sẽ xóa toàn bộ câu hỏi. Tiếp tục?")) return;
        try {
            await axiosClient.delete(`/quizzes/${id}`);
            fetchQuizzes();
            if (selectedQuiz?.quizId === id) setSelectedQuiz(null);
        } catch (err) {
            alert("Lỗi khi xóa đề thi");
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
            if (editQuestion) {
                await axiosClient.put(`/questions/${editQuestion.questionId}`, questionForm);
            } else {
                await axiosClient.post(`/questions/quiz/${selectedQuiz.quizId}`, questionForm);
            }
            setShowQuestionModal(false);
            handleViewQuestions(selectedQuiz); // refresh
        } catch (err) {
            alert("Lỗi lưu câu hỏi");
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
        <div className="admin-page">
            <header className="admin-header">
                <h2>Quản lý Thư viện đề (Question Bank)</h2>
                <button onClick={() => navigate('/admin')} className="btn-back">Quay lại Dashboard</button>
            </header>

            <div className="admin-content" style={{ padding: '20px', display: 'flex', gap: '20px' }}>
                {/* Cột trái: Quản lý Quizzes */}
                <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3>Danh sách Đề thi (Quizzes)</h3>
                        <button onClick={() => { setEditQuiz(null); setQuizForm({ quizTitle: '', durationMinutes: 60, courseId: '' }); setShowQuizModal(true); }} style={st.btnPrimary}>+ Tạo Đề thi</button>
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
                                {quizzes.map(q => (
                                    <tr key={q.quizId} style={selectedQuiz?.quizId === q.quizId ? { background: '#f0f9ff' } : {}}>
                                        <td style={st.td}>{q.quizId}</td>
                                        <td style={st.td}><strong>{q.quizTitle}</strong></td>
                                        <td style={st.td}>{q.durationMinutes}p</td>
                                        <td style={st.td}>
                                            <button onClick={() => handleViewQuestions(q)} style={st.btnSmallAction}>Chi tiết</button>
                                            <button onClick={() => { setEditQuiz(q); setQuizForm({ quizTitle: q.quizTitle, durationMinutes: q.durationMinutes, courseId: q.course?.courseId || '' }); setShowQuizModal(true); }} style={{ ...st.btnSmallAction, background: '#f59e0b' }}>Sửa</button>
                                            <button onClick={() => handleDeleteQuiz(q.quizId)} style={{ ...st.btnSmallAction, background: '#ef4444' }}>Xóa</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Cột phải: Quản lý Questions của Quiz được chọn */}
                {selectedQuiz && (
                    <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3>Câu hỏi: {selectedQuiz.quizTitle}</h3>
                            <button onClick={() => { setEditQuestion(null); setQuestionForm({ questionContent: '', correctAnswer: '', explanation: '', options: ['', '', '', ''] }); setShowQuestionModal(true); }} style={st.btnPrimary}>+ Thêm câu hỏi</button>
                        </div>
                        
                        {questions.length === 0 ? <p>Đề thi này chưa có câu hỏi nào.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {questions.map((q, idx) => (
                                    <div key={q.questionId} style={{ border: '1px solid #e2e8f0', padding: '15px', borderRadius: '6px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <strong>Câu {idx + 1}: {q.questionContent}</strong>
                                            <div>
                                                <button onClick={() => { setEditQuestion(q); setQuestionForm({ questionContent: q.questionContent, correctAnswer: q.correctAnswer, explanation: q.explanation || '', options: q.options ? q.options.map(o => o.optionContent) : ['', '', '', ''] }); setShowQuestionModal(true); }} style={{ ...st.btnSmallAction, background: '#f59e0b' }}>Sửa</button>
                                                <button onClick={() => handleDeleteQuestion(q.questionId)} style={{ ...st.btnSmallAction, background: '#ef4444' }}>Xóa</button>
                                            </div>
                                        </div>
                                        <ul style={{ marginTop: '10px', marginLeft: '20px', color: '#475569' }}>
                                            {q.options?.map((opt, i) => (
                                                <li key={i} style={opt.optionContent === q.correctAnswer ? { color: '#10b981', fontWeight: 'bold' } : {}}>
                                                    {opt.optionContent}
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
                        <label>Tên đề thi:</label>
                        <input value={quizForm.quizTitle} onChange={e => setQuizForm({...quizForm, quizTitle: e.target.value})} style={st.input} placeholder="(Ví dụ: Kiểm tra đầu vào Toán học)" />
                        
                        <label>Thời gian (phút):</label>
                        <input type="number" value={quizForm.durationMinutes} onChange={e => setQuizForm({...quizForm, durationMinutes: e.target.value})} style={st.input} />

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
                        
                        <label>Nội dung câu hỏi:</label>
                        <textarea value={questionForm.questionContent} onChange={e => setQuestionForm({...questionForm, questionContent: e.target.value})} style={{ ...st.input, height: '60px' }} />
                        
                        <label>Các đáp án:</label>
                        {questionForm.options.map((opt, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <input type="radio" name="correct" checked={questionForm.correctAnswer === opt && opt !== ''} onChange={() => setQuestionForm({...questionForm, correctAnswer: opt})} />
                                <input value={opt} onChange={e => handleOptionChange(idx, e.target.value)} style={{ ...st.input, margin: 0, flex: 1 }} placeholder={`Đáp án ${idx + 1}`} />
                            </div>
                        ))}
                        <small style={{ color: '#64748b', display: 'block', marginBottom: '15px' }}>* Chọn radio button để đánh dấu đáp án đúng</small>

                        <label>Giải thích (nếu có):</label>
                        <textarea value={questionForm.explanation} onChange={e => setQuestionForm({...questionForm, explanation: e.target.value})} style={{ ...st.input, height: '50px' }} />

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
    btnPrimary: { background: '#0ea5e9', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
    btnCancel: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 },
    btnSmallAction: { background: '#0ea5e9', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginLeft: '6px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { background: '#f8fafc', padding: '12px', textAlign: 'left', borderBottom: '2px solid #e2e8f0', color: '#475569' },
    td: { padding: '12px', borderBottom: '1px solid #e2e8f0', verticalAlign: 'middle' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { background: '#fff', padding: '25px', borderRadius: '8px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', marginTop: '5px', marginBottom: '15px' }
};

export default AdminQuestionBankPage;
