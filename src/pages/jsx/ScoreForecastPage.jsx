import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import aiService from "../../services/aiService";
import "../css/AiInsights.css";

// Biểu đồ cột so sánh điểm hiện tại và điểm dự đoán (SVG thuần)
function ForecastChart({ subjects }) {
    const width = 640;
    const height = 280;
    const padding = 40;
    const groupW = (width - padding * 2) / subjects.length;
    const barW = Math.min(28, groupW / 3);
    const scale = (v) => (v / 10) * (height - padding * 2);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="forecast-chart">
            {[0, 2, 4, 6, 8, 10].map((g) => {
                const y = height - padding - scale(g);
                return (
                    <g key={g}>
                        <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e2e8f0" strokeWidth="1" />
                        <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="11" fill="#94a3b8">{g}</text>
                    </g>
                );
            })}
            {subjects.map((s, i) => {
                const cx = padding + groupW * i + groupW / 2;
                const curH = scale(s.currentAvg);
                const predH = scale(s.predictedScore);
                return (
                    <g key={i}>
                        <rect x={cx - barW - 3} y={height - padding - curH} width={barW} height={curH} rx="4" fill="#cbd5e1" />
                        <rect x={cx + 3} y={height - padding - predH} width={barW} height={predH} rx="4" fill={s.color || "#3b82f6"} />
                        <text x={cx} y={height - padding + 16} textAnchor="middle" fontSize="11" fill="#475569" fontWeight="600">{s.subject}</text>
                        <text x={cx + 3 + barW / 2} y={height - padding - predH - 6} textAnchor="middle" fontSize="11" fill="#0f172a" fontWeight="700">{s.predictedScore}</text>
                    </g>
                );
            })}
        </svg>
    );
}

export default function ScoreForecastPage() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        aiService
            .getScoreForecast()
            .then(setData)
            .catch((e) => setError(e.response?.data?.message || "Không tải được dữ liệu."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="ai-status">AI đang dự đoán điểm số của bạn...</div>;
    if (error) return <div className="ai-status error">{error}</div>;

    return (
        <div className="ai-page">
            <header className="ai-header">
                <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại</span>
                <h1>📈 Dự đoán điểm thi THPT QG</h1>
                <p>AI phân tích phong độ làm bài để dự đoán điểm số bạn có thể đạt được.</p>
            </header>

            {!data.hasData ? (
                <div className="ai-empty">
                    <p>{data.summary}</p>
                    <button onClick={() => navigate("/tests")}>Luyện đề ngay</button>
                </div>
            ) : (
                <div className="ai-content">
                    <div className="forecast-top">
                        <div className="forecast-stat">
                            <span className="forecast-label">Tổng điểm dự đoán</span>
                            <span className="forecast-value">{data.predictedTotal}</span>
                            <span className="forecast-sub">hiện tại: {data.currentTotal}</span>
                        </div>
                        <div className="forecast-stat">
                            <span className="forecast-label">Xu hướng</span>
                            <span className="forecast-trend">{data.trend}</span>
                        </div>
                        <div className="forecast-stat">
                            <span className="forecast-label">Độ tin cậy</span>
                            <span className="forecast-value small">{data.confidence}%</span>
                        </div>
                    </div>

                    <div className="ai-card">
                        <h3>So sánh điểm hiện tại & dự đoán (thang 10)</h3>
                        <div className="chart-legend">
                            <span><i className="dot gray" /> Hiện tại</span>
                            <span><i className="dot blue" /> Dự đoán</span>
                        </div>
                        <ForecastChart subjects={data.subjects} />
                    </div>

                    <div className="ai-summary-box">
                        <h3>💡 Nhận xét từ AI</h3>
                        <p>{data.summary}</p>
                    </div>

                    <div className="ai-cta">
                        <button onClick={() => navigate("/ai/university-advising")}>Tư vấn ngành/trường phù hợp →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
