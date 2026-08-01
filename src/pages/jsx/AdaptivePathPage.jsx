import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import aiService from "../../services/aiService";
import "../css/AdaptivePathPage.css";

// Dữ liệu mẫu dùng khi học sinh chưa có lịch sử học tập hoặc API lỗi
const FALLBACK_SKILLS = [
    { subject: "Toán học", score: 85, color: "#3b82f6", status: "Tốt" },
    { subject: "Vật lý", score: 45, color: "#ef4444", status: "Cần cải thiện", warning: true },
    { subject: "Tiếng Anh", score: 75, color: "#10b981", status: "Khá" },
];

const FALLBACK_PATH = [
    { type: "review", title: "Ôn tập bù lấp lỗ hổng: Động lực học chất điểm", subject: "Vật lý", reason: "AI phát hiện: Bạn làm sai 3 câu dạng này trong bài Mock Exam gần nhất.", action: "Xem lại Video bài giảng", icon: "🔄" },
    { type: "practice", title: "Bài tập tăng tốc độ: Tích phân vận dụng cao", subject: "Toán học", reason: "AI phân tích: Tốc độ giải bài của bạn đang chậm hơn 20% so với mục tiêu điểm 9+.", action: "Luyện 15 câu trắc nghiệm", icon: "⚡" },
    { type: "next", title: "Học bài mới: Mệnh đề quan hệ (Relative Clauses)", subject: "Tiếng Anh", reason: "Bạn đã hoàn thành xuất sắc bài trước, sẵn sàng học kiến thức mới.", action: "Vào lớp học", icon: "📖" },
];

// Biểu đồ năng lực dạng radar bằng SVG thuần (không cần thư viện ngoài)
function RadarChart({ skills }) {
    const size = 260;
    const center = size / 2;
    const radius = center - 40;
    const n = Math.max(skills.length, 3);

    const point = (value, index) => {
        const angle = (Math.PI * 2 * index) / n - Math.PI / 2;
        const r = (value / 100) * radius;
        return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
    };

    const rings = [0.25, 0.5, 0.75, 1];
    const dataPoints = skills.map((s, i) => point(s.score, i));
    const polygon = dataPoints.map((p) => p.join(",")).join(" ");

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="radar-chart" width="100%" height="260">
            {rings.map((ring, ri) => (
                <polygon
                    key={ri}
                    points={skills.map((_, i) => point(ring * 100, i).join(",")).join(" ")}
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="1"
                />
            ))}
            {skills.map((_, i) => {
                const [x, y] = point(100, i);
                return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
            })}
            <polygon points={polygon} fill="rgba(59,130,246,0.25)" stroke="#3b82f6" strokeWidth="2" />
            {dataPoints.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r="4" fill={skills[i].color || "#3b82f6"} />
            ))}
            {skills.map((s, i) => {
                const [x, y] = point(118, i);
                return (
                    <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#475569" fontWeight="600">
                        {s.subject}
                    </text>
                );
            })}
        </svg>
    );
}

const SUBJECT_MAP = {
    "math": "Toán", "physics": "Vật lý", "chemistry": "Hóa học",
    "english": "Tiếng Anh", "literature": "Ngữ Văn", "history": "Lịch sử",
    "geography": "Địa lý", "biology": "Sinh học", "it": "Tin học", "civic": "GDCD"
};

const translateSubject = (subject) => {
    if (!subject) return "";
    return SUBJECT_MAP[subject.toLowerCase()] || subject;
};

const translateText = (text) => {
    if (!text) return "";
    return text.replace(/\bmath\b/gi, "Toán")
               .replace(/\bphysics\b/gi, "Vật lý")
               .replace(/\bchemistry\b/gi, "Hóa học")
               .replace(/\benglish\b/gi, "Tiếng Anh")
               .replace(/\bliterature\b/gi, "Ngữ Văn")
               .replace(/\bhistory\b/gi, "Lịch sử")
               .replace(/\bgeography\b/gi, "Địa lý")
               .replace(/\bbiology\b/gi, "Sinh học");
};

export default function AdaptivePathPage() {
    const navigate = useNavigate();

    const [skills, setSkills] = useState(FALLBACK_SKILLS);
    const [path, setPath] = useState(FALLBACK_PATH);
    const [summary, setSummary] = useState(
        "Nền tảng Toán và Tiếng Anh của bạn khá vững. Tuy nhiên, môn Vật lý đang dưới mức trung bình. Đã tự động chèn thêm 2 bài ôn tập và 1 bài kiểm tra nhỏ vào lịch học tuần này của bạn để khắc phục."
    );
    const [loading, setLoading] = useState(true);
    const [isDemo, setIsDemo] = useState(false);

    useEffect(() => {
        let mounted = true;
        aiService
            .getAdaptivePath()
            .then((data) => {
                if (!mounted) return;
                if (data && data.hasData && data.skills?.length) {
                    setSkills(data.skills);
                    setPath(data.path || []);
                    if (data.aiSummary) setSummary(data.aiSummary);
                    setIsDemo(false);
                } else {
                    setIsDemo(true); // chưa có dữ liệu thật -> hiển thị demo
                }
            })
            .catch(() => mounted && setIsDemo(true))
            .finally(() => mounted && setLoading(false));
        return () => {
            mounted = false;
        };
    }, []);

    if (loading) return <div className="loading">Đang phân tích năng lực của bạn...</div>;

    return (
        <div className="adaptive-page">
            <header className="adaptive-header">
                <div className="header-left">
                    <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại</span>
                    <h1>🤖 Phân Tích Năng Lực & Lộ Trình AI</h1>
                </div>
                <p>Hệ thống tự động điều chỉnh lộ trình dựa trên lịch sử học tập và kết quả kiểm tra của bạn.</p>
                {isDemo && (
                    <p className="demo-banner">
                        ⓘ Bạn chưa có dữ liệu học tập — đang hiển thị dữ liệu minh họa. Hãy{" "}
                        <span className="link-inline" onClick={() => navigate("/entry-test")}>làm bài kiểm tra đầu vào</span>{" "}
                        để nhận lộ trình cá nhân hóa.
                    </p>
                )}
            </header>

            <div className="adaptive-container">
                {/* CỘT TRÁI: BIỂU ĐỒ NĂNG LỰC */}
                <div className="skill-chart-section">
                    <h2>Biểu đồ năng lực hiện tại</h2>
                    <p className="subtitle">Mức độ hoàn thiện mục tiêu THPT Quốc gia 2026</p>

                    <RadarChart skills={skills.map(s => ({...s, subject: translateSubject(s.subject)}))} />

                    <div className="skills-list">
                        {skills.map((skill, idx) => (
                            <div className="skill-item" key={idx}>
                                <div className="skill-info">
                                    <span className="skill-name">{translateSubject(skill.subject)}</span>
                                    <span className="skill-status" style={{ color: skill.color }}>
                                        {skill.status} ({skill.score}%)
                                    </span>
                                </div>
                                <div className="progress-bg">
                                    <div
                                        className={`progress-fill ${skill.warning ? "pulse-warning" : ""}`}
                                        style={{ width: `${skill.score}%`, backgroundColor: skill.color }}
                                    ></div>
                                </div>
                                {skill.warning && <p className="warning-text">⚠️ Cảnh báo: Nguy cơ mất điểm phần này rất cao!</p>}
                            </div>
                        ))}
                    </div>

                    <div className="ai-summary">
                        <h3>💡 Nhận xét từ AI PrepAce</h3>
                        <p>{translateText(summary)}</p>
                    </div>
                </div>

                {/* CỘT PHẢI: LỘ TRÌNH THÍCH ỨNG */}
                <div className="adaptive-path-section">
                    <h2>Lộ trình AI đề xuất (Adaptive Path)</h2>
                    <p className="subtitle">Các bước hành động tối ưu nhất dành riêng cho bạn lúc này</p>

                    <div className="timeline">
                        {path.map((step, index) => (
                            <div className="timeline-item" key={index}>
                                <div className="timeline-icon">{step.icon}</div>
                                <div className="timeline-content">
                                    <div className="step-badge">{translateSubject(step.subject)}</div>
                                    <h3 className="step-title">{translateText(step.title)}</h3>
                                    <p className="step-reason">{translateText(step.reason)}</p>
                                    <button
                                        className="step-action-btn"
                                        onClick={() => {
                                            const isCourse = step.type === "review" || step.type === "next" || step.type === "video" || step.action?.toLowerCase().includes("video");
                                            navigate(isCourse ? "/courses" : "/tests");
                                        }}
                                    >
                                        {step.action}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
