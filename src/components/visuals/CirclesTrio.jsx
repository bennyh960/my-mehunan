export function CirclesTrio({ circles }) {
  return (
    <div className="circles-trio">
      {circles.map((c, i) => {
        const col = v => v === "?" ? "#fbbf24" : "#e2e8f0";
        return (
          <svg key={i} width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="50" fill="none" stroke="#818cf8" strokeWidth="2" />
            <line x1="55" y1="55" x2="55" y2="5" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="55" y1="55" x2="12" y2="80" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="55" y1="55" x2="98" y2="80" stroke="#818cf8" strokeWidth="1.5" />
            <text x="35" y="40" textAnchor="middle" fill={col(c.top[0])} fontSize="16" fontWeight="bold">{c.top[0]}</text>
            <text x="75" y="40" textAnchor="middle" fill={col(c.top[1])} fontSize="16" fontWeight="bold">{c.top[1]}</text>
            <text x="55" y="90" textAnchor="middle" fill={col(c.bottom)} fontSize="18" fontWeight="bold">{c.bottom}</text>
          </svg>
        );
      })}
    </div>
  );
}
