import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AiGapAnalysis from "./AiGapAnalysis";
import "../css/PracticeResultPage.css"; // Reuse the beautiful PracticeResultPage CSS

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function EntryTestResultPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { sessionsId } = useParams();
    
    // We rely on location.state from submit. 
    // Since there's no getAssessment API, if state is null, we tell them to re-take.
    const [result, setResult] = useState(location.state || null);
    const [filter, setFilter] = useState("all");
    const [loading, setLoading] = useState(!location.state);

    useEffect(() => {
        if (!result && sessionsId) {
            import("../../api/axiosClient").then(({ default: axiosClient }) => {
                axiosClient.get(`/entry-test/assessment/${sessionsId}`)
                    .then(res => {
                        setResult(res.data);
                        setLoading(false);
                    })
                    .catch(err => {
                        console.error("Lỗi lấy dữ liệu bài kiểm tra:", err);
                        setLoading(false);
                    });
            });
        } else {
            setLoading(false);
        }
    }, [sessionsId, result]);

    if (loading) {
        return <div className="pr-page"><p className="pr-status">Đang tải dữ liệu bài kiểm tra...</p></div>;
    }

    if (!result) {
        return (
            <div className="pr-page">
                <p className="pr-status">Không tìm thấy dữ liệu bài kiểm tra. Vui lòng làm bài lại.</p>
                <button className="pr-btn pr-btn-primary" onClick={() => navigate("/entry-test")}>Quay lại</button>
            </div>
        );
    }

    const filteredDetails = (result.details || []).filter((d) => {
        if (filter === "wrong") return !d.isCorrect;
        if (filter === "correct") return d.isCorrect;
        return true;
    });

    const scoreClass = result.score >= 8 ? "pr-score-good" : result.score >= 5 ? "pr-score-mid" : "pr-score-bad";

    return (
        <div className="pr-page">
            {/* ============ TỔNG QUAN ĐIỂM ============ */}
            <header className="pr-summary">
                <div className={`pr-score-circle ${scoreClass}`}>
                    <span className="pr-score-value">{result.score?.toFixed(2)}</span>
                    <span className="pr-score-label">/ 10 điểm</span>
                </div>
                <div className="pr-summary-info">
                    <h1>Kết quả Kiểm tra đầu vào: {result.quizTitle}</h1>
                    <div className="pr-stats">
                        <div className="pr-stat pr-stat-correct">
                            <strong>{result.correctCount}</strong><span>Câu đúng</span>
                        </div>
                        <div className="pr-stat pr-stat-wrong">
                            <strong>{result.totalQuestions - result.correctCount}</strong><span>Câu sai</span>
                        </div>
                        <div className="pr-stat">
                            <strong>{result.level}</strong><span>Đánh giá năng lực</span>
                        </div>
                        <div className="pr-stat">
                            <strong>{result.totalQuestions}</strong><span>Tổng số câu</span>
                        </div>
                    </div>
                    <div className="pr-actions">
                        <button className="pr-btn pr-btn-primary" onClick={() => navigate("/adaptive-path")}>
                            🚀 Xem lộ trình học cá nhân hóa
                        </button>
                        <button className="pr-btn" onClick={() => navigate("/tests")}>Làm bài khác</button>
                    </div>
                </div>
            </header>

            {/* ============ 🤖 AI ĐÁNH GIÁ & LỘ TRÌNH ============ */}
            <AiGapAnalysis
                items={(result.details || []).map((d) => ({
                    topic: d.topic,
                    correct: !!d.isCorrect,
                    answered: d.selectedAnswer != null,
                }))}
            />

            {/* ============ BỘ LỌC XEM LẠI ============ */}
            <div className="pr-filter">
                <button className={filter === "all" ? "pr-filter-active" : ""} onClick={() => setFilter("all")}>
                    Tất cả ({(result.details || []).length})
                </button>
                <button className={filter === "wrong" ? "pr-filter-active" : ""} onClick={() => setFilter("wrong")}>
                    ❌ Câu sai ({(result.details || []).length - result.correctCount})
                </button>
                <button className={filter === "correct" ? "pr-filter-active" : ""} onClick={() => setFilter("correct")}>
                    ✅ Câu đúng ({result.correctCount})
                </button>
            </div>

            {/* ============ CHI TIẾT TỪNG CÂU ============ */}
            <main className="pr-review-list">
                {filteredDetails.map((d, idx) => (
                    <section
                        key={d.questionId}
                        className={`pr-question-card ${d.isCorrect ? "pr-card-correct" : "pr-card-wrong"}`}
                    >
                        <div className="pr-question-head">
                            <span className="pr-question-no">Câu {idx + 1}</span>
                            {d.isCorrect ? (
                                <span className="pr-badge pr-badge-correct">✔ Đúng</span>
                            ) : d.selectedAnswer ? (
                                <span className="pr-badge pr-badge-wrong">✘ Sai</span>
                            ) : (
                                <span className="pr-badge pr-badge-skip">— Bỏ trống</span>
                            )}
                        </div>

                        <p className="pr-question-content">{d.questionContent}</p>

                        <div className="pr-options">
                            {/* Vì API chỉ trả về selectedAnswer và correctAnswer dạng string, ta render chúng trực tiếp */}
                            <div className={`pr-option ${d.isCorrect ? "pr-option-correct" : "pr-option-wrong"}`}>
                                <span className="pr-option-label">➤</span>
                                <span className="pr-option-content">{d.selectedAnswer || "Không trả lời"}</span>
                                <span className="pr-option-tag pr-tag-you">Bạn chọn</span>
                            </div>
                            {!d.isCorrect && (
                                <div className="pr-option pr-option-correct">
                                    <span className="pr-option-label">✓</span>
                                    <span className="pr-option-content">{d.correctAnswer}</span>
                                    <span className="pr-option-tag pr-tag-key">Đáp án đúng</span>
                                </div>
                            )}
                        </div>

                        {/* Box giải thích chi tiết lỗi sai */}
                        {d.explanation && (
                            <div className={`pr-explanation ${d.isCorrect ? "" : "pr-explanation-wrong"}`}>
                                <div className="pr-explanation-title">
                                    {d.isCorrect ? "💡 Giải thích" : "🔍 Giải thích chi tiết — lỗi sai ở đâu?"}
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
