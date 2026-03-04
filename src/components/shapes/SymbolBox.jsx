export function SymbolBox({ symbols, size = 70 }) {
  if (!symbols) return null;
  return (
    <div className="symbol-box" style={{ width: size, height: size }}>
      {symbols.map((row, i) => (
        <div key={i} className="symbol-row">
          {Array.from({ length: row.count }, (_, j) => (
            <span key={j} style={{ fontSize: row.size || 10, color: row.color || "#e2e8f0", lineHeight: 1 }}>{row.char}</span>
          ))}
        </div>
      ))}
    </div>
  );
}
