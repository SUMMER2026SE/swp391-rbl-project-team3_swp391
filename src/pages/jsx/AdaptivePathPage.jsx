import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/AdaptivePathPage.css";

export default function AdaptivePathPage() {
    const navigate = useNavigate();

    // Mock dữ liệu phân tích năng lực từ AI
    const skills = [
        { id: 1, subject: "Toán học", score: 85, color: "#3b82f6", status: "Tốt" },
        { id: 2, subject: "Vật lý", score: 45, color: "#ef4444", status: "Cần cải thiện", warning: true },
        { id: 3, subject: "Tiếng Anh", score: 75, color: "#10b981", status: "Khá" }
    ];

    // Mock dữ liệu lộ trình do AI tự động generate
    const adaptivePath = [
        { 
            id: 1, 
            type: "review", 
            title: "Ôn tập bù lấp lỗ hổng: Động lực học chất điểm", 
            subject: "Vật lý", 
            reason: "AI phát hiện: Bạn làm sai 3 câu dạng này trong bài Mock Exam gần nhất.", 
            action: "Xem lại Video bài giảng",
            icon: "🔄"
        },
        { 
            id: 2, 
            type: "practice", 
            title: "Bài tập tăng tốc độ: Tích phân vận dụng cao", 
            subject: "Toán học", 
            reason: "AI phân tích: Tốc độ giải bài của bạn đang chậm hơn 20% so với mục tiêu điểm 9+.", 
            action: "Luyện 15 câu trắc nghiệm",
            icon: "⚡"
        },
        { 
            id: 3, 
            type: "next", 
            title: "Học bài mới: Mệnh đề quan hệ (Relative Clauses)", 
            subject: "Tiếng Anh", 
            reason: "Bạn đã hoàn thành xuất sắc bài trước, sẵn sàng học kiến thức mới.", 
            action: "Vào lớp học",
            icon: "📖"
        }
    ];

    return (
        <div className="adaptive-page">
            <header className="adaptive-header">
                <div className="header-left">
                    <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại</span>
                    <h1>🤖 Phân Tích Năng Lực & Lộ Trình AI</h1>
                </div>
                <p>Hệ thống tự động điều chỉnh lộ trình dựa trên lịch sử học tập và kết quả kiểm tra của bạn.</p>
            </header>

            <div className="adaptive-container">
                {/* CỘT TRÁI: BIỂU ĐỒ NĂNG LỰC */}
                <div className="skill-chart-section">
                    <h2>Biểu đồ năng lực hiện tại</h2>
                    <p className="subtitle">Mức độ hoàn thiện mục tiêu THPT Quốc gia 2026</p>
                    
                    <div className="skills-list">
                        {skills.map(skill => (
                            <div className="skill-item" key={skill.id}>
                                <div className="skill-info">
                                    <span className="skill-name">{skill.subject}</span>
                                    <span className="skill-status" style={{ color: skill.color }}>{skill.status} ({skill.score}%)</span>
                                </div>
                                <div className="progress-bg">
                                    <div 
                                        className={`progress-fill ${skill.warning ? 'pulse-warning' : ''}`} 
                                        style={{ width: `${skill.score}%`, backgroundColor: skill.color }}
                                    ></div>
                                </div>
                                {skill.warning && <p className="warning-text">⚠️ Cảnh báo: Nguy cơ mất điểm phần này rất cao!</p>}
                            </div>
                        ))}
                    </div>

                    <div className="ai-summary">
                        <h3>💡 Nhận xét từ AI PrepAce</h3>
                        <p>Nền tảng <strong>Toán</strong> và <strong>Tiếng Anh</strong> của bạn khá vững. Tuy nhiên, môn <strong>Vật lý</strong> đang dưới mức trung bình. Đã tự động chèn thêm 2 bài ôn tập và 1 bài kiểm tra nhỏ vào lịch học tuần này của bạn để khắc phục.</p>
                    </div>
                </div>

                {/* CỘT PHẢI: LỘ TRÌNH THÍCH ỨNG (TIMELINE) */}
                <div className="adaptive-path-section">
                    <h2>Lộ trình AI đề xuất (Adaptive Path)</h2>
                    <p className="subtitle">Các bước hành động tối ưu nhất dành riêng cho bạn lúc này</p>

                    <div className="timeline">
                        {adaptivePath.map((step, index) => (
                            <div className="timeline-item" key={step.id}>
                                <div className="timeline-icon">{step.icon}</div>
                                <div className="timeline-content">
                                    <div className="step-badge">{step.subject}</div>
                                    <h3 className="step-title">{step.title}</h3>
                                    <p className="step-reason">{step.reason}</p>
                                    <button className="step-action-btn">{step.action}</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}