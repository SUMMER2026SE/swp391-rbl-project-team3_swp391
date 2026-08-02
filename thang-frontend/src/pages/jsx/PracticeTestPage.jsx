import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import practiceService from "../../services/practiceService";
import ConfirmModal from "../../components/ConfirmModal";
import "../css/PracticeTestPage.css";

const OPTION_LABELS = ["A", "B", "C", "D"];

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export default function PracticeTestPage() {
    const navigate = useNavigate();

    // --- Chế độ danh sách đề ---
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [starting, setStarting] = useState(false);

    // --- Chế độ làm bài ---
    const [session, setSession] = useState(null);   // { attemptId, quizTitle, durationMinutes, questions }
    const [answers, setAnswers] = useState({});     // { [questionId]: optionId }
    const [timeLeft, setTimeLeft] = useState(0);    // giây
    const [submitting, setSubmitting] = useState(false);
    const questionRefs = useRef({});

    useEffect(() => {
        practiceService
            .getQuizzes()
            .then((data) => setQuizzes(data || []))
            .catch(() => setError("Không tải được danh sách đề luyện. Kiểm tra backend đã chạy chưa."))
            .finally(() => setLoading(false));
    }, []);

    const requireLogin = () => {
        if (!localStorage.getItem("token")) {
            alert("Vui lòng đăng nhập để luyện đề.");
            navigate("/auth", { state: { mode: "login" } });
            return false;
        }
        return true;
    };

    const startQuiz = async (quiz) => {
        if (!requireLogin()) return;
        setStarting(true);
        try {
            const data = await practiceService.start(quiz.quizId);
            setSession(data);
            setAnswers({});
            setTimeLeft((data.durationMinutes || 30) * 60);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {
            alert("Không thể bắt đầu luyện đề: " + (e.response?.data?.message || e.message));
        } finally {
            setStarting(false);
        }
    };

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMsg, setConfirmMsg] = useState("");

    const doSubmit = async () => {
        setSubmitting(true);
        setShowConfirm(false);
        try {
            const result = await practiceService.submit(session.attemptId, answers);
            navigate(`/practice/result/${result.attemptId}`, { state: { result } });
        } catch (e) {
            alert("Nộp bài thất bại: " + (e.response?.data?.message || e.message));
            setSubmitting(false);
        }
    };

    const handleSubmit = useCallback(
        (auto = false) => {
            if (!session || submitting) return;
            const total = session.questions.length;
            const answered = Object.keys(answers).length;
            if (!auto && answered < total) {
                setConfirmMsg(`Bạn còn ${total - answered} câu chưa trả lời. Vẫn nộp bài?`);
                setShowConfirm(true);
                return;
            }
            doSubmit();
        },
        [session, submitting, answers, navigate]
    );

    // Đồng hồ đếm ngược — hết giờ tự nộp
    useEffect(() => {
        if (!session) return;
        if (timeLeft <= 0) {
            handleSubmit(true);
            return;
        }
        const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearInterval(t);
    }, [session, timeLeft, handleSubmit]);

    const choose = (questionId, optionId) =>
        setAnswers((prev) => ({ ...prev, [questionId]: optionId }));

    const chooseTrueFalse = (questionId, optionId, val) => {
        setAnswers((prev) => {
            const currentQAns = prev[questionId] || {};
            return {
                ...prev,
                [questionId]: { ...currentQAns, [optionId]: val }
            };
        });
    };

    const scrollToQuestion = (questionId) =>
        questionRefs.current[questionId]?.scrollIntoView({ behavior: "smooth", block: "center" });

    /* ================= MÀN HÌNH LÀM BÀI ================= */
    if (session) {
        const total = session.questions.length;
        const answered = Object.keys(answers).length;
        return (
            <div className="pt-page">
                {/* Thanh trên: tiêu đề + tiến độ + đồng hồ */}
                <header className="pt-topbar">
                    <div className="pt-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <button 
                            className="td-btn-back"
                            onClick={() => {
                                if (window.confirm("Cảnh báo: Nếu thoát bây giờ, tiến trình làm bài có thể bị gián đoạn. Bạn có chắc chắn muốn trở về Trang chủ không?")) {
                                    navigate("/home");
                                }
                            }}
                            style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#64748b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                        >
                            ← Trang chủ
                        </button>
                        <h2>{session.quizTitle}</h2>
                        <span className="pt-subject-chip">{session.subject}</span>
                    </div>
                    <div className="pt-topbar-right">
                        <span className="pt-progress-text">Đã làm {answered}/{total}</span>
                        <span className={`pt-timer ${timeLeft <= 60 ? "pt-timer-danger" : ""}`}>
                            ⏱ {formatTime(Math.max(timeLeft, 0))}
                        </span>
                        <button
                            className="pt-btn pt-btn-submit"
                            disabled={submitting}
                            onClick={() => handleSubmit(false)}
                        >
                            {submitting ? "Đang nộp..." : "Nộp bài"}
                        </button>
                    </div>
                </header>

                <div className="pt-exam-layout">
                    {/* Danh sách câu hỏi */}
                    <main className="pt-questions">
                        {session.questions.map((q, idx) => (
                            <section
                                key={q.questionId}
                                className="pt-question-card"
                                ref={(el) => (questionRefs.current[q.questionId] = el)}
                            >
                                <div className="pt-question-head">
                                    <span className="pt-question-no">Câu {idx + 1}</span>
                                    {q.topic && <span className="pt-topic-chip">{q.topic}</span>}
                                </div>
                                <p className="pt-question-content">{q.questionContent}</p>
                                <div className="pt-options">
                                    {(!q.questionType || q.questionType === "CHOICE") && q.options.map((o, oi) => (
                                        <label
                                            key={o.optionId}
                                            className={`pt-option ${answers[q.questionId] === o.optionId ? "pt-option-selected" : ""}`}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${q.questionId}`}
                                                checked={answers[q.questionId] === o.optionId}
                                                onChange={() => choose(q.questionId, o.optionId)}
                                            />
                                            <span className="pt-option-label">{OPTION_LABELS[oi]}</span>
                                            <span className="pt-option-content">{o.optionContent}</span>
                                        </label>
                                    ))}
                                    {q.questionType === "TRUE_FALSE" && (
                                        <div className="pt-tf-container">
                                            {q.options.map((o, oi) => {
                                                const qAns = answers[q.questionId] || {};
                                                return (
                                                    <div key={o.optionId} className="pt-tf-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f1f5f9' }}>
                                                        <div style={{ flex: 1, paddingRight: '20px' }}>
                                                            <span className="pt-option-label" style={{ marginRight: '8px' }}>{OPTION_LABELS[oi]}</span>
                                                            <span className="pt-option-content">{o.optionContent}</span>
                                                        </div>
                                                        <div className="pt-tf-actions" style={{ display: 'flex', gap: '10px' }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: qAns[o.optionId] === true ? '#ecfdf5' : '#fff', padding: '6px 12px', borderRadius: '4px', border: qAns[o.optionId] === true ? '1px solid #10b981' : '1px solid #cbd5e1', color: qAns[o.optionId] === true ? '#047857' : '#475569', fontWeight: qAns[o.optionId] === true ? 'bold' : 'normal' }}>
                                                                <input type="radio" name={`tf-${q.questionId}-${o.optionId}`} checked={qAns[o.optionId] === true} onChange={() => chooseTrueFalse(q.questionId, o.optionId, true)} style={{ display: 'none' }} />
                                                                Đúng
                                                            </label>
                                                            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', background: qAns[o.optionId] === false ? '#fef2f2' : '#fff', padding: '6px 12px', borderRadius: '4px', border: qAns[o.optionId] === false ? '1px solid #ef4444' : '1px solid #cbd5e1', color: qAns[o.optionId] === false ? '#b91c1c' : '#475569', fontWeight: qAns[o.optionId] === false ? 'bold' : 'normal' }}>
                                                                <input type="radio" name={`tf-${q.questionId}-${o.optionId}`} checked={qAns[o.optionId] === false} onChange={() => chooseTrueFalse(q.questionId, o.optionId, false)} style={{ display: 'none' }} />
                                                                Sai
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    {q.questionType === "SHORT_ANSWER" && (
                                        <input
                                            type="text"
                                            className="pt-short-answer-input"
                                            placeholder="Nhập câu trả lời ngắn của bạn..."
                                            value={answers[q.questionId] || ""}
                                            onChange={(e) => choose(q.questionId, e.target.value)}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '10px' }}
                                        />
                                    )}
                                    {q.questionType === "ESSAY" && (
                                        <textarea
                                            className="pt-essay-input"
                                            placeholder="Nhập câu trả lời tự luận của bạn..."
                                            value={answers[q.questionId] || ""}
                                            onChange={(e) => choose(q.questionId, e.target.value)}
                                            rows={6}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', marginTop: '10px', resize: 'vertical' }}
                                        />
                                    )}
                                </div>
                            </section>
                        ))}
                        <button
                            className="pt-btn pt-btn-submit pt-btn-bottom"
                            disabled={submitting}
                            onClick={() => handleSubmit(false)}
                        >
                            {submitting ? "Đang nộp..." : `📤 Nộp bài (${Object.keys(answers).length}/${session.questions.length})`}
                        </button>
                    </main>

                    {/* Bảng điều hướng câu hỏi */}
                    <aside className="pt-navigator">
                        <h4>Danh sách câu</h4>
                        <div className="pt-navigator-grid">
                            {session.questions.map((q, idx) => (
                                <button
                                    key={q.questionId}
                                    className={`pt-nav-cell ${answers[q.questionId] != null ? "pt-nav-done" : ""}`}
                                    onClick={() => scrollToQuestion(q.questionId)}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                        <div className="pt-navigator-legend">
                            <span><i className="pt-dot pt-dot-done" /> Đã trả lời</span>
                            <span><i className="pt-dot" /> Chưa trả lời</span>
                        </div>
                    </aside>
                </div>
                <ConfirmModal
                    isOpen={showConfirm}
                    title="Xác nhận nộp bài"
                    message={confirmMsg}
                    onConfirm={doSubmit}
                    onCancel={() => setShowConfirm(false)}
                    confirmText="Vẫn nộp bài"
                />
            </div>
        );
    }

    /* ================= MÀN HÌNH CHỌN ĐỀ ================= */
    return (
        <div className="pt-page">
            <header className="pt-hero">
                <h1>📝 Luyện Đề</h1>
                <p>Mỗi lượt gồm 25 câu hỏi được chọn ngẫu nhiên từ kho đề — mỗi lần làm là một đề khác nhau.</p>
            </header>

            {loading && <p className="pt-status">Đang tải danh sách đề...</p>}
            {error && <p className="pt-status pt-status-error">{error}</p>}
            {!loading && !error && quizzes.length === 0 && (
                <p className="pt-status">Chưa có đề luyện nào. Hãy chạy script seed câu hỏi trước.</p>
            )}

            <div className="pt-quiz-list">
                {quizzes.map((quiz) => (
                    <div key={quiz.quizId} className="pt-quiz-card">
                        <div className="pt-quiz-info">
                            <h3>{quiz.quizTitle}</h3>
                            <div className="pt-quiz-meta">
                                <span>📚 {quiz.subject}</span>
                                <span>⏱ {quiz.durationMinutes} phút</span>
                                <span>🎲 {quiz.questionsPerTest} câu / kho {quiz.bankSize} câu</span>
                            </div>
                        </div>
                        <button
                            className="pt-btn pt-btn-start"
                            disabled={starting}
                            onClick={() => startQuiz(quiz)}
                        >
                            {starting ? "Đang tạo đề..." : "Bắt đầu luyện"}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
