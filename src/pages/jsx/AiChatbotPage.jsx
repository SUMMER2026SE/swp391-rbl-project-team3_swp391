import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import aiService from "../../services/aiService";

import "katex/dist/katex.min.css";
import "../css/AiChatbotPage.css";

const SUGGESTIONS = [
    "Giải phương trình bậc hai x² - 5x + 6 = 0",
    "Tóm tắt lý thuyết về dao động điều hòa",
    "Cách làm bài đọc hiểu Tiếng Anh hiệu quả",
    "Công thức tính nhanh tích phân từng phần",
];

export default function AiChatbotPage() {
    const navigate = useNavigate();
    const [messages, setMessages] = useState([
        { role: "ai", text: "Xin chào! Mình là trợ lý AI của PrepAce 🤖. Bạn cần mình giải bài, tóm tắt lý thuyết hay tư vấn học tập? Hỏi mình bất cứ lúc nào nhé!" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, loading]);

    const formatAIResponse = (response) => {
        if (!response) return "Không có phản hồi từ AI.";

        // Nếu backend trả object
        if (typeof response === "object") {
            return objectToMarkdown(response);
        }

        // Nếu là string
        if (typeof response === "string") {
            try {
                const obj = JSON.parse(response);
                return objectToMarkdown(obj);
            } catch {
                return response;
            }
        }

        return String(response);
    };

    const objectToMarkdown = (obj) => {
        // Chat bình thường
        if (obj.response) return obj.response;
        if (obj.answer) return obj.answer;
        if (obj.message) return obj.message;
        if (obj.text) return obj.text;

        // Tóm tắt lý thuyết
        if (obj.title && Array.isArray(obj.content)) {
            let md = `# ${obj.title}\n\n`;

            obj.content.forEach(item => {
                md += `## ${item.heading}\n\n`;
                md += `${item.text}\n\n`;
            });

            return md;
        }

        // Fallback
        return JSON.stringify(obj, null, 2);
    };

    const send = async (text) => {
        const content = (text ?? input).trim();
        if (!content || loading) return;

        if (!localStorage.getItem("token")) {
            alert("Vui lòng đăng nhập để trò chuyện với AI.");
            navigate("/auth", { state: { mode: "login" } });
            return;
        }

        setMessages((prev) => [...prev, { role: "user", text: content }]);
        setInput("");
        setLoading(true);
        try {
            const res = await aiService.chat(content);

            console.log("AI response:", res);

            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    text: formatAIResponse(res.aiResponse)
                }
            ]);
        }
        catch (e) {
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    text:
                        "Xin lỗi, mình gặp sự cố khi xử lý. Bạn thử lại sau nhé. ("
                        + (e.response?.data?.message || e.message)
                        + ")"
                }
            ]);
        }
        finally {
            setLoading(false);
        }
    };

    const onKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    return (
        <div className="chat-page">
            <header className="chat-header">
                <span className="back-btn" onClick={() => navigate("/home")}>← Quay lại</span>
                <div className="chat-title">
                    <span className="chat-avatar">🤖</span>
                    <div>
                        <h1>Trợ lý AI PrepAce</h1>
                        <p>Giải bài, tóm tắt lý thuyết, tư vấn học tập 24/7</p>
                    </div>
                </div>
            </header>

            <div className="chat-window">
                <div className="chat-messages">
                    {messages.map((m, i) => (
                        <div key={i} className={`chat-msg ${m.role}`}>
                            {m.role === "ai" && <span className="msg-avatar">🤖</span>}
                            <div className="msg-bubble">
                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]}
                                                rehypePlugins={[rehypeKatex]}>
                                    {m.text}
                                </ReactMarkdown>
                                {m.source === "FALLBACK" && <span className="msg-tag">chế độ ngoại tuyến</span>}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="chat-msg ai">
                            <span className="msg-avatar">🤖</span>
                            <div className="msg-bubble typing"><span></span><span></span><span></span></div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                {messages.length <= 1 && (
                    <div className="chat-suggestions">
                        {SUGGESTIONS.map((s, i) => (
                            <button key={i} onClick={() => send(s)}>{s}</button>
                        ))}
                    </div>
                )}

                <div className="chat-input-bar">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Nhập câu hỏi của bạn..."
                        rows={1}
                    />
                    <button className="chat-send-btn" disabled={loading || !input.trim()} onClick={() => send()}>
                        Gửi
                    </button>
                </div>
            </div>
        </div>
    );
}
