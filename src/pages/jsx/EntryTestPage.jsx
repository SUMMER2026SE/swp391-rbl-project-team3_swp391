import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import entryTestService from "../../services/entryTestService";
import practiceService from "../../services/practiceService";
import ConfirmModal from "../../components/ConfirmModal";
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

    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMsg, setConfirmMsg] = useState("");

    const doSubmit = async () => {
        setSubmitting(true);
        setShowConfirm(false);
        try {
            const result = await entryTestService.submit(sessionsId, answers);
            localStorage.setItem("entryTestAttempt", result.attemptId || result.sessionsId);
            navigate(`/entry-test/result/${result.attemptId || result.sessionsId}`, { state: result });
        } catch (e) {
            alert("Không thể nộp bài: " + (e.response?.data?.message || e.message));
            setSubmitting(false);
        }
    };

    const handleSubmit = async (auto = false) => {
        if (submitting) return;
        const total = questions.length;
        if (Object.keys(answers).length === 0) {
            alert("Vui lòng chọn ít nhất một đáp án trước khi nộp bài.");
            return;
        }
        if (!auto && Object.keys(answers).length < total) {
            setConfirmMsg(`Bạn còn ${total - Object.keys(answers).length} câu chưa trả lời. Vẫn nộp bài?`);
            setShowConfirm(true);
            return;
        }
        doSubmit();
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

                <div className="entry-quiz" style={{ gap: '24px', display: 'flex', flexDirection: 'column' }}>
                    {questions.map((q, idx) => (
                        <div className="etq-card" key={q.questionId} style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', border: '1px solid #f1f5f9', transition: 'all 0.3s ease' }}>
                            <h3 className="etq-title" style={{ fontSize: '18px', color: '#1e293b', marginBottom: '16px', lineHeight: '1.5' }}>
                                <span style={{ background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '14px', marginRight: '8px', fontWeight: 'bold' }}>Câu {idx + 1}</span> 
                                {q.questionContent}
                            </h3>

                            <div className="etq-options" style={{ marginTop: '16px' }}>
                                {(!q.questionType || q.questionType === "CHOICE" || q.questionType === "TRUE_FALSE") && q.options?.map((o) => (
                                    <label
                                        key={o.optionId}
                                        className={`etq-option ${
                                            answers[q.questionId] === o.optionContent ? "selected" : ""
                                        }`}
                                        style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', border: answers[q.questionId] === o.optionContent ? '2px solid #3b82f6' : '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', marginBottom: '10px', background: answers[q.questionId] === o.optionContent ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${q.questionId}`}
                                            checked={answers[q.questionId] === o.optionContent}
                                            onChange={() => choose(q.questionId, o.optionContent)}
                                            style={{ marginRight: '12px', accentColor: '#3b82f6', transform: 'scale(1.2)' }}
                                        />
                                        <span style={{ color: answers[q.questionId] === o.optionContent ? '#1e40af' : '#475569', fontWeight: answers[q.questionId] === o.optionContent ? '500' : 'normal' }}>{o.optionContent}</span>
                                    </label>
                                ))}

                                {q.questionType === "SHORT_ANSWER" && (
                                    <div style={{ marginTop: '12px' }}>
                                        <input
                                            type="text"
                                            placeholder="Nhập câu trả lời ngắn của bạn vào đây..."
                                            value={answers[q.questionId] || ""}
                                            onChange={(e) => choose(q.questionId, e.target.value)}
                                            style={{ 
                                                width: '100%', 
                                                padding: '14px 16px', 
                                                fontSize: '16px',
                                                borderRadius: '8px', 
                                                border: answers[q.questionId] ? '2px solid #3b82f6' : '1px solid #cbd5e1', 
                                                background: answers[q.questionId] ? '#eff6ff' : '#f8fafc',
                                                color: '#1e293b',
                                                outline: 'none',
                                                transition: 'all 0.2s ease',
                                                boxShadow: answers[q.questionId] ? '0 0 0 3px rgba(59, 130, 246, 0.2)' : 'none'
                                            }}
                                        />
                                        <div style={{ marginTop: '8px', fontSize: '13px', color: '#64748b', fontStyle: 'italic' }}>
                                            * Câu trả lời tự luận ngắn (1-2 từ hoặc con số).
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="entry-submit-bar">
                    <button className="entry-start-btn" disabled={submitting} onClick={() => handleSubmit(false)}>
                        {submitting ? "Đang chấm điểm..." : "Nộp bài & xem đánh giá"}
                    </button>
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
