export const polygon = (cx, cy, r, sides, rot = -Math.PI/2) =>
  Array.from({ length: sides }, (_, i) => {
    const a = rot + (i * 2 * Math.PI / sides);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");
