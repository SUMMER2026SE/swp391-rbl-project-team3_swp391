// jsx/TestPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Timer from './Timer';
import QuestionCard from './QuestionCard';
import QuestionNavigator from './QuestionNavigator';
import '../css/TestPage.css';
import { SERVER_URL } from '../../config/server';

const TestPage = () => {
    const { sessionsId } = useParams();   // Lấy sessionId từ URL

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [remainingTime] = useState(() => {
        const saved = localStorage.getItem(`test_time_${sessionsId}`);
        return saved ? parseInt(saved, 10) : 3600; // lấy thời gian thực từ lúc bắt đầu
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, [sessionsId]);

    const fetchQuestions = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `${SERVER_URL}/tests/${sessionsId}/questions`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            const data = await res.json();
            setQuestions(data);
            
            // TODO: Sau này lấy remainingTime từ API startTest
        } catch (err) {
            console.error(err);
            alert("Không thể tải câu hỏi");
        } finally {
            setLoading(false);
        }
    };
const saveTimeoutRef = useRef(null);
    const handleAnswer = (questionId, optionId, essayText = null) => {
        // Xác định giá trị hiện tại để lưu vào State UI
        const currentAnswerValue = essayText !== null ? essayText : optionId;
        
        // Cập nhật State ngay lập tức để giao diện mượt mà, học sinh gõ chữ không bị lag
        setAnswers(prev => ({ ...prev, [questionId]: currentAnswerValue }));

        // TRƯỜNG HỢP 1: Nếu là Trắc nghiệm (bấm chọn là ăn luôn, lưu ngay không cần chờ)
        if (optionId !== null) {
            sendAnswerToBackend(questionId, optionId, null);
            return;
        }

        // TRƯỜNG HỢP 2: Nếu là Điền số/Tự luận (Đang gõ chữ)
        // Nếu có hẹn giờ cũ đang chạy -> Xóa đi để hẹn giờ lại từ đầu
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Tạo hẹn giờ mới: Ngừng gõ đủ 500ms thì mới chính thức gọi API lưu vào DB
        saveTimeoutRef.current = setTimeout(() => {
            sendAnswerToBackend(questionId, null, essayText);
        }, 500); 
    };

    // 🔥 TÁCH HÀM GỬI API RA RIÊNG CHO SẠCH CODE:
    const sendAnswerToBackend = (questionId, optionId, essayText) => {
        const token = localStorage.getItem("token");
        
        console.log(`📡 Đang tự động lưu câu ${questionId} về DB...`);

        fetch(`${SERVER_URL}/tests/${sessionsId}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                questionId,
                selectedOptionId: optionId,
                essayAnswer: essayText
            })
        }).catch(err => console.error("Auto save thất bại", err));
    };

    const submitTest = async (auto = false) => {
        if (!auto && !window.confirm("Bạn chắc chắn muốn nộp bài?")) return;

        try {
            const token = localStorage.getItem("token");

            await fetch(`/api/tests/${sessionsId}/submit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(answers)
            });
            localStorage.removeItem(`test_time_${sessionsId}`);
            alert(auto ? "Hết giờ! Bài thi đã được tự động nộp." : "Nộp bài thành công!");
            window.location.href = `/tests/result/${sessionsId}`;
        } catch (err) {
            alert("Nộp bài thất bại");
        }
    };

    if (loading) return <div className="loading">Đang tải bài thi...</div>;

    const currentQuestion = questions[currentIndex];

    return (
        <div className="test-page">
            <div className="test-header">
                {/* Sửa lỗi comment ở đây */}
                <Timer
                    initialTime={remainingTime}
                    sessionsId={sessionsId}
                    onTimeout={() => submitTest(true)}
                />
                <button onClick={() => submitTest(false)} className="btn-submit">Nộp Bài</button>
            </div>

            <div className="test-content">
                <QuestionCard
                    question={currentQuestion}
                    selectedOption={answers[currentQuestion?.questionId]}
                    onAnswer={handleAnswer}
                    index={currentIndex}
                />

                <QuestionNavigator 
                    questions={questions} 
                    answers={answers} 
                    currentIndex={currentIndex} 
                    setCurrentIndex={setCurrentIndex} 
                />
            </div>
        </div>
    );
};

export default TestPage;