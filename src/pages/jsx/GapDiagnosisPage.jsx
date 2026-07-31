import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import aiService from "../../services/aiService";
import "../css/AiInsights.css";

export default function GapDiagnosisPage() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        aiService
            .getGapDiagnosis()
            .then(setData)
            .catch((e) => setError(e.response?.data?.message || "Không tải được dữ liệu."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="ai-status">AI đang quét lịch sử bài làm của bạn...</div>;
    if (error) return <div className="ai-status error">{error}</div>;

    return (
        <div className="ai-page">
            <header className="ai-header">
                <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại</span>
                <h1>🔍 Chẩn đoán lỗ hổng kiến thức</h1>
                <p>AI quét toàn bộ lịch sử bài làm để phát hiện những điểm yếu cần khắc phục.</p>
            </header>

            {!data.hasData ? (
                <div className="ai-empty">
                    <p>{data.summary}</p>
                    <button onClick={() => navigate("/entry-test")}>Làm bài kiểm tra đầu vào</button>
                </div>
            ) : (
                <div className="ai-content">
                    <div className="ai-overview-card">
                        <div className="gauge" style={{ "--val": data.overallAccuracy }}>
                            <span>{data.overallAccuracy}%</span>
                        </div>
                        <div className="ai-overview-text">
                            <h3>Độ chính xác trung bình</h3>
                            <p>{data.summary}</p>
                        </div>
                    </div>

                    <h2 className="ai-section-title" style={{ marginTop: '20px' }}>
                        {data.gaps.length === 0 ? "Không phát hiện lỗ hổng đáng kể 🎉" : `Phát hiện ${data.gaps.length} điểm yếu`}
                    </h2>

                    <div className="gap-grid">
                        <div className="gap-col">
                            <h3 className="gap-col-title">📉 Lỗ hổng phát hiện được</h3>
                            <div className="gap-list">
                                {data.gaps.map((g, i) => (
                                    <div className="gap-item" key={i}>
                                        <div className="gap-head">
                                            <span className="gap-subject">{g.subject}{g.topic ? ` - ${g.topic}` : ''}</span>
                                            <span className="gap-severity" style={{ background: g.color }}>{g.severity}</span>
                                        </div>
                                        <div className="gap-bar">
                                            <div className="gap-bar-fill" style={{ width: `${g.accuracy}%`, background: g.color }} />
                                        </div>
                                        <div className="gap-acc">Độ chính xác: {g.accuracy}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="gap-col">
                            <h3 className="gap-col-title">🗺️ Lộ trình khắc phục & Giải pháp</h3>
                            <div className="gap-roadmap">
                                    {data.gaps.map((g, i) => (
                                        <li key={i}>
                                            <strong>{g.subject}{g.topic ? ` - ${g.topic}` : ''}:</strong> {g.recommendation}
                                        </li>
                                    ))}
                                </div>
                            </div>
                        ))
                    </div>

                    <div className="ai-cta" style={{ marginTop: '30px' }}>
                        <button onClick={() => navigate("/adaptive-path")}>Xem lộ trình khắc phục →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
