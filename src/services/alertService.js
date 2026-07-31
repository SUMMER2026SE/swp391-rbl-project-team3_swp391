// src/utils/alert.js
import Swal from "sweetalert2";

export const successAlert = (title, text) =>
    Swal.fire({
        icon: "success",
        title,
        text,
        confirmButtonColor: "#4f46e5"
    });

export const errorAlert = (title, text) =>
    Swal.fire({
        icon: "error",
        title,
        text,
        confirmButtonColor: "#dc2626"
    });

export const warningAlert = (title, text) =>
    Swal.fire({
        icon: "warning",
        title,
        text,
        confirmButtonColor: "#f59e0b"
    });

export const confirmAlert = (title, text) =>
    Swal.fire({
        icon: "question",
        title,
        text,
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Huỷ",
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#9ca3af"
    });

export const inputAlert = (title, inputLabel) =>
    Swal.fire({
        title,
        input: "textarea",
        inputLabel,
        inputPlaceholder: "Nhập nội dung...",
        inputAttributes: {
            maxlength: 500
        },
        showCancelButton: true,
        confirmButtonText: "Gửi",
        cancelButtonText: "Huỷ",
        confirmButtonColor: "#4f46e5",
        cancelButtonColor: "#9ca3af"
    });