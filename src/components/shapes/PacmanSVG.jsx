export function PacmanSVG({ rotation = 0, fill = "#94a3b8", stroke = "none", size = 40 }) {
  const c = size / 2, r = size / 2 - 2;
  const mouthAngle = 45;
  const startA = (rotation + mouthAngle / 2) * Math.PI / 180;
  const endA = (rotation - mouthAngle / 2 + 360) * Math.PI / 180;
  const x1 = c + r * Math.cos(startA);
  const y1 = c + r * Math.sin(startA);
  const x2 = c + r * Math.cos(endA);
  const y2 = c + r * Math.sin(endA);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <path d={`M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2} Z`} fill={fill} stroke={stroke} strokeWidth={stroke !== "none" ? 1.5 : 0} />
    </svg>
  );
}
