import { useState, useEffect } from "react";

export function Timer({ seconds, onExpire, running }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { setLeft(seconds); }, [seconds]);
  useEffect(() => {
    if (!running || left <= 0) return;
    const t = setTimeout(() => setLeft(l => { if (l<=1){onExpire();return 0;} return l-1; }), 1000);
    return () => clearTimeout(t);
  }, [left, running, onExpire]);
  const pct = (left / seconds) * 100;
  const color = pct > 50 ? "#4ade80" : pct > 20 ? "#fbbf24" : "#f87171";
  const mins = Math.floor(left/60), secs = left%60;
  return (
    <div className="timer-wrap">
      <div className="timer-track">
        <div style={{ width:`${pct}%`, height:"100%", backgroundColor:color, transition:"width 1s linear" }} />
      </div>
      <span className="timer-text" style={{ color }}>
        {mins>0?`${mins}:${secs.toString().padStart(2,"0")}`:`${secs}s`}
      </span>
    </div>
  );
}
