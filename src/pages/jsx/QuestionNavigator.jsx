// jsx/QuestionNavigator.jsx
import React from 'react';
import "../css/QuestionNavigator.css";

const QuestionNavigator = ({ questions, answers, currentIndex, setCurrentIndex }) => {
    return (
        <div className="navigator-container">
            <h4>Danh sách câu hỏi</h4>
            <div className="question-grid">
                {questions.map((question, index) => {
                    const isAnswered = answers[question.questionId] !== undefined;
                    const isCurrent = index === currentIndex;

                    return (
                        <button
                            key={question.questionId}
                            className={`question-btn 
                                ${isCurrent ? 'current' : ''} 
                                ${isAnswered ? 'answered' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                        >
                            {index + 1}
                        </button>
                    );
                })}
            </div>

            <div className="navigator-footer">
                <button 
                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                    disabled={currentIndex === 0}
                >
                    ← Câu trước
                </button>
                <button 
                    onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                    disabled={currentIndex === questions.length - 1}
                >
                    Câu sau →
                </button>
            </div>
        </div>
    );
};

export default QuestionNavigator;