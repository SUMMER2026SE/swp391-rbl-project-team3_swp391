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
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Vui lòng đăng nhập để xem danh sách bài thi");
                setLoading(false);
                return;
            }

            const res = await fetch('http://localhost:8080/api/quizzes', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Đọc toàn bộ response dưới dạng text
            const responseText = await res.text();
            
            console.log("📊 Status:", res.status);
            console.log("📄 Response Length:", responseText.length);
            console.log("🔍 First 300 characters:", responseText.substring(0, 300));
            console.log("🔍 Last 200 characters:", responseText.slice(-200));

            if (!res.ok) {
                if (res.status === 401) {
                    setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
                } else if (res.status === 403) {
                    setError("Bạn không có quyền truy cập. Vui lòng đăng nhập với tài khoản phù hợp.");
                } else {
                    setError(`Lỗi server: ${res.status}`);
                }
                return;
            }

            // Nếu là JSON hợp lệ thì parse
            try {
                const data = JSON.parse(responseText);
                console.log("✅ Dữ liệu quiz hợp lệ:", data);
                setQuizzes(Array.isArray(data) ? data : []);
            } catch (parseError) {
                console.error("❌ Parse JSON thất bại:", parseError);
                setError("Dữ liệu trả về không đúng định dạng JSON. Backend đang trả về lỗi HTML.");
            }

        } catch (err) {
            console.error("❌ Lỗi fetchQuizzes:", err);
            setError("Không thể kết nối đến server");
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
            // Lưu thời gian làm bài thực tế (giây) để TestPage đếm ngược đúng
            if (data.remainingTime) {
                localStorage.setItem(`test_time_${data.sessionsId}`, data.remainingTime);
            }
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