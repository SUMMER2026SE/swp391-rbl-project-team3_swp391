import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import practiceService from "../../services/practiceService";
import AiGapAnalysis from "./AiGapAnalysis";
import "../css/PracticeResultPage.css";

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function PracticeResultPage() {
    const { attemptId } = useParams();
    const location = useLocation();

    // Ưu tiên result truyền qua navigate state (nộp bài xong hiển thị ngay);
    // nếu F5 hoặc mở từ lịch sử thì fetch lại theo attemptId.
    const [result, setResult] = useState(location.state?.result || null);
    const [loading, setLoading] = useState(!location.state?.result);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState("all"); // all | wrong | correct

    useEffect(() => {
        if (result) return;
        practiceService
            .getResult(attemptId)
            .then(setResult)
            .catch((e) => setError(e.response?.data?.message || "Không tải được kết quả."))
            .finally(() => setLoading(false));
    }, [attemptId, result]);

    // Tự động phân loại danh sách câu hỏi theo tab được chọn
    const filteredDetails = useMemo(() => {
        if (!result || !result.details) return [];

        return result.details.filter((d) => {
            const type = d.questionType || d.question_type;
            const isPendingEssay = (type === "ESSAY" || d.questionType === "ESSAY") && (d.score === null || d.score === undefined);

            if (filter === "wrong") {
                // Câu sai thực sự: không đúng, không phải tự luận đang chờ chấm, và có câu trả lời
                return !d.correct && !isPendingEssay && d.answered;
            }
            if (filter === "correct") {
                return d.correct;
            }
            if (filter === "pending") {
                // Nhóm chờ chấm bài
                return isPendingEssay;
            }
            return true; // Tab "Tất cả"
        });
    }, [result, filter]);

    // Tính toán động số lượng câu cho từng Tab hiển thị
    const counts = useMemo(() => {
        if (!result || !result.details) return { all: 0, correct: 0, wrong: 0, pending: 0 };

        let correct = 0;
        let wrong = 0;
        let pending = 0;

        result.details.forEach((d) => {
            const type = d.questionType || d.question_type;
            const isPendingEssay = (type === "ESSAY" || d.questionType === "ESSAY") && (d.score === null || d.score === undefined);
            if (d.correct) correct++;
            else if (isPendingEssay) pending++;
            else if (d.answered) wrong++;
        });

        return { all: result.details.length, correct, wrong, pending };
    }, [result]);

    if (loading) return <div className="pr-page"><p className="pr-status">Đang tải kết quả...</p></div>;
    if (error) return <div className="pr-page"><p className="pr-status pr-status-error">{error}</p></div>;
    if (!result) return null;

    const scoreClass =
        result.score >= 8 ? "pr-score-good" : result.score >= 5 ? "pr-score-mid" : "pr-score-bad";

    return (
        <div className="pr-page">
            {/* ============ TỔNG QUAN ĐIỂM ============ */}
            <header className="pr-summary">
                <div className={`pr-score-circle ${scoreClass}`}>
                    <span className="pr-score-value">{result.score?.toFixed(2)}</span>
                    <span className="pr-score-label">/ 10 điểm</span>
                </div>
                <div className="pr-summary-info">
                    <h1>{result.quizTitle}</h1>
                    <div className="pr-stats">
                        <div className="pr-stat pr-stat-correct">
                            <strong>{result.correctCount}</strong><span>Câu đúng</span>
                        </div>
                        <div className="pr-stat pr-stat-wrong">
                            <strong>{result.wrongCount}</strong><span>Câu sai</span>
                        </div>
                        <div className="pr-stat pr-stat-skip">
                            <strong>{result.unansweredCount}</strong><span>Bỏ trống</span>
                        </div>
                        <div className="pr-stat">
                            <strong>{result.totalQuestions}</strong><span>Tổng số câu</span>
                        </div>
                    </div>
                    <div className="pr-actions">
                        <Link to="/tests" className="pr-btn pr-btn-primary">🔄 Luyện đề khác</Link>
                        <Link to="/" className="pr-btn">Về trang chủ</Link>
                    </div>
                </div>
            </header>

            {/* ============ 🤖 AI ĐÁNH GIÁ & LỘ TRÌNH ============ */}
            <AiGapAnalysis
                items={result.details.map((d) => ({
                    topic: d.topic,
                    correct: d.correct,
                    answered: d.answered,
                }))}
            />

            {/* ============ BỘ LỌC XEM LẠI ============ */}
            {/* ============ BỘ LỌC XEM LẠI ĐÃ ĐƯỢC PHÂN LOẠI CHUẨN ============ */}
            <div className="pr-filter">
                <button className={filter === "all" ? "pr-filter-active" : ""} onClick={() => setFilter("all")}>
                    Tất cả ({counts.all})
                </button>
                <button className={filter === "correct" ? "pr-filter-active" : ""} onClick={() => setFilter("correct")}>
                    ✅ Câu đúng ({counts.correct})
                </button>
                <button className={filter === "wrong" ? "pr-filter-active" : ""} onClick={() => setFilter("wrong")}>
                    ❌ Câu sai ({counts.wrong})
                </button>
                {/* Nếu bài làm có câu tự luận thì tự động mở thêm Tab Chờ Chấm */}
                {counts.pending > 0 && (
                    <button className={filter === "pending" ? "pr-filter-active" : ""} onClick={() => setFilter("pending")} style={{ color: "#b45309" }}>
                        ⏳ Chờ chấm ({counts.pending})
                    </button>
                )}
            </div>

            {/* ============ CHI TIẾT TỪNG CÂU ============ */}
            <main className="pr-review-list">
                {filteredDetails.map((d) => (
                    <section
                        key={d.questionId}
                        className={`pr-question-card ${d.correct
                                ? "pr-card-correct"
                                : (d.questionType === "ESSAY" && (d.score === null || d.score === undefined))
                                    ? "pr-card-pending"
                                    : "pr-card-wrong"
                            }`}
                        style={{
                            borderLeft: d.correct
                                ? "5px solid #10b981"
                                : (d.questionType === "ESSAY" && (d.score === null || d.score === undefined))
                                    ? "5px solid #f59e0b" // Chưa chấm -> Viền vàng cam
                                    : "5px solid #ef4444"  // Đã chấm sai (score = 0) -> Đổi sang viền đỏ chuẩn câu sai
                        }}
                    >
                        <div className="pr-question-head">
                            <span className="pr-question-no">Câu {d.questionOrder}</span>
                            {d.topic && <span className="pr-topic-chip">{d.topic}</span>}
                            {d.correct ? (
    <span className="pr-badge pr-badge-correct">✔ Đúng</span>
) : (d.questionType === "ESSAY" && (d.score === null || d.score === undefined)) ? (
    <span className="pr-badge pr-badge-pending" style={{ background: "#fffbeb", color: "#b45309", border: "1px solid #fde68a", padding: "4px 8px", borderRadius: "4px", fontSize: "12px", fontWeight: "600" }}>
        ⏳ Chờ chấm
    </span>
) : d.answered ? (
    <span className="pr-badge pr-badge-wrong">✘ Sai</span>
) : (
    <span className="pr-badge pr-badge-skip">— Bỏ trống</span>
)}
                        </div>

<p className="pr-question-content" dangerouslySetInnerHTML={{ __html: d.questionContent }} />
                        <div className="pr-options">
                            {(!d.options || d.options.length === 0) ? (
    <div className="pr-essay-review-box" style={{ padding: "15px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", marginTop: "10px" }}>
        <div style={{ marginBottom: "5px" }}>
            {/* Tự động đổi tiêu đề nếu là câu trả lời ngắn */}
            <strong style={{ color: "#64748b", fontSize: "14px" }}>
                {d.questionType === "SHORT_ANSWER" ? "⌨️ Câu trả lời của bạn:" : "✍️ Bài làm của bạn:"}
            </strong>
            <p style={{ margin: "8px 0 0 0", color: "#1e293b", fontWeight: "500", fontSize: "15px", whiteSpace: "pre-wrap", background: "#fff", padding: "10px", borderRadius: "6px", border: "1px solid #f1f5f9" }}>
                {d.essayAnswer || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>Học sinh bỏ trống không trả lời câu này</span>}
            </p>
        </div>
    </div>
                            ) : d.questionType === "TRUE_FALSE" ? (
                                /* HIỂN THỊ ĐÚNG/SAI */
                                <div className="pr-tf-review">
                                    {(() => {
                                        let studentAnswers = {};
                                        try {
                                            studentAnswers = JSON.parse(d.essayAnswer || "{}");
                                        } catch (e) {
                                            studentAnswers = {};
                                        }
                                        return d.options.map((o, oi) => {
                                            const sAns = studentAnswers[o.optionId];
                                            const isMatch = sAns === o.correct;
                                            return (
                                                <div key={o.optionId} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #f1f5f9', background: isMatch ? '#f0fdf4' : (sAns !== undefined ? '#fef2f2' : '#fff') }}>
                                                    <div style={{ flex: 1 }}>
                                                        <span className="pr-option-label" style={{ marginRight: '8px' }}>{OPTION_LABELS[oi]}</span>
<span className="pr-option-content" dangerouslySetInnerHTML={{ __html: o.optionContent }} />                                                    </div>
                                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                        <div>
                                                            <span style={{ fontSize: '12px', color: '#64748b' }}>Bạn chọn: </span>
                                                            <strong style={{ color: sAns === true ? '#047857' : (sAns === false ? '#b91c1c' : '#94a3b8') }}>
                                                                {sAns === true ? "Đúng" : (sAns === false ? "Sai" : "Trống")}
                                                            </strong>
                                                        </div>
                                                        <div>
                                                            <span style={{ fontSize: '12px', color: '#64748b' }}>Đáp án: </span>
                                                            <strong style={{ color: o.correct === true ? '#047857' : '#b91c1c' }}>
                                                                {o.correct === true ? "Đúng" : "Sai"}
                                                            </strong>
                                                        </div>
                                                        <div style={{ width: '20px', textAlign: 'center' }}>
                                                            {isMatch ? <span style={{ color: '#10b981' }}>✔</span> : <span style={{ color: '#ef4444' }}>✘</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            ) : (
                                /* TRẮC NGHIỆM TRUYỀN THỐNG GIỮ NGUYÊN CODE CŨ */
                                d.options.map((o, oi) => {
                                    let cls = "pr-option";
                                    if (o.correct) cls += " pr-option-correct";
                                    else if (o.selected) cls += " pr-option-wrong";
                                    return (
                                        <div key={o.optionId} className={cls}>
                                            <span className="pr-option-label">{OPTION_LABELS[oi]}</span>
<span className="pr-option-content" dangerouslySetInnerHTML={{ __html: o.optionContent }} />
                                            {o.selected && (
                                                <span className="pr-option-tag pr-tag-you">Bạn chọn</span>
                                            )}
                                            {o.correct && (
                                                <span className="pr-option-tag pr-tag-key">Đáp án đúng</span>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Box đánh giá của AI hoặc điểm (Cho Tự luận / Trả lời ngắn) */}
                        {d.questionType && (d.questionType === "ESSAY" || d.questionType === "SHORT_ANSWER") && (d.score !== null && d.score !== undefined) && (
                            <div className={`pr-explanation ${d.correct ? "pr-explanation-correct" : "pr-explanation-wrong"}`} style={{ marginTop: "15px", backgroundColor: d.correct ? "#f0fdf4" : "#fef2f2", borderColor: d.correct ? "#bbf7d0" : "#fecaca" }}>
                                <div className="pr-explanation-title" style={{ color: d.correct ? "#166534" : "#991b1b" }}>
                                    {d.questionType === "ESSAY" ? "🤖 Nhận xét từ AI (Giáo viên)" : "✔️ Đánh giá câu trả lời ngắn"}
                                    <span style={{ float: "right", fontWeight: "bold" }}>Điểm: <span style={{ color: d.correct ? "#16a34a" : "#dc2626" }}>{d.score.toFixed(1)}/10.0</span></span>
                                </div>
                                {d.teacherComment && (
                                    <p style={{ marginTop: "10px", fontSize: "14.5px", lineHeight: "1.5" }}>{d.teacherComment}</p>
                                )}
                            </div>
                        )}

                        {/* Box giải thích chi tiết lỗi sai truyền thống */}
{d.questionType && d.questionType === "ESSAY" && (d.score !== null && d.score !== undefined) && (                            <div className={`pr-explanation ${d.correct ? "" : "pr-explanation-wrong"}`}>
                                <div className="pr-explanation-title">
                                    {d.correct ? "💡 Giải thích / Đáp án" : "🔍 Giải thích chi tiết — lỗi sai ở đâu?"}
                                </div>
                                <p dangerouslySetInnerHTML={{ __html: d.explanation }} />
                            </div>
                        )}
                    </section>
                ))}
                {filteredDetails.length === 0 && (
                    <p className="pr-status">Không có câu nào trong nhóm này. 🎉</p>
                )}
            </main>
        </div>
    );
}
