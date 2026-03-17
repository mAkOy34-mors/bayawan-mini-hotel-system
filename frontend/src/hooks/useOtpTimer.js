import { useState, useRef } from 'react';

export function useOtpTimer(duration = 60) {
  const [timer, setTimer] = useState(0);
  const ref = useRef(null);

  const start = () => {
    setTimer(duration);
    clearInterval(ref.current);
    ref.current = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(ref.current); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const stop = () => clearInterval(ref.current);

  return { timer, start, stop, isRunning: timer > 0 };
}
