import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import aiService from "../../services/aiService";
import "../css/AiInsights.css";

const BLOCKS = [
    { code: "A00", label: "A00 · Toán - Lý - Hóa" },
    { code: "A01", label: "A01 · Toán - Lý - Anh" },
    { code: "B00", label: "B00 · Toán - Hóa - Sinh" },
    { code: "C00", label: "C00 · Văn - Sử - Địa" },
    { code: "D01", label: "D01 · Toán - Văn - Anh" },
];

export default function UniversityAdvisingPage() {
    const navigate = useNavigate();
    const [block, setBlock] = useState("A00");
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        let active = true;
        aiService
            .getUniversityAdvising(block)
            .then((d) => active && setData(d))
            .catch((e) => active && setError(e.response?.data?.message || "Không tải được dữ liệu."))
            .finally(() => active && setLoading(false));
        return () => {
            active = false;
        };
    }, [block]);

    const changeBlock = (b) => {
        if (b === block) return;
        setLoading(true);
        setError(null);
        setBlock(b);
    };

    return (
        <div className="ai-page">
            <header className="ai-header">
                <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại</span>
                <h1>🎓 Tư vấn chọn ngành & trường</h1>
                <p>AI gợi ý ngành học, trường đại học phù hợp dựa trên năng lực dự đoán của bạn.</p>
            </header>

            <div className="block-tabs">
                {BLOCKS.map((b) => (
                    <button
                        key={b.code}
                        className={block === b.code ? "active" : ""}
                        onClick={() => changeBlock(b.code)}
                    >
                        {b.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="ai-status">AI đang tư vấn cho khối {block}...</div>
            ) : error ? (
                <div className="ai-status error">{error}</div>
            ) : !data.hasData ? (
                <div className="ai-empty">
                    <p>{data.summary}</p>
                    <button onClick={() => navigate("/entry-test")}>Làm bài kiểm tra đầu vào</button>
                </div>
            ) : (
                <div className="ai-content">
                    <div className="advise-top">
                        <span className="advise-label">Tổng điểm dự đoán khối {data.block}</span>
                        <span className="advise-score">{data.predictedScore}<small>/30</small></span>
                    </div>

                    <div className="ai-summary-box">
                        <h3>💡 Lời khuyên từ AI</h3>
                        <p>{data.summary}</p>
                    </div>

                    <h2 className="ai-section-title">Gợi ý ngành / trường</h2>
                    <div className="uni-grid">
                        {data.suggestions.map((s, i) => (
                            <div className="uni-card" key={i}>
                                <div className="uni-head">
                                    <h3>{s.university}</h3>
                                    <span className="uni-chance" style={{ background: s.color }}>{s.chancePercent}%</span>
                                </div>
                                <p className="uni-major">{s.major}</p>
                                <div className="uni-meta">
                                    <span>Điểm chuẩn: <strong>{s.benchmark}</strong></span>
                                    <span className="uni-label" style={{ color: s.color }}>{s.chanceLabel}</span>
                                </div>
                                <p className="uni-note">{s.note}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
