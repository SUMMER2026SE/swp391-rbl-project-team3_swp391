import axiosClient from "../api/axiosClient";

export const getChapterSummary = async (chapterId) => {
    const response = await axiosClient.get(
        `/ai/chapter-summary/${chapterId}`
    );
    return response.data;
};