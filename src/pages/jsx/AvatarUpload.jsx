import axios from "axios";
import "../css/AvatarUpload.css";
import { useState } from "react";

export default function AvatarUpload({onUploaded}){
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState(null);

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setPreview(URL.createObjectURL(file));

        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", "prepace_avatar");

        try {
            setLoading(true);
            const res = await axios.post(
                "https://api.cloudinary.com/v1_1/dkt2hrljr/image/upload",
                formData
            );
            const url = res.data.secure_url;
            onUploaded(url);

        } catch (err) {
            console.log("Upload error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="avatar-upload">
            <label className="upload-btn">
                Change Avatar
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    hidden
                />
            </label>

            {loading && <p className="uploading">Uploading...</p>}
        </div>
    );
}