import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";
import axiosClient from "../api/axiosClient";
import { connectNotification } from "../services/websocket";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState([]);
    const [connected, setConnected] = useState(false);
    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);
        const userId = user.id || user.user_id;
        const role = (
            user.roleName ||
            user.role ||
            "STUDENT"
        ).toUpperCase();

        //----------------------------------------
        // Load notification ban đầu
        //----------------------------------------

        axiosClient
            .get(`/notifications?role=${role}&userId=${userId}`)
            .then(res => {

                setNotifications(res.data || []);

            })
            .catch(err => {

                console.error(
                    "Load notifications failed",
                    err
                );

            });

        //----------------------------------------
        // Connect websocket
        //----------------------------------------

        const stomp = connectNotification(

            userId,

            (notification) => {

                console.log(
                    "Realtime Notification:",
                    notification
                );

                setNotifications(prev => [

                    notification,

                    ...prev

                ]);

                if (Notification.permission === "granted") {

                    new Notification(notification.title, {
                        body: notification.content
                    });

                }

            },

            () => {

                setConnected(true);

            }

        );

        //----------------------------------------
        // Browser permission
        //----------------------------------------

        if (Notification.permission !== "granted") {

            Notification.requestPermission();

        }

        //----------------------------------------

        return () => {

            stomp?.deactivate();

        };

    }, []);

    //----------------------------------------

    const unreadCount =
        notifications.filter(x => !x.is_read).length;

    //----------------------------------------

    const markRead = (id) => {

        setNotifications(prev =>

            prev.map(n =>

                n.notificationId === id

                    ? {
                        ...n,
                        is_read: true
                    }

                    : n

            )

        );

    };

    //----------------------------------------

    const markAllRead = () => {

        setNotifications(prev =>

            prev.map(n => ({

                ...n,

                is_read: true

            }))

        );

    };

    //----------------------------------------

    return (

        <NotificationContext.Provider

            value={{

                notifications,

                setNotifications,

                unreadCount,

                markRead,

                markAllRead,

                connected

            }}

        >

            {children}

        </NotificationContext.Provider>

    );

}

export function useNotification() {
    return useContext(NotificationContext);
}