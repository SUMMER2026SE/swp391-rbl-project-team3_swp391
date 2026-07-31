import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const socket = new SockJS("http://localhost:8080/ws");

const client = new Client({
    webSocketFactory: () => socket,
    reconnectDelay: 5000,
});

export default client;