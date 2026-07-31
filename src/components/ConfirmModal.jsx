import React from "react";
import "../pages/css/ConfirmModal.css";

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Đồng ý", cancelText = "Hủy" }) {
    if (!isOpen) return null;

    return (
        <div className="cm-overlay">
            <div className="cm-modal">
                <div className="cm-icon">❓</div>
                <h3 className="cm-title">{title || "Xác nhận"}</h3>
                <p className="cm-message">{message}</p>
                <div className="cm-actions">
                    <button className="cm-btn cm-btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className="cm-btn cm-btn-confirm" onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
