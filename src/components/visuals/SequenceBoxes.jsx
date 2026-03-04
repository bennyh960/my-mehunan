export function SequenceBoxes({ numbers }) {
  return (
    <div className="sequence-boxes">
      {numbers.map((n, i) => (
        <div key={i} className="sequence-item">
          <div className={`sequence-box ${n==="?"?"missing":"normal"}`}>{n}</div>
          {i < numbers.length - 1 && <span className="sequence-arrow">→</span>}
        </div>
      ))}
    </div>
  );
}
