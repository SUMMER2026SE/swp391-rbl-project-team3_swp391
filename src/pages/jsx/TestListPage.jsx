import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../css/TestListPage.css';

const TestListPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            const res = await fetch('http://localhost:8080/api/quizzes'); // ← Chỉnh port nếu khác

            if (!res.ok) {
                throw new Error(`Lỗi server: ${res.status}`);
            }

            const data = await res.json();
            console.log("✅ Dữ liệu quiz:", data);
            // const text = await res.text();
            // console.log(text);
            setQuizzes(data);
        } catch (err) {
            console.error("❌ Lỗi:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startTest = async (quizId) => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch('http://localhost:8080/api/tests/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ quizId })
            });

            if (!res.ok) {
                const errorText = await res.text();
                console.log(errorText);
                throw new Error(errorText);
            }

            const data = await res.json();
            window.location.href = `/tests/${data.sessionsId}`;
        } catch (err) {
            alert("Lỗi khi bắt đầu: " + err.message);
        }
    };

    if (loading) return <div className="loading">Đang tải danh sách bài thi...</div>;
    if (error) return <div className="error">Lỗi: {error}</div>;

    return (
        <div className="test-list-container">
            <h1>Luyện Tập Trắc Nghiệm & Thi Thử</h1>
            <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại Trang chủ</span>

            {quizzes.length === 0 ? (
                <p>Chưa có bài quiz nào trong hệ thống.</p>
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