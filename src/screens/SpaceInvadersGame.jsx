import { useState, useEffect, useRef, useCallback } from 'react';
import { NINJAS, getUnlockedNinjas } from '../constants/ninjago';
import { Topic4Visual } from '../components/visuals/Topic4Visual';
import { Topic5Visual } from '../components/visuals/Topic5Visual';
import { Topic5Option } from '../components/visuals/Topic5Option';
import { Confetti } from '../components/ui/Confetti';

// ─── Constants ───
const CANVAS_W = 480;
const CANVAS_H = 640;

// Player
const PLAYER_W = 40;
const PLAYER_H = 64;
const PLAYER_Y = 565; // feet Y
const PLAYER_SPEED = 3.5;

// Bullets
const BULLET_SPEED = 9;
const BULLET_R = 8;    // orb radius
const BULLET_TRAIL = 15;
const ENEMY_BULLET_SPEED = 2.4;
const ENEMY_BULLET_W = 7;
const ENEMY_BULLET_H = 11;

// Enemy grid
const GRID_COLS = 6;
const GRID_ROWS = 4;
const ENEMY_START_Y = 75;
const ENEMY_DROP = 22;
const BASE_MARCH_INTERVAL = 800;

// Enemy sizes — 1.5x bigger than original
const SKULKIN_W = 48;
const SKULKIN_H = 42;
const SERPENTINE_W = 42;
const SERPENTINE_H = 54;
const STONE_W = 54;
const STONE_H = 60;
const HYPNO_W = 46;
const HYPNO_H = 46;

// Falling ally
const ALLY_FALL_SPEED = 1.5;
const ALLY_SPAWN_INTERVAL = 900; // frames ~15s at 60fps
const ALLY_SCALE = 0.6;
const ALLY_HP = 3;

// Boosts
const BOOST_TYPES = [
  { id: "lightning", nameHe: "ברק מהיר",    descHe: "2x מהירות וקצב ירי", icon: "⚡", color: "#fbbf24", duration: 600 },
  { id: "power",     nameHe: "כוח עצום",    descHe: "+2 נזק לכל כדור",     icon: "💥", color: "#ef4444", duration: 480 },
  { id: "shield",    nameHe: "מגן אנרגיה",  descHe: "סופג 2 פגיעות",       icon: "🛡", color: "#3b82f6", duration: 720 },
  { id: "spinjitzu", nameHe: "ספינג'יטסו",  descHe: "ירי אוטומטי לכל הכיוונים", icon: "🌀", color: "#a855f7", duration: 360 },
];

// Points
const KILL_PTS = { skulkin: 10, serpentine: 20, stoneWarrior: 40, hypnobrai: 30, bonus: 100 };

// ─── Level Definitions ───
const LEVEL_DEFS = [
  { rows: ["skulkin","skulkin","skulkin","skulkin"],               mandatoryQ: 1 },
  { rows: ["skulkin","skulkin","skulkin","serpentine"],            mandatoryQ: 1 },
  { rows: ["skulkin","skulkin","serpentine","stoneWarrior"],       mandatoryQ: 1 },
  { rows: ["skulkin","skulkin","serpentine","serpentine"], extraRow: "stoneWarrior", mandatoryQ: 2 },
  { rows: ["skulkin","serpentine","serpentine","stoneWarrior"], extraRow: "hypnobrai", mandatoryQ: 2 },
];

// ─── Helpers ───
function rectOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function randInt(a, b) {
  return Math.floor(Math.random() * (b - a + 1)) + a;
}

function getEnemySize(type) {
  if (type === "skulkin")      return { w: SKULKIN_W,    h: SKULKIN_H };
  if (type === "serpentine")   return { w: SERPENTINE_W, h: SERPENTINE_H };
  if (type === "stoneWarrior") return { w: STONE_W,      h: STONE_H };
  if (type === "hypnobrai")    return { w: HYPNO_W,      h: HYPNO_H };
  return { w: 32, h: 32 };
}

function getEnemyHP(type) {
  if (type === "skulkin")      return 1;
  if (type === "serpentine")   return 2;
  if (type === "stoneWarrior") return 4;
  if (type === "hypnobrai")    return 2;
  return 1;
}

function buildEnemyGrid(levelDef) {
  const enemies = [];
  const allRows = [...levelDef.rows];
  if (levelDef.extraRow) allRows.push(levelDef.extraRow);
  const rowCount = allRows.length;

  allRows.forEach((type, rowIdx) => {
    const sz = getEnemySize(type);
    const spacingX = (CANVAS_W - GRID_COLS * sz.w) / (GRID_COLS + 1);
    for (let col = 0; col < GRID_COLS; col++) {
      const startX = spacingX + col * (sz.w + spacingX);
      const startY = ENEMY_START_Y + (rowCount - 1 - rowIdx) * 58;
      enemies.push({
        id: `${rowIdx}-${col}`,
        type,
        x: startX, y: startY,
        w: sz.w,   h: sz.h,
        hp: getEnemyHP(type),
        maxHp: getEnemyHP(type),
        alive: true,
        row: rowIdx, col,
        frame: 0,
        shootTimer: randInt(80, 200) + rowIdx * 30,
        sineOffset: col * 0.5 + rowIdx * 0.8,
        deathTimer: 0,
      });
    }
  });
  return enemies;
}

// ─── Canvas Drawing ───

function drawStars(ctx, stars) {
  stars.forEach(s => {
    ctx.globalAlpha = s.brightness;
    ctx.fillStyle = "#fff";
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  ctx.globalAlpha = 1;
}

// Draw a humanoid ninja figure.
// (cx, cy) = center-bottom of feet.
// scale: 1 for full player, 0.6 for falling ally
function drawNinjaFigure(ctx, cx, cy, color, scale, frame, boosts, shootFlash) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  // All measurements are relative to scale=1; feet at y=0, head top at y=-64
  const headR = 14;          // head radius
  const headCY = -54;        // head center Y
  const torsoT = -42;        // torso top
  const torsoB = -20;        // torso bottom (belt level)
  const legTopY = -20;
  const legBotY = 0;
  const legW = 9;
  const armH = 14;
  const armW = 7;

  // Shield aura
  if (boosts) {
    const shieldBoost = boosts.find(b => b.id === "shield");
    if (shieldBoost) {
      const pulse = 0.4 + Math.sin(frame * 0.12) * 0.2;
      ctx.strokeStyle = `rgba(59,130,246,${pulse + 0.3})`;
      ctx.lineWidth = 3 / scale;
      ctx.beginPath();
      ctx.ellipse(0, -32, 28, 38, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    const lightBoost = boosts.find(b => b.id === "lightning");
    if (lightBoost) {
      ctx.shadowColor = "#fbbf24";
      ctx.shadowBlur = 12;
    }
    const spinBoost = boosts.find(b => b.id === "spinjitzu");
    if (spinBoost) {
      const spin = frame * 0.15;
      ctx.strokeStyle = "rgba(168,85,247,0.65)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = spin + (i * Math.PI) / 2;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * 22, -32 + Math.sin(a) * 28, 4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // ── Legs ──
  const legColor = "#374151";
  // Left leg
  ctx.fillStyle = legColor;
  ctx.beginPath();
  ctx.roundRect(-legW - 1, legTopY, legW, legBotY - legTopY, 3);
  ctx.fill();
  // Right leg
  ctx.beginPath();
  ctx.roundRect(2, legTopY, legW, legBotY - legTopY, 3);
  ctx.fill();

  // ── Torso ──
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-11, torsoT, 22, torsoB - torsoT, 4);
  ctx.fill();

  // Belt stripe (white/gold)
  ctx.fillStyle = "#fde68a";
  ctx.fillRect(-11, -26, 22, 3);

  // Torso highlight
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.roundRect(-9, torsoT + 2, 10, 10, 3);
  ctx.fill();

  // ── Arms ──
  // Left arm (angled outward)
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(-14, -38);
  ctx.rotate(-0.2);
  ctx.beginPath();
  ctx.roundRect(-armW / 2, 0, armW, armH, 3);
  ctx.fill();
  ctx.restore();
  // Right arm
  ctx.save();
  ctx.translate(14, -38);
  ctx.rotate(0.2);
  ctx.beginPath();
  ctx.roundRect(-armW / 2, 0, armW, armH, 3);
  ctx.fill();
  ctx.restore();

  // ── Head ──
  ctx.shadowBlur = 0;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, headCY, headR, 0, Math.PI * 2);
  ctx.fill();

  // Face mask (dark strip across eyes)
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(-headR + 2, headCY - 4, (headR - 2) * 2, 7);

  // Eye slits (white)
  ctx.fillStyle = "#fff";
  ctx.fillRect(-8, headCY - 2, 5, 3);
  ctx.fillRect(3, headCY - 2, 5, 3);

  // Head highlight
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ctx.beginPath();
  ctx.arc(-4, headCY - 5, 6, 0, Math.PI * 2);
  ctx.fill();

  // Ninja headband knot (small bump on side)
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(headR - 2, headCY - 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // ── Shooting flash — energy orb above head ──
  if (shootFlash && shootFlash > 0) {
    ctx.globalAlpha = shootFlash / 8;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(0, headCY - headR - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// Draw falling ally ninja with glow outline and label
function drawFallingAlly(ctx, ally, frame) {
  if (!ally || !ally.active) return;
  const { x, y, ninja, hp } = ally;

  ctx.save();

  // Pulsing gold/white glow outline
  const pulse = 0.5 + Math.sin(frame * 0.12) * 0.5;
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 16 * pulse;

  // Draw mini ninja
  const cx = x;
  const cy = y; // feet
  const sc = ALLY_SCALE;

  // Glow ring
  ctx.strokeStyle = `rgba(251,191,36,${pulse * 0.8})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - (PLAYER_H * sc) / 2, (PLAYER_W * sc) / 2 + 6, (PLAYER_H * sc) / 2 + 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  drawNinjaFigure(ctx, cx, cy, ninja.color, sc, frame, null, 0);

  ctx.shadowBlur = 0;

  // Name label above
  ctx.font = "bold 10px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillStyle = "#fbbf24";
  ctx.strokeStyle = "#0f172a";
  ctx.lineWidth = 2;
  const labelY = cy - PLAYER_H * sc - 4;
  ctx.strokeText(ninja.nameHe, cx, labelY);
  ctx.fillText(ninja.nameHe, cx, labelY);

  // Down arrow
  ctx.fillStyle = "#fbbf24";
  ctx.font = "bold 11px sans-serif";
  ctx.textBaseline = "top";
  ctx.fillText("▼", cx, cy - PLAYER_H * sc - 18);

  // HP dots
  for (let i = 0; i < ALLY_HP; i++) {
    ctx.beginPath();
    ctx.arc(cx - (ALLY_HP - 1) * 5 + i * 10, cy + 6, 3, 0, Math.PI * 2);
    ctx.fillStyle = i < hp ? "#4ade80" : "#374151";
    ctx.fill();
  }

  ctx.restore();
}

// Glowing orb bullet
function drawBullet(ctx, b, color) {
  ctx.save();
  // Trail
  const trailAlpha = 0.3;
  const grad = ctx.createLinearGradient(b.x, b.y + BULLET_TRAIL, b.x, b.y - BULLET_R);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(1, color + "88");
  ctx.fillStyle = grad;
  ctx.fillRect(b.x - 3, b.y, 6, BULLET_TRAIL);
  ctx.globalAlpha = trailAlpha;

  // Glow
  ctx.shadowColor = color;
  ctx.shadowBlur = 14;
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(b.x, b.y, BULLET_R, 0, Math.PI * 2);
  ctx.fill();

  // White core
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(b.x, b.y, BULLET_R * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSpinBullet(ctx, b, color) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawEnemyBullet(ctx, b) {
  ctx.save();
  ctx.shadowColor = "#7b2d8b";
  ctx.shadowBlur = 7;
  ctx.fillStyle = "#a855f7";
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, ENEMY_BULLET_W / 2, ENEMY_BULLET_H / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c084fc";
  ctx.beginPath();
  ctx.ellipse(b.x, b.y, 2, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

// ─── Enemy drawing (1.5x bigger, more detailed) ───

function drawSkulkinEnemy(ctx, enemy, frame) {
  const { x, y, w, h, hp, maxHp, deathTimer } = enemy;
  const cx = x + w / 2;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 20;
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      const r = (20 - deathTimer) * 1.2;
      ctx.fillStyle = i % 2 === 0 ? "#d4c5a9" : "#6b7280";
      ctx.fillRect(cx + Math.cos(a) * r - 4, y + h / 2 + Math.sin(a) * r - 4, 8, 8);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const bob = Math.sin(frame * 0.08 + enemy.sineOffset) * 2.5;

  // Armored body
  ctx.fillStyle = "#3a3a4a";
  ctx.beginPath();
  ctx.roundRect(x + 5, y + h * 0.42 + bob, w - 10, h * 0.5, 4);
  ctx.fill();

  // Shoulder pads
  ctx.fillStyle = "#2a2a3a";
  ctx.fillRect(x - 2, y + h * 0.43 + bob, 12, 8);
  ctx.fillRect(x + w - 10, y + h * 0.43 + bob, 12, 8);

  // Skull head (large circle, bone-white)
  ctx.fillStyle = "#d4c5a9";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.27 + bob, 15, 0, Math.PI * 2);
  ctx.fill();

  // Dark helmet cap over top half
  ctx.fillStyle = "#2a2a3a";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.25 + bob, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x + 3, y + h * 0.25 + bob, w - 6, 8);

  // Deep dark eye sockets
  ctx.fillStyle = "#1e293b";
  ctx.beginPath();
  ctx.ellipse(cx - 5, y + h * 0.275 + bob, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 5, y + h * 0.275 + bob, 5, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glowing red pupils
  ctx.fillStyle = "#ff4444";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 6;
  ctx.beginPath();
  ctx.arc(cx - 5, y + h * 0.275 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 5, y + h * 0.275 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Nose dot
  ctx.fillStyle = "#9ca3af";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.31 + bob, 2, 0, Math.PI * 2);
  ctx.fill();

  // Teeth row (dark bar + white rects)
  ctx.fillStyle = "#1e293b";
  ctx.fillRect(cx - 8, y + h * 0.34 + bob, 16, 5);
  ctx.fillStyle = "#d4c5a9";
  for (let t = 0; t < 4; t++) {
    ctx.fillRect(cx - 7 + t * 4, y + h * 0.34 + bob, 3, 4);
  }

  // Sword
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + h * 0.52 + bob);
  ctx.lineTo(x - 6, y + h * 0.82 + bob);
  ctx.stroke();
  ctx.strokeStyle = "#fbbf24";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + h * 0.51 + bob);
  ctx.lineTo(x + 8, y + h * 0.55 + bob);
  ctx.stroke();

  if (hp < maxHp) {
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(x, y - 8, w, 4);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x, y - 8, w * (hp / maxHp), 4);
  }
}

function drawSerpentineEnemy(ctx, enemy, frame) {
  const { x, y, w, h, hp, maxHp, deathTimer } = enemy;
  const cx = x + w / 2;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 20;
    ctx.fillStyle = "#2dd45b";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + i * 9 + (20 - deathTimer) * 0.6, y + (20 - deathTimer) * 0.6, 7, 7);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const slither = Math.sin(frame * 0.13 + enemy.sineOffset) * 3.5;

  // Body (green cobra)
  ctx.fillStyle = "#166534";
  ctx.beginPath();
  ctx.roundRect(x + 4 + slither, y + h * 0.4, w - 8, h * 0.45, 5);
  ctx.fill();

  // Scale pattern
  ctx.fillStyle = "#15803d";
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(x + 9 + i * 8 + slither, y + h * 0.56, 4, 6, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wide hood triangle (pointing down = cobra flare)
  ctx.fillStyle = "#16a34a";
  ctx.beginPath();
  ctx.moveTo(cx - 18 + slither, y + h * 0.38);
  ctx.lineTo(cx + slither, y + h * 0.12);
  ctx.lineTo(cx + 18 + slither, y + h * 0.38);
  ctx.closePath();
  ctx.fill();

  // Hood pattern
  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.moveTo(cx - 10 + slither, y + h * 0.35);
  ctx.lineTo(cx + slither, y + h * 0.2);
  ctx.lineTo(cx + 10 + slither, y + h * 0.35);
  ctx.closePath();
  ctx.fill();

  // Head circle at bottom of hood
  ctx.fillStyle = "#15803d";
  ctx.beginPath();
  ctx.arc(cx + slither, y + h * 0.22, 11, 0, Math.PI * 2);
  ctx.fill();

  // Yellow slit eyes
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(cx - 7 + slither, y + h * 0.19, 4, 5);
  ctx.fillRect(cx + 3 + slither, y + h * 0.19, 4, 5);
  // Vertical slit pupil
  ctx.fillStyle = "#000";
  ctx.fillRect(cx - 5.5 + slither, y + h * 0.19, 1.5, 5);
  ctx.fillRect(cx + 4.5 + slither, y + h * 0.19, 1.5, 5);

  // Fangs
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(cx - 3 + slither, y + h * 0.3);
  ctx.lineTo(cx - 1 + slither, y + h * 0.38);
  ctx.lineTo(cx + 1 + slither, y + h * 0.3);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 2 + slither, y + h * 0.3);
  ctx.lineTo(cx + 4 + slither, y + h * 0.38);
  ctx.lineTo(cx + 6 + slither, y + h * 0.3);
  ctx.fill();

  // Diagonal scale lines
  ctx.strokeStyle = "#22c55e";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 6 + i * 9 + slither, y + h * 0.42);
    ctx.lineTo(x + 12 + i * 9 + slither, y + h * 0.54);
    ctx.stroke();
  }

  if (hp < maxHp) {
    ctx.fillStyle = "rgba(0,180,0,0.3)";
    ctx.fillRect(x, y - 8, w, 4);
    ctx.fillStyle = "#22c55e";
    ctx.fillRect(x, y - 8, w * (hp / maxHp), 4);
  }
}

function drawStoneWarriorEnemy(ctx, enemy, frame) {
  const { x, y, w, h, hp, maxHp, deathTimer } = enemy;
  const cx = x + w / 2;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 20;
    ctx.fillStyle = "#3a3a45";
    for (let i = 0; i < 6; i++) {
      const ox = (Math.random() - 0.5) * (20 - deathTimer) * 1.5;
      const oy = (Math.random() - 0.5) * (20 - deathTimer) * 1.5;
      ctx.fillRect(cx + ox - 5, y + h / 2 + oy - 5, 10, 10);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const glow = Math.sin(frame * 0.08 + enemy.sineOffset) * 0.35 + 0.65;
  const bob = Math.sin(frame * 0.05 + enemy.sineOffset) * 1.5;

  // Main block body (gray stone)
  ctx.fillStyle = "#374151";
  ctx.beginPath();
  ctx.roundRect(x + 3, y + h * 0.28 + bob, w - 6, h * 0.6, 5);
  ctx.fill();

  // Stone crosshatch texture
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 2; c++) {
      ctx.strokeRect(x + 6 + c * 20, y + h * 0.3 + r * 14 + bob, 18, 12);
    }
  }

  // Wide shoulders / pauldrons
  ctx.fillStyle = "#4b5563";
  ctx.fillRect(x - 4, y + h * 0.28 + bob, w + 8, 14);

  // Helmet head
  ctx.fillStyle = "#6b7280";
  ctx.beginPath();
  ctx.roundRect(x + 8, y + bob, w - 16, h * 0.3, 6);
  ctx.fill();
  ctx.fillStyle = "#4b5563";
  ctx.beginPath();
  ctx.roundRect(x + 6, y + h * 0.08 + bob, w - 12, h * 0.24, 4);
  ctx.fill();

  // Red glowing power lines on body
  ctx.strokeStyle = `rgba(255,50,50,${glow})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 6 * glow;
  ctx.beginPath();
  ctx.moveTo(x + 10, y + h * 0.4 + bob);
  ctx.lineTo(cx, y + h * 0.52 + bob);
  ctx.lineTo(x + w - 10, y + h * 0.4 + bob);
  ctx.stroke();

  // Eye slits
  ctx.fillStyle = `rgba(255,50,50,${glow})`;
  ctx.fillRect(cx - 9, y + h * 0.1 + bob, 6, 5);
  ctx.fillRect(cx + 3, y + h * 0.1 + bob, 6, 5);
  ctx.shadowBlur = 0;

  // Horizontal mouth line
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 8, y + h * 0.2 + bob);
  ctx.lineTo(cx + 8, y + h * 0.2 + bob);
  ctx.stroke();

  if (hp < maxHp) {
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(x, y - 10, w, 5);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x, y - 10, w * (hp / maxHp), 5);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(hp, cx, y - 3);
  }
}

function drawHypnobraiEnemy(ctx, enemy, frame) {
  const { x, y, w, h, hp, maxHp, deathTimer } = enemy;
  const cx = x + w / 2;
  const cy = y + h / 2;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 20;
    ctx.fillStyle = "#06b6d4";
    ctx.beginPath();
    ctx.arc(cx, cy, (w / 2) * (1 - (20 - deathTimer) / 20), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  const spin = frame * 0.07 + enemy.sineOffset;

  // Outer glow ring
  const pulse = 0.4 + Math.sin(frame * 0.1 + enemy.sineOffset) * 0.3;
  ctx.strokeStyle = `rgba(6,182,212,${pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, w / 2 + 4, 0, Math.PI * 2);
  ctx.stroke();

  // Circle body
  ctx.fillStyle = "#0e7490";
  ctx.beginPath();
  ctx.arc(cx, cy, w / 2, 0, Math.PI * 2);
  ctx.fill();

  // Hypnotic triple spiral
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i === 0 ? "#06b6d4" : i === 1 ? "#a855f7" : "#fbbf24";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const startR = 3 + i * 3;
    for (let t = 0; t < Math.PI * 3; t += 0.15) {
      const r = startR + t * 1.8;
      if (r > w / 2 - 2) break;
      const a = t + spin + (i * Math.PI * 2) / 3;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Head at top
  ctx.fillStyle = "#06b6d4";
  ctx.beginPath();
  ctx.arc(cx, y + 8, 10, 0, Math.PI * 2);
  ctx.fill();

  // Hypnotic spiral eyes
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(cx - 4, y + 7, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4, y + 7, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Spinning pupils
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx - 4 + Math.cos(spin) * 1.2, y + 7 + Math.sin(spin) * 1.2, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 4 + Math.cos(spin + Math.PI) * 1.2, y + 7 + Math.sin(spin + Math.PI) * 1.2, 1.5, 0, Math.PI * 2);
  ctx.fill();

  if (hp < maxHp) {
    ctx.fillStyle = "rgba(6,182,212,0.3)";
    ctx.fillRect(x, y - 8, w, 4);
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(x, y - 8, w * (hp / maxHp), 4);
  }
}

function drawBonusEnemy(ctx, enemy, frame) {
  const { x, y, w, h } = enemy;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const pulse = 0.8 + Math.sin(frame * 0.15) * 0.2;

  ctx.save();
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 16 * pulse;

  ctx.fillStyle = `rgba(251,191,36,${pulse})`;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 4, w - 4, h - 8, 5);
  ctx.fill();

  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.ellipse(x + 3, cy, 6, h / 2 - 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w - 3, cy, 6, h / 2 - 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1e293b";
  ctx.font = `bold ${18 * pulse}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", cx, cy);

  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.textBaseline = "alphabetic";
}

function drawEnemy(ctx, enemy, frame) {
  if (!enemy.alive && enemy.deathTimer <= 0) return;
  if (enemy.type === "skulkin")       drawSkulkinEnemy(ctx, enemy, frame);
  else if (enemy.type === "serpentine")  drawSerpentineEnemy(ctx, enemy, frame);
  else if (enemy.type === "stoneWarrior") drawStoneWarriorEnemy(ctx, enemy, frame);
  else if (enemy.type === "hypnobrai")   drawHypnobraiEnemy(ctx, enemy, frame);
  else if (enemy.type === "bonus")       drawBonusEnemy(ctx, enemy, frame);
}

function drawHUD(ctx, hearts, maxHearts, score, level, boosts, frame) {
  // Semi-transparent HUD band
  ctx.fillStyle = "rgba(2,6,23,0.7)";
  ctx.fillRect(0, 0, CANVAS_W, 32);

  // Hearts
  ctx.font = "18px sans-serif";
  for (let i = 0; i < maxHearts; i++) {
    ctx.fillStyle = i < hearts ? "#ef4444" : "rgba(239,68,68,0.2)";
    ctx.fillText("♥", 10 + i * 22, 22);
  }

  // Score
  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "bold 14px sans-serif";
  ctx.fillStyle = "#e2e8f0";
  ctx.fillText(`${score}`, CANVAS_W / 2, 22);
  ctx.restore();

  // Level
  ctx.save();
  ctx.textAlign = "right";
  ctx.font = "bold 13px sans-serif";
  ctx.fillStyle = "#94a3b8";
  ctx.fillText(`שלב ${level}`, CANVAS_W - 10, 22);
  ctx.restore();

  // Active boost banner
  if (boosts.length > 0) {
    const bannerY = 32;
    const bannerH = 22;
    boosts.forEach((b, i) => {
      const pct = b.remaining / b.maxDuration;
      const bw = CANVAS_W / boosts.length;
      const bx = i * bw;

      ctx.fillStyle = b.color + "33";
      ctx.fillRect(bx, bannerY, bw, bannerH);

      // Progress fill
      ctx.fillStyle = b.color + "77";
      ctx.fillRect(bx, bannerY + bannerH - 3, bw * pct, 3);

      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = b.color;
      ctx.fillText(`${b.icon} ${b.nameHe}`, bx + bw / 2, bannerY + bannerH / 2);
    });
    ctx.textBaseline = "alphabetic";
  }

  // Control hints — top-left below hearts
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = "#fff";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("← →  להזזה", 8, 36);
  ctx.fillText("רווח  לירי", 8, 50);
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Main Component ───
export function SpaceInvadersGame({ gradeQ, sparks, isAdmin, addSparks, gameProgress, saveGameProgress, onExit, playSound }) {
  // ── UI state ──
  const [phase, setPhase] = useState("levelSelect");
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [hearts, setHearts] = useState(3);
  const [, setScore] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [questionData, setQuestionData] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [attemptNum, setAttemptNum] = useState(1);
  const [resultData, setResultData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Refs ──
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animRef = useRef(null);
  const keysRef = useRef({});
  const touchRef = useRef({ left: false, right: false, shooting: false });
  const starsRef = useRef([]);

  // Derived
  const unlockedNinjas = getUnlockedNinjas(sparks || 0, isAdmin);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gp = gameProgress["space-invaders"] || {};

  const getStars = (lvl) => gp[lvl]?.stars || 0;
  const getStarsDisplay = (stars) => "⭐".repeat(stars) + "☆".repeat(3 - stars);
  const isLevelUnlocked = (lvl) => isAdmin || lvl === 1 || gp[lvl - 1]?.stars > 0;

  // Init stars
  useEffect(() => {
    starsRef.current = Array.from({ length: 200 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: Math.random() < 0.75 ? 1 : Math.random() < 0.9 ? 2 : 3,
      brightness: 0.3 + Math.random() * 0.7,
      speed: 0.3 + Math.random() * 1.2,
    }));
  }, []);

  // ── Keyboard ──
  useEffect(() => {
    if (phase !== "playing") return;
    const onDown = (e) => {
      keysRef.current[e.key] = true;
      if (e.key === " ") { e.preventDefault(); keysRef.current._shoot = true; }
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") e.preventDefault();
    };
    const onUp = (e) => { keysRef.current[e.key] = false; };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      keysRef.current = {};
    };
  }, [phase]);

  // ── Start level ──
  const startLevel = useCallback((lvlNum) => {
    const levelDef = LEVEL_DEFS[Math.min(lvlNum - 1, LEVEL_DEFS.length - 1)];
    const enemies = buildEnemyGrid(levelDef);

    const pool = [...(gradeQ || [])].sort(() => Math.random() - 0.5);
    const mandatoryPool = pool.filter(q => q.difficulty !== "hard");
    const hardPool = pool.filter(q => q.difficulty === "hard");

    const mandatoryQuestions = [];
    for (let i = 0; i < (levelDef.mandatoryQ || 1); i++) {
      mandatoryQuestions.push(mandatoryPool[i % mandatoryPool.length] || pool[i] || null);
    }

    const selectedNinja = unlockedNinjas[unlockedNinjas.length - 1] || NINJAS[0];

    gameRef.current = {
      frame: 0,
      player: { x: CANVAS_W / 2 - PLAYER_W / 2, speed: PLAYER_SPEED },
      shootFlash: 0,
      bullets: [],
      enemyBullets: [],
      enemies,
      bonusEnemy: null,
      bonusSpawnTimer: 300 + Math.random() * 300,
      marchDir: 1,
      marchTimer: 0,
      marchInterval: BASE_MARCH_INTERVAL,
      marchStep: 18 + lvlNum * 2,
      hearts: 3,
      score: 0,
      paused: false,
      shootCooldown: 0,
      autoShootTimer: 0,
      boosts: [],
      shieldHits: 0,
      selectedNinja,
      // Falling ally
      allyTimer: 0,
      fallingAlly: null,
      // Questions
      mandatoryQuestions,
      mandatoryQIdx: 0,
      mandatoryQTriggered: false,
      hardPool,
      firstAttemptCorrect: 0,
      bonusQCorrect: 0,
      mandatoryQCount: levelDef.mandatoryQ || 1,
      levelNum: lvlNum,
      finished: false,
      floaters: [],
    };

    setSelectedLevel(lvlNum);
    setHearts(3);
    setScore(0);
    setShowQuestion(false);
    setQuestionData(null);
    setSelectedAnswer(null);
    setFeedback(null);
    setShowExplanation(false);
    setAttemptNum(1);
    setResultData(null);
    setPhase("playing");
  }, [gradeQ, unlockedNinjas]);

  // ── Finish level ──
  const finishLevel = useCallback((won, finalScore, finalHearts, firstAttemptCorrect, mandatoryCount, bonusQCorrect) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    let stars = 0;
    if (won) {
      stars = 1;
      if (firstAttemptCorrect >= mandatoryCount) stars = 2;
      if (stars === 2 && bonusQCorrect >= 1) stars = 3;
    }

    const sparksEarned = won ? (10 + (stars - 1) * 5) : 0;
    if (sparksEarned > 0 && addSparks) addSparks(sparksEarned);

    const existingStars = gp[selectedLevel]?.stars || 0;
    const newGp = {
      ...gameProgress,
      "space-invaders": {
        ...(gameProgress["space-invaders"] || {}),
        [selectedLevel]: { stars: Math.max(existingStars, stars) },
      },
    };
    saveGameProgress(newGp);

    if (won && stars > 0) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
      if (playSound) playSound("celebrate");
    }

    setResultData({ won, stars, score: finalScore, sparksEarned, hearts: finalHearts });
    setPhase("result");
  }, [gp, selectedLevel, gameProgress, saveGameProgress, addSparks, playSound]);

  // ── Trigger question ──
  const triggerQuestion = useCallback((type, q, onCorrect, onWrong) => {
    const g = gameRef.current;
    if (!g) return;
    g.paused = true;
    setQuestionData({ q, type, onCorrect, onWrong });
    setShowQuestion(true);
    setSelectedAnswer(null);
    setFeedback(null);
    setShowExplanation(false);
    setAttemptNum(1);
  }, []);

  // ── Handle answer ──
  const handleAnswer = useCallback(() => {
    if (selectedAnswer === null || feedback) return;
    const { q, type } = questionData;
    const isCorrect = selectedAnswer === q.correct;

    setFeedback(isCorrect ? "correct" : "wrong");
    if (playSound) playSound(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      if (type === "mandatory" && attemptNum === 1) {
        const g = gameRef.current;
        if (g) g.firstAttemptCorrect = (g.firstAttemptCorrect || 0) + 1;
      }
      if (type === "bonus") {
        const g = gameRef.current;
        if (g) g.bonusQCorrect = (g.bonusQCorrect || 0) + 1;
      }
    }

    setTimeout(() => setShowExplanation(true), 500);
  }, [selectedAnswer, feedback, questionData, attemptNum, playSound]);

  // ── Close question ──
  const closeQuestion = useCallback(() => {
    const { onCorrect, onWrong } = questionData;
    const isCorrect = feedback === "correct";

    setShowQuestion(false);
    setQuestionData(null);
    setSelectedAnswer(null);
    setFeedback(null);
    setShowExplanation(false);
    setAttemptNum(1);

    const g = gameRef.current;
    if (!g) return;
    g.paused = false;

    if (isCorrect) {
      if (onCorrect) onCorrect(g);
    } else {
      if (onWrong) onWrong(g);
      g.enemies.forEach(en => { en.y += 20; });
    }
  }, [questionData, feedback]);

  // ── Apply boost ──
  function applyBoost(g, boostId) {
    const def = BOOST_TYPES.find(b => b.id === boostId);
    if (!def) return;
    g.boosts = g.boosts.filter(b => b.id !== boostId);
    g.boosts.push({ id: def.id, icon: def.icon, nameHe: def.nameHe, color: def.color, remaining: def.duration, maxDuration: def.duration });
    if (boostId === "shield") g.shieldHits = 2;
  }

  // ── Spawn a falling ally ──
  function spawnFallingAlly(g) {
    const others = g.benchNinjas
      ? g.benchNinjas.filter(n => n.id !== g.selectedNinja.id)
      : unlockedNinjas.filter(n => n.id !== g.selectedNinja.id);
    if (others.length === 0) return;
    const ninja = others[randInt(0, others.length - 1)];
    g.fallingAlly = {
      active: true,
      x: randInt(PLAYER_W, CANVAS_W - PLAYER_W),
      y: 0,
      ninja,
      hp: ALLY_HP,
    };
  }

  // ── Game loop ──
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const loop = () => {
      animRef.current = requestAnimationFrame(loop);
      const g = gameRef.current;
      if (!g) return;

      renderFrame(ctx, g);

      if (g.paused || g.finished) return;

      g.frame++;

      // ── Tick shoot flash ──
      if (g.shootFlash > 0) g.shootFlash--;

      // ── Boost timers ──
      g.boosts = g.boosts.filter(b => { b.remaining--; return b.remaining > 0; });
      const hasLightning = g.boosts.some(b => b.id === "lightning");
      const hasPower    = g.boosts.some(b => b.id === "power");
      const hasShield   = g.boosts.some(b => b.id === "shield");
      const hasSpinjitzu = g.boosts.some(b => b.id === "spinjitzu");

      // ── Player movement ──
      const keys = keysRef.current;
      const touch = touchRef.current;
      const effSpeed = hasLightning ? g.player.speed * 2 : g.player.speed;
      if ((keys["ArrowLeft"] || touch.left) && g.player.x > 0)
        g.player.x -= effSpeed;
      if ((keys["ArrowRight"] || touch.right) && g.player.x + PLAYER_W < CANVAS_W)
        g.player.x += effSpeed;
      g.player.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, g.player.x));

      // ── Shoot cooldown ──
      if (g.shootCooldown > 0) g.shootCooldown--;

      const shootCooldownBase = hasLightning ? 8 : 15;
      const bulletDamage = hasPower ? 3 : 1;

      if ((keys[" "] || keys._shoot || touch.shooting) && g.shootCooldown <= 0) {
        keys._shoot = false;
        touch.shooting = false;
        g.shootCooldown = shootCooldownBase;
        const bx = g.player.x + PLAYER_W / 2;
        g.bullets.push({ x: bx, y: PLAYER_Y, damage: bulletDamage });
        g.shootFlash = 8;
        if (playSound) playSound("click");
      }

      // Spinjitzu auto-fire
      if (hasSpinjitzu) {
        if (g.autoShootTimer > 0) g.autoShootTimer--;
        if (g.autoShootTimer <= 0) {
          g.autoShootTimer = 30;
          const cx = g.player.x + PLAYER_W / 2;
          const cy = PLAYER_Y - PLAYER_H / 2;
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            g.bullets.push({ x: cx, y: cy, vx: Math.cos(angle) * BULLET_SPEED, vy: Math.sin(angle) * BULLET_SPEED, spin: true, damage: bulletDamage });
          }
        }
      }

      // ── Scroll stars ──
      starsRef.current.forEach(s => {
        s.y += s.speed * 1.5;
        if (s.y > CANVAS_H) { s.y = 0; s.x = Math.random() * CANVAS_W; }
      });

      // ── Move bullets ──
      g.bullets = g.bullets.filter(b => {
        if (b.spin) {
          b.x += b.vx; b.y += b.vy;
          return b.x > -20 && b.x < CANVAS_W + 20 && b.y > -20 && b.y < CANVAS_H + 20;
        }
        b.y -= BULLET_SPEED;
        return b.y > -(BULLET_R + BULLET_TRAIL);
      });

      g.enemyBullets = g.enemyBullets.filter(b => {
        b.y += ENEMY_BULLET_SPEED;
        return b.y < CANVAS_H + ENEMY_BULLET_H;
      });

      // ── Enemy march ──
      g.marchTimer += 16.67;
      const aliveEnemies = g.enemies.filter(e => e.alive);
      const marchInterval = Math.max(150, g.marchInterval - aliveEnemies.length * 8);

      if (g.marchTimer >= marchInterval) {
        g.marchTimer = 0;
        let hitWall = false;
        const stepX = g.marchStep * g.marchDir;
        aliveEnemies.forEach(en => {
          const nx = en.x + stepX;
          if (nx < 6 || nx + en.w > CANVAS_W - 6) hitWall = true;
        });
        if (hitWall) {
          g.marchDir *= -1;
          aliveEnemies.forEach(en => { en.y += ENEMY_DROP; });
          g.marchInterval = Math.max(150, g.marchInterval - 30);

          const lowestY = Math.max(...aliveEnemies.map(e => e.y + e.h));
          if (!g.mandatoryQTriggered && lowestY >= 350 && g.mandatoryQIdx < g.mandatoryQuestions.length) {
            g.mandatoryQTriggered = true;
            const q = g.mandatoryQuestions[g.mandatoryQIdx];
            g.mandatoryQIdx++;
            if (q) {
              triggerQuestion("mandatory", q,
                (gg) => { applyBoost(gg, BOOST_TYPES[randInt(0, BOOST_TYPES.length - 1)].id); gg.mandatoryQTriggered = false; },
                (gg) => { gg.mandatoryQTriggered = false; }
              );
            }
          }
        } else {
          aliveEnemies.forEach(en => { en.x += stepX; });
        }
      }

      // ── Enemy frame & shooting ──
      g.enemies.forEach(en => {
        if (!en.alive) { if (en.deathTimer > 0) en.deathTimer--; return; }
        en.frame++;
        if (en.type === "serpentine" || en.type === "hypnobrai") {
          en.shootTimer--;
          if (en.shootTimer <= 0) {
            en.shootTimer = 180 + randInt(0, 120);
            g.enemyBullets.push({ x: en.x + en.w / 2, y: en.y + en.h });
          }
        }
        if (en.type === "stoneWarrior") {
          en.shootTimer--;
          if (en.shootTimer <= 0) {
            en.shootTimer = 220 + randInt(0, 80);
            g.enemyBullets.push({ x: en.x + en.w / 2, y: en.y + en.h });
          }
        }
      });

      // ── Enemies reach bottom ──
      aliveEnemies.forEach(en => {
        if (en.y + en.h >= PLAYER_Y - 10) {
          en.alive = false;
          en.deathTimer = 0;
          g.hearts = Math.max(0, g.hearts - 1);
          setHearts(g.hearts);
        }
      });

      // ── Bonus enemy ──
      if (g.bonusEnemy && g.bonusEnemy.alive) {
        g.bonusEnemy.x += g.bonusEnemy.vx;
        g.bonusEnemy.frame++;
        if (g.bonusEnemy.x < -80 || g.bonusEnemy.x > CANVAS_W + 80) g.bonusEnemy = null;
      } else if (!g.bonusEnemy) {
        g.bonusSpawnTimer--;
        if (g.bonusSpawnTimer <= 0) {
          g.bonusSpawnTimer = 400 + Math.random() * 400;
          const fromLeft = Math.random() < 0.5;
          g.bonusEnemy = {
            type: "bonus", alive: true, frame: 0,
            x: fromLeft ? -50 : CANVAS_W + 50,
            y: 200 + Math.random() * 200,
            w: 40, h: 40,
            vx: fromLeft ? 2 : -2,
            sineOffset: Math.random() * Math.PI * 2,
          };
        }
      }

      // ── Falling ally timer ──
      if (!g.fallingAlly || !g.fallingAlly.active) {
        g.allyTimer++;
        if (g.allyTimer >= ALLY_SPAWN_INTERVAL) {
          g.allyTimer = 0;
          spawnFallingAlly(g);
        }
      } else {
        // Move ally down
        const ally = g.fallingAlly;
        ally.y += ALLY_FALL_SPEED;

        // Enemy bullets hitting ally
        g.enemyBullets = g.enemyBullets.filter(b => {
          const aLeft = ally.x - (PLAYER_W * ALLY_SCALE) / 2;
          const aTop  = ally.y - PLAYER_H * ALLY_SCALE;
          if (!rectOverlap(b.x - ENEMY_BULLET_W / 2, b.y - ENEMY_BULLET_H / 2, ENEMY_BULLET_W, ENEMY_BULLET_H, aLeft, aTop, PLAYER_W * ALLY_SCALE, PLAYER_H * ALLY_SCALE)) return true;
          ally.hp--;
          if (ally.hp <= 0) {
            ally.active = false;
            g.floaters.push({ x: ally.x, y: ally.y - 20, text: "הנינג'ה נפל!", life: 50 });
          }
          return false;
        });

        // Catch check: player overlaps ally
        if (ally.active) {
          const pCx = g.player.x + PLAYER_W / 2;
          const aCx = ally.x;
          const catchDist = (PLAYER_W / 2) + (PLAYER_W * ALLY_SCALE) / 2 + 10;
          const vertOk = Math.abs(ally.y - PLAYER_Y) < 50;
          if (Math.abs(pCx - aCx) < catchDist && vertOk) {
            // Caught!
            const caught = ally.ninja;
            ally.active = false;
            g.selectedNinja = caught;
            if (g.hearts < 3) { g.hearts++; setHearts(g.hearts); }
            g.floaters.push({ x: pCx, y: PLAYER_Y - 30, text: `${caught.nameHe} הצטרף! +❤`, life: 70 });
            if (playSound) playSound("correct");
          }
        }

        // Fell off screen
        if (ally.y > CANVAS_H + 20) ally.active = false;
      }

      // ── Bullet vs enemies ──
      const bulletsToRemove = new Set();
      g.enemies.forEach(en => {
        if (!en.alive) return;
        g.bullets.forEach((b, bi) => {
          const bLeft = b.spin ? b.x - 5 : b.x - BULLET_R;
          const bTop  = b.spin ? b.y - 5 : b.y - BULLET_R;
          const bW    = b.spin ? 10 : BULLET_R * 2;
          const bH    = b.spin ? 10 : BULLET_R * 2;
          if (!rectOverlap(bLeft, bTop, bW, bH, en.x, en.y, en.w, en.h)) return;
          en.hp -= (b.damage || 1);
          bulletsToRemove.add(bi);
          if (en.hp <= 0) {
            en.alive = false;
            en.deathTimer = 20;
            const pts = KILL_PTS[en.type] || 10;
            g.score += pts;
            g.floaters.push({ x: en.x + en.w / 2, y: en.y, text: `+${pts}`, life: 40 });
            setScore(g.score);
            if (playSound) playSound("correct");
          }
        });
      });

      // Bullet vs bonus enemy
      if (g.bonusEnemy && g.bonusEnemy.alive) {
        g.bullets.forEach((b, bi) => {
          if (!rectOverlap(b.x - BULLET_R, b.y - BULLET_R, BULLET_R * 2, BULLET_R * 2,
              g.bonusEnemy.x, g.bonusEnemy.y, g.bonusEnemy.w, g.bonusEnemy.h)) return;
          bulletsToRemove.add(bi);
          g.bonusEnemy.alive = false;
          g.bonusEnemy = null;
          const hardQ = g.hardPool[randInt(0, g.hardPool.length - 1)] || g.mandatoryQuestions[0];
          if (hardQ) {
            triggerQuestion("bonus", hardQ,
              (gg) => { applyBoost(gg, BOOST_TYPES[randInt(0, BOOST_TYPES.length - 1)].id); gg.score += KILL_PTS.bonus; setScore(gg.score); gg.floaters.push({ x: CANVAS_W / 2, y: 200, text: `+${KILL_PTS.bonus} בונוס!`, life: 60 }); },
              () => {}
            );
          }
        });
      }
      g.bullets = g.bullets.filter((_, i) => !bulletsToRemove.has(i));

      // ── Enemy bullets vs player ──
      const pLeft = g.player.x, pTop = PLAYER_Y - PLAYER_H;
      g.enemyBullets = g.enemyBullets.filter(b => {
        if (!rectOverlap(b.x - ENEMY_BULLET_W / 2, b.y - ENEMY_BULLET_H / 2, ENEMY_BULLET_W, ENEMY_BULLET_H,
            pLeft, pTop, PLAYER_W, PLAYER_H)) return true;
        if (hasShield && g.shieldHits > 0) {
          g.shieldHits--;
          if (g.shieldHits <= 0) g.boosts = g.boosts.filter(b => b.id !== "shield");
          if (playSound) playSound("wrong");
          return false;
        }
        g.hearts = Math.max(0, g.hearts - 1);
        setHearts(g.hearts);
        if (playSound) playSound("wrong");
        return false;
      });

      // ── Tick floaters ──
      g.floaters = g.floaters.filter(f => { f.y -= 0.8; f.life--; return f.life > 0; });

      // ── Wave cleared ──
      const stillAlive = g.enemies.filter(e => e.alive);
      if (stillAlive.length === 0 && !g.mandatoryQTriggered && !g.paused) {
        if (g.mandatoryQIdx < g.mandatoryQuestions.length) {
          g.mandatoryQTriggered = true;
          const q = g.mandatoryQuestions[g.mandatoryQIdx];
          g.mandatoryQIdx++;
          if (q) {
            const onDone = (gg) => {
              const al = gg.enemies.filter(e => e.alive);
              if (al.length === 0 && gg.mandatoryQIdx >= gg.mandatoryQuestions.length) {
                gg.finished = true;
                finishLevel(true, gg.score, gg.hearts, gg.firstAttemptCorrect, gg.mandatoryQCount, gg.bonusQCorrect);
              } else { gg.mandatoryQTriggered = false; }
            };
            triggerQuestion("mandatory", q,
              (gg) => { applyBoost(gg, BOOST_TYPES[randInt(0, BOOST_TYPES.length - 1)].id); onDone(gg); },
              onDone
            );
          }
        } else {
          g.finished = true;
          finishLevel(true, g.score, g.hearts, g.firstAttemptCorrect, g.mandatoryQCount, g.bonusQCorrect);
        }
      }

      // ── Game over ──
      if (g.hearts <= 0 && !g.finished) {
        g.finished = true;
        finishLevel(false, g.score, 0, g.firstAttemptCorrect, g.mandatoryQCount, g.bonusQCorrect);
      }
    };

    // ── Render (every frame, even paused) ──
    function renderFrame(ctx, g) {
      if (!g) return;

      // Deep space gradient background
      const bg = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      bg.addColorStop(0, "#020617");
      bg.addColorStop(1, "#0f172a");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Stars (scrolling)
      drawStars(ctx, starsRef.current);

      // Danger line
      if (g.enemies.filter(e => e.alive).length > 0) {
        ctx.strokeStyle = "rgba(239,68,68,0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(0, 350);
        ctx.lineTo(CANVAS_W, 350);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Enemies
      g.enemies.forEach(en => drawEnemy(ctx, en, g.frame));
      if (g.bonusEnemy) drawEnemy(ctx, g.bonusEnemy, g.frame);

      // Falling ally (drawn before player so player is on top)
      if (g.fallingAlly && g.fallingAlly.active) {
        drawFallingAlly(ctx, g.fallingAlly, g.frame);
      }

      // Player bullets
      const bullColor = g.selectedNinja?.shootColor || "#fbbf24";
      g.bullets.forEach(b => {
        if (b.spin) drawSpinBullet(ctx, b, bullColor);
        else drawBullet(ctx, b, bullColor);
      });

      // Enemy bullets
      g.enemyBullets.forEach(b => drawEnemyBullet(ctx, b));

      // Player ninja figure
      const px = g.player.x + PLAYER_W / 2;
      drawNinjaFigure(ctx, px, PLAYER_Y, g.selectedNinja?.color || "#ef4444", 1, g.frame, g.boosts, g.shootFlash);

      // Floaters
      g.floaters.forEach(f => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, f.life / 20);
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = "#fbbf24";
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      });

      // HUD (drawn last so it's on top)
      drawHUD(ctx, g.hearts, 3, g.score, g.levelNum, g.boosts, g.frame);

      // Paused overlay
      if (g.paused) {
        ctx.fillStyle = "rgba(2,6,23,0.55)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 22px sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("שאלה!", CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.restore();
      }
    }

    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, triggerQuestion, finishLevel, playSound]);

  // ── Touch handlers ──
  const handleCanvasTouchStart = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const tx = (touch.clientX - rect.left) * (CANVAS_W / rect.width);

    if (tx < CANVAS_W / 2) {
      touchRef.current.left = true;
      touchRef.current.right = false;
    } else {
      touchRef.current.right = true;
      touchRef.current.left = false;
    }
  }, []);

  const handleCanvasTouchEnd = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 0) {
      touchRef.current.left = false;
      touchRef.current.right = false;
    }
  }, []);

  // ── RENDER: Level select ──
  if (phase === "levelSelect") {
    return (
      <div className="container" style={{ direction: "rtl" }}>
        <div className="page-content">
          <div className="page-header">
            <button onClick={onExit} className="back-btn">→ חזרה</button>
            <h2>🥷 פלישת הסרפנטין</h2>
          </div>

          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            ירו על הסרפנטין המסתערים! ענו על שאלות לקבלת חיזוקים.
            <br />
            <span style={{ color: "#fbbf24", fontSize: 12 }}>
              כל 15 שניות נינג'ה חבר יצנח — תפסו אותו לקבלת לב נוסף!
            </span>
          </div>

          {/* Boost legend */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            {BOOST_TYPES.map(b => (
              <div key={b.id} style={{
                background: b.color + "22", border: `1px solid ${b.color}55`,
                borderRadius: 8, padding: "4px 10px",
                fontSize: 12, color: b.color,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span>{b.icon}</span><span>{b.nameHe}</span>
              </div>
            ))}
          </div>

          {/* Level list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LEVEL_DEFS.map((_, i) => {
              const lvl = i + 1;
              const unlocked = isLevelUnlocked(lvl);
              const stars = getStars(lvl);
              return (
                <button
                  key={lvl}
                  onClick={() => unlocked && startLevel(lvl)}
                  disabled={!unlocked}
                  style={{
                    display: "flex", alignItems: "center", gap: 12,
                    padding: "12px 16px", borderRadius: 12,
                    background: unlocked ? "rgba(30,41,59,0.9)" : "rgba(15,23,42,0.6)",
                    border: `2px solid ${unlocked ? "#7c3aed66" : "#1e293b"}`,
                    color: unlocked ? "#e2e8f0" : "#475569",
                    cursor: unlocked ? "pointer" : "default",
                    opacity: unlocked ? 1 : 0.5, textAlign: "right",
                  }}
                >
                  <span style={{ fontSize: 24, minWidth: 36 }}>{unlocked ? "🥷" : "🔒"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>שלב {lvl}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {LEVEL_DEFS[i].rows.map(r =>
                        r === "skulkin" ? "גולגולות" :
                        r === "serpentine" ? "סרפנטין" :
                        r === "stoneWarrior" ? "לוחמי אבן" : "היפנוברי"
                      ).join(" · ")}
                      {LEVEL_DEFS[i].extraRow ? ` · ${LEVEL_DEFS[i].extraRow === "stoneWarrior" ? "לוחמי אבן" : "היפנוברי"}` : ""}
                    </div>
                  </div>
                  {unlocked && (
                    <div style={{ fontSize: 16, minWidth: 60, textAlign: "left" }}>
                      {stars > 0 ? getStarsDisplay(stars) : <span style={{ color: "#475569" }}>☆☆☆</span>}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── RENDER: Playing ──
  if (phase === "playing") {
    const currentQ = questionData?.q || null;
    const isTopic4 = currentQ?.topic === 4;
    const isTopic5 = currentQ?.topic === 5;

    return (
      <div className="container" style={{ padding: 0, direction: "rtl" }}>
        <Confetti active={showConfetti} />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            width: "100%", maxWidth: CANVAS_W, height: "auto",
            display: "block", background: "#020617",
            borderRadius: 8, touchAction: "none",
          }}
          onTouchStart={handleCanvasTouchStart}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchMove={(e) => e.preventDefault()}
        />

        {/* Controls bar below canvas */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 12px", background: "rgba(2,6,23,0.95)",
          borderTop: "1px solid #1e293b",
        }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="ninja-ctrl-btn"
              onTouchStart={() => { touchRef.current.left = true; }}
              onTouchEnd={() => { touchRef.current.left = false; }}
              onMouseDown={() => { touchRef.current.left = true; }}
              onMouseUp={() => { touchRef.current.left = false; }}
              onMouseLeave={() => { touchRef.current.left = false; }}
            >◀</button>
            <button
              className="ninja-ctrl-btn"
              onTouchStart={() => { touchRef.current.right = true; }}
              onTouchEnd={() => { touchRef.current.right = false; }}
              onMouseDown={() => { touchRef.current.right = true; }}
              onMouseUp={() => { touchRef.current.right = false; }}
              onMouseLeave={() => { touchRef.current.right = false; }}
            >▶</button>
          </div>

          {/* Big fire button */}
          <button
            style={{
              width: 58, height: 58, borderRadius: "50%",
              background: "rgba(124,58,237,0.35)",
              border: "2px solid #7c3aed",
              color: "#a78bfa", fontSize: 26,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              userSelect: "none",
            }}
            onTouchStart={(e) => { e.preventDefault(); keysRef.current._shoot = true; }}
            onMouseDown={() => { keysRef.current._shoot = true; }}
          >↑</button>

          <button
            className="back-btn"
            onClick={() => {
              if (animRef.current) cancelAnimationFrame(animRef.current);
              setPhase("levelSelect");
            }}
          >✕</button>
        </div>

        {/* Question overlay */}
        {showQuestion && currentQ && (
          <div className="ninja-gate-overlay">
            <div className="ninja-gate-card" style={{ maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <span style={{ color: questionData.type === "bonus" ? "#fbbf24" : "#7c3aed", fontWeight: 700, fontSize: 14 }}>
                    {questionData.type === "bonus" ? "🌀 שאלת בונוס!" : "❓ שאלת עצירה"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4, fontSize: 18 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ opacity: i < hearts ? 1 : 0.2 }}>❤️</span>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, textAlign: "center" }}>
                {questionData.type === "bonus"
                  ? "ענו נכון לקבלת חיזוק + ניצוצות בונוס!"
                  : "ענו נכון לקבלת חיזוק! טעות = הגריד יירד"}
              </div>

              <div className="question-card" style={{ marginBottom: 12 }}>
                {isTopic4 && currentQ.visual ? (
                  <div>
                    <p className="visual-prompt">מצאו את המספר החסר (?)</p>
                    <Topic4Visual visual={currentQ.visual} />
                  </div>
                ) : isTopic5 && currentQ.visual ? (
                  <div>
                    <p className="visual-prompt">מה הצורה הבאה?</p>
                    <Topic5Visual visual={currentQ.visual} />
                  </div>
                ) : (
                  <p className="question-text">{currentQ.question}</p>
                )}
              </div>

              <div className="options-grid">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = feedback && i === currentQ.correct;
                  const isWrong = feedback && isSelected && i !== currentQ.correct;
                  let cls = "option-btn";
                  if (isTopic5) cls += " topic5";
                  if (isSelected && !feedback) cls += " selected";
                  if (isCorrect) cls += " correct";
                  if (isWrong) cls += " wrong";
                  return (
                    <button
                      key={i}
                      onClick={() => { if (!feedback) { setSelectedAnswer(i); if (playSound) playSound("click"); } }}
                      disabled={!!feedback}
                      className={cls}
                      style={{ cursor: feedback ? "default" : "pointer" }}
                    >
                      <span className="option-num">{i + 1}</span>
                      {isCorrect && <span style={{ color: "#4ade80" }}>✓</span>}
                      {isWrong && <span style={{ color: "#f87171" }}>✗</span>}
                      {isTopic5 && typeof opt === "object"
                        ? <Topic5Option opt={opt} size={40} />
                        : <span className="option-text" style={{ color: "#e2e8f0" }}>{typeof opt === "string" ? opt : opt?.label || ""}</span>}
                    </button>
                  );
                })}
              </div>

              {!feedback ? (
                <button
                  onClick={handleAnswer}
                  disabled={selectedAnswer === null}
                  className={`primary-btn w-full${selectedAnswer === null ? " disabled" : ""}`}
                  style={{ marginTop: 8 }}
                >
                  ✓ אישור תשובה
                </button>
              ) : showExplanation ? (
                <div>
                  {currentQ.explanation && (
                    <div className="explanation-card" style={{ marginBottom: 10 }}>
                      <div className="explanation-title">💡 הסבר</div>
                      <p className="explanation-text">{currentQ.explanation}</p>
                    </div>
                  )}
                  <button className="primary-btn w-full" onClick={closeQuestion} style={{ marginTop: 8 }}>
                    {feedback === "correct" ? "⚡ קבלו חיזוק! המשיכו!" : "← המשיכו לשחק"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── RENDER: Result ──
  if (phase === "result" && resultData) {
    const { won, stars, score: finalScore, sparksEarned } = resultData;
    const nextLevel = selectedLevel + 1;
    const hasNext = won && nextLevel <= LEVEL_DEFS.length && isLevelUnlocked(nextLevel);

    return (
      <div className="container" style={{ direction: "rtl" }}>
        <div className="page-content">
          <Confetti active={showConfetti} />
          <div className={`level-result-card ${won ? "passed" : "failed"}`}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>{won ? "🥷" : "💥"}</div>
            <h2 style={{ color: "#e2e8f0", margin: "6px 0" }}>
              {won ? "כל הכבוד! הגריד הובס!" : "הסרפנטין נצחו הפעם..."}
            </h2>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 8 }}>שלב {selectedLevel}</div>

            <div className={`result-score ${won ? "pass" : "fail"}`} style={{ fontSize: 36 }}>
              {finalScore}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>נקודות</div>

            {won && (
              <div className="result-stars" style={{ marginBottom: 12 }}>
                {getStarsDisplay(stars)}
              </div>
            )}

            <div style={{ display: "flex", gap: 4, justifyContent: "center", fontSize: 22, marginBottom: 12 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ opacity: i < (won ? resultData.hearts : 0) ? 1 : 0.2 }}>❤️</span>
              ))}
            </div>

            {sparksEarned > 0 && (
              <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                ✨ {sparksEarned} ניצוצות!
              </div>
            )}

            {won && (
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, lineHeight: 1.8, textAlign: "right" }}>
                <div>⭐ כוכב 1: ניצחון</div>
                <div style={{ opacity: stars >= 2 ? 1 : 0.4 }}>⭐ כוכב 2: כל השאלות נכון בניסיון ראשון</div>
                <div style={{ opacity: stars >= 3 ? 1 : 0.4 }}>⭐ כוכב 3: שאלת הבונוס נכון</div>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {hasNext && (
                <button className="primary-btn w-full" onClick={() => startLevel(nextLevel)}>
                  שלב הבא ←
                </button>
              )}
              <button className="primary-btn w-full" onClick={() => startLevel(selectedLevel)}>
                נסו שוב 🔄
              </button>
              <button className="secondary-btn w-full" onClick={() => setPhase("levelSelect")}>
                בחירת שלב
              </button>
              <button className="secondary-btn w-full" onClick={onExit}>
                → חזרה למשחקים
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
