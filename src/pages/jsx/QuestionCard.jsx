import React from "react";
import "../css/QuestionCard.css";

const QuestionCard = ({ question, selectedOption, onAnswer }) => {
    if (!question) {
        return <div className="loading">Đang tải câu hỏi...</div>;
    }

    return (
        <div className="question-card">
            <div className="question-header">
                <span className="question-number">Câu {question.questionId}</span>
            </div>
            
            <div className="question-content">
                <p>{question.content}</p>
            </div>

            <div className="options-container">
                {question.options && question.options.length > 0 ? (
                    question.options.map((option, index) => {
                        const isSelected = selectedOption === option.optionId || 
                                         String(selectedOption) === String(option.optionId);
                        
                        return (
                            <div 
                                key={option.optionId}
                                className={`option-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => onAnswer(question.questionId, option.optionId)}
                            >
                                <span className="option-label">
                                    {String.fromCharCode(65 + index)}
                                </span>
                                <span className="option-text">{option.content}</span>
                            </div>
                        );
                    })
                ) : (
                    <p style={{color: 'red'}}>Không có lựa chọn cho câu hỏi này.</p>
                )}
            </div>
        </div>
    );
};

export default QuestionCard;