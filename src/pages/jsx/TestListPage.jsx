import React, {useState, useEffect} from "react";
import "../css/TestListPage.css"

const TestListPage = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try{
            const res = await fetch('/api/quizzes');
            const data = await res.json();
            setQuizzes(data);
        }catch (error){
            console.error(error);
        }finally{
            setLoading(false);
        }
    };

    const startTest = async (quizId) => {
        try{
            const res = await fetch('/api/tests/start', {
                method: 'POST',
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({quizId})
            });

            const data = await res.json();
            window.location.href = `/test/${data.sessionsId}`;
        }catch (error){
            alert("Không thể bắt đầu bài thi !!!");
        }
    }

    return(
        <div className="test-list-container">
            <h1>Luyện Tập & Thi Thử...</h1>
            {loading ? <p>Đang Tải...</p> : (
                <div className="quiz-grid">
                    {quizzes.map(quiz => (
                        <div className="quiz-card" key={quiz.quizId}>
                            <h3>{quiz.quizTitle}</h3>
                            <p>Thời gian: {quiz.durationMinutes} phút</p>
                            <button className="btn-start" onClick={() => startTest(quiz.quizId)}>
                                Bắt Đầu Thi
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TestListPage;