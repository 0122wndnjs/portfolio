import React, { useState, useEffect } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number;
  delay?: number;
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 150, delay = 0 }) => {
  const [displayedText, setDisplayedText] = useState('');

  useEffect(() => {
    const delayTimeout = setTimeout(() => {
      let index = 0;
      const timer = setInterval(() => {
        setDisplayedText(text.slice(0, index + 1));
        index++;
        if (index === text.length) clearInterval(timer);
      }, speed);
    }, delay);

    return () => {
      clearTimeout(delayTimeout);
    };
  }, [text, speed, delay]);

  return (
    <span className="border-r-2 border-white animate-blink-caret">
      {displayedText}
    </span>
  );
};

export default TypingText;
