import { useState, useEffect } from 'react';

// Efeito de digitacao para titulos
export default function TypewriterHeading({ text, triggerKey, delay = 0, speed = 25 }) {
  const [displayed, setDisplayed] = useState('');
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timer = null;
    let index = 0;
    setDisplayed('');
    setIsDone(false);

    const startTimeout = setTimeout(() => {
      timer = setInterval(() => {
        index += 1;
        if (index >= text.length) {
          setDisplayed(text);
          setIsDone(true);
          clearInterval(timer);
        } else {
          setDisplayed(text.slice(0, index));
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (timer) clearInterval(timer);
    };
  }, [text, triggerKey, delay, speed]);

  return (
    <span className="cyber-typewriter-text">
      {displayed}
      {!isDone && <span className="cyber-cursor">▌</span>}
    </span>
  );
}

