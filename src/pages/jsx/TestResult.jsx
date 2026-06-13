// jsx/TestResult.jsx
import React, { useState, useEffect } from 'react';
import '../css/TestResult.css';

const TestResult = ({ sessionId }) => {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResult();
    }, [sessionId]);

    const fetchResult = async () => {
        try {
            const res = await fetch(`/api/tests/${sessionId}/result`);
            const data = await res.json();
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

    const percentage = ((result.correctAnswers / result.totalQuestions) * 100).toFixed(1);

    return (
        <div className="result-container">
            <div className="result-header">
                <h1>Kết Quả Bài Thi</h1>
                <div className="score-circle">
                    <span className="score">{result.score}</span>
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
                {result.questions && result.questions.map((q, index) => (
                    <div key={q.questionId} className={`review-item ${q.isCorrect ? 'correct' : 'wrong'}`}>
                        <div className="review-header">
                            <span className="q-number">Câu {index + 1}</span>
                            <span className={`status ${q.isCorrect ? 'correct' : 'wrong'}`}>
                                {q.isCorrect ? '✓ Đúng' : '✗ Sai'}
                            </span>
                        </div>

                        <p className="question-text">{q.content}</p>

                        <div className="answer-row">
                            <div className="user-answer">
                                <strong>Bạn chọn:</strong> {q.selectedAnswer}
                            </div>
                            <div className="correct-answer">
                                <strong>Đáp án đúng:</strong> {q.correctAnswer}
                            </div>
                        </div>

                        {q.explanation && (
                            <div className="explanation">
                                <strong>Giải thích:</strong> {q.explanation}
                            </div>
                        )}
                    </div>
                ))}
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