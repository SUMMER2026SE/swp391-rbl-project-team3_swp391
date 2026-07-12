import React from "react";
import "../css/QuestionCard.css";

const QuestionCard = ({ question, selectedOption, onAnswer, index }) => {
    if (!question) {
        return <div className="loading">Đang tải câu hỏi...</div>;
    }

    // ─── 1. XỬ LÝ CHO CÂU HỎI ĐIỀN ĐÁP ÁN NGẮN (SHORT_ANSWER) ───────
    if (question.questionType === "SHORT_ANSWER") {
        return (
            <div className="question-card">
                <div className="question-header">
                    <span className="question-number">Câu {index != null ? index + 1 : question.questionId} (Đáp án ngắn)</span>
                </div>
                <div className="question-content">
                    <p style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>{question.content}</p>
                </div>
                <div className="options-container" style={{ marginTop: "20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <strong>Đáp án của bạn:</strong>
                        <input
                            type="text"
                            placeholder="Nhập kết quả tính toán tại đây..."
                            value={selectedOption || ""}
                            // Gọi hàm onAnswer truyền text vào tham số thứ 3 để auto save
                            onChange={(e) => onAnswer(question.questionId, null, e.target.value)}
                            style={{
                                flex: "1",
                                maxWidth: "300px",
                                padding: "10px 15px",
                                borderRadius: "8px",
                                border: "1px solid #cbd5e1",
                                fontSize: "15px",
                                outline: "none",
                                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)"
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    // ─── 2. XỬ LÝ CHO CÂU HỎI TỰ LUẬN DÀI (ESSAY) ──────────────────
    if (question.questionType === "TEXT" || question.questionType === "ESSAY") {
        return (
            <div className="question-card">
                <div className="question-header">
                    <span className="question-number">Câu {index != null ? index + 1 : question.questionId} (Tự luận)</span>
                </div>
                <div className="question-content">
                    <p>{question.content}</p>
                </div>
                <div className="options-container">
                    <textarea
                        className="essay-textarea"
                        placeholder="Nhập bài làm tự luận của bạn tại đây..."
                        value={selectedOption || ""}
                        onChange={(e) => onAnswer(question.questionId, null, e.target.value)}
                        style={{
                            width: "100%",
                            minHeight: "180px",
                            padding: "15px",
                            borderRadius: "12px",
                            border: "1px solid #cbd5e1",
                            fontSize: "15px",
                            resize: "vertical"
                        }}
                    />
                </div>
            </div>
        );
    }

    // ─── 3. GIỮ NGUYÊN DIỆN CỦA TRẮC NGHIỆM ĐANG CÓ (CHOICE) ────────
    return (
        <div className="question-card">
            <div className="question-header">
                <span className="question-number">Câu {index != null ? index + 1 : question.questionId}</span>
            </div>
            
            <div className="question-content">
                <p>{question.content}</p>
            </div>

            <div className="options-container">
                {question.options && question.options.length > 0 ? (
                    question.options.map((option, idx) => {
                        const isSelected = selectedOption === option.optionId || 
                                         String(selectedOption) === String(option.optionId);
                        
                        return (
                            <div 
                                key={option.optionId}
                                className={`option-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => onAnswer(question.questionId, option.optionId)}
                            >
                                <span className="option-label">
                                    {String.fromCharCode(65 + idx)}
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