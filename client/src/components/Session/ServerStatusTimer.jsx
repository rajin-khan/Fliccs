// client/src/components/Session/ServerStatusTimer.jsx

import { useState, useEffect } from 'react';
import { FaRegClock } from 'react-icons/fa';
import { turnCredentials } from '../../hooks/useWebRTC.js';

const lastResetTimestamp = turnCredentials.lastResetTimestamp;

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

function ServerStatusTimer() {
  const [timeLeft, setTimeLeft] = useState('');
  const [textColor, setTextColor] = useState('text-green-400');

  useEffect(() => {
    // The new Date() constructor handles the simplified format correctly.
    const expiryTime = new Date(new Date(lastResetTimestamp).getTime() + TWENTY_FOUR_HOURS_MS);

    const intervalId = setInterval(() => {
      const now = new Date();
      const difference = expiryTime.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft('Server Expired - Awaiting Refresh');
        setTextColor('text-red-500');
        clearInterval(intervalId);
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );

      // Change color based on time left
      if (hours < 1) {
        setTextColor('text-red-500');
      } else if (hours < 6) {
        setTextColor('text-yellow-400');
      } else {
        setTextColor('text-green-400');
      }
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={`text-xs mt-1 flex items-center justify-center gap-1.5 ${textColor}`}>
      <FaRegClock />
      <span>Streaming Mode Available For: <strong>{timeLeft}</strong></span>
    </div>
  );
}

export default ServerStatusTimer;