// jsx/TestPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Timer from './Timer';
import QuestionCard from './QuestionCard';
import QuestionNavigator from './QuestionNavigator';
import '../css/TestPage.css';

const TestPage = () => {
    const { sessionId } = useParams();   // Lấy sessionId từ URL

    const [questions, setQuestions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [remainingTime, setRemainingTime] = useState(3600); // mặc định 60 phút
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchQuestions();
    }, [sessionId]);

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`/api/tests/${sessionId}/questions`);
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
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));

        // Auto save
        fetch(`/api/tests/${sessionId}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ questionId, selectedOptionId: optionId })
        }).catch(err => console.error("Auto save thất bại", err));
    };

    const submitTest = async () => {
        if (!window.confirm("Bạn chắc chắn muốn nộp bài?")) return;

        try {
            await fetch(`/api/tests/${sessionId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: parseInt(sessionId) })
            });
            alert("Nộp bài thành công!");
            window.location.href = `/test/result/${sessionId}`;
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
                    sessionId={sessionId} 
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