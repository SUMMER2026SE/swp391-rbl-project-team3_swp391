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

            {/* Bản Tóm Tắt Nhanh */}
            <div className="ai-gap-quick-view" style={{ margin: "20px 0" }}>
                {gap.weakTopics.length > 0 ? (
                    <div style={{ padding: "15px", background: "#fef2f2", borderRadius: "10px", borderLeft: "5px solid #ef4444" }}>
                        <h4 style={{ margin: "0 0 8px 0", color: "#b91c1c", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>⚠️</span> Lỗ hổng nghiêm trọng nhất
                        </h4>
                        <p style={{ margin: 0, color: "#7f1d1d", fontSize: "15px" }}>
                            Phần <strong>«{gap.weakTopics[0].topic}»</strong> đang yếu (Chỉ đúng {gap.weakTopics[0].accuracy}%). 
                            {gap.weakTopics.length > 1 ? ` Ngoài ra còn ${gap.weakTopics.length - 1} chủ đề khác cần cải thiện.` : ""}
                        </p>
                    </div>
                ) : (
                    <div style={{ padding: "15px", background: "#f0fdf4", borderRadius: "10px", borderLeft: "5px solid #22c55e" }}>
                        <h4 style={{ margin: "0 0 8px 0", color: "#15803d", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>🎉</span> Phong độ xuất sắc
                        </h4>
                        <p style={{ margin: 0, color: "#14532d", fontSize: "15px" }}>
                            Không phát hiện lỗ hổng nghiêm trọng nào. Tiếp tục giữ vững phong độ nhé!
                        </p>
                    </div>
                )}
            </div>

            <div className="ai-gap-actions">
                <Link to="/tests" className="ai-gap-btn primary">📝 Luyện đề mới để lấp lỗ hổng</Link>
                <Link to="/ai/gap-diagnosis" className="ai-gap-btn">🔬 Chẩn đoán AI chuyên sâu →</Link>
            </div>
        </section>
    );
}
