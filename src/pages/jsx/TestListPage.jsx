// jsx/TestListPage.jsx
import React, { useState, useEffect } from 'react';
import '../css/TestListPage.css';

const TestListPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/quizzes')
            .then(res => res.json())
            .then(data => {
                setQuizzes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const startTest = (quizId) => {
        fetch('/api/tests/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId: quizId })
        })
        .then(res => res.json())
        .then(data => {
            window.location.href = `/test/${data.sessionsId}`;
        })
        .catch(() => alert("Không thể bắt đầu bài thi"));
    };

    if (loading) return <p>Đang tải danh sách bài thi...</p>;

    return (
        <div className="test-list-container">
            <h1>Luyện Tập Trắc Nghiệm & Thi Thử</h1>
            
            {quizzes.length === 0 ? (
                <p>Chưa có bộ câu hỏi nào. Hãy thêm quiz trong database.</p>
            ) : (
                <div className="quiz-grid">
                    {quizzes.map(quiz => (
                        <div key={quiz.quizId} className="quiz-card">
                            <h3>{quiz.quizTitle}</h3>
                            <p>Thời gian: {quiz.durationMinutes} phút</p>
                            <button 
                                onClick={() => startTest(quiz.quizId)} 
                                className="btn-start"
                            >
                                Bắt đầu làm bài
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TestListPage;