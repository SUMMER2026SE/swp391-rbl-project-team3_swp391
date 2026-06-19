import React, {useState, useEffect} from "react";
import "../css/Timer.css";

const Timer = ({initialTime, sessionsId}) => {
    const [timeLeft, setTimeLeft] = useState(initialTime || 3600);

    useEffect(() => {
        if(timeLeft <= 0){
            alert("Hết thời gian! Bài thi sẽ được tự động nộp !!!");
            //Gọi API nộp bài
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