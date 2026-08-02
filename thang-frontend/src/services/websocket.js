import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const socket = new SockJS(`${import.meta.env.VITE_API_URL.replace("/api","")}/ws`);

const client = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
});

export default client;