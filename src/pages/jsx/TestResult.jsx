// jsx/TestResult.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../css/TestResult.css';

const TestResult = () => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const { sessionsId } = useParams();

    useEffect(() => {
        fetchResult();
    }, [sessionsId]);

    const fetchResult = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/tests/${sessionsId}/result`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const data = await res.json();
            console.log("📊 Dữ liệu kết quả từ backend:", data);
            setResult(data);
        } catch (err) {
            console.error(err);
            alert("Không thể tải kết quả");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Đang tải kết quả...</div>;
    if (!result) return <div>Lỗi khi tải kết quả</div>;

    const percentage =
        result && result.totalQuestions > 0
            ? ((result.correctAnswers / result.totalQuestions) * 100).toFixed(1)
            : "0.0";

    // Hàm so sánh thông minh (đồng bộ với backend)
    const isAnswerCorrect = (q) => {
        if (!q.selectedAnswer || !q.correctAnswer) return false;
        
        const selected = String(q.selectedAnswer).trim().toLowerCase();
        const correct = String(q.correctAnswer).trim().toLowerCase();

        return selected === correct || 
               correct.includes(selected) || 
               selected.includes(correct);
    };

    return (
        <div className="result-container">
            <div className="result-header">
                <h1>Kết Quả Bài Thi</h1>
                <div className="score-circle">
                    <span className="score">{result.score?.toFixed(2) || "0.00"}</span>
                    <span className="score-label">/10</span>
                </div>
                <p className="percentage">{percentage}% đúng</p>
            </div>

            <div className="result-summary">
                <div className="summary-item">
                    <strong>Tổng số câu:</strong> {result.totalQuestions}
                </div>
                <div className="summary-item">
                    <strong>Số câu đúng:</strong> {result.correctAnswers}
                </div>
                <div className="summary-item">
                    <strong>Thời gian làm:</strong> {Math.floor(result.timeSpent / 60)} phút {result.timeSpent % 60} giây
                </div>
            </div>

            <div className="review-section">
    <h2>Chi tiết từng câu</h2>
    {result.questions && result.questions.map((q, index) => {
        const isEssay = q.questionType === "ESSAY" || q.questionType === "TEXT";

        return (
            <div key={q.questionId} className={`review-item ${isEssay ? 'essay-style' : q.correct ? 'correct' : 'wrong'}`}>
                <div className="review-header">
                    <span className="q-number">Câu {index + 1} {isEssay ? "(Tự luận)" : ""}</span>
                    <span className={`status ${isEssay ? 'essay' : q.correct ? 'correct' : 'wrong'}`}>
                        {isEssay 
                            ? (q.score !== null && q.score !== undefined ? `💯 Điểm: ${q.score}` : '⏳ Chờ chấm điểm')
                            : (q.correct ? '✓ Đúng' : '✗ Sai')}
                    </span>
                </div>

                <p className="question-text">{q.content}</p>

                <div className="answer-row">
                    <div className="user-answer">
                        <strong>Bạn làm:</strong> {q.selectedAnswer || "Chưa trả lời"}
                    </div>
                    {/* Chỉ hiện đáp án chuẩn nếu là câu hỏi trắc nghiệm */}
                    {!isEssay && (
                        <div className="correct-answer">
                            <strong>Đáp án đúng:</strong> {q.correctedAnswer}
                        </div>
                    )}
                </div>

                {/* HIỂN THỊ LỜI PHÊ GIÁO VIÊN NẾU CÓ */}
                {isEssay && q.teacherComment && (
                    <div className="explanation" style={{background: "#f0fdf4", borderColor: "#bbf7d0", color: "#166534"}}>
                        <strong>📝 Lời phê của giáo viên:</strong> {q.teacherComment}
                    </div>
                )}

                {!isEssay && q.explanation && (
                    <div className="explanation">
                        <strong>Giải thích:</strong> {q.explanation}
                    </div>
                )}
            </div>
        );
    })}
</div>

            <div className="result-actions">
                <button onClick={() => window.location.href = '/tests'} className="btn-back">
                    Quay lại danh sách bài thi
                </button>
                <button onClick={() => window.print()} className="btn-print">
                    In kết quả
                </button>
            </div>
        </div>
    );
};

export default TestResult;