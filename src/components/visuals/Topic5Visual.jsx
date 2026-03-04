import { SymbolBox } from '../shapes/SymbolBox';
import { PacmanSVG } from '../shapes/PacmanSVG';
import { CompositeShape } from '../shapes/Shape';
import { GridCell } from '../shapes/GridCell';

export function Topic5Visual({ visual }) {
  if (!visual) return null;
  if (visual.type === "shape_row") {
    return (
      <div className="shape-row">
        {visual.sequence.map((desc, i) => (
          <div key={i} className="shape-cell">
            {desc.type === "symbols" ? <SymbolBox symbols={desc.symbols} size={60} />
              : desc.type === "pacman" ? <PacmanSVG rotation={desc.rotation} fill={desc.fill} size={46} />
              : <CompositeShape desc={desc} size={50} />}
          </div>
        ))}
        <div className="missing-shape">?</div>
      </div>
    );
  }
  if (visual.type === "matrix_3x3") {
    return (
      <div className="matrix-3x3">
        {visual.grid.map((row, ri) => (
          <div key={ri} className="matrix-row">
            {row.map((cell, ci) => (
              <div key={ci} className={`matrix-cell ${cell?"filled":"empty"}`}>
                <GridCell cell={cell} size={56} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (visual.type === "symbol_row") {
    return (
      <div className="symbol-row-wrap">
        {visual.sequence.map((box, i) => (
          <SymbolBox key={i} symbols={box.symbols} size={65} />
        ))}
        <div className="missing-symbol-box">?</div>
      </div>
    );
  }
  return null;
}
