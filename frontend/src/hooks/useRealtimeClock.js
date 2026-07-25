import { useState, useEffect } from 'react';

export const useRealtimeClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedClock = `${time.getFullYear()}-${String(time.getMonth() + 1).padStart(2, '0')}-${String(
    time.getDate()
  ).padStart(2, '0')} ${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(
    2,
    '0'
  )}:${String(time.getSeconds()).padStart(2, '0')}`;

  return { time, formattedClock };
};
