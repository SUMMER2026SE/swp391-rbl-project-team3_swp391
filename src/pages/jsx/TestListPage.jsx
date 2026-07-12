import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import practiceService from "../../services/practiceService";
import "../css/TestListPage.css";

// Icon + màu nhấn theo môn học
const SUBJECT_META = {
    "Toán":      { icon: "📐", accent: "indigo" },
    "Vật Lý":    { icon: "⚛️", accent: "sky" },
    "Hóa Học":   { icon: "🧪", accent: "emerald" },
    "Tiếng Anh": { icon: "🌍", accent: "amber" },
};
const TYPE_LABEL = {
    ENTRY_TEST: "Kiểm tra đầu vào",
    PRACTICE: "Luyện đề",
    MOCK_EXAM: "Thi thử",
};

const fmtDate = (d) =>
    new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function TestListPage() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [startingId, setStartingId] = useState(null);

    const [tab, setTab] = useState("ENTRY"); // ENTRY | PRACTICE
    const [subjectFilter, setSubjectFilter] = useState("all");

    useEffect(() => {
        practiceService
            .getQuizzes()
            .then((data) => setQuizzes(data || []))
            .catch(() => setError("Không tải được danh sách đề thi. Kiểm tra backend đã chạy chưa."))
            .finally(() => setLoading(false));

        if (localStorage.getItem("token")) {
            practiceService.getHistory().then((h) => setHistory(h || [])).catch(() => {});
        }
    }, []);

    const subjects = useMemo(
        () => [...new Set(quizzes.map((q) => q.subject).filter(Boolean))],
        [quizzes]
    );

    const visible = useMemo(
        () =>
            quizzes.filter((q) => {
                const inTab = tab === "ENTRY" ? q.quizType === "ENTRY_TEST" : q.quizType !== "ENTRY_TEST";
                const inSubject = subjectFilter === "all" || q.subject === subjectFilter;
                return inTab && inSubject;
            }),
        [quizzes, tab, subjectFilter]
    );

    const totalBank = useMemo(() => quizzes.reduce((s, q) => s + (q.bankSize || 0), 0), [quizzes]);

    const startQuiz = async (quiz) => {
        if (!localStorage.getItem("token")) {
            alert("Vui lòng đăng nhập để làm bài thi.");
            navigate("/auth", { state: { mode: "login" } });
            return;
        }
        setStartingId(quiz.quizId);
        try {
            const session = await practiceService.start(quiz.quizId);
            navigate(`/tests/doing/${session.attemptId}`, { state: { session } });
        } catch (e) {
            alert("Không thể bắt đầu bài thi: " + (e.response?.data?.message || e.message));
        } finally {
            setStartingId(null);
        }
    };

    return (
        <div className="tl-page">
            {/* ===== HERO ===== */}
            <header className="tl-hero">
                <div className="tl-hero-glow tl-hero-glow-1" />
                <div className="tl-hero-glow tl-hero-glow-2" />
                <h1>🎓 Trung tâm Luyện thi PrepACE</h1>
                <p>
                    Kiểm tra đầu vào để định vị năng lực — Luyện đề &amp; Thi thử để bứt phá điểm số.
                    Mỗi lượt thi là một đề <b>hoàn toàn ngẫu nhiên</b> từ kho câu hỏi khổng lồ.
                </p>
                <div className="tl-hero-stats">
                    <span><b>{quizzes.length}</b> đề thi</span>
                    <span className="tl-dot">•</span>
                    <span><b>{totalBank.toLocaleString("vi-VN")}</b> câu hỏi trong kho</span>
                    <span className="tl-dot">•</span>
                    <span><b>{history.length}</b> lượt thi của bạn</span>
                </div>
            </header>

            {/* ===== TABS + FILTER ===== */}
            <div className="tl-controls">
                <div className="tl-tabs">
                    <button className={tab === "ENTRY" ? "tl-tab-active" : ""} onClick={() => setTab("ENTRY")}>
                        🎯 Kiểm tra đầu vào
                    </button>
                    <button className={tab === "PRACTICE" ? "tl-tab-active" : ""} onClick={() => setTab("PRACTICE")}>
                        📝 Luyện đề &amp; Thi thử
                    </button>
                </div>
                <div className="tl-subject-chips">
                    <button
                        className={subjectFilter === "all" ? "tl-chip-active" : ""}
                        onClick={() => setSubjectFilter("all")}
                    >
                        Tất cả môn
                    </button>
                    {subjects.map((s) => (
                        <button
                            key={s}
                            className={subjectFilter === s ? "tl-chip-active" : ""}
                            onClick={() => setSubjectFilter(s)}
                        >
                            {SUBJECT_META[s]?.icon} {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* ===== DANH SÁCH ĐỀ ===== */}
            {loading && <p className="tl-status">Đang tải danh sách đề thi...</p>}
            {error && <p className="tl-status tl-status-error">{error}</p>}
            {!loading && !error && visible.length === 0 && (
                <p className="tl-status">Chưa có đề nào trong nhóm này. Hãy chạy script sql/prepace_exam_system_v2.sql.</p>
            )}

            <div className="tl-grid">
                {visible.map((quiz, idx) => {
                    const meta = SUBJECT_META[quiz.subject] || { icon: "📖", accent: "indigo" };
                    return (
                        <article
                            key={quiz.quizId}
                            className={`tl-card tl-accent-${meta.accent}`}
                            style={{ animationDelay: `${idx * 60}ms` }}
                        >
                            <div className="tl-card-head">
                                <span className="tl-subject-icon">{meta.icon}</span>
                                <span className={`tl-type-badge tl-type-${quiz.quizType}`}>
                                    {TYPE_LABEL[quiz.quizType] || quiz.quizType}
                                </span>
                            </div>
                            <h3 className="tl-card-title">{quiz.quizTitle}</h3>
                            <div className="tl-card-meta">
                                <span>🎲 <b>{quiz.questionsPerTest} câu</b>/lượt</span>
                                <span>⏱ {quiz.durationMinutes} phút</span>
                                <span>📚 Kho {quiz.bankSize} câu</span>
                            </div>
                            <button
                                className="tl-start-btn"
                                disabled={startingId !== null}
                                onClick={() => startQuiz(quiz)}
                            >
                                {startingId === quiz.quizId ? "Đang tạo đề..." : "Bắt đầu làm bài →"}
                            </button>
                        </article>
                    );
                })}
            </div>

            {/* ===== LỊCH SỬ GẦN ĐÂY ===== */}
            {history.length > 0 && (
                <section className="tl-history">
                    <h2>🕘 Lượt thi gần đây</h2>
                    <div className="tl-history-list">
                        {history.slice(0, 6).map((h) => (
                            <Link key={h.attemptId} to={`/tests/result/${h.attemptId}`} className="tl-history-item">
                                <span
                                    className={`tl-history-score ${
                                        h.score >= 8 ? "good" : h.score >= 5 ? "mid" : "bad"
                                    }`}
                                >
                                    {h.score?.toFixed(1)}
                                </span>
                                <span className="tl-history-info">
                                    <b>{h.quizTitle}</b>
                                    <small>
                                        {h.correctCount}/{h.totalQuestions} câu đúng • {fmtDate(h.submittedAt)}
                                    </small>
                                </span>
                                <span className="tl-history-arrow">→</span>
                            </Link>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}
