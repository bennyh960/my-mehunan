export function TrianglePyramid({ numbers }) {
  const { top, midLeft, midRight, botLeft, botMid, botRight } = numbers;
  const col = v => v==="?"?"#fbbf24":"#e2e8f0";
  const W = 240, H = 210;
  const px = 120, py = 15;
  const blx = 15, bly = 200;
  const brx = 225, bry = 200;
  const r1y = 80;
  const r2y = 140;
  const lerp = (ax,ay,bx,by,t) => [ax+(bx-ax)*t, ay+(by-ay)*t];
  const [l1x,l1y] = lerp(px,py,blx,bly,(r1y-py)/(bly-py));
  const [r1x] = lerp(px,py,brx,bry,(r1y-py)/(bry-py));
  const [l2x,l2y] = lerp(px,py,blx,bly,(r2y-py)/(bly-py));
  const [r2x] = lerp(px,py,brx,bry,(r2y-py)/(bry-py));
  const m1x = (l1x + r1x) / 2;
  const third2 = (r2x - l2x) / 3;
  const v2ax = l2x + third2;
  const v2bx = l2x + third2 * 2;
  const bthird = (brx - blx) / 3;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", margin: "0 auto" }}>
      <polygon points={`${px},${py} ${blx},${bly} ${brx},${bry}`} fill="none" stroke="#818cf8" strokeWidth="2.2" />
      <line x1={l1x} y1={r1y} x2={r1x} y2={r1y} stroke="#818cf8" strokeWidth="1.8" />
      <line x1={l2x} y1={r2y} x2={r2x} y2={r2y} stroke="#818cf8" strokeWidth="1.8" />
      <line x1={m1x} y1={r1y} x2={px} y2={r2y} stroke="#818cf8" strokeWidth="1.8" />
      <line x1={v2ax} y1={r2y} x2={blx + bthird} y2={bly} stroke="#818cf8" strokeWidth="1.8" />
      <line x1={v2bx} y1={r2y} x2={blx + bthird * 2} y2={bly} stroke="#818cf8" strokeWidth="1.8" />
      <text x={px} y={(py + r1y) / 2 + 6} textAnchor="middle" fill={col(top)} fontSize="20" fontWeight="bold">{top}</text>
      <text x={(l1x + m1x) / 2} y={(r1y + r2y) / 2 + 6} textAnchor="middle" fill={col(midLeft)} fontSize="17" fontWeight="bold">{midLeft}</text>
      <text x={(m1x + r1x) / 2} y={(r1y + r2y) / 2 + 6} textAnchor="middle" fill={col(midRight)} fontSize="17" fontWeight="bold">{midRight}</text>
      <text x={(blx + blx + bthird) / 2} y={(r2y + bly) / 2 + 5} textAnchor="middle" fill={col(botLeft)} fontSize="15" fontWeight="bold">{botLeft}</text>
      <text x={px} y={(r2y + bly) / 2 + 5} textAnchor="middle" fill={col(botMid)} fontSize="15" fontWeight="bold">{botMid}</text>
      <text x={(blx + bthird * 2 + brx) / 2} y={(r2y + bly) / 2 + 5} textAnchor="middle" fill={col(botRight)} fontSize="15" fontWeight="bold">{botRight}</text>
    </svg>
  );
}
