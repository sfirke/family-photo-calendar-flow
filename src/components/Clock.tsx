
import React, { useState, useEffect } from 'react';

const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    
    return {
      time: `${displayHours}:${displayMinutes}`,
      ampm
    };
  };

  const { time: timeString, ampm } = formatTime(time);

  return (
    <div className="flex items-baseline gap-2">
      <span className="text-6xl font-bold text-gray-900 dark:text-white">
        {timeString}
      </span>
      <span className="text-3xl font-bold text-gray-900 dark:text-white">
        {ampm}
      </span>
    </div>
  );
};

export default Clock;
