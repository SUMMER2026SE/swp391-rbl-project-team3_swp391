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

    const filteredDetails = useMemo(() => {
        if (!result) return [];
        if (filter === "wrong") return result.details.filter((d) => !d.correct);
        if (filter === "correct") return result.details.filter((d) => d.correct);
        return result.details;
    }, [result, filter]);

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
            <div className="pr-filter">
                <button className={filter === "all" ? "pr-filter-active" : ""} onClick={() => setFilter("all")}>
                    Tất cả ({result.details.length})
                </button>
                <button className={filter === "wrong" ? "pr-filter-active" : ""} onClick={() => setFilter("wrong")}>
                    ❌ Câu sai ({result.details.length - result.correctCount})
                </button>
                <button className={filter === "correct" ? "pr-filter-active" : ""} onClick={() => setFilter("correct")}>
                    ✅ Câu đúng ({result.correctCount})
                </button>
            </div>

            {/* ============ CHI TIẾT TỪNG CÂU ============ */}
            <main className="pr-review-list">
                {filteredDetails.map((d) => (
                    <section
                        key={d.questionId}
                        className={`pr-question-card ${d.correct ? "pr-card-correct" : "pr-card-wrong"}`}
                    >
                        <div className="pr-question-head">
                            <span className="pr-question-no">Câu {d.questionOrder}</span>
                            {d.topic && <span className="pr-topic-chip">{d.topic}</span>}
                            {d.correct ? (
                                <span className="pr-badge pr-badge-correct">✔ Đúng</span>
                            ) : d.answered ? (
                                <span className="pr-badge pr-badge-wrong">✘ Sai</span>
                            ) : (
                                <span className="pr-badge pr-badge-skip">— Bỏ trống</span>
                            )}
                        </div>

                        <p className="pr-question-content">{d.questionContent}</p>

                        <div className="pr-options">
                            {d.options.map((o, oi) => {
                                // Xanh: đáp án đúng thật sự. Đỏ: đáp án user chọn nhưng sai.
                                let cls = "pr-option";
                                if (o.correct) cls += " pr-option-correct";
                                else if (o.selected) cls += " pr-option-wrong";
                                return (
                                    <div key={o.optionId} className={cls}>
                                        <span className="pr-option-label">{OPTION_LABELS[oi]}</span>
                                        <span className="pr-option-content">{o.optionContent}</span>
                                        {o.selected && (
                                            <span className="pr-option-tag pr-tag-you">Bạn chọn</span>
                                        )}
                                        {o.correct && (
                                            <span className="pr-option-tag pr-tag-key">Đáp án đúng</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Box giải thích chi tiết lỗi sai */}
                        {d.explanation && (
                            <div className={`pr-explanation ${d.correct ? "" : "pr-explanation-wrong"}`}>
                                <div className="pr-explanation-title">
                                    {d.correct ? "💡 Giải thích" : "🔍 Giải thích chi tiết — lỗi sai ở đâu?"}
                                </div>
                                <p>{d.explanation}</p>
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
