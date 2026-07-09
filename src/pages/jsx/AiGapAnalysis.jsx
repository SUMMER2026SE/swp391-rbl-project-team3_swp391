import { Link } from "react-router-dom";
import { buildGapAnalysis } from "../../services/practiceService";
import "../css/AiGapAnalysis.css";

/**
 * 🤖 Box "AI Đánh giá & Lộ trình" — dùng chung cho mọi trang kết quả thi.
 * @param {Array<{topic?: string, correct: boolean, answered: boolean}>} items
 *        Chi tiết bài làm đã chuẩn hóa (mỗi phần tử 1 câu hỏi).
 */
export default function AiGapAnalysis({ items }) {
    if (!items || items.length === 0) return null;
    const gap = buildGapAnalysis(items);

    return (
        <section className="ai-gap-box">
            <div className="ai-gap-head">
                <span className="ai-gap-icon">🤖</span>
                <div>
                    <h2>AI Đánh giá &amp; Lộ trình</h2>
                    <p className="ai-gap-sub">Phân tích lỗ hổng kiến thức từ chính bài làm này của bạn</p>
                </div>
                <span className="ai-gap-accuracy">{gap.accuracy}%<small>chính xác</small></span>
            </div>

            <p className="ai-gap-summary">{gap.summary}</p>

            {/* Biểu đồ mức độ nắm vững theo chủ đề */}
            {gap.weakTopics.length > 0 && (
                <div className="ai-gap-topics">
                    <h3>📉 Lỗ hổng kiến thức phát hiện được</h3>
                    {gap.weakTopics.map((t) => (
                        <div key={t.topic} className="ai-gap-topic-row">
                            <span className="ai-gap-topic-name">{t.topic}</span>
                            <div className="ai-gap-bar">
                                <div
                                    className={`ai-gap-bar-fill ${
                                        t.accuracy < 40 ? "bad" : t.accuracy < 70 ? "mid" : "ok"
                                    }`}
                                    style={{ width: `${Math.max(t.accuracy, 6)}%` }}
                                />
                            </div>
                            <span className="ai-gap-topic-stat">sai {t.wrong}/{t.total}</span>
                        </div>
                    ))}
                </div>
            )}

            {gap.strongTopics.length > 0 && (
                <p className="ai-gap-strong">
                    💪 Điểm mạnh: bạn làm đúng 100% các câu thuộc{" "}
                    {gap.strongTopics.map((t) => `«${t.topic}»`).join(", ")}.
                </p>
            )}

            {/* Lộ trình đề xuất */}
            <div className="ai-gap-roadmap">
                <h3>🗺️ Lộ trình AI đề xuất</h3>
                <ol>
                    {gap.recommendations.map((r, i) => (
                        <li key={i}>{r}</li>
                    ))}
                </ol>
            </div>

            <div className="ai-gap-actions">
                <Link to="/tests" className="ai-gap-btn primary">📝 Luyện đề mới để lấp lỗ hổng</Link>
                <Link to="/ai/gap-diagnosis" className="ai-gap-btn">🔬 Chẩn đoán AI chuyên sâu →</Link>
            </div>
        </section>
    );
}
