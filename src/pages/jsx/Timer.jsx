import React, {useState, useEffect} from "react";
import "../css/Timer.css";

const Timer = ({initialTime, sessionsId, onTimeout}) => {
    const [timeLeft, setTimeLeft] = useState(initialTime || 3600);
    const firedRef = useState({ done: false })[0];

    useEffect(() => {
        if(timeLeft <= 0){
            if (!firedRef.done) {
                firedRef.done = true;
                if (typeof onTimeout === "function") onTimeout(); // Tự động nộp bài
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return(
        <div className={`timer ${timeLeft < 300 ? 'urgent' : ''}`}>
            ⏰ {minutes}:{seconds < 10 ? '0' : ''}{seconds}
        </div>
    )
};

export default Timer;