import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import aiService from "../services/aiService";

import "katex/dist/katex.min.css";
import "./css/GlobalChatbot.css";

const SUGGESTIONS = [
    "Giải phương trình bậc hai x² - 5x + 6 = 0",
    "Tóm tắt lý thuyết về dao động điều hòa",
    "Cách làm bài đọc hiểu Tiếng Anh",
];

export default function GlobalChatbot() {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "ai", text: "Xin chào! Mình là trợ lý AI của PrepAce 🤖. Bạn cần mình giúp gì nào?" },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    // Ẩn chatbot ở trang thi
    if (
        location.pathname.startsWith("/tests") || 
        location.pathname.startsWith("/entry-test") ||
        location.pathname.startsWith("/practice")
    ) {
        return null;
    }

    useEffect(() => {
        if (isOpen) {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, loading, isOpen]);

    const formatAIResponse = (response) => {
        if (!response) return "Không có phản hồi từ AI.";
        if (typeof response === "object") return objectToMarkdown(response);
        if (typeof response === "string") {
            try {
                return objectToMarkdown(JSON.parse(response));
            } catch {
                return response;
            }
        }
        return String(response);
    };

    const objectToMarkdown = (obj) => {
        if (obj.response) return obj.response;
        if (obj.answer) return obj.answer;
        if (obj.message) return obj.message;
        if (obj.text) return obj.text;
        if (obj.title && Array.isArray(obj.content)) {
            let md = `# ${obj.title}\n\n`;
            obj.content.forEach(item => {
                md += `## ${item.heading}\n\n${item.text}\n\n`;
            });
            return md;
        }
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
            setMessages((prev) => [...prev, { role: "ai", text: formatAIResponse(res.aiResponse) }]);
        } catch (e) {
            setMessages((prev) => [...prev, { role: "ai", text: "Xin lỗi, mình gặp sự cố khi xử lý (" + (e.response?.data?.message || e.message) + ")" }]);
        } finally {
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
        <div className="global-chatbot">
            {!isOpen && (
                <button className="chatbot-toggle-btn" onClick={() => setIsOpen(true)}>
                    <span className="chatbot-icon">🤖</span>
                </button>
            )}

            {isOpen && (
                <div className="chatbot-window">
                    <header className="chatbot-header">
                        <div className="chatbot-title">
                            <span className="chatbot-avatar">🤖</span>
                            <div>
                                <h3>Trợ lý AI PrepAce</h3>
                                <p>Sẵn sàng hỗ trợ 24/7</p>
                            </div>
                        </div>
                        <button className="chatbot-close-btn" onClick={() => setIsOpen(false)}>✕</button>
                    </header>

                    <div className="chatbot-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`chat-msg ${m.role}`}>
                                {m.role === "ai" && <span className="msg-avatar">🤖</span>}
                                <div className="msg-bubble">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {m.text}
                                    </ReactMarkdown>
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
                        <div className="chatbot-suggestions">
                            {SUGGESTIONS.map((s, i) => (
                                <button key={i} onClick={() => send(s)}>{s}</button>
                            ))}
                        </div>
                    )}

                    <div className="chatbot-input">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={onKeyDown}
                            placeholder="Hỏi AI..."
                            rows={1}
                        />
                        <button disabled={loading || !input.trim()} onClick={() => send()}>Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
}
