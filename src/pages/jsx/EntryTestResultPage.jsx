import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import entryTestService from "../../services/entryTestService";
import "../css/EntryTestResultPage.css";

export default function EntryTestResultPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { sessionsId } = useParams();   // chính là attemptId
    const [data, setData] = useState(location.state || null);
    const [loading, setLoading] = useState(!location.state);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (data) return;                 // đã có sẵn từ state khi vừa nộp bài
        entryTestService
            .getAssessment(sessionsId)
            .then(setData)
            .catch((e) => setError(e.response?.data?.message || "Không tải được kết quả đánh giá."))
            .finally(() => setLoading(false));
    }, [sessionsId, data]);

    if (loading) return <div className="etr-status">Đang phân tích năng lực gốc...</div>;
    if (error) return <div className="etr-status error">{error}</div>;
    if (!data) return null;

    return (
        <div className="etr-page">
            <span className="back-btn" onClick={() => navigate("/entry-test")}>← Làm bài kiểm tra khác</span>
            <h1 className="etr-title">Kết quả đánh giá năng lực gốc</h1>
            <p className="etr-quiz">{data.quizTitle}</p>

            <div className="etr-grid">
                <div className="etr-score-card" style={{ borderTopColor: data.levelColor }}>
                    <div className="etr-level" style={{ color: data.levelColor }}>{data.level}</div>
                    <div className="etr-score">{data.score?.toFixed(1)}<span>/10</span></div>
                    <div className="etr-stats">
                        <span>✅ {data.correctAnswers}/{data.totalQuestions} câu đúng</span>
                        <span>🎯 Độ chính xác {data.accuracyPercent}%</span>
                    </div>
                    <div className="etr-accuracy-bar">
                        <div className="etr-accuracy-fill" style={{ width: `${data.accuracyPercent}%`, background: data.levelColor }} />
                    </div>
                </div>

                <div className="etr-detail-card">
                    <h3>💡 Nhận xét từ AI</h3>
                    <p className="etr-summary">{data.summary}</p>

                    <div className="etr-start-level">
                        <span className="etr-start-label">Điểm xuất phát đề xuất</span>
                        <span className="etr-start-value">{data.recommendedStartLevel}</span>
                    </div>

                    <h3>🗺️ Lộ trình gợi ý</h3>
                    <ul className="etr-recs">
                        {(data.recommendations || []).map((r, i) => (
                            <li key={i}>{r}</li>
                        ))}
                    </ul>

                    <div className="etr-actions">
                        <button className="etr-primary" onClick={() => navigate("/adaptive-path")}>Xem lộ trình thích ứng AI</button>
                        <button className="etr-secondary" onClick={() => navigate("/courses")}>Khám phá khóa học phù hợp</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
