import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import practiceService from "../../services/practiceService";
import "../css/TestDoingPage.css";
import ConfirmModal from "../../components/ConfirmModal";

const OPTION_LABELS = ["A", "B", "C", "D"];
const TYPE_LABEL = {
    ENTRY_TEST: "Kiểm tra đầu vào",
    PRACTICE: "Luyện đề",
    MOCK_EXAM: "Thi thử",
};

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * Màn hình LÀM BÀI THI (route /tests/doing/:attemptId).
 * - Nhận session qua navigate state từ TestListPage;
 *   nếu F5 giữa chừng → tự resume qua GET /practice/attempt/:attemptId
 *   (server nhớ đề đã phát + thời gian còn lại).
 * - Nộp bài → điều hướng sang trang kết quả thống nhất /practice/result/:attemptId.
 */
export default function TestDoingPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { attemptId } = useParams();

    const [session, setSession] = useState(location.state?.session || null);
    const [loading, setLoading] = useState(!location.state?.session);
    const [error, setError] = useState(null);

    const [answers, setAnswers] = useState({}); // { [questionId]: optionId }
    const [timeLeft, setTimeLeft] = useState(location.state?.session?.remainingSeconds ?? 0);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmMsg, setConfirmMsg] = useState("");
    const questionRefs = useRef({});

    // Resume khi vào thẳng URL / F5 (không có state)
    useEffect(() => {
        if (session) return;
        practiceService
            .getAttempt(attemptId)
            .then((data) => {
                setSession(data);
                setTimeLeft(data.remainingSeconds ?? (data.durationMinutes || 30) * 60);
            })
            .catch((e) => {
                const msg = e.response?.data?.message || "";
                if (msg.includes("ALREADY_SUBMITTED")) {
                    // Bài đã nộp rồi → chuyển thẳng sang trang kết quả
                    navigate(`/practice/result/${attemptId}`, { replace: true });
                } else {
                    setError(msg || "Không tải được bài thi. Vui lòng quay lại danh sách đề.");
                }
            })
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attemptId]);

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
        [session, submitting, answers]
    );

    // Đồng hồ đếm ngược (khởi tạo từ remainingSeconds của server → resume-safe)
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

    const scrollToQuestion = (questionId) =>
        questionRefs.current[questionId]?.scrollIntoView({ behavior: "smooth", block: "center" });

    if (loading)
        return <div className="td-page"><p className="td-status">Đang tải bài thi...</p></div>;
    if (error)
        return (
            <div className="td-page">
                <p className="td-status td-status-error">{error}</p>
                <div style={{ textAlign: "center" }}>
                    <button className="td-btn-submit" onClick={() => navigate("/tests")}>← Về danh sách đề</button>
                </div>
            </div>
        );
    if (!session) return null;

    const total = session.questions.length;
    const answered = Object.keys(answers).length;
    const progressPct = Math.round((answered / total) * 100);
    const timerClass = timeLeft <= 60 ? "danger" : timeLeft <= 300 ? "warn" : "";

    return (
        <div className="td-page">
            {/* ===== TOP BAR (sticky) ===== */}
            <header className="td-topbar">
                <div className="td-topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                    <span className="td-type-chip">{TYPE_LABEL[session.quizType] || "Bài thi"}</span>
                </div>
                <div className="td-progress-wrap">
                    <div className="td-progress-bar">
                        <div className="td-progress-fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="td-progress-text">{answered}/{total} câu</span>
                </div>
            </header>

            {/* ===== BỐ CỤC 2 CỘT: 70% câu hỏi | 30% điều hướng ===== */}
            <div className="td-layout">
                <main className="td-questions">
                    {session.questions.map((q, idx) => (
                        <section
                            key={q.questionId}
                            className="td-question-card"
                            ref={(el) => (questionRefs.current[q.questionId] = el)}
                        >
                            <div className="td-question-head">
                                <span className="td-question-no">Câu {idx + 1}</span>
                                {q.topic && <span className="td-topic-chip">{q.topic}</span>}
                            </div>
                            <p className="td-question-content">{q.questionContent}</p>
                            <div className="td-options">
    {(() => {
        // Tự động bắt tất cả các kiểu đặt tên biến có thể xảy ra từ Backend
        const type = q.questionType || q.question_type || q.type;
        const hasOptions = q.options && q.options.length > 0;

        // TRƯỜNG HỢP 1: Cấu hình câu TỰ LUẬN (ESSAY)
        // Hoặc tự động nhận diện nếu không có options và nội dung chứa chữ "tiếp tuyến/tự luận"
        if (type === "ESSAY" || (!hasOptions && q.questionContent?.toLowerCase().includes("tiếp tuyến"))) {
            return (
                <textarea
                    className="td-option-essay"
                    placeholder="Nhập bài làm tự luận chi tiết của bạn tại đây..."
                    value={answers[q.questionId] || ""}
                    onChange={(e) => choose(q.questionId, e.target.value)}
                    style={{ width: "100%", minHeight: "120px", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", resize: "vertical" }}
                />
            );
        }

        // TRƯỜNG HỢP 2: Cấu hình câu ĐÁP ÁN NGẮN (SHORT_ANSWER)
        // Hoặc tự động nhận diện nếu kho câu hỏi trống trơn không có options trắc nghiệm
        if (type === "SHORT_ANSWER" || !hasOptions) {
            return (
                <input
                    type="text"
                    className="td-option-short"
                    placeholder="Nhập đáp án ngắn (Ví dụ: 3)..."
                    value={answers[q.questionId] || ""}
                    onChange={(e) => choose(q.questionId, e.target.value)}
                    style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none" }}
                />
            );
        }

        // TRƯỜNG HỢP 3: Câu hỏi TRẮC NGHIỆM truyền thống
        return q.options.map((o, oi) => {
            const selected = answers[q.questionId] === o.optionId;
            return (
                <label
                    key={o.optionId}
                    className={`td-option ${selected ? "td-option-selected" : ""}`}
                >
                    <input
                        type="radio"
                        name={`q-${q.questionId}`}
                        checked={selected}
                        onChange={() => choose(q.questionId, o.optionId)}
                    />
                    <span className="td-option-label">{OPTION_LABELS[oi]}</span>
                    <span className="td-option-content">{o.optionContent}</span>
                    {selected && <span className="td-option-check">✓</span>}
                </label>
            );
        });
    })()}
</div>
                        </section>
                    ))}
                </main>

                {/* ===== SIDEBAR sticky: đồng hồ + bảng điều hướng ===== */}
                <aside className="td-sidebar">
                    <div className={`td-timer-card ${timerClass}`}>
                        <span className="td-timer-label">⏱ Thời gian còn lại</span>
                        <span className="td-timer-value">{formatTime(Math.max(timeLeft, 0))}</span>
                    </div>

                    <div className="td-navigator">
                        <h4>Bảng điều hướng</h4>
                        <div className="td-nav-grid">
                            {session.questions.map((q, idx) => (
                                <button
                                    key={q.questionId}
                                    className={`td-nav-cell ${answers[q.questionId] != null ? "done" : ""}`}
                                    onClick={() => scrollToQuestion(q.questionId)}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                        </div>
                        <div className="td-nav-legend">
                            <span><i className="td-dot done" /> Đã trả lời</span>
                            <span><i className="td-dot" /> Chưa trả lời</span>
                        </div>
                    </div>

                    <button
                        className="td-btn-submit"
                        disabled={submitting}
                        onClick={() => handleSubmit(false)}
                    >
                        {submitting ? "Đang chấm điểm..." : `📤 Nộp bài (${answered}/${total})`}
                    </button>
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
