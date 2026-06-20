import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import entryTestService from "../../services/entryTestService";
import "../css/EntryTestPage.css";

export default function EntryTestPage() {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // chế độ làm bài
    const [active, setActive] = useState(null);   // quiz đang làm
    const [answers, setAnswers] = useState({});    // { questionId: optionContent }
    const [submitting, setSubmitting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);   // đếm ngược (giây)

    const lastAttempt = localStorage.getItem("entryTestAttempt");

    useEffect(() => {
        entryTestService
            .getQuizzes()
            .then((data) => setQuizzes(data || []))
            .catch(() => setError("Không tải được danh sách bài kiểm tra."))
            .finally(() => setLoading(false));
    }, []);

    const requireLogin = () => {
        if (!localStorage.getItem("token")) {
            alert("Vui lòng đăng nhập để làm bài kiểm tra đầu vào.");
            navigate("/auth", { state: { mode: "login" } });
            return false;
        }
        return true;
    };

    const startQuiz = (quiz) => {
        if (!requireLogin()) return;
        setActive(quiz);
        setAnswers({});
        setTimeLeft((quiz.durationMinutes || 20) * 60);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // Đếm ngược thời gian; hết giờ tự động nộp bài
    useEffect(() => {
        if (!active) return;
        if (timeLeft <= 0) { handleSubmit(true); return; }
        const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active, timeLeft]);

    const choose = (questionId, optionContent) =>
        setAnswers((prev) => ({ ...prev, [questionId]: optionContent }));

    const handleSubmit = async (auto = false) => {
        if (submitting) return;
        const total = active.questions?.length || 0;
        if (!auto && Object.keys(answers).length < total) {
            if (!window.confirm("Bạn còn câu chưa trả lời. Vẫn nộp bài?")) return;
        }
        try {
            setSubmitting(true);
            const result = await entryTestService.submit(active.quizId, answers);
            localStorage.setItem("entryTestAttempt", result.attemptId);
            navigate(`/entry-test/result/${result.attemptId}`, { state: result });
        } catch (e) {
            alert("Không thể nộp bài: " + (e.response?.data?.message || e.message));
            setSubmitting(false);
        }
    };

    const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    // ─── Màn hình làm bài ────────────────────────────────────────────────────────
    if (active) {
        const total = active.questions?.length || 0;
        const answered = Object.keys(answers).length;
        return (
            <div className="entry-page">
                <header className="entry-header">
                    <span className="back-btn" onClick={() => setActive(null)}>← Chọn đề khác</span>
                    <h1>{active.quizTitle}</h1>
                    <p>
                        Đã trả lời <strong>{answered}/{total}</strong> câu
                        <span style={{ marginLeft: 16, fontWeight: 700, color: timeLeft < 60 ? "#ef4444" : "#0068ff" }}>
                            ⏱️ {fmtTime(timeLeft)}
                        </span>
                    </p>
                </header>

                <div className="entry-quiz">
                    {active.questions.map((q, idx) => (
                        <div className="etq-card" key={q.questionId}>
                            <h3 className="etq-title">Câu {idx + 1}. {q.questionContent}</h3>
                            <div className="etq-options">
                                {q.options.map((o) => (
                                    <label
                                        key={o.optionId}
                                        className={`etq-option ${answers[q.questionId] === o.optionContent ? "selected" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${q.questionId}`}
                                            checked={answers[q.questionId] === o.optionContent}
                                            onChange={() => choose(q.questionId, o.optionContent)}
                                        />
                                        <span>{o.optionContent}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="entry-submit-bar">
                    <button className="entry-start-btn" disabled={submitting} onClick={() => handleSubmit(false)}>
                        {submitting ? "Đang chấm điểm..." : "Nộp bài & xem đánh giá"}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Màn hình danh sách đề ───────────────────────────────────────────────────
    return (
        <div className="entry-page">
            <header className="entry-header">
                <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại Trang chủ</span>
                <h1>🎯 Kiểm tra đầu vào</h1>
                <p>Làm bài kiểm tra để PrepAce đánh giá <strong>năng lực gốc</strong> và xây dựng lộ trình học cá nhân hóa cho bạn.</p>
            </header>

            <div className="entry-intro">
                <div className="intro-card">
                    <span className="intro-icon">⏱️</span>
                    <h3>Thời gian linh hoạt</h3>
                    <p>Đề thi tự động canh giờ theo từng môn học.</p>
                </div>
                <div className="intro-card">
                    <span className="intro-icon">🧠</span>
                    <h3>Đánh giá chính xác</h3>
                    <p>Phân loại trình độ Yếu / TB / Khá / Giỏi.</p>
                </div>
                <div className="intro-card">
                    <span className="intro-icon">🗺️</span>
                    <h3>Gợi ý lộ trình</h3>
                    <p>Đề xuất điểm xuất phát phù hợp năng lực.</p>
                </div>
            </div>

            {lastAttempt && (
                <div className="entry-resume">
                    <span>Bạn đã có một bài kiểm tra gần đây.</span>
                    <button onClick={() => navigate(`/entry-test/result/${lastAttempt}`)}>
                        Xem đánh giá năng lực →
                    </button>
                </div>
            )}

            <h2 className="entry-section-title">Chọn đề kiểm tra</h2>

            {loading ? (
                <p className="entry-status">Đang tải danh sách bài kiểm tra...</p>
            ) : error ? (
                <p className="entry-status error">{error}</p>
            ) : quizzes.length === 0 ? (
                <p className="entry-status">Chưa có đề kiểm tra đầu vào nào trong hệ thống.</p>
            ) : (
                <div className="entry-grid">
                    {quizzes.map((q) => (
                        <div className="entry-card" key={q.quizId}>
                            <div className="entry-card-body">
                                <h3>{q.quizTitle}</h3>
                                <div className="entry-meta">
                                    <span>⏱️ {q.durationMinutes} phút</span>
                                    <span>📝 {q.questions?.length || 0} câu</span>
                                </div>
                            </div>
                            <button className="entry-start-btn" onClick={() => startQuiz(q)}>
                                Bắt đầu kiểm tra
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
