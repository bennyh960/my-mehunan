export function SquaresArrows({ rows }) {
  return (
    <div className="squares-rows">
      {rows.map((r, i) => (
        <div key={i} className="squares-row">
          {[r.left, r.center, r.right].map((val, j) => {
            const isQ = val==="?";
            const isBig = j===1;
            return (
              <div key={j} className="squares-item">
                <div className={`square-box ${isBig?"big":"small"} ${isQ?"missing":isBig?"normal-big":"normal"}`}>{val}</div>
                {j < 2 && <span className="squares-arrow">←</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
