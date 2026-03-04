import { CirclesTrio } from './CirclesTrio';
import { SequenceBoxes } from './SequenceBoxes';
import { TrianglePyramid } from './TrianglePyramid';
import { StarNumbers } from './StarNumbers';
import { SquaresArrows } from './SquaresArrows';

export function Topic4Visual({ visual }) {
  if (!visual) return null;
  if (visual.type==="circles_trio") return <CirclesTrio circles={visual.circles} />;
  if (visual.type==="sequence") return <SequenceBoxes numbers={visual.numbers} />;
  if (visual.type==="triangle_pyramid") return <TrianglePyramid numbers={visual.numbers} />;
  if (visual.type==="star_numbers") return <StarNumbers outer={visual.outer} inner={visual.inner} />;
  if (visual.type==="squares_arrows") return <SquaresArrows rows={visual.rows} />;
  return null;
}
