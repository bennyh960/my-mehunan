export function StarNumbers({ outer, inner }) {
  const W = 220, H = 220, cx = 110, cy = 110, R = 100, r = 42;
  const col = v => v === "?" ? "#fbbf24" : "#e2e8f0";

  const starPoints = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI / 5) - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    starPoints.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }

  const outerPos = [0, 2, 4, 6, 8].map(i => {
    const angle = (i * Math.PI / 5) - Math.PI / 2;
    return { x: cx + (R - 8) * Math.cos(angle), y: cy + (R - 8) * Math.sin(angle) + 5 };
  });

  const innerR = r * 0.55;
  const innerPos = [0, 1, 2, 3, 4].map(i => {
    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
    return { x: cx + innerR * Math.cos(angle), y: cy + innerR * Math.sin(angle) + 5 };
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", margin: "0 auto" }}>
      <polygon points={starPoints.join(" ")} fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinejoin="round" />
      <polygon points={[1,3,5,7,9].map(i => {
        const a = (i * Math.PI / 5) - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ")} fill="none" stroke="#818cf8" strokeWidth="1.5" />
      {[1,3,5,7,9].map((i, idx) => {
        const a = (i * Math.PI / 5) - Math.PI / 2;
        return <line key={idx} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#818cf8" strokeWidth="1" />;
      })}
      {outer.map((v, i) => (
        <text key={`o${i}`} x={outerPos[i].x} y={outerPos[i].y} textAnchor="middle" fill={col(v)} fontSize="15" fontWeight="bold">{v}</text>
      ))}
      {inner.map((v, i) => (
        <text key={`i${i}`} x={innerPos[i].x} y={innerPos[i].y} textAnchor="middle" fill={col(v)} fontSize="14" fontWeight="bold">{v}</text>
      ))}
    </svg>
  );
}
