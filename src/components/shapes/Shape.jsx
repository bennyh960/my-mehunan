import { polygon } from '../../utils/svg';

export function Shape({ type, size = 40, fill = "none", stroke = "#22d3ee", strokeWidth = 2.2, rotation = 0, innerShape, innerColor, dotPos, dotColor }) {
  const s = size, c = s / 2, r = s / 2 - 3;
  const transform = rotation ? `rotate(${rotation} ${c} ${c})` : undefined;
  let main = null;
  switch (type) {
    case "triangle": main = <polygon points={polygon(c, c, r, 3)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "square": main = <rect x="3" y="3" width={s-6} height={s-6} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "pentagon": main = <polygon points={polygon(c, c, r, 5)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "hexagon": main = <polygon points={polygon(c, c, r, 6)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "heptagon": main = <polygon points={polygon(c, c, r, 7)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "octagon": main = <polygon points={polygon(c, c, r, 8)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "circle": main = <circle cx={c} cy={c} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "diamond": main = <polygon points={`${c},3 ${s-3},${c} ${c},${s-3} 3,${c}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "star": main = <polygon points={Array.from({length:10},(_,i)=>{const a=(i*Math.PI/5)-Math.PI/2;const rr=i%2===0?r:r*0.4;return `${c+rr*Math.cos(a)},${c+rr*Math.sin(a)}`;}).join(" ")} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "arrow_up": main = <polygon points={`${c},4 ${s-6},${c+4} ${c+5},${c+4} ${c+5},${s-4} ${c-5},${s-4} ${c-5},${c+4} 6,${c+4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "cross": main = <polygon points={`${c-4},3 ${c+4},3 ${c+4},${c-4} ${s-3},${c-4} ${s-3},${c+4} ${c+4},${c+4} ${c+4},${s-3} ${c-4},${s-3} ${c-4},${c+4} 3,${c+4} 3,${c-4} ${c-4},${c-4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "semicircle": main = <path d={`M ${3} ${c} A ${r} ${r} 0 0 1 ${s-3} ${c} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    default: main = <circle cx={c} cy={c} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }
  let inner = null;
  if (innerShape) {
    const ir = r * 0.4;
    const ic = innerColor || stroke;
    switch (innerShape) {
      case "circle": inner = <circle cx={c} cy={c} r={ir} fill={ic} stroke="none" />; break;
      case "square": inner = <rect x={c-ir} y={c-ir} width={ir*2} height={ir*2} fill={ic} stroke="none" />; break;
      case "dot": inner = <circle cx={c} cy={c} r={3} fill={ic} stroke="none" />; break;
      case "triangle": inner = <polygon points={polygon(c, c, ir, 3)} fill={ic} stroke="none" />; break;
    }
  }
  let dot = null;
  if (dotPos) {
    const dc = dotColor || "#fbbf24";
    const positions = { top: [c, 6], bottom: [c, s-6], left: [6, c], right: [s-6, c], center: [c, c], tl: [8,8], tr: [s-8,8], bl: [8,s-8], br: [s-8,s-8] };
    const p = positions[dotPos] || positions.center;
    dot = <circle cx={p[0]} cy={p[1]} r={3.5} fill={dc} stroke="none" />;
  }
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      <g transform={transform}>{main}{inner}{dot}</g>
    </svg>
  );
}

export function CompositeShape({ desc, size = 52 }) {
  if (!desc) return null;
  return (
    <Shape
      type={desc.shape || "circle"}
      size={size}
      fill={desc.fill || "none"}
      stroke={desc.stroke || "#22d3ee"}
      strokeWidth={desc.strokeWidth || 2.2}
      rotation={desc.rotation || 0}
      innerShape={desc.inner}
      innerColor={desc.innerColor}
      dotPos={desc.dot}
      dotColor={desc.dotColor}
    />
  );
}
