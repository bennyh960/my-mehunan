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
const PLAYER_H = 56;
const PLAYER_Y = 570;
const PLAYER_SPEED = 3.5;

// Bullets
const BULLET_SPEED = 8;
const BULLET_W = 4;
const BULLET_H = 14;
const ENEMY_BULLET_SPEED = 2.2;
const ENEMY_BULLET_W = 6;
const ENEMY_BULLET_H = 10;

// Enemy grid
const GRID_COLS = 6;
const GRID_ROWS = 4;
const ENEMY_START_Y = 80;
const ENEMY_DROP = 20;
const BASE_MARCH_INTERVAL = 800; // ms per step

// Enemy sizes
const SKULKIN_W = 32;
const SKULKIN_H = 28;
const SERPENTINE_W = 28;
const SERPENTINE_H = 36;
const STONE_W = 36;
const STONE_H = 40;
const HYPNO_W = 30;
const HYPNO_H = 30;

// Boosts
const BOOST_TYPES = [
  { id: "lightning", nameHe: "ברק מהיר", descHe: "2x מהירות וקצב ירי", icon: "⚡", color: "#fbbf24", duration: 600 },
  { id: "power",     nameHe: "כוח עצום", descHe: "+2 נזק לכל כדור",     icon: "💥", color: "#ef4444", duration: 480 },
  { id: "shield",    nameHe: "מגן אנרגיה", descHe: "סופג 2 פגיעות",    icon: "🛡", color: "#3b82f6", duration: 720 },
  { id: "spinjitzu", nameHe: "ספינג'יטסו", descHe: "ירי אוטומטי לכל הכיוונים", icon: "🌀", color: "#a855f7", duration: 360 },
];

// Points
const KILL_PTS = { skulkin: 10, serpentine: 20, stoneWarrior: 40, hypnobrai: 30, bonus: 100 };

// ─── Level Definitions ───
// Each entry: rows = array of enemy types per row (bottom to top in grid)
// mandatoryQ: how many mandatory questions trigger during the wave
const LEVEL_DEFS = [
  // Level 1: 4 rows Skulkin, 1 mandatory question
  { rows: ["skulkin","skulkin","skulkin","skulkin"], mandatoryQ: 1 },
  // Level 2: 3 Skulkin + 1 Serpentine row, 1 question
  { rows: ["skulkin","skulkin","skulkin","serpentine"], mandatoryQ: 1 },
  // Level 3: 2 Skulkin + 1 Serpentine + 1 Stone Warrior, 1 question
  { rows: ["skulkin","skulkin","serpentine","stoneWarrior"], mandatoryQ: 1 },
  // Level 4: 2 Skulkin + 2 Serpentine + 1 Stone Warrior (extra row offset), 2 questions
  { rows: ["skulkin","skulkin","serpentine","serpentine"], extraRow: "stoneWarrior", mandatoryQ: 2 },
  // Level 5: 1 Skulkin + 2 Serpentine + 1 Stone + 1 Hypnobrai, 2 questions
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
  if (type === "skulkin")     return { w: SKULKIN_W,    h: SKULKIN_H };
  if (type === "serpentine")  return { w: SERPENTINE_W, h: SERPENTINE_H };
  if (type === "stoneWarrior") return { w: STONE_W,     h: STONE_H };
  if (type === "hypnobrai")   return { w: HYPNO_W,      h: HYPNO_H };
  return { w: 32, h: 32 };
}

function getEnemyHP(type) {
  if (type === "skulkin")     return 1;
  if (type === "serpentine")  return 2;
  if (type === "stoneWarrior") return 4;
  if (type === "hypnobrai")   return 2;
  return 1;
}

// ─── Build an enemy grid for a level ───
function buildEnemyGrid(levelDef) {
  const enemies = [];
  const allRows = [...levelDef.rows];
  if (levelDef.extraRow) allRows.push(levelDef.extraRow);

  const rowCount = allRows.length;

  allRows.forEach((type, rowIdx) => {
    const sz = getEnemySize(type);
    const spacingX = (CANVAS_W - GRID_COLS * sz.w) / (GRID_COLS + 1);
    for (let col = 0; col < GRID_COLS; col++) {
      // Stagger start positions
      const startX = spacingX + col * (sz.w + spacingX);
      const startY = ENEMY_START_Y + (rowCount - 1 - rowIdx) * 52;
      enemies.push({
        id: `${rowIdx}-${col}`,
        type,
        x: startX,
        y: startY,
        w: sz.w,
        h: sz.h,
        hp: getEnemyHP(type),
        maxHp: getEnemyHP(type),
        alive: true,
        row: rowIdx,
        col,
        frame: 0,
        shootTimer: randInt(80, 200) + rowIdx * 30,
        sineOffset: col * 0.5 + rowIdx * 0.8,
        deathTimer: 0,
      });
    }
  });
  return enemies;
}

// ─── Canvas Drawing Functions ───

function drawStars(ctx, stars) {
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  stars.forEach(s => {
    ctx.globalAlpha = s.brightness;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
  ctx.globalAlpha = 1;
}

function drawPlayer(ctx, player, ninjaColor, frame, boosts) {
  const { x, y } = player;
  const cx = x + PLAYER_W / 2;
  const col = ninjaColor || "#ef4444";

  ctx.save();

  // Shield aura
  const shieldBoost = boosts.find(b => b.id === "shield");
  if (shieldBoost) {
    const pulse = 0.3 + Math.sin(frame * 0.12) * 0.2;
    ctx.strokeStyle = `rgba(59,130,246,${pulse + 0.3})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, y + PLAYER_H / 2, PLAYER_W * 0.7, PLAYER_H * 0.6, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Lightning speed glow
  const lightBoost = boosts.find(b => b.id === "lightning");
  if (lightBoost) {
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 12;
  }

  // Spinjitzu glow
  const spinBoost = boosts.find(b => b.id === "spinjitzu");
  if (spinBoost) {
    const spin = frame * 0.15;
    ctx.strokeStyle = `rgba(168,85,247,0.6)`;
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const a = spin + (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * 22, y + PLAYER_H / 2 + Math.sin(a) * 28, 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Ship body (ninja silhouette as space fighter)
  // Fuselage
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx, y);                          // nose
  ctx.lineTo(cx + 14, y + 30);               // right shoulder
  ctx.lineTo(cx + 10, y + PLAYER_H);         // right base
  ctx.lineTo(cx - 10, y + PLAYER_H);         // left base
  ctx.lineTo(cx - 14, y + 30);               // left shoulder
  ctx.closePath();
  ctx.fill();

  // Cockpit (dark)
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.ellipse(cx, y + 14, 8, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  // Visor glow
  ctx.fillStyle = col;
  ctx.globalAlpha = 0.5 + Math.sin(frame * 0.08) * 0.2;
  ctx.beginPath();
  ctx.ellipse(cx, y + 13, 5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Left wing
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(cx - 12, y + 28);
  ctx.lineTo(cx - PLAYER_W / 2 - 4, y + 48);
  ctx.lineTo(cx - PLAYER_W / 2 + 2, y + PLAYER_H);
  ctx.lineTo(cx - 10, y + PLAYER_H);
  ctx.closePath();
  ctx.fill();

  // Right wing
  ctx.beginPath();
  ctx.moveTo(cx + 12, y + 28);
  ctx.lineTo(cx + PLAYER_W / 2 + 4, y + 48);
  ctx.lineTo(cx + PLAYER_W / 2 - 2, y + PLAYER_H);
  ctx.lineTo(cx + 10, y + PLAYER_H);
  ctx.closePath();
  ctx.fill();

  // Darker wing detail
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.beginPath();
  ctx.moveTo(cx - 12, y + 36);
  ctx.lineTo(cx - PLAYER_W / 2, y + 50);
  ctx.lineTo(cx - 10, y + PLAYER_H);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + 12, y + 36);
  ctx.lineTo(cx + PLAYER_W / 2, y + 50);
  ctx.lineTo(cx + 10, y + PLAYER_H);
  ctx.closePath();
  ctx.fill();

  // Engine exhaust
  const exhaustFlicker = 0.6 + Math.sin(frame * 0.3) * 0.4;
  ctx.fillStyle = `rgba(251,191,36,${exhaustFlicker})`;
  ctx.beginPath();
  ctx.ellipse(cx - 6,  y + PLAYER_H + 4, 3, 6 * exhaustFlicker, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + 6,  y + PLAYER_H + 4, 3, 6 * exhaustFlicker, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(239,68,68,${exhaustFlicker * 0.7})`;
  ctx.beginPath();
  ctx.ellipse(cx, y + PLAYER_H + 2, 4, 8 * exhaustFlicker, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawBullet(ctx, b, color) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(b.x - BULLET_W / 2, b.y - BULLET_H, BULLET_W, BULLET_H, 2);
  ctx.fill();
  // Core bright
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.roundRect(b.x - 1, b.y - BULLET_H + 2, 2, BULLET_H - 4, 1);
  ctx.fill();
  ctx.restore();
  ctx.shadowBlur = 0;
}

function drawEnemyBullet(ctx, b) {
  ctx.save();
  ctx.shadowColor = "#7b2d8b";
  ctx.shadowBlur = 6;
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

function drawSkulkinEnemy(ctx, enemy, frame) {
  const { x, y, w, h, hp, maxHp, deathTimer } = enemy;
  const cx = x + w / 2;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 20;
    // Skull fragments
    for (let i = 0; i < 4; i++) {
      const ox = Math.cos((i * Math.PI) / 2) * (20 - deathTimer) * 0.6;
      const oy = Math.sin((i * Math.PI) / 2) * (20 - deathTimer) * 0.6;
      ctx.fillStyle = "#d4c5a9";
      ctx.fillRect(cx + ox - 3, y + h / 2 + oy - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const bob = Math.sin(frame * 0.08 + enemy.sineOffset) * 2;

  // Armor body
  ctx.fillStyle = "#3a3a4a";
  ctx.fillRect(x + 4, y + h * 0.4 + bob, w - 8, h * 0.5);

  // Skull head
  ctx.fillStyle = "#d4c5a9";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.28 + bob, 10, 0, Math.PI * 2);
  ctx.fill();

  // Dark helmet cap
  ctx.fillStyle = "#2a2a3a";
  ctx.beginPath();
  ctx.arc(cx, y + h * 0.26 + bob, 10, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(x + 2, y + h * 0.26 + bob, w - 4, 6);

  // Glowing red eyes
  ctx.fillStyle = "#ff4444";
  ctx.beginPath();
  ctx.arc(cx - 3, y + h * 0.28 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3, y + h * 0.28 + bob, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Sword
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 2, y + h * 0.5 + bob);
  ctx.lineTo(x - 4, y + h * 0.8 + bob);
  ctx.stroke();

  // HP bar if damaged
  if (hp < maxHp) {
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(x, y - 6, w, 3);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x, y - 6, w * (hp / maxHp), 3);
  }
}

function drawSerpentineEnemy(ctx, enemy, frame) {
  const { x, y, w, h, hp, maxHp, deathTimer } = enemy;
  const cx = x + w / 2;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 20;
    ctx.fillStyle = "#2dd45b";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + i * 8 + (20 - deathTimer) * 0.5, y + (20 - deathTimer) * 0.5, 6, 6);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const slither = Math.sin(frame * 0.15 + enemy.sineOffset) * 3;

  // Body
  ctx.fillStyle = "#7b2d8b";
  ctx.fillRect(x + 3 + slither, y + h * 0.35, w - 6, h * 0.5);

  // Green scales
  ctx.fillStyle = "#2dd45b";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(x + 5 + i * 7 + slither, y + h * 0.4 + i * 4, 4, 3);
  }

  // Hooded head
  ctx.fillStyle = "#7b2d8b";
  ctx.beginPath();
  ctx.arc(cx + slither, y + h * 0.22, 10, 0, Math.PI * 2);
  ctx.fill();

  // Hood cobra flare
  ctx.beginPath();
  ctx.moveTo(cx - 13 + slither, y + h * 0.3);
  ctx.lineTo(cx + slither, y + h * 0.05);
  ctx.lineTo(cx + 13 + slither, y + h * 0.3);
  ctx.fill();

  // Yellow slit eyes
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(cx - 5 + slither, y + h * 0.19, 3, 4);
  ctx.fillRect(cx + 2 + slither, y + h * 0.19, 3, 4);
  ctx.fillStyle = "#000";
  ctx.fillRect(cx - 4 + slither, y + h * 0.2, 1, 3);
  ctx.fillRect(cx + 3 + slither, y + h * 0.2, 1, 3);

  // Fangs
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - 2 + slither, y + h * 0.32, 2, 4);
  ctx.fillRect(cx + 1 + slither, y + h * 0.32, 2, 4);

  if (hp < maxHp) {
    ctx.fillStyle = "rgba(168,85,247,0.3)";
    ctx.fillRect(x, y - 6, w, 3);
    ctx.fillStyle = "#a855f7";
    ctx.fillRect(x, y - 6, w * (hp / maxHp), 3);
  }
}

function drawStoneWarriorEnemy(ctx, enemy, frame) {
  const { x, y, w, h, hp, maxHp, deathTimer } = enemy;
  const cx = x + w / 2;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 20;
    ctx.fillStyle = "#3a3a45";
    for (let i = 0; i < 5; i++) {
      const ox = (Math.random() - 0.5) * (20 - deathTimer);
      ctx.fillRect(cx + ox - 4, y + h / 2 + (Math.random() - 0.5) * (20 - deathTimer) - 4, 8, 8);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const glow = Math.sin(frame * 0.08 + enemy.sineOffset) * 0.3 + 0.7;
  const bob = Math.sin(frame * 0.05 + enemy.sineOffset) * 1.5;

  // Bulky body
  ctx.fillStyle = "#2a2a35";
  ctx.fillRect(x + 2, y + h * 0.3 + bob, w - 4, h * 0.55);

  // Shoulders
  ctx.fillRect(x - 2, y + h * 0.3 + bob, w + 4, h * 0.18);

  // Helmet head
  ctx.fillStyle = "#3a3a45";
  ctx.fillRect(x + 6, y + bob, w - 12, h * 0.33);
  ctx.fillRect(x + 4, y + h * 0.08 + bob, w - 8, h * 0.28);

  // Red power lines
  ctx.strokeStyle = `rgba(255,50,50,${glow})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 8, y + h * 0.38 + bob);
  ctx.lineTo(cx, y + h * 0.48 + bob);
  ctx.lineTo(x + w - 8, y + h * 0.38 + bob);
  ctx.stroke();

  // Eyes
  ctx.fillStyle = `rgba(255,50,50,${glow})`;
  ctx.fillRect(cx - 6, y + h * 0.12 + bob, 4, 4);
  ctx.fillRect(cx + 2, y + h * 0.12 + bob, 4, 4);

  // HP bar
  if (hp < maxHp) {
    ctx.fillStyle = "rgba(255,0,0,0.3)";
    ctx.fillRect(x, y - 8, w, 4);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(x, y - 8, w * (hp / maxHp), 4);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(hp, cx, y - 2);
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
    ctx.arc(cx, cy, w / 2 * (1 - deathTimer / 20), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return;
  }

  const spin = frame * 0.06 + enemy.sineOffset;

  // Hypnotic spiral body
  ctx.save();
  ctx.translate(cx, cy);
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = i === 0 ? "#06b6d4" : i === 1 ? "#a855f7" : "#fbbf24";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const startR = 4 + i * 3;
    for (let t = 0; t < Math.PI * 3; t += 0.2) {
      const r = startR + t * 1.5;
      const a = t + spin + (i * Math.PI * 2) / 3;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();

  // Cobra head
  ctx.fillStyle = "#06b6d4";
  ctx.beginPath();
  ctx.arc(cx, y + 6, 7, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath();
  ctx.arc(cx - 3, y + 5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3, y + 5, 2, 0, Math.PI * 2);
  ctx.fill();
  // Spiral pupils
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(cx - 3 + Math.cos(spin) * 0.8, y + 5 + Math.sin(spin) * 0.8, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + 3 + Math.cos(spin + Math.PI) * 0.8, y + 5 + Math.sin(spin + Math.PI) * 0.8, 1, 0, Math.PI * 2);
  ctx.fill();

  if (hp < maxHp) {
    ctx.fillStyle = "rgba(6,182,212,0.3)";
    ctx.fillRect(x, y - 6, w, 3);
    ctx.fillStyle = "#06b6d4";
    ctx.fillRect(x, y - 6, w * (hp / maxHp), 3);
  }
}

function drawBonusEnemy(ctx, enemy, frame) {
  const { x, y, w, h } = enemy;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const pulse = 0.8 + Math.sin(frame * 0.15) * 0.2;

  ctx.save();
  ctx.shadowColor = "#fbbf24";
  ctx.shadowBlur = 12 * pulse;

  // Golden scroll
  ctx.fillStyle = `rgba(251,191,36,${pulse})`;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 4, w - 4, h - 8, 4);
  ctx.fill();

  // Scroll ends
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.ellipse(x + 2, cy, 5, h / 2 - 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + w - 2, cy, 5, h / 2 - 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Question mark
  ctx.fillStyle = "#1e293b";
  ctx.font = `bold ${16 * pulse}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("?", cx, cy);

  ctx.restore();
  ctx.shadowBlur = 0;
  ctx.textBaseline = "alphabetic";
}

function drawEnemy(ctx, enemy, frame) {
  if (!enemy.alive && enemy.deathTimer <= 0) return;
  if (enemy.type === "skulkin")      drawSkulkinEnemy(ctx, enemy, frame);
  else if (enemy.type === "serpentine") drawSerpentineEnemy(ctx, enemy, frame);
  else if (enemy.type === "stoneWarrior") drawStoneWarriorEnemy(ctx, enemy, frame);
  else if (enemy.type === "hypnobrai")  drawHypnobraiEnemy(ctx, enemy, frame);
  else if (enemy.type === "bonus")   drawBonusEnemy(ctx, enemy, frame);
}

function drawHUD(ctx, hearts, maxHearts, score, level, boosts) {
  // Hearts
  ctx.font = "18px sans-serif";
  for (let i = 0; i < maxHearts; i++) {
    ctx.fillStyle = i < hearts ? "#ef4444" : "rgba(239,68,68,0.2)";
    ctx.fillText("♥", 10 + i * 22, 24);
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

  // Active boosts
  if (boosts.length > 0) {
    ctx.save();
    ctx.textAlign = "right";
    boosts.forEach((b, i) => {
      const pct = b.remaining / b.maxDuration;
      const bx = CANVAS_W - 10;
      const by = 36 + i * 22;
      // Timer bar
      ctx.fillStyle = "rgba(0,0,0,0.4)";
      ctx.fillRect(bx - 46, by - 10, 40, 6);
      ctx.fillStyle = b.color;
      ctx.fillRect(bx - 46, by - 10, 40 * pct, 6);
      // Icon
      ctx.font = "14px sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = b.color;
      ctx.fillText(b.icon, bx, by);
    });
    ctx.restore();
  }
}

function drawNinjaBench(ctx, benchNinjas, selectedIdx, cooldowns) {
  // Draw bench background
  const benchY = CANVAS_H - 90;
  ctx.fillStyle = "rgba(15,23,42,0.85)";
  ctx.fillRect(0, benchY, CANVAS_W, 38);
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 1;
  ctx.strokeRect(0, benchY, CANVAS_W, 38);

  const cellW = 42;
  const startX = (CANVAS_W - benchNinjas.length * (cellW + 6)) / 2;

  benchNinjas.forEach((ninja, i) => {
    const bx = startX + i * (cellW + 6);
    const by = benchY + 4;
    const isSelected = i === selectedIdx;
    const cd = cooldowns[ninja.id] || 0;
    const onCooldown = cd > 0;

    // Cell bg
    ctx.fillStyle = isSelected ? ninja.color + "44" : "rgba(30,41,59,0.8)";
    ctx.fillRect(bx, by, cellW, 30);
    ctx.strokeStyle = isSelected ? ninja.color : "#475569";
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(bx, by, cellW, 30);

    // Ninja color square
    ctx.fillStyle = onCooldown ? "#1e293b" : ninja.color;
    ctx.fillRect(bx + 4, by + 4, 22, 22);

    // Initial letter (Hebrew)
    ctx.fillStyle = onCooldown ? "#475569" : "#fff";
    ctx.font = `bold 13px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ninja.nameHe[0], bx + 15, by + 15);

    // Cooldown overlay
    if (onCooldown) {
      const cdPct = cd / 180;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(bx + 4, by + 4 + 22 * (1 - cdPct), 22, 22 * cdPct);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "9px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(Math.ceil(cd / 60) + "s", bx + 15, by + 15);
    }

    // Star indicator for currently selected
    if (isSelected) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "10px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      ctx.fillText("★", bx + cellW - 2, by + 2);
    }

    ctx.textBaseline = "alphabetic";
  });
  ctx.textBaseline = "alphabetic";
}

// ─── Main Component ───
export function SpaceInvadersGame({ gradeQ, sparks, isAdmin, addSparks, gameProgress, saveGameProgress, onExit, playSound }) {
  // ── UI state (React) ──
  const [phase, setPhase] = useState("levelSelect"); // levelSelect | playing | result
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [hearts, setHearts] = useState(3);
  const [, setScore] = useState(0);
  const [showQuestion, setShowQuestion] = useState(false);
  const [questionData, setQuestionData] = useState(null); // { q, type: "mandatory"|"bonus", onCorrect, onWrong }
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [showExplanation, setShowExplanation] = useState(false);
  const [attemptNum, setAttemptNum] = useState(1);
  const [resultData, setResultData] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // ── Refs (game state) ──
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const animRef = useRef(null);
  const keysRef = useRef({});
  const touchRef = useRef({ left: false, right: false, lastTap: 0 });
  const starsRef = useRef([]); // background stars

  // Derived
  const unlockedNinjas = getUnlockedNinjas(sparks || 0, isAdmin);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const gp = gameProgress["space-invaders"] || {};

  const getStars = (lvl) => gp[lvl]?.stars || 0;
  const getStarsDisplay = (stars) => "⭐".repeat(stars) + "☆".repeat(3 - stars);
  const isLevelUnlocked = (lvl) => isAdmin || lvl === 1 || gp[lvl - 1]?.stars > 0;

  // Init background stars once
  useEffect(() => {
    starsRef.current = Array.from({ length: 80 }, () => ({
      x: Math.random() * CANVAS_W,
      y: Math.random() * CANVAS_H,
      size: Math.random() < 0.8 ? 1 : 2,
      brightness: 0.3 + Math.random() * 0.7,
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

    // Pick mandatory questions from gradeQ
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
      // Player
      player: { x: CANVAS_W / 2 - PLAYER_W / 2, speed: PLAYER_SPEED },
      bullets: [],        // { x, y, damage }
      enemyBullets: [],   // { x, y }
      // Enemies
      enemies,
      bonusEnemy: null,   // bonus question enemy
      bonusSpawnTimer: 300 + Math.random() * 300,
      // March
      marchDir: 1,
      marchTimer: 0,
      marchInterval: BASE_MARCH_INTERVAL,
      marchStep: 18 + lvlNum * 2,
      // State
      hearts: 3,
      score: 0,
      lives: 3,
      paused: false,
      // Shooting
      shootCooldown: 0,
      autoShootTimer: 0,
      // Active boosts (array of { id, icon, color, remaining, maxDuration })
      boosts: [],
      shieldHits: 0,
      // Ninja bench
      selectedNinja,
      selectedNinjaIdx: unlockedNinjas.length - 1,
      benchNinjas: unlockedNinjas,
      ninjaCooldowns: {},
      // Question tracking
      mandatoryQuestions,
      mandatoryQIdx: 0,
      mandatoryQTriggered: false,
      hardPool,
      // Scoring for stars
      firstAttemptCorrect: 0,   // mandatory questions correct first try
      bonusQCorrect: 0,
      mandatoryQCount: levelDef.mandatoryQ || 1,
      // Level
      levelNum: lvlNum,
      finished: false,
      // Floaters
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

    setResultData({ won, stars, score: finalScore, sparksEarned });
    setPhase("result");
  }, [gp, selectedLevel, gameProgress, saveGameProgress, addSparks, playSound]);

  // ── Trigger question overlay ──
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

  // ── Handle answer submission ──
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

  // ── Close question overlay ──
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
      // Penalty: drop grid 20px
      g.enemies.forEach(en => { en.y += 20; });
    }
  }, [questionData, feedback]);

  // ── Bench ninja swap ──
  const swapNinja = useCallback((idx) => {
    const g = gameRef.current;
    if (!g) return;
    const ninja = g.benchNinjas[idx];
    if (!ninja) return;
    if ((g.ninjaCooldowns[ninja.id] || 0) > 0) return;
    if (idx === g.selectedNinjaIdx) return;

    // Put old ninja on cooldown
    const oldNinja = g.selectedNinja;
    g.ninjaCooldowns[oldNinja.id] = 180; // 3s at 60fps

    g.selectedNinja = ninja;
    g.selectedNinjaIdx = idx;
    // Gain +1 heart on swap (max 3)
    if (g.hearts < 3) {
      g.hearts++;
      setHearts(g.hearts);
    }
  }, []);

  // ── Apply a boost ──
  function applyBoost(g, boostId) {
    const def = BOOST_TYPES.find(b => b.id === boostId);
    if (!def) return;
    // Remove existing of same type
    g.boosts = g.boosts.filter(b => b.id !== boostId);
    g.boosts.push({ id: def.id, icon: def.icon, color: def.color, remaining: def.duration, maxDuration: def.duration });
    if (boostId === "shield") g.shieldHits = 2;
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

      // Draw even when paused
      renderFrame(ctx, g);

      if (g.paused || g.finished) return;

      g.frame++;

      // ── Tick cooldowns ──
      for (const id in g.ninjaCooldowns) {
        if (g.ninjaCooldowns[id] > 0) g.ninjaCooldowns[id]--;
      }
      if (g.shootCooldown > 0) g.shootCooldown--;
      if (g.autoShootTimer > 0) g.autoShootTimer--;

      // ── Boost timers ──
      g.boosts = g.boosts.filter(b => {
        b.remaining--;
        return b.remaining > 0;
      });
      const hasLightning = g.boosts.some(b => b.id === "lightning");
      const hasPower = g.boosts.some(b => b.id === "power");
      const hasShield = g.boosts.some(b => b.id === "shield");
      const hasSpinjitzu = g.boosts.some(b => b.id === "spinjitzu");

      // ── Player movement ──
      const keys = keysRef.current;
      const touch = touchRef.current;
      const effSpeed = hasLightning ? g.player.speed * 2 : g.player.speed;
      if ((keys["ArrowLeft"] || touch.left) && g.player.x > 0) {
        g.player.x -= effSpeed;
      }
      if ((keys["ArrowRight"] || touch.right) && g.player.x + PLAYER_W < CANVAS_W) {
        g.player.x += effSpeed;
      }
      g.player.x = Math.max(0, Math.min(CANVAS_W - PLAYER_W, g.player.x));

      // ── Shooting ──
      const shootCooldownBase = hasLightning ? 8 : 15;
      const bulletDamage = hasPower ? 3 : 1;

      if ((keys[" "] || keys._shoot || touch.shooting) && g.shootCooldown <= 0) {
        keys._shoot = false;
        touch.shooting = false;
        g.shootCooldown = shootCooldownBase;
        const bx = g.player.x + PLAYER_W / 2;
        g.bullets.push({ x: bx, y: PLAYER_Y, damage: bulletDamage });
        if (playSound) playSound("click");
      }

      // Spinjitzu auto-fire (all directions)
      if (hasSpinjitzu && g.autoShootTimer <= 0) {
        g.autoShootTimer = 30;
        const cx = g.player.x + PLAYER_W / 2;
        const cy = PLAYER_Y + PLAYER_H / 2;
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI * 2) / 8;
          const vx = Math.cos(angle) * BULLET_SPEED;
          const vy = Math.sin(angle) * BULLET_SPEED;
          g.bullets.push({ x: cx, y: cy, vx, vy, spin: true, damage: bulletDamage });
        }
      }

      // ── Move player bullets ──
      g.bullets = g.bullets.filter(b => {
        if (b.spin) {
          b.x += b.vx;
          b.y += b.vy;
          return b.x > -20 && b.x < CANVAS_W + 20 && b.y > -20 && b.y < CANVAS_H + 20;
        }
        b.y -= BULLET_SPEED;
        return b.y > -BULLET_H;
      });

      // ── Move enemy bullets ──
      g.enemyBullets = g.enemyBullets.filter(b => {
        b.y += ENEMY_BULLET_SPEED;
        return b.y < CANVAS_H + ENEMY_BULLET_H;
      });

      // ── Enemy march ──
      g.marchTimer += 16.67; // approx ms per frame at 60fps
      const aliveEnemies = g.enemies.filter(e => e.alive);
      const marchInterval = Math.max(150, g.marchInterval - aliveEnemies.length * 8); // speed up as fewer enemies

      if (g.marchTimer >= marchInterval) {
        g.marchTimer = 0;
        // Check walls
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

          // ── Mandatory question trigger: when grid crosses Y=350 ──
          const lowestY = Math.max(...aliveEnemies.map(e => e.y + e.h));
          if (!g.mandatoryQTriggered && lowestY >= 350 && g.mandatoryQIdx < g.mandatoryQuestions.length) {
            g.mandatoryQTriggered = true;
            const q = g.mandatoryQuestions[g.mandatoryQIdx];
            g.mandatoryQIdx++;
            if (q) {
              triggerQuestion("mandatory", q,
                (gg) => {
                  // Correct: grant random boost
                  const boostId = BOOST_TYPES[randInt(0, BOOST_TYPES.length - 1)].id;
                  applyBoost(gg, boostId);
                  gg.mandatoryQTriggered = false; // allow next trigger
                },
                (gg) => {
                  gg.mandatoryQTriggered = false;
                }
              );
            }
          }
        } else {
          aliveEnemies.forEach(en => { en.x += stepX; });
        }
      }

      // ── Enemy frame animation & shooting ──
      g.enemies.forEach(en => {
        if (!en.alive) {
          if (en.deathTimer > 0) en.deathTimer--;
          return;
        }
        en.frame++;

        // Serpentine: sine wave drift
        if (en.type === "serpentine") {
          en.sinePhase = (en.sinePhase || 0) + 0.03;
        }

        // Shooting
        if (en.type === "serpentine" || en.type === "hypnobrai") {
          en.shootTimer--;
          if (en.shootTimer <= 0) {
            en.shootTimer = 180 + randInt(0, 120);
            g.enemyBullets.push({ x: en.x + en.w / 2, y: en.y + en.h });
          }
        }
        // Stone Warrior slower shots
        if (en.type === "stoneWarrior") {
          en.shootTimer--;
          if (en.shootTimer <= 0) {
            en.shootTimer = 220 + randInt(0, 80);
            g.enemyBullets.push({ x: en.x + en.w / 2, y: en.y + en.h });
          }
        }
      });

      // ── Enemy reaches bottom ──
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
        if (g.bonusEnemy.x < -80 || g.bonusEnemy.x > CANVAS_W + 80) {
          g.bonusEnemy = null;
        }
      } else if (!g.bonusEnemy) {
        g.bonusSpawnTimer--;
        if (g.bonusSpawnTimer <= 0) {
          g.bonusSpawnTimer = 400 + Math.random() * 400;
          const fromLeft = Math.random() < 0.5;
          const y = 200 + Math.random() * 200;
          g.bonusEnemy = {
            type: "bonus", alive: true, frame: 0,
            x: fromLeft ? -50 : CANVAS_W + 50,
            y,
            w: 40, h: 40,
            vx: fromLeft ? 2 : -2,
            sineOffset: Math.random() * Math.PI * 2,
          };
        }
      }

      // ── Bullet collision: player bullets vs enemies ──
      const bulletsToRemove = new Set();
      g.enemies.forEach(en => {
        if (!en.alive) return;
        g.bullets.forEach((b, bi) => {
          if (!rectOverlap(b.x - BULLET_W / 2, b.y - BULLET_H, BULLET_W, BULLET_H, en.x, en.y, en.w, en.h)) return;
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
      // Bonus enemy vs player bullets
      if (g.bonusEnemy && g.bonusEnemy.alive) {
        g.bullets.forEach((b, bi) => {
          if (!rectOverlap(b.x - BULLET_W / 2, b.y - BULLET_H, BULLET_W, BULLET_H,
              g.bonusEnemy.x, g.bonusEnemy.y, g.bonusEnemy.w, g.bonusEnemy.h)) return;
          bulletsToRemove.add(bi);
          g.bonusEnemy.alive = false;
          g.bonusEnemy = null;
          // Trigger bonus question
          const hardQ = g.hardPool[randInt(0, g.hardPool.length - 1)] || g.mandatoryQuestions[0];
          if (hardQ) {
            triggerQuestion("bonus", hardQ,
              (gg) => {
                // Correct: random boost + bonus score
                const boostId = BOOST_TYPES[randInt(0, BOOST_TYPES.length - 1)].id;
                applyBoost(gg, boostId);
                gg.score += KILL_PTS.bonus;
                setScore(gg.score);
                gg.floaters.push({ x: CANVAS_W / 2, y: 200, text: `+${KILL_PTS.bonus} בונוס!`, life: 60 });
              },
              () => {}
            );
          }
        });
      }
      g.bullets = g.bullets.filter((_, i) => !bulletsToRemove.has(i));

      // ── Enemy bullets vs player ──
      const pLeft = g.player.x, pTop = PLAYER_Y;
      g.enemyBullets = g.enemyBullets.filter(b => {
        if (!rectOverlap(b.x - ENEMY_BULLET_W / 2, b.y - ENEMY_BULLET_H / 2, ENEMY_BULLET_W, ENEMY_BULLET_H,
            pLeft, pTop, PLAYER_W, PLAYER_H)) return true;
        // Hit!
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

      // ── Check wave cleared ──
      const stillAlive = g.enemies.filter(e => e.alive);
      if (stillAlive.length === 0 && !g.mandatoryQTriggered && !g.paused) {
        // Check if all mandatory questions done
        if (g.mandatoryQIdx < g.mandatoryQuestions.length) {
          // Still have mandatory questions — trigger them
          g.mandatoryQTriggered = true;
          const q = g.mandatoryQuestions[g.mandatoryQIdx];
          g.mandatoryQIdx++;
          if (q) {
            triggerQuestion("mandatory", q,
              (gg) => {
                const boostId = BOOST_TYPES[randInt(0, BOOST_TYPES.length - 1)].id;
                applyBoost(gg, boostId);
                // Check win
                const al = gg.enemies.filter(e => e.alive);
                if (al.length === 0 && gg.mandatoryQIdx >= gg.mandatoryQuestions.length) {
                  gg.finished = true;
                  finishLevel(true, gg.score, gg.hearts, gg.firstAttemptCorrect, gg.mandatoryQCount, gg.bonusQCorrect);
                } else {
                  gg.mandatoryQTriggered = false;
                }
              },
              (gg) => {
                const al = gg.enemies.filter(e => e.alive);
                if (al.length === 0 && gg.mandatoryQIdx >= gg.mandatoryQuestions.length) {
                  gg.finished = true;
                  finishLevel(true, gg.score, gg.hearts, gg.firstAttemptCorrect, gg.mandatoryQCount, gg.bonusQCorrect);
                } else {
                  gg.mandatoryQTriggered = false;
                }
              }
            );
          }
        } else {
          // All enemies cleared, all questions done: win
          g.finished = true;
          finishLevel(true, g.score, g.hearts, g.firstAttemptCorrect, g.mandatoryQCount, g.bonusQCorrect);
        }
      }

      // ── Check game over (no hearts) ──
      if (g.hearts <= 0 && !g.finished) {
        g.finished = true;
        finishLevel(false, g.score, 0, g.firstAttemptCorrect, g.mandatoryQCount, g.bonusQCorrect);
      }
    };

    // ── Render function (called every frame, even when paused) ──
    function renderFrame(ctx, g) {
      if (!g) return;
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Background stars
      drawStars(ctx, starsRef.current);

      // Grid warning line (Y=350)
      if (g.enemies.filter(e => e.alive).length > 0) {
        ctx.strokeStyle = "rgba(239,68,68,0.2)";
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

      // Bonus enemy
      if (g.bonusEnemy) drawEnemy(ctx, g.bonusEnemy, g.frame);

      // Player bullets
      const bullColor = g.selectedNinja?.shootColor || "#fbbf24";
      g.bullets.forEach(b => drawBullet(ctx, b, bullColor));

      // Enemy bullets
      g.enemyBullets.forEach(b => drawEnemyBullet(ctx, b));

      // Player
      drawPlayer(ctx, g.player, g.selectedNinja?.color || "#ef4444", g.frame, g.boosts);

      // Floaters
      g.floaters.forEach(f => {
        ctx.save();
        ctx.globalAlpha = Math.min(1, f.life / 20);
        ctx.font = "bold 13px sans-serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "#fbbf24";
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      });

      // HUD
      drawHUD(ctx, g.hearts, 3, g.score, g.levelNum, g.boosts);

      // Bench (above bottom-most play area)
      drawNinjaBench(ctx, g.benchNinjas, g.selectedNinjaIdx, g.ninjaCooldowns);

      // Paused overlay
      if (g.paused) {
        ctx.fillStyle = "rgba(3,7,18,0.5)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.save();
        ctx.textAlign = "center";
        ctx.font = "bold 20px sans-serif";
        ctx.fillStyle = "#fbbf24";
        ctx.fillText("שאלה!", CANVAS_W / 2, CANVAS_H / 2 - 10);
        ctx.restore();
      }
    }

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [phase, triggerQuestion, finishLevel, playSound]);

  // ── Touch handlers ──
  const handleCanvasTouchStart = useCallback((e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const touch = e.touches[0];
    const tx = (touch.clientX - rect.left) * scaleX;
    const ty = (touch.clientY - rect.top) * (CANVAS_H / rect.height);

    // Check bench tap (bottom area)
    const g = gameRef.current;
    if (g && ty > CANVAS_H - 90 && ty < CANVAS_H - 52) {
      const cellW = 42;
      const startX = (CANVAS_W - g.benchNinjas.length * (cellW + 6)) / 2;
      g.benchNinjas.forEach((_, i) => {
        const bx = startX + i * (cellW + 6);
        if (tx >= bx && tx <= bx + cellW) {
          swapNinja(i);
        }
      });
      return;
    }

    // Left half = move left, right half = move right
    if (tx < CANVAS_W / 2) {
      touchRef.current.left = true;
      touchRef.current.right = false;
    } else {
      touchRef.current.right = true;
      touchRef.current.left = false;
    }
    // Tap = shoot
    const now = Date.now();
    if (now - touchRef.current.lastTap < 300) {
      touchRef.current.shooting = true;
    }
    touchRef.current.lastTap = now;
  }, [swapNinja]);

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
            <h2>🛸 פלישת הסרפנטין</h2>
          </div>

          <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
            ירו על הסרפנטין המסתערים! ענו על שאלות כדי לקבל חיזוקים.
            <br />
            <span style={{ color: "#fbbf24", fontSize: 12 }}>חיזוק: החליפו נינג'ה מהספסל לקבלת לב נוסף</span>
          </div>

          {/* Boost legend */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 16 }}>
            {BOOST_TYPES.map(b => (
              <div key={b.id} style={{
                background: b.color + "22",
                border: `1px solid ${b.color}55`,
                borderRadius: 8, padding: "4px 10px",
                fontSize: 12, color: b.color,
                display: "flex", alignItems: "center", gap: 4,
              }}>
                <span>{b.icon}</span>
                <span>{b.nameHe}</span>
              </div>
            ))}
          </div>

          {/* Levels */}
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
                    opacity: unlocked ? 1 : 0.5,
                    textAlign: "right",
                  }}
                >
                  <span style={{ fontSize: 24, minWidth: 36 }}>{unlocked ? "🛸" : "🔒"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>שלב {lvl}</div>
                    <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                      {LEVEL_DEFS[i].rows.map(r =>
                        r === "skulkin" ? "גולגולות" :
                        r === "serpentine" ? "סרפנטין" :
                        r === "stoneWarrior" ? "לוחמי אבן" :
                        "היפנוברי"
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
            width: "100%",
            maxWidth: CANVAS_W,
            height: "auto",
            display: "block",
            background: "#030712",
            borderRadius: 8,
            touchAction: "none",
          }}
          onTouchStart={handleCanvasTouchStart}
          onTouchEnd={handleCanvasTouchEnd}
          onTouchMove={(e) => e.preventDefault()}
        />

        {/* Touch controls (below canvas) */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 12px", background: "rgba(3,7,18,0.9)",
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
            >
              ◀
            </button>
            <button
              className="ninja-ctrl-btn"
              onTouchStart={() => { touchRef.current.right = true; }}
              onTouchEnd={() => { touchRef.current.right = false; }}
              onMouseDown={() => { touchRef.current.right = true; }}
              onMouseUp={() => { touchRef.current.right = false; }}
              onMouseLeave={() => { touchRef.current.right = false; }}
            >
              ▶
            </button>
          </div>

          {/* Shoot button */}
          <button
            className="ninja-ctrl-btn"
            style={{ background: "rgba(124,58,237,0.3)", borderColor: "#7c3aed", fontSize: 20 }}
            onTouchStart={() => { keysRef.current._shoot = true; }}
            onMouseDown={() => { keysRef.current._shoot = true; }}
          >
            ↑
          </button>

          {/* Exit button */}
          <button
            className="back-btn"
            onClick={() => {
              if (animRef.current) cancelAnimationFrame(animRef.current);
              setPhase("levelSelect");
            }}
          >
            ✕
          </button>
        </div>

        {/* Question overlay */}
        {showQuestion && currentQ && (
          <div className="ninja-gate-overlay">
            <div className="ninja-gate-card" style={{ maxHeight: "90vh", overflowY: "auto" }}>
              {/* Header */}
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

              {/* Boost info */}
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8, textAlign: "center" }}>
                {questionData.type === "bonus"
                  ? "ענו נכון לקבלת חיזוק + ניצוצות בונוס!"
                  : "ענו נכון לקבלת חיזוק! טעות = הגריד יירד"}
              </div>

              {/* Question */}
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

              {/* Options */}
              <div className="options-grid">
                {currentQ.options.map((opt, i) => {
                  const isSelected = selectedAnswer === i;
                  const isCorrect = feedback && i === currentQ.correct;
                  const isWrong = feedback && isSelected && i !== currentQ.correct;
                  const isDisabled = !!feedback;

                  let cls = "option-btn";
                  if (isTopic5) cls += " topic5";
                  if (isSelected && !feedback) cls += " selected";
                  if (isCorrect) cls += " correct";
                  if (isWrong) cls += " wrong";

                  return (
                    <button
                      key={i}
                      onClick={() => { if (!isDisabled) { setSelectedAnswer(i); if (playSound) playSound("click"); } }}
                      disabled={isDisabled}
                      className={cls}
                      style={{ cursor: isDisabled ? "default" : "pointer" }}
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

              {/* Action buttons */}
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
            <div style={{ fontSize: 48, marginBottom: 8 }}>{won ? "🛸" : "💥"}</div>
            <h2 style={{ color: "#e2e8f0", margin: "6px 0" }}>
              {won ? "כל הכבוד! הגריד הובס!" : "הסרפנטין נצחו הפעם..."}
            </h2>
            <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 8 }}>
              שלב {selectedLevel}
            </div>

            {/* Score */}
            <div className={`result-score ${won ? "pass" : "fail"}`} style={{ fontSize: 36 }}>
              {finalScore}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>נקודות</div>

            {/* Stars */}
            {won && (
              <div className="result-stars" style={{ marginBottom: 12 }}>
                {getStarsDisplay(stars)}
              </div>
            )}

            {/* Hearts left */}
            <div style={{ display: "flex", gap: 4, justifyContent: "center", fontSize: 22, marginBottom: 12 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ opacity: i < (resultData.won ? hearts : 0) ? 1 : 0.2 }}>❤️</span>
              ))}
            </div>

            {/* Stars earned */}
            {sparksEarned > 0 && (
              <div style={{ color: "#fbbf24", fontWeight: 700, fontSize: 15, marginBottom: 12 }}>
                ✨ {sparksEarned} ניצוצות!
              </div>
            )}

            {/* Star breakdown */}
            {won && (
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 16, lineHeight: 1.8, textAlign: "right" }}>
                <div>⭐ כוכב 1: ניצחון</div>
                <div style={{ opacity: stars >= 2 ? 1 : 0.4 }}>⭐ כוכב 2: כל השאלות נכון בניסיון ראשון</div>
                <div style={{ opacity: stars >= 3 ? 1 : 0.4 }}>⭐ כוכב 3: שאלת הבונוס נכון</div>
              </div>
            )}

            {/* Action buttons */}
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
