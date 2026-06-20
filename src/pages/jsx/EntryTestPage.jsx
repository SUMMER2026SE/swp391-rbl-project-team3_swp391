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
    const [activeQuiz, setActiveQuiz] = useState(null);    // quiz metadata đang chọn
    const [sessionsId, setSessionsId] = useState(null);    // sessionsId từ backend
    const [questions, setQuestions] = useState([]);          // 20 câu hỏi ngẫu nhiên
    const [answers, setAnswers] = useState({});              // { questionId: optionContent }
    const [submitting, setSubmitting] = useState(false);
    const [starting, setStarting] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);             // đếm ngược (giây)

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

    const startQuiz = async (quiz) => {
        if (!requireLogin()) return;
        setStarting(true);
        try {
            // Gọi API bắt đầu bài thi → nhận sessionsId + 20 câu hỏi ngẫu nhiên
            const data = await entryTestService.start(quiz.quizId);
            setActiveQuiz(quiz);
            setSessionsId(data.sessionsId);
            setQuestions(data.questions || []);
            setAnswers({});
            setTimeLeft(data.remainingTime || (quiz.durationMinutes || 20) * 60);
            window.scrollTo({ top: 0, behavior: "smooth" });
        } catch (e) {
            alert("Không thể bắt đầu bài thi: " + (e.response?.data?.message || e.message));
        } finally {
            setStarting(false);
        }
    };

    // Đếm ngược thời gian; hết giờ tự động nộp bài
    useEffect(() => {
        if (!sessionsId) return;
        if (timeLeft <= 0) { handleSubmit(true); return; }
        const t = setInterval(() => setTimeLeft((s) => s - 1), 1000);
        return () => clearInterval(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionsId, timeLeft]);

    const choose = (questionId, optionContent) =>
        setAnswers((prev) => ({ ...prev, [questionId]: optionContent }));

    const handleSubmit = async (auto = false) => {
        if (submitting) return;
        const total = questions.length;
        if (!auto && Object.keys(answers).length < total) {
            if (!window.confirm("Bạn còn câu chưa trả lời. Vẫn nộp bài?")) return;
        }
        try {
            setSubmitting(true);
            const result = await entryTestService.submit(sessionsId, answers);
            localStorage.setItem("entryTestAttempt", result.attemptId || result.sessionsId);
            navigate(`/entry-test/result/${result.attemptId || result.sessionsId}`, { state: result });
        } catch (e) {
            alert("Không thể nộp bài: " + (e.response?.data?.message || e.message));
            setSubmitting(false);
        }
    };

    const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    const goBack = () => {
        setActiveQuiz(null);
        setSessionsId(null);
        setQuestions([]);
        setAnswers({});
    };

    // ─── Màn hình làm bài ────────────────────────────────────────────────────────
    if (sessionsId && questions.length > 0) {
        const total = questions.length;
        const answered = Object.keys(answers).length;
        return (
            <div className="entry-page">
                <header className="entry-header">
                    <span className="back-btn" onClick={goBack}>← Chọn đề khác</span>
                    <h1>{activeQuiz?.quizTitle || "Bài kiểm tra đầu vào"}</h1>
                    <p>
                        Đã trả lời <strong>{answered}/{total}</strong> câu
                        <span style={{ marginLeft: 16, fontWeight: 700, color: timeLeft < 60 ? "#ef4444" : "#0068ff" }}>
                            ⏱️ {fmtTime(timeLeft)}
                        </span>
                    </p>
                </header>

                <div className="entry-quiz">
                    {questions.map((q, idx) => (
                        <div className="etq-card" key={q.questionId}>
                            <h3 className="etq-title">Câu {idx + 1}. {q.content}</h3>
                            <div className="etq-options">
                                {q.options && q.options.map((o) => (
                                    <label
                                        key={o.optionId}
                                        className={`etq-option ${answers[q.questionId] === o.content ? "selected" : ""}`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${q.questionId}`}
                                            checked={answers[q.questionId] === o.content}
                                            onChange={() => choose(q.questionId, o.content)}
                                        />
                                        <span>{o.content}</span>
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
                    <h3>20 câu ngẫu nhiên</h3>
                    <p>Mỗi lần thi, hệ thống bốc 20 câu từ kho đề lớn.</p>
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
                                    <span>📝 20 câu ngẫu nhiên (kho: {q.totalQuestions})</span>
                                </div>
                            </div>
                            <button className="entry-start-btn" disabled={starting} onClick={() => startQuiz(q)}>
                                {starting ? "Đang chuẩn bị..." : "Bắt đầu kiểm tra"}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
