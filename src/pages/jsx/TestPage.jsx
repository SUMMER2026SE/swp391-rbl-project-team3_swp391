// jsx/TestPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Timer from './Timer';
import QuestionCard from './QuestionCard';
import QuestionNavigator from './QuestionNavigator';
import '../css/TestPage.css';

const TestPage = () => {
    const { sessionsId } = useParams();   // Lấy sessionId từ URL

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [remainingTime, setRemainingTime] = useState(3600); // mặc định 60 phút
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, [sessionsId]);

    const fetchQuestions = async () => {
        try {
            const token = localStorage.getItem("token");

            const res = await fetch(
                `http://localhost:8080/api/tests/${sessionsId}/questions`,
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

    const handleAnswer = (questionId, optionId) => {
        console.log(`Chọn câu ${questionId} - Đáp án: ${optionId}`);
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));

        // Auto save
        const token = localStorage.getItem("token");

        fetch(`http://localhost:8080/api/tests/${sessionsId}/answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                questionId,
                selectedOptionId: optionId
            })
        }).catch(err => console.error("Auto save thất bại", err));
    };

    const submitTest = async () => {
        if (!window.confirm("Bạn chắc chắn muốn nộp bài?")) return;

        try {
            const token = localStorage.getItem("token");

            await fetch(`http://localhost:8080/api/tests/${sessionsId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            alert("Nộp bài thành công!");
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
                />
                <button onClick={submitTest} className="btn-submit">Nộp Bài</button>
            </div>

            <div className="test-content">
                <QuestionCard 
                    question={currentQuestion} 
                    selectedOption={answers[currentQuestion?.questionId]} 
                    onAnswer={handleAnswer}
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