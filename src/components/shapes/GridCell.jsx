import { SymbolBox } from './SymbolBox';
import { PacmanSVG } from './PacmanSVG';
import { CompositeShape } from './Shape';

export function GridCell({ cell, size = 52 }) {
  if (!cell) return <span className="grid-cell-empty">?</span>;
  if (cell.type === "symbols") return <SymbolBox symbols={cell.symbols} size={size} />;
  if (cell.type === "pacman") return <PacmanSVG rotation={cell.rotation || 0} fill={cell.fill || "#94a3b8"} stroke={cell.stroke || "none"} size={size - 8} />;
  if (cell.type === "rect_fill") {
    return (
      <div className="rect-fill" style={{ width: size - 10, height: size - 10, backgroundColor: cell.fill || "#94a3b8" }} />
    );
  }
  if (cell.type === "pacman_rect") {
    return (
      <div className="pacman-rect" style={{ width: size - 6, height: size - 6 }}>
        <div className="pacman-rect-layer">
          <div className="pacman-rect-bg" style={{ backgroundColor: cell.rectFill || "#64748b" }} />
        </div>
        <div className="pacman-rect-layer">
          <PacmanSVG rotation={cell.rotation || 0} fill={cell.pacFill || "#94a3b8"} size={size - 10} />
        </div>
      </div>
    );
  }
  return <CompositeShape desc={cell} size={size - 8} />;
}
