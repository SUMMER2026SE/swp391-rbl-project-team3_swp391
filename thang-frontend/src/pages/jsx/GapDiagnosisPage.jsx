import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import aiService from "../../services/aiService";
import "../css/AiInsights.css";

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

const parseRecommendation = (text) => {
    if (!text) return null;
    // Tìm cụm "sai X/Y câu, đúng Z% — Lời khuyên"
    const match = text.match(/sai\s+(\d+\/\d+)\s+câu,\s+đúng\s+(\d+%?)\s*(?:—|-)\s*(.*)/i);
    if (match) {
        return {
            mistakes: match[1],
            accuracy: match[2],
            advice: match[3]
        };
    }
    return null;
};

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
                    <p>{translateText(data.summary)}</p>
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
                            <p>{translateText(data.summary)}</p>
                        </div>
                    </div>

                    <h2 className="ai-section-title" style={{ marginTop: '20px' }}>
                        {data.gaps.length === 0 ? "Không phát hiện lỗ hổng đáng kể 🎉" : `Phát hiện ${data.gaps.length} điểm yếu`}
                    </h2>

                    <div className="gap-grid">
                        <div className="gap-col">
                            <h3 className="gap-col-title">📉 Lỗ hổng phát hiện được</h3>
                            <div className="gap-grouped-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {Object.entries(data.gaps.reduce((acc, g) => {
                                    const subj = g.subject || "Khác";
                                    if (!acc[subj]) acc[subj] = [];
                                    acc[subj].push(g);
                                    return acc;
                                }, {})).map(([subject, gaps]) => (
                                    <details key={subject} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }} open>
                                        <summary style={{ padding: '16px', fontWeight: '600', fontSize: '16px', cursor: 'pointer', background: '#f8fafc', color: '#1e293b' }}>
                                            📚 {translateSubject(subject)} ({gaps.length} chủ đề yếu)
                                        </summary>
                                        <div className="gap-list" style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
                                            {gaps.map((g, i) => (
                                                <div className="gap-item" key={i}>
                                                    <div className="gap-head">
                                                        <span className="gap-subject">{g.topic || translateSubject(g.subject)}</span>
                                                        <span className="gap-severity" style={{ background: g.color }}>{g.severity}</span>
                                                    </div>
                                                    <div className="gap-bar">
                                                        <div className="gap-bar-fill" style={{ width: `${g.accuracy}%`, background: g.color }} />
                                                    </div>
                                                    <div className="gap-acc">Độ chính xác: {g.accuracy}%</div>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>

                        <div className="gap-col">
                            <h3 className="gap-col-title">🗺️ Lộ trình khắc phục & Giải pháp</h3>
                            <div className="gap-roadmap" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {Object.entries(data.gaps.reduce((acc, g) => {
                                    const subj = g.subject || "Khác";
                                    if (!acc[subj]) acc[subj] = [];
                                    acc[subj].push(g);
                                    return acc;
                                }, {})).map(([subject, gaps]) => (
                                    <details key={subject} style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }} open>
                                        <summary style={{ padding: '16px', fontWeight: '600', fontSize: '16px', cursor: 'pointer', background: '#f8fafc', color: '#1e293b' }}>
                                            💡 Giải pháp cho môn {translateSubject(subject)}
                                        </summary>
                                        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            {gaps.map((g, i) => {
                                                const rawText = translateText(g.recommendation);
                                                const parsed = parseRecommendation(rawText);

                                                return (
                                                    <div key={i} style={{
                                                        background: '#ffffff',
                                                        borderLeft: '4px solid #ef4444',
                                                        border: '1px solid #e2e8f0',
                                                        padding: '16px',
                                                        borderRadius: '12px',
                                                        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                                                    }}>
                                                        <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            🎯 {g.topic || translateSubject(g.subject)}
                                                        </div>
                                                        
                                                        {parsed ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                                    <span style={{ background: '#fef2f2', color: '#b91c1c', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                                                                        ❌ Sai: {parsed.mistakes} câu
                                                                    </span>
                                                                    <span style={{ background: '#f0fdf4', color: '#15803d', padding: '4px 10px', borderRadius: '6px', fontSize: '13px', fontWeight: '600' }}>
                                                                        ✅ Đúng: {parsed.accuracy}
                                                                    </span>
                                                                </div>
                                                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', fontSize: '13.5px', color: '#334155', lineHeight: '1.5' }}>
                                                                    <strong style={{ color: '#2563eb', display: 'block', marginBottom: '4px' }}>💡 Giải pháp khắc phục:</strong>
                                                                    {parsed.advice}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#475569' }}>
                                                                {rawText}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="ai-cta" style={{ marginTop: '30px' }}>
                        <button onClick={() => navigate("/adaptive-path")}>Xem lộ trình khắc phục →</button>
                    </div>
                </div>
            )}
        </div>
    );
}
