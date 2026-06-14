import React from "react";
import "../css/QuestionCard.css";

const QuestionCard = ({ question, selectedOption, onAnswer }) => {
    if (!question) return <div>Đang tải câu hỏi...</div>;

    return (
        <div className="question-card">
            <div className="question-header">
                <span className="question-number">Câu {question.questionId}</span>
            </div>
            
            <div className="question-content">
                <p>{question.content}</p>
            </div>

            <div className="options-container">
                {question.options && question.options.map((option, index) => {
                    const isSelected = selectedOption === option.optionId;
                    
                    return (
                        <div 
                            key={option.optionId}
                            className={`option-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => onAnswer(question.questionId, option.optionId)}
                        >
                            <span className="option-label">
                                {String.fromCharCode(65 + index)}
                            </span>
                            <span className="option-text">{option.questionContent}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default QuestionCard;