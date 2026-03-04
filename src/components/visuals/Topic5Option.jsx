import { SymbolBox } from '../shapes/SymbolBox';
import { PacmanSVG } from '../shapes/PacmanSVG';
import { GridCell } from '../shapes/GridCell';
import { CompositeShape } from '../shapes/Shape';

export function Topic5Option({ opt, size = 44 }) {
  if (opt.type === "symbols") return <SymbolBox symbols={opt.symbols} size={size} />;
  if (opt.type === "pacman") return <PacmanSVG rotation={opt.rotation} fill={opt.fill} size={size - 4} />;
  if (opt.type === "pacman_rect") return <GridCell cell={opt} size={size} />;
  return <CompositeShape desc={opt} size={size} />;
}
