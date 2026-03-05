import { useState, useEffect, useRef, useCallback } from 'react';
import { NINJA_CONFIGS } from '../constants/games';
import { SPARKS_REWARDS, getUnlockedNinjas, getNinjaById, NINJAS } from '../constants/ninjago';
import { Topic4Visual } from '../components/visuals/Topic4Visual';
import { Topic5Visual } from '../components/visuals/Topic5Visual';
import { Topic5Option } from '../components/visuals/Topic5Option';
import { Confetti } from '../components/ui/Confetti';

// ─── Question builder (same pattern as adventure) ───
function buildNinjaQuestions(config, gradeQuestions) {
  const usedIds = new Set();
  const questions = [];
  const gateCount = config.gates;

  for (let g = 0; g < gateCount; g++) {
    const topic = (g % 5) + 1;
    const diff = config.difficulty[Math.min(g, config.difficulty.length - 1)];

    const topicQs = gradeQuestions.filter(q => q.topic === topic && !usedIds.has(q.id));
    let candidates = topicQs.filter(q => q.difficulty === diff);
    if (!candidates.length) {
      const adj = diff === "easy" ? "medium" : diff === "hard" ? "medium" : "easy";
      candidates = topicQs.filter(q => q.difficulty === adj);
    }
    if (!candidates.length) candidates = topicQs;
    if (!candidates.length) candidates = gradeQuestions.filter(q => !usedIds.has(q.id));

    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const question = shuffled[0] || null;
    if (question) usedIds.add(question.id);
    questions.push(question);
  }
  return questions;
}

// ─── Level themes (20 unique backgrounds) ───
const LEVEL_THEMES = [
  // World 1: Training Dojo (green/peaceful)
  { sky: ["#0c1445","#1a1a3e"], mountain: "#1a2744", hill: "#1e3a2f", treeTrunk: "#3d5a17", treeCanopy: "#2d6b1e", ground: "#3b5249", grass: "#4ade80", elevated: "#4a6fa5" }, // 1: Bamboo Trail
  { sky: ["#6bb3e0","#2563eb"], mountain: "#4a7ab5", hill: "#5a8fcf", treeTrunk: "#6b5b3e", treeCanopy: "#7ec89a", ground: "#5a7a8f", grass: "#93c5fd", elevated: "#7da8c9" }, // 2: Cloud Bridge
  { sky: ["#581c87","#0f0524"], mountain: "#2a1050", hill: "#1f0a3a", treeTrunk: "#2a1a3a", treeCanopy: "#4a2060", ground: "#2d1b4e", grass: "#a855f7", elevated: "#6b3fa0" }, // 3: Shadow Tower
  { sky: ["#0d9488","#064e3b"], mountain: "#0a3d2f", hill: "#0c5a3e", treeTrunk: "#5c3a1a", treeCanopy: "#15803d", ground: "#1a5c3a", grass: "#34d399", elevated: "#2d8a5e" }, // 4: Hidden Forest
  { sky: ["#22c55e","#064e3b"], mountain: "#0a4d2f", hill: "#0c6a3e", treeTrunk: "#4c3a1a", treeCanopy: "#22c55e", ground: "#1a5c3a", grass: "#86efac", elevated: "#2d8a5e" }, // 5: Dojo Courtyard
  // World 2: Serpentine Caves (purple/dark)
  { sky: ["#78573a","#2a1a0e"], mountain: "#3a2a1a", hill: "#4a3a2a", treeTrunk: "#5a4a3a", treeCanopy: "#6a5a4a", ground: "#4a3828", grass: "#a8845a", elevated: "#6a5a4a" }, // 6: Snake Caves
  { sky: ["#ea580c","#1e3a5f"], mountain: "#2a4a6a", hill: "#1a3a5a", treeTrunk: "#5a3a1a", treeCanopy: "#4a6a3a", ground: "#3a4a5a", grass: "#fb923c", elevated: "#5a7a9a" }, // 7: Dragon River
  { sky: ["#581c87","#1a0a3e"], mountain: "#2a1050", hill: "#1f0a3a", treeTrunk: "#3a1a4a", treeCanopy: "#5a2070", ground: "#2d1b4e", grass: "#c084fc", elevated: "#7b4fb0" }, // 8: Wind Cave
  { sky: ["#4c1d95","#1e0a4e"], mountain: "#2a1060", hill: "#1f0a4a", treeTrunk: "#3a1a5a", treeCanopy: "#5a2080", ground: "#2d1b5e", grass: "#a78bfa", elevated: "#6b3fb0" }, // 9: Venom Tunnel
  { sky: ["#7e22ce","#1a0530"], mountain: "#3a1070", hill: "#2f0a5a", treeTrunk: "#4a1a6a", treeCanopy: "#6a2090", ground: "#3d1b6e", grass: "#c084fc", elevated: "#8b4fc0" }, // 10: Serpentine Lair
  // World 3: Dark Island (gray/ominous)
  { sky: ["#1e293b","#0f172a"], mountain: "#1a2030", hill: "#1c2535", treeTrunk: "#2a3040", treeCanopy: "#3a4050", ground: "#2a3040", grass: "#64748b", elevated: "#4a5a6a" }, // 11: Dark Beach
  { sky: ["#0f172a","#030712"], mountain: "#0a0f20", hill: "#0c1225", treeTrunk: "#1a2030", treeCanopy: "#2a3040", ground: "#1a2530", grass: "#475569", elevated: "#3a4a5a" }, // 12: Shadow Forest
  { sky: ["#ea580c","#7e22ce"], mountain: "#5a2a3a", hill: "#6a3a4a", treeTrunk: "#7a3a2a", treeCanopy: "#c44a2a", ground: "#5a2a2a", grass: "#fb923c", elevated: "#8a4a5a" }, // 13: Temple Roof
  { sky: ["#030712","#0c1445"], mountain: "#0a0f2a", hill: "#0c1230", treeTrunk: "#1a2a3a", treeCanopy: "#0a1a2a", ground: "#1a2a3a", grass: "#6366f1", elevated: "#2a3a5a" }, // 14: Star Field
  { sky: ["#1e1b4b","#0c0a1e"], mountain: "#15132a", hill: "#1a1835", treeTrunk: "#2a2840", treeCanopy: "#1a1830", ground: "#201e3a", grass: "#818cf8", elevated: "#3a385a" }, // 15: Dark Fortress
  // World 4: Overlord's Tower (red/fiery)
  { sky: ["#dc2626","#450a0a"], mountain: "#5a1a0a", hill: "#6a2a1a", treeTrunk: "#4a1a0a", treeCanopy: "#7a2a0a", ground: "#4a1a0a", grass: "#f87171", elevated: "#7a3a2a" }, // 16: Tower Gate
  { sky: ["#f97316","#7c2d12"], mountain: "#6a2a0a", hill: "#7a3a1a", treeTrunk: "#5a2a0a", treeCanopy: "#8a3a0a", ground: "#5a2a0a", grass: "#fdba74", elevated: "#8a4a2a" }, // 17: Flame Stairs
  { sky: ["#e0f2fe","#7dd3fc"], mountain: "#b0d4f1", hill: "#93c5fd", treeTrunk: "#94a3b8", treeCanopy: "#bae6fd", ground: "#7aa4c8", grass: "#e0f2fe", elevated: "#93c5fd" }, // 18: Ice Palace
  { sky: ["#991b1b","#3b0000"], mountain: "#4a0a0a", hill: "#5a1a1a", treeTrunk: "#3a0a0a", treeCanopy: "#6a1a0a", ground: "#3a0a0a", grass: "#ef4444", elevated: "#6a2a1a" }, // 19: Ruler's Chamber
  { sky: ["#facc15","#dc2626"], mountain: "#8a4a0a", hill: "#9a5a1a", treeTrunk: "#6a3a0a", treeCanopy: "#aa5a0a", ground: "#6a3a0a", grass: "#fde047", elevated: "#9a5a2a" }, // 20: Ninjago Summit
];

// ─── Enemy waves per level ───
const ENEMY_WAVES = [
  // World 1: Training Dojo
  { skulkin: 2, serpentine: 0, stoneWarrior: 0, dragon: 0 }, // Level 1
  { skulkin: 4, serpentine: 0, stoneWarrior: 0, dragon: 0 }, // Level 2
  { skulkin: 3, serpentine: 1, stoneWarrior: 0, dragon: 0 }, // Level 3
  { skulkin: 3, serpentine: 2, stoneWarrior: 0, dragon: 0 }, // Level 4
  { skulkin: 2, serpentine: 3, stoneWarrior: 0, dragon: 0 }, // Level 5
  // World 2: Serpentine Caves
  { skulkin: 0, serpentine: 5, stoneWarrior: 0, dragon: 0 }, // Level 6
  { skulkin: 0, serpentine: 4, stoneWarrior: 1, dragon: 0 }, // Level 7
  { skulkin: 0, serpentine: 3, stoneWarrior: 2, dragon: 0 }, // Level 8
  { skulkin: 0, serpentine: 2, stoneWarrior: 3, dragon: 0 }, // Level 9
  { skulkin: 0, serpentine: 1, stoneWarrior: 4, dragon: 0 }, // Level 10
  // World 3: Dark Island (enemy dragons appear!)
  { skulkin: 0, serpentine: 2, stoneWarrior: 3, dragon: 1 }, // Level 11
  { skulkin: 0, serpentine: 1, stoneWarrior: 4, dragon: 1 }, // Level 12
  { skulkin: 0, serpentine: 0, stoneWarrior: 4, dragon: 2 }, // Level 13
  { skulkin: 0, serpentine: 0, stoneWarrior: 3, dragon: 3 }, // Level 14
  { skulkin: 0, serpentine: 0, stoneWarrior: 2, dragon: 4 }, // Level 15
  // World 4: Overlord's Tower
  { skulkin: 0, serpentine: 0, stoneWarrior: 3, dragon: 4 }, // Level 16
  { skulkin: 0, serpentine: 0, stoneWarrior: 2, dragon: 5 }, // Level 17
  { skulkin: 0, serpentine: 0, stoneWarrior: 1, dragon: 6 }, // Level 18
  { skulkin: 0, serpentine: 0, stoneWarrior: 0, dragon: 7 }, // Level 19
  { skulkin: 0, serpentine: 0, stoneWarrior: 0, dragon: 9 }, // Level 20: Boss level
];

// ─── Canvas constants ───
const CANVAS_W = 800;
const CANVAS_H = 400;
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const MOVE_SPEED = 4;
const PLAYER_W = 28;
const PLAYER_H = 40;
const GROUND_Y = CANVAS_H - 40;
const SEGMENT_W = CANVAS_W * 2.5;

// ─── Level generator ───
function generateLevel(gateCount, levelNum) {
  const platforms = [];
  const gates = [];
  const totalW = SEGMENT_W * gateCount + CANVAS_W;

  // Ground platforms with gaps
  let x = 0;
  while (x < totalW) {
    const w = 150 + Math.random() * 250;
    platforms.push({ x, y: GROUND_Y, w, h: 40, type: "ground" });
    x += w + (Math.random() < 0.3 && x > 200 ? 60 + Math.random() * 40 : 0);
  }

  // Elevated platforms
  const elevCount = Math.floor(gateCount * 3) + levelNum;
  for (let i = 0; i < elevCount; i++) {
    const px = 200 + Math.random() * (totalW - 400);
    const py = GROUND_Y - 80 - Math.random() * 120;
    const pw = 80 + Math.random() * 100;
    const moving = levelNum >= 5 && Math.random() < 0.2;
    const crumbling = levelNum >= 7 && Math.random() < 0.15;
    platforms.push({ x: px, y: py, w: pw, h: 16, type: "elevated", moving, crumbling, origX: px, moveDir: 1 });
  }

  // Gates
  for (let g = 0; g < gateCount; g++) {
    const gx = SEGMENT_W * (g + 1);
    gates.push({ x: gx, y: GROUND_Y - 60, w: 30, h: 60, locked: true, questionIdx: g });
  }

  // Enemies (structured waves)
  const enemies = [];
  const wave = ENEMY_WAVES[Math.min(levelNum - 1, ENEMY_WAVES.length - 1)];
  const spawnList = [];
  for (let i = 0; i < wave.skulkin; i++) spawnList.push("skulkin");
  for (let i = 0; i < wave.serpentine; i++) spawnList.push("serpentine");
  for (let i = 0; i < wave.stoneWarrior; i++) spawnList.push("stoneWarrior");
  // Shuffle spawn list
  for (let i = spawnList.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [spawnList[i], spawnList[j]] = [spawnList[j], spawnList[i]];
  }

  const groundPlats = platforms.filter(p => p.type === "ground" && p.w >= 120);
  for (let i = 0; i < spawnList.length && groundPlats.length > 0; i++) {
    const plat = groundPlats[Math.floor(Math.random() * groundPlats.length)];
    const ex = plat.x + 40 + Math.random() * (plat.w - 80);
    const tooClose = gates.some(gate => Math.abs(ex - gate.x) < 120) || ex < 200;
    if (tooClose) continue;

    let type = spawnList[i], hp, vx, w, h;
    if (type === "stoneWarrior") { hp = 3; vx = 0; w = 32; h = 38; }
    else if (type === "serpentine") { hp = 2; vx = 1.5; w = 26; h = 36; }
    else { hp = 1; vx = 1; w = 24; h = 36; }

    enemies.push({
      type, hp, x: ex, y: plat.y - h, w, h,
      vx, patrolLeft: plat.x + 10, patrolRight: plat.x + plat.w - w - 10,
      alive: true, deathTimer: 0, frame: 0,
      shootTimer: type === "stoneWarrior" ? 60 + Math.floor(Math.random() * 60) : 0,
      facingRight: Math.random() > 0.5,
    });
  }

  // Flying dragon enemies (levels 11+)
  const dragonCount = wave.dragon || 0;
  for (let i = 0; i < dragonCount; i++) {
    const dx = 400 + Math.random() * (totalW - 800);
    const dy = 40 + Math.random() * 80; // fly high
    const tooClose = gates.some(gate => Math.abs(dx - gate.x) < 150);
    if (tooClose) continue;
    enemies.push({
      type: "dragon", hp: 4, x: dx, y: dy, w: 44, h: 32,
      vx: 1.2, patrolLeft: dx - 200, patrolRight: dx + 200,
      alive: true, deathTimer: 0, frame: 0,
      shootTimer: 90 + Math.floor(Math.random() * 60),
      facingRight: Math.random() > 0.5,
      flying: true,
    });
  }

  return { platforms, gates, enemies, totalW };
}

// ─── Drawing helpers ───
function drawThemeElement(ctx, cameraX, canvasW, canvasH, levelNum, frame) {
  const t = (frame || 0) * 0.02;
  switch (levelNum) {
    case 1: // Bamboo stalks
      for (let i = -1; i < 10; i++) {
        const bx = i * 120 - (cameraX * 0.25 % 120);
        ctx.fillStyle = "#2d6b1e";
        ctx.fillRect(bx, canvasH - 140, 6, 140);
        ctx.fillStyle = "#4ade80";
        for (let j = 0; j < 4; j++) {
          ctx.fillRect(bx - 1, canvasH - 30 - j * 32, 8, 3);
        }
        // Leaves
        ctx.fillStyle = "#34d399";
        ctx.beginPath();
        ctx.ellipse(bx + 12, canvasH - 110, 10, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(bx - 6, canvasH - 80, 8, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 2: // Fluffy clouds
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      for (let i = 0; i < 6; i++) {
        const cx = ((i * 200 + 50) - cameraX * 0.08) % (canvasW + 200) - 100;
        const cy = 40 + (i % 3) * 30;
        ctx.beginPath();
        ctx.arc(cx, cy, 20, 0, Math.PI * 2);
        ctx.arc(cx + 18, cy - 5, 16, 0, Math.PI * 2);
        ctx.arc(cx + 34, cy, 18, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 3: // Tower spires
      for (let i = -1; i < 5; i++) {
        const sx = i * 250 - (cameraX * 0.15 % 250);
        ctx.fillStyle = "#1f0a3a";
        ctx.fillRect(sx + 5, canvasH - 180, 20, 180);
        ctx.beginPath();
        ctx.moveTo(sx, canvasH - 180);
        ctx.lineTo(sx + 15, canvasH - 220);
        ctx.lineTo(sx + 30, canvasH - 180);
        ctx.fill();
        // Lit window
        ctx.fillStyle = `rgba(168,85,247,${0.5 + Math.sin(t + i) * 0.3})`;
        ctx.fillRect(sx + 10, canvasH - 140, 8, 10);
        ctx.fillRect(sx + 10, canvasH - 100, 8, 10);
      }
      break;
    case 4: // Mushrooms
      for (let i = -1; i < 8; i++) {
        const mx = i * 140 - (cameraX * 0.3 % 140);
        const mh = 20 + (i % 3) * 10;
        ctx.fillStyle = "#8b7355";
        ctx.fillRect(mx + 8, canvasH - mh, 5, mh);
        ctx.fillStyle = i % 2 === 0 ? "#ef4444" : "#fbbf24";
        ctx.beginPath();
        ctx.arc(mx + 10, canvasH - mh, 12, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(mx + 6, canvasH - mh - 3, 2, 0, Math.PI * 2);
        ctx.arc(mx + 14, canvasH - mh - 5, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 5: // Water ripples
      ctx.strokeStyle = "rgba(59,130,246,0.4)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 8; i++) {
        const rx = ((i * 130) - cameraX * 0.2) % (canvasW + 100) - 50;
        const ry = canvasH - 30 + Math.sin(t + i * 0.7) * 4;
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.quadraticCurveTo(rx + 20, ry - 6, rx + 40, ry);
        ctx.stroke();
      }
      break;
    case 6: // Stalactites
      for (let i = -1; i < 10; i++) {
        const stx = i * 100 - (cameraX * 0.12 % 100);
        const stH = 30 + (i * 37 % 40);
        ctx.fillStyle = "#5a4a3a";
        ctx.beginPath();
        ctx.moveTo(stx, 0);
        ctx.lineTo(stx + 8, stH);
        ctx.lineTo(stx + 16, 0);
        ctx.fill();
        // Drip
        ctx.fillStyle = `rgba(120,180,220,${0.3 + Math.sin(t + i * 1.3) * 0.3})`;
        ctx.beginPath();
        ctx.arc(stx + 8, stH + 4 + Math.sin(t + i) * 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 7: // Paper lanterns
      for (let i = 0; i < 7; i++) {
        const lx = ((i * 150 + 30) - cameraX * 0.18) % (canvasW + 150) - 75;
        const ly = 30 + (i % 3) * 20 + Math.sin(t + i) * 3;
        // String
        ctx.strokeStyle = "#6b5a4a";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lx + 10, 0);
        ctx.lineTo(lx + 10, ly);
        ctx.stroke();
        // Lantern body
        ctx.fillStyle = i % 2 === 0 ? "#dc2626" : "#ea580c";
        ctx.beginPath();
        ctx.ellipse(lx + 10, ly + 12, 10, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        // Glow
        ctx.fillStyle = `rgba(251,191,36,${0.4 + Math.sin(t + i * 0.8) * 0.2})`;
        ctx.beginPath();
        ctx.arc(lx + 10, ly + 12, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 8: // Shooting stars
      for (let i = 0; i < 4; i++) {
        const phase = (t * 0.5 + i * 1.5) % 4;
        if (phase > 1) continue;
        const sx = (i * 200 + phase * canvasW * 0.7) % canvasW;
        const sy = 20 + i * 40 + phase * 60;
        ctx.strokeStyle = `rgba(255,255,255,${1 - phase})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 30, sy - 15);
        ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${1 - phase})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 9: // Crystal shards
      for (let i = -1; i < 8; i++) {
        const cx = i * 130 - (cameraX * 0.22 % 130);
        const ch = 25 + (i * 23 % 30);
        const shimmer = 0.5 + Math.sin(t + i * 0.9) * 0.3;
        ctx.fillStyle = `rgba(186,230,253,${shimmer})`;
        ctx.beginPath();
        ctx.moveTo(cx, canvasH - 10);
        ctx.lineTo(cx + 6, canvasH - ch);
        ctx.lineTo(cx + 12, canvasH - 10);
        ctx.fill();
        ctx.fillStyle = `rgba(224,242,254,${shimmer * 0.7})`;
        ctx.beginPath();
        ctx.moveTo(cx + 15, canvasH - 10);
        ctx.lineTo(cx + 19, canvasH - ch * 0.6);
        ctx.lineTo(cx + 23, canvasH - 10);
        ctx.fill();
      }
      break;
    case 10: // Lava particles
      for (let i = 0; i < 12; i++) {
        const px = ((i * 80 + t * 30) % (canvasW + 40)) - 20;
        const py = canvasH - 20 - ((t * 20 + i * 40) % 80);
        const size = 2 + (i % 3);
        const alpha = 0.4 + Math.sin(t * 2 + i) * 0.3;
        ctx.fillStyle = i % 2 === 0
          ? `rgba(239,68,68,${alpha})`
          : `rgba(251,191,36,${alpha})`;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
  }
}

function drawParallax(ctx, cameraX, canvasW, canvasH, levelNum, frame) {
  const theme = LEVEL_THEMES[(levelNum || 1) - 1] || LEVEL_THEMES[0];

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, canvasH);
  skyGrad.addColorStop(0, theme.sky[0]);
  skyGrad.addColorStop(1, theme.sky[1]);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Stars (only for dark themes)
  const darkSky = theme.sky[0] !== "#e0f2fe" && theme.sky[0] !== "#6bb3e0" && theme.sky[0] !== "#78573a";
  if (darkSky) {
    const starSeed = 42;
    for (let i = 0; i < 40; i++) {
      const sx = ((i * 137 + starSeed) % canvasW + canvasW - cameraX * 0.05 % canvasW) % canvasW;
      const sy = (i * 97 + starSeed) % (canvasH * 0.6);
      ctx.fillStyle = `rgba(255,255,255,${0.3 + (i % 3) * 0.2})`;
      ctx.fillRect(sx, sy, 2, 2);
    }
  }

  // Mountains (far)
  ctx.fillStyle = theme.mountain;
  for (let i = -1; i < 4; i++) {
    const mx = i * 400 - (cameraX * 0.1 % 400);
    ctx.beginPath();
    ctx.moveTo(mx, canvasH);
    ctx.lineTo(mx + 200, canvasH - 160);
    ctx.lineTo(mx + 400, canvasH);
    ctx.fill();
  }

  // Hills (mid)
  ctx.fillStyle = theme.hill;
  for (let i = -1; i < 5; i++) {
    const hx = i * 300 - (cameraX * 0.2 % 300);
    ctx.beginPath();
    ctx.moveTo(hx, canvasH);
    ctx.quadraticCurveTo(hx + 150, canvasH - 100, hx + 300, canvasH);
    ctx.fill();
  }

  // Trees (near)
  for (let i = -1; i < 8; i++) {
    const tx = i * 180 - (cameraX * 0.35 % 180);
    const th = 40 + (i % 3) * 20;
    // Trunk
    ctx.fillStyle = theme.treeTrunk;
    ctx.fillRect(tx + 8, canvasH - th, 6, th * 0.4);
    // Canopy
    ctx.fillStyle = theme.treeCanopy;
    ctx.beginPath();
    ctx.moveTo(tx, canvasH - th * 0.5);
    ctx.lineTo(tx + 11, canvasH - th);
    ctx.lineTo(tx + 22, canvasH - th * 0.5);
    ctx.fill();
  }

  // Theme-specific unique element
  drawThemeElement(ctx, cameraX, canvasW, canvasH, levelNum || 1, frame);
}

function drawPlatform(ctx, p, cameraX, theme) {
  const sx = p.x - cameraX;
  if (sx + p.w < -50 || sx > CANVAS_W + 50) return;

  if (p.type === "ground") {
    ctx.fillStyle = theme.ground;
    ctx.beginPath();
    ctx.roundRect(sx, p.y, p.w, p.h, 6);
    ctx.fill();
    // Grass top
    ctx.fillStyle = theme.grass;
    ctx.fillRect(sx + 2, p.y, p.w - 4, 4);
  } else {
    ctx.fillStyle = p.crumbling ? "#7c5a3a" : theme.elevated;
    ctx.beginPath();
    ctx.roundRect(sx, p.y, p.w, p.h, 4);
    ctx.fill();
    if (p.moving) {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(sx, p.y, p.w, p.h);
      ctx.setLineDash([]);
    }
  }
}

function drawGate(ctx, gate, cameraX) {
  const sx = gate.x - cameraX;
  if (sx < -50 || sx > CANVAS_W + 50) return;

  if (gate.locked) {
    // Locked gate: amber/red
    ctx.fillStyle = "#b45309";
    ctx.fillRect(sx, gate.y, gate.w, gate.h);
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(sx + 2, gate.y + 2, gate.w - 4, gate.h - 4);
    // Bars
    ctx.fillStyle = "#92400e";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(sx + 5 + i * 10, gate.y, 3, gate.h);
    }
    // "?" symbol
    ctx.fillStyle = "#7c2d12";
    ctx.font = "bold 22px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("?", sx + gate.w / 2, gate.y + gate.h / 2 + 8);
  } else {
    // Unlocked gate: green
    ctx.fillStyle = "#166534";
    ctx.fillRect(sx, gate.y, gate.w, gate.h);
    ctx.fillStyle = "#4ade80";
    ctx.fillRect(sx + 2, gate.y + 2, gate.w - 4, gate.h - 4);
    ctx.fillStyle = "#166534";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("✓", sx + gate.w / 2, gate.y + gate.h / 2 + 6);
  }
}

function drawNinja(ctx, player, ninjaColor) {
  const { x, y, facingRight, frame, invincible } = player;
  const col = ninjaColor || "#22c55e";
  // Blink when invincible
  if (invincible > 0 && Math.floor(invincible / 4) % 2 === 0) return;
  const dir = facingRight ? 1 : -1;
  const cx = x + PLAYER_W / 2;

  // Body (ninja gi)
  ctx.fillStyle = col;
  ctx.fillRect(x + 4, y + 14, 20, 18);

  // Head
  ctx.fillStyle = "#1a1a2e";
  ctx.beginPath();
  ctx.arc(cx, y + 8, 10, 0, Math.PI * 2);
  ctx.fill();

  // Mask band
  ctx.fillStyle = col;
  ctx.fillRect(x + 4, y + 3, 20, 6);

  // Eyes
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx + dir * 2 - 3, y + 5, 3, 3);
  ctx.fillRect(cx + dir * 2 + 2, y + 5, 3, 3);
  ctx.fillStyle = "#000";
  ctx.fillRect(cx + dir * 2 - 2, y + 6, 2, 2);
  ctx.fillRect(cx + dir * 2 + 3, y + 6, 2, 2);

  // Mask tail
  ctx.strokeStyle = col;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - dir * 8, y + 6);
  ctx.lineTo(cx - dir * 16, y + 2 + Math.sin(frame * 0.3) * 3);
  ctx.stroke();

  // Belt
  ctx.fillStyle = "#000";
  ctx.fillRect(x + 4, y + 22, 20, 3);

  // Sword on back
  ctx.strokeStyle = "#94a3b8";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - dir * 6, y + 10);
  ctx.lineTo(cx - dir * 6, y - 6);
  ctx.stroke();
  // Sword handle
  ctx.fillStyle = "#7c2d12";
  ctx.fillRect(cx - dir * 6 - 2, y + 8, 5, 4);

  // Legs (animated)
  const legOffset = Math.sin(frame * 0.4) * 5;
  ctx.fillStyle = "#1a1a2e";
  ctx.fillRect(x + 6, y + 32, 6, 8 + (player.onGround ? legOffset : 0));
  ctx.fillRect(x + 16, y + 32, 6, 8 + (player.onGround ? -legOffset : 0));

  // Arms
  const armSwing = player.onGround ? Math.sin(frame * 0.4) * 4 : -3;
  ctx.fillStyle = col;
  ctx.fillRect(x + (facingRight ? 22 : -2), y + 16 + armSwing, 6, 4);
  ctx.fillRect(x + (facingRight ? -2 : 22), y + 16 - armSwing, 6, 4);
}

function drawFinishFlag(ctx, totalW, cameraX, ninjaColor) {
  const fx = totalW - 60 - cameraX;
  if (fx < -50 || fx > CANVAS_W + 50) return;

  // Pole
  ctx.fillStyle = "#e2e8f0";
  ctx.fillRect(fx + 4, GROUND_Y - 80, 4, 80);
  // Flag
  ctx.fillStyle = ninjaColor || "#22c55e";
  ctx.beginPath();
  ctx.moveTo(fx + 8, GROUND_Y - 80);
  ctx.lineTo(fx + 40, GROUND_Y - 65);
  ctx.lineTo(fx + 8, GROUND_Y - 50);
  ctx.fill();
  // Star on flag
  ctx.fillStyle = "#fbbf24";
  ctx.font = "16px sans-serif";
  ctx.fillText("⭐", fx + 16, GROUND_Y - 60);
}

function drawHUD(ctx, lives, gateProgress, totalGates, powerCooldown, ninjaColor) {
  // Lives
  ctx.font = "18px sans-serif";
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < lives ? "#ef4444" : "rgba(239,68,68,0.2)";
    ctx.fillText("❤", 10 + i * 22, 24);
  }

  // Gate progress dots
  const dotStartX = CANVAS_W - 20 - totalGates * 18;
  for (let i = 0; i < totalGates; i++) {
    ctx.beginPath();
    ctx.arc(dotStartX + i * 18 + 6, 18, 6, 0, Math.PI * 2);
    if (i < gateProgress) {
      ctx.fillStyle = "#4ade80";
    } else if (i === gateProgress) {
      ctx.fillStyle = "#fbbf24";
    } else {
      ctx.fillStyle = "#334155";
    }
    ctx.fill();
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Power cooldown bar
  const cdMax = 90;
  const cdRemaining = Math.max(0, powerCooldown || 0);
  const cdPct = 1 - cdRemaining / cdMax;
  ctx.fillStyle = "rgba(34,197,94,0.2)";
  ctx.fillRect(10, 32, 60, 4);
  ctx.fillStyle = cdPct >= 1 ? (ninjaColor || "#4ade80") : "#166534";
  ctx.fillRect(10, 32, 60 * cdPct, 4);
}

// ─── Enemy draw functions ───
function drawSkulkin(ctx, enemy, cameraX) {
  const sx = enemy.x - cameraX;
  if (sx + enemy.w < -50 || sx > CANVAS_W + 50) return;
  const { w, h, facingRight, frame, deathTimer } = enemy;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 15;
    ctx.fillStyle = "#d4c5a9";
    ctx.fillRect(sx, enemy.y + h - 8, w, 8);
    ctx.globalAlpha = 1;
    return;
  }

  const cx = sx + w / 2;

  // Dark armor body
  ctx.fillStyle = "#3a3a4a";
  ctx.fillRect(sx + 3, enemy.y + 12, w - 6, h - 20);

  // Bone-colored head
  ctx.fillStyle = "#d4c5a9";
  ctx.beginPath();
  ctx.arc(cx, enemy.y + 8, 9, 0, Math.PI * 2);
  ctx.fill();

  // Dark helmet
  ctx.fillStyle = "#2a2a3a";
  ctx.beginPath();
  ctx.arc(cx, enemy.y + 6, 9, Math.PI, 0);
  ctx.fill();

  // Red glowing eyes
  ctx.fillStyle = "#ff3333";
  ctx.fillRect(cx - 4, enemy.y + 6, 3, 3);
  ctx.fillRect(cx + 1, enemy.y + 6, 3, 3);

  // Legs
  const legOff = Math.sin(frame * 0.3) * 3;
  ctx.fillStyle = "#4a4a5a";
  ctx.fillRect(sx + 5, enemy.y + h - 8, 5, 8 + legOff);
  ctx.fillRect(sx + w - 10, enemy.y + h - 8, 5, 8 - legOff);
}

function drawSerpentine(ctx, enemy, cameraX) {
  const sx = enemy.x - cameraX;
  if (sx + enemy.w < -50 || sx > CANVAS_W + 50) return;
  const { w, h, facingRight, frame, deathTimer } = enemy;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 15;
    ctx.fillStyle = "#7b2d8b";
    ctx.fillRect(sx, enemy.y + h - 8, w, 8);
    ctx.globalAlpha = 1;
    return;
  }

  const cx = sx + w / 2;
  const slither = Math.sin(frame * 0.2) * 2;

  // Purple body
  ctx.fillStyle = "#7b2d8b";
  ctx.fillRect(sx + 3 + slither, enemy.y + 14, w - 6, h - 20);

  // Green scale pattern
  ctx.fillStyle = "#2dd45b";
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(sx + 6 + i * 7 + slither, enemy.y + 18 + i * 4, 4, 3);
  }

  // Hooded head
  ctx.fillStyle = "#7b2d8b";
  ctx.beginPath();
  ctx.arc(cx, enemy.y + 9, 10, 0, Math.PI * 2);
  ctx.fill();

  // Hood flare
  ctx.beginPath();
  ctx.moveTo(cx - 12, enemy.y + 10);
  ctx.lineTo(cx, enemy.y - 2);
  ctx.lineTo(cx + 12, enemy.y + 10);
  ctx.fill();

  // Yellow slit eyes
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(cx - 4, enemy.y + 7, 3, 4);
  ctx.fillRect(cx + 1, enemy.y + 7, 3, 4);
  ctx.fillStyle = "#000";
  ctx.fillRect(cx - 3, enemy.y + 8, 1, 3);
  ctx.fillRect(cx + 2, enemy.y + 8, 1, 3);

  // Fangs
  ctx.fillStyle = "#fff";
  ctx.fillRect(cx - 2, enemy.y + 14, 2, 3);
  ctx.fillRect(cx + 1, enemy.y + 14, 2, 3);

  // Tail
  ctx.strokeStyle = "#7b2d8b";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx + (facingRight ? 0 : w), enemy.y + h - 6);
  ctx.quadraticCurveTo(
    sx + (facingRight ? -8 : w + 8),
    enemy.y + h - 12 + slither,
    sx + (facingRight ? -4 : w + 4),
    enemy.y + h - 2
  );
  ctx.stroke();

  // HP bar if damaged
  if (enemy.hp < 2) {
    ctx.fillStyle = "rgba(168,85,247,0.3)";
    ctx.fillRect(sx + 2, enemy.y - 6, w - 4, 3);
    ctx.fillStyle = "rgba(168,85,247,0.8)";
    ctx.fillRect(sx + 2, enemy.y - 6, (w - 4) * (enemy.hp / 2), 3);
  }
}

function drawStoneWarrior(ctx, enemy, cameraX) {
  const sx = enemy.x - cameraX;
  if (sx + enemy.w < -50 || sx > CANVAS_W + 50) return;
  const { w, h, hp, deathTimer, frame } = enemy;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 15;
    ctx.fillStyle = "#3a3a4a";
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(sx + i * 8, enemy.y + h - 10 + (i % 2) * 4, 6, 6);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const cx = sx + w / 2;
  const glow = Math.sin(frame * 0.1) * 0.3 + 0.7;

  // Bulky dark body
  ctx.fillStyle = "#2a2a35";
  ctx.fillRect(sx + 2, enemy.y + 10, w - 4, h - 14);

  // Shoulders
  ctx.fillRect(sx - 2, enemy.y + 10, w + 4, 8);

  // Head
  ctx.fillStyle = "#3a3a45";
  ctx.fillRect(sx + 6, enemy.y, w - 12, 14);

  // Red glow lines
  ctx.strokeStyle = `rgba(255, 50, 50, ${glow})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx + 8, enemy.y + 16);
  ctx.lineTo(cx, enemy.y + 24);
  ctx.lineTo(sx + w - 8, enemy.y + 16);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + 2, enemy.y + 14);
  ctx.lineTo(sx + 2, enemy.y + 26);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(sx + w - 2, enemy.y + 14);
  ctx.lineTo(sx + w - 2, enemy.y + 26);
  ctx.stroke();

  // Red glowing eyes
  ctx.fillStyle = `rgba(255, 50, 50, ${glow})`;
  ctx.fillRect(cx - 5, enemy.y + 4, 4, 3);
  ctx.fillRect(cx + 1, enemy.y + 4, 4, 3);

  // HP bar if damaged
  if (hp < 3) {
    ctx.fillStyle = "rgba(255,50,50,0.3)";
    ctx.fillRect(sx + 4, enemy.y - 6, w - 8, 3);
    ctx.fillStyle = "rgba(255,50,50,0.8)";
    ctx.fillRect(sx + 4, enemy.y - 6, (w - 8) * (hp / 3), 3);
  }

  // Legs
  ctx.fillStyle = "#2a2a35";
  ctx.fillRect(sx + 5, enemy.y + h - 6, 8, 6);
  ctx.fillRect(sx + w - 13, enemy.y + h - 6, 8, 6);
}

function drawEnergyBall(ctx, ball, shootColor) {
  const sc = shootColor || "#4ade80";
  // Trail
  for (let i = 1; i <= 3; i++) {
    ctx.globalAlpha = 0.3 - i * 0.08;
    ctx.fillStyle = sc;
    ctx.beginPath();
    ctx.arc(ball.sx - ball.vx * i * 3, ball.sy, 6 - i, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Glow
  ctx.shadowColor = sc;
  ctx.shadowBlur = 12;
  ctx.fillStyle = sc;
  ctx.beginPath();
  ctx.arc(ball.sx, ball.sy, 6, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(ball.sx, ball.sy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function drawProjectile(ctx, proj) {
  ctx.shadowColor = "#ff3333";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#cc2222";
  ctx.beginPath();
  ctx.arc(proj.sx, proj.sy, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff6666";
  ctx.beginPath();
  ctx.arc(proj.sx, proj.sy, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

// ─── Draw dragon enemy ───
function drawDragonEnemy(ctx, enemy, cameraX) {
  const sx = enemy.x - cameraX;
  if (sx + enemy.w < -50 || sx > CANVAS_W + 50) return;
  const { w, h, hp, deathTimer, frame, facingRight } = enemy;

  if (deathTimer > 0) {
    ctx.globalAlpha = deathTimer / 15;
    ctx.fillStyle = "#ef4444";
    for (let i = 0; i < 5; i++) {
      ctx.fillRect(sx + i * 9, enemy.y + Math.sin(i) * 6, 5, 5);
    }
    ctx.globalAlpha = 1;
    return;
  }

  const wingFlap = Math.sin(frame * 0.15) * 8;
  const dir = facingRight ? 1 : -1;
  const cx = sx + w / 2;
  const cy = enemy.y + h / 2;

  // Wings
  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx - 20 * dir, cy - 12 + wingFlap);
  ctx.lineTo(cx - 10 * dir, cy + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx + 20 * dir, cy - 12 - wingFlap);
  ctx.lineTo(cx + 10 * dir, cy + 2);
  ctx.closePath();
  ctx.fill();

  // Body
  ctx.fillStyle = "#b91c1c";
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2 - 4, h / 2 - 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = "#991b1b";
  ctx.beginPath();
  ctx.arc(cx + dir * (w / 2), cy - 4, 8, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (yellow glowing)
  const glow = Math.sin(frame * 0.1) * 0.3 + 0.7;
  ctx.fillStyle = `rgba(250, 204, 21, ${glow})`;
  ctx.fillRect(cx + dir * (w / 2) - 2, cy - 7, 3, 3);
  ctx.fillRect(cx + dir * (w / 2) + 2, cy - 7, 3, 3);

  // Fire breath particles
  if (enemy.shootTimer < 20) {
    ctx.fillStyle = `rgba(249, 115, 22, ${0.6 + Math.random() * 0.4})`;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + dir * (w / 2 + 10 + i * 6), cy - 4 + (Math.random() - 0.5) * 8, 3 - i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // HP bar
  if (hp < 4) {
    ctx.fillStyle = "rgba(255,50,50,0.3)";
    ctx.fillRect(sx + 4, enemy.y - 8, w - 8, 3);
    ctx.fillStyle = "rgba(255,50,50,0.8)";
    ctx.fillRect(sx + 4, enemy.y - 8, (w - 8) * (hp / 4), 3);
  }
}

// ─── Main Component ───
export function NinjaGame({ settings, gradeQ, gameProgress, saveGameProgress, playSound, setScreen, addSparks, isAdmin, sparks }) {
  const [phase, setPhase] = useState("levelSelect");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [sparksEarned, setSparksEarned] = useState(0);
  const [chosenNinjaId, setChosenNinjaId] = useState("kai");

  const unlockedNinjas = getUnlockedNinjas(sparks || 0, isAdmin);
  const chosenNinja = getNinjaById(chosenNinjaId);

  // Game state
  const [lives, setLives] = useState(3);
  const [gateQuestions, setGateQuestions] = useState([]);
  const [gateIdx, setGateIdx] = useState(0);
  const [showGate, setShowGate] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);

  // Canvas refs
  const canvasRef = useRef(null);
  const gameRef = useRef(null);
  const keysRef = useRef({});
  const animRef = useRef(null);

  const grade = settings.grade;
  const levels = NINJA_CONFIGS[grade] || [];
  const gp = gameProgress.ninja || {};

  const isUnlocked = (lvl) => isAdmin || lvl === 1 || (gp[lvl - 1]?.stars > 0);
  const getStars = (lvl) => gp[lvl]?.stars || 0;
  const getStarsDisplay = (stars) => "⭐".repeat(stars) + "☆".repeat(3 - stars);

  const startLevel = useCallback((lvlNum) => {
    const config = levels[lvlNum - 1];
    if (!config) return;

    const questions = buildNinjaQuestions(config, gradeQ);
    const level = generateLevel(config.gates, config.level);

    setGateQuestions(questions);
    setSelectedLevel(lvlNum);
    setLives(3);
    setGateIdx(0);
    setShowGate(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setShowExplanation(false);
    setLevelComplete(false);

    gameRef.current = {
      player: {
        x: 60,
        y: GROUND_Y - PLAYER_H,
        vx: 0,
        vy: 0,
        onGround: true,
        facingRight: true,
        frame: 0,
        invincible: 0,
        powerCooldown: 0,
      },
      cameraX: 0,
      platforms: level.platforms,
      gates: level.gates,
      enemies: level.enemies,
      energyBalls: [],
      projectiles: [],
      totalW: level.totalW,
      gateCount: config.gates,
      paused: false,
      lives: 3,
      gatesOpened: 0,
      finished: false,
      levelNum: config.level,
      frameCount: 0,
    };

    setPhase("playing");
  }, [levels, gradeQ]);

  // ─── Keyboard handlers ───
  useEffect(() => {
    if (phase !== "playing") return;
    const onDown = (e) => {
      keysRef.current[e.key] = true;
      if (e.key === " " || e.key === "ArrowUp") e.preventDefault();
      if ((e.key === " " || e.key === "e" || e.key === "E" || e.key === "x" || e.key === "X") && !e.repeat) {
        keysRef.current._firePower = true;
      }
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

  // ─── Game loop ───
  useEffect(() => {
    if (phase !== "playing") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const loop = () => {
      const g = gameRef.current;
      if (!g || g.paused) {
        animRef.current = requestAnimationFrame(loop);
        // Still draw when paused
        render(ctx, g);
        return;
      }

      const p = g.player;
      const keys = keysRef.current;

      // Movement
      let moving = false;
      if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        p.vx = MOVE_SPEED;
        p.facingRight = true;
        moving = true;
      } else if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        p.vx = -MOVE_SPEED;
        p.facingRight = false;
        moving = true;
      } else {
        p.vx = 0;
      }

      // Jump
      if ((keys["ArrowUp"]  || keys["w"] || keys["W"]) && p.onGround) {
        p.vy = JUMP_FORCE;
        p.onGround = false;
      }

      // Gravity
      p.vy += GRAVITY;
      p.x += p.vx;
      p.y += p.vy;

      // Clamp left
      if (p.x < 0) p.x = 0;

      // Animation frame
      if (moving && p.onGround) p.frame++;

      // Moving platforms
      g.platforms.forEach(plat => {
        if (plat.moving) {
          plat.x += plat.moveDir * 0.8;
          if (Math.abs(plat.x - plat.origX) > 60) plat.moveDir *= -1;
        }
      });

      // Platform collision
      p.onGround = false;
      for (const plat of g.platforms) {
        if (
          p.x + PLAYER_W > plat.x &&
          p.x < plat.x + plat.w &&
          p.y + PLAYER_H >= plat.y &&
          p.y + PLAYER_H <= plat.y + plat.h + 10 &&
          p.vy >= 0
        ) {
          p.y = plat.y - PLAYER_H;
          p.vy = 0;
          p.onGround = true;

          // Crumbling platform
          if (plat.crumbling && !plat.crumbleTimer) {
            plat.crumbleTimer = 30;
          }
          break;
        }
      }

      // Update crumbling
      g.platforms = g.platforms.filter(plat => {
        if (plat.crumbleTimer !== undefined) {
          plat.crumbleTimer--;
          if (plat.crumbleTimer <= 0) return false;
        }
        return true;
      });

      // ── Enemy update ──
      g.enemies.forEach(en => { if (en.alive) en.frame++; });

      // Patrol movement
      g.enemies.forEach(en => {
        if (!en.alive || en.vx === 0) return;
        en.x += en.facingRight ? en.vx : -en.vx;
        if (en.x <= en.patrolLeft) { en.x = en.patrolLeft; en.facingRight = true; }
        if (en.x >= en.patrolRight) { en.x = en.patrolRight; en.facingRight = false; }
      });

      // Stone warrior + dragon shooting
      g.enemies.forEach(en => {
        if (!en.alive || (en.type !== "stoneWarrior" && en.type !== "dragon")) return;
        en.shootTimer--;
        if (en.shootTimer <= 0) {
          en.shootTimer = en.type === "dragon" ? 70 + Math.floor(Math.random() * 50) : 90 + Math.floor(Math.random() * 60);
          const dirX = p.x > en.x ? 1 : -1;
          const speed = en.type === "dragon" ? 4 : 3;
          const vy = en.type === "dragon" ? 2 : -1; // dragons shoot downward
          g.projectiles.push({
            x: en.x + en.w / 2, y: en.y + en.h / 2,
            vx: dirX * speed, vy, lifetime: 180,
          });
        }
      });

      // Death timer cleanup
      g.enemies = g.enemies.filter(en => {
        if (!en.alive) {
          en.deathTimer--;
          return en.deathTimer > 0;
        }
        return true;
      });

      // Fire energy ball (E/X key or touch)
      if (keys._firePower && p.powerCooldown <= 0) {
        g.energyBalls.push({
          x: p.x + (p.facingRight ? PLAYER_W + 4 : -4),
          y: p.y + PLAYER_H / 2,
          vx: p.facingRight ? 8 : -8,
          lifetime: 50,
        });
        p.powerCooldown = 90;
        playSound("click");
      }
      keys._firePower = false;

      // Energy ball update
      g.energyBalls = g.energyBalls.filter(ball => {
        ball.x += ball.vx;
        ball.lifetime--;
        if (ball.lifetime <= 0) return false;
        for (const en of g.enemies) {
          if (!en.alive) continue;
          if (ball.x > en.x && ball.x < en.x + en.w &&
              ball.y > en.y && ball.y < en.y + en.h) {
            en.hp--;
            if (en.hp <= 0) {
              en.alive = false;
              en.deathTimer = 15;
            }
            playSound("correct");
            return false;
          }
        }
        return true;
      });

      // Projectile update (stone warrior)
      g.projectiles = g.projectiles.filter(proj => {
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.vy += 0.05;
        proj.lifetime--;
        if (proj.lifetime <= 0) return false;
        if (p.invincible <= 0 &&
            proj.x > p.x && proj.x < p.x + PLAYER_W &&
            proj.y > p.y && proj.y < p.y + PLAYER_H) {
          g.lives--;
          setLives(g.lives);
          p.invincible = 60;
          if (g.lives <= 0) {
            g.finished = true;
            setPhase("result");
          }
          return false;
        }
        return true;
      });

      // Stomp collision (player landing on enemy from above)
      let stomped = false;
      if (p.vy > 0) {
        for (const en of g.enemies) {
          if (!en.alive) continue;
          if (p.x + PLAYER_W > en.x + 4 && p.x < en.x + en.w - 4 &&
              p.y + PLAYER_H >= en.y && p.y + PLAYER_H <= en.y + en.h * 0.5) {
            en.hp--;
            if (en.hp <= 0) {
              en.alive = false;
              en.deathTimer = 15;
            }
            p.vy = JUMP_FORCE * 0.6;
            playSound("correct");
            stomped = true;
            break;
          }
        }
      }

      // Side collision (enemy touches player)
      if (!stomped && p.invincible <= 0) {
        for (const en of g.enemies) {
          if (!en.alive) continue;
          if (p.x + PLAYER_W > en.x && p.x < en.x + en.w &&
              p.y + PLAYER_H > en.y && p.y < en.y + en.h) {
            g.lives--;
            setLives(g.lives);
            p.invincible = 60;
            p.vx = p.x < en.x ? -5 : 5;
            p.vy = -6;
            if (g.lives <= 0) {
              g.finished = true;
              setPhase("result");
            }
            break;
          }
        }
      }

      // Invincibility & cooldown countdown
      if (p.invincible > 0) p.invincible--;
      if (p.powerCooldown > 0) p.powerCooldown--;

      // Fall death
      if (p.y > CANVAS_H + 50) {
        g.lives--;
        setLives(g.lives);
        if (g.lives <= 0) {
          g.finished = true;
          setPhase("result");
          return;
        }
        // Respawn at last safe position
        p.x = Math.max(0, p.x - 200);
        p.y = GROUND_Y - PLAYER_H - 20;
        p.vy = 0;
        p.vx = 0;
      }

      // Gate collision
      for (const gate of g.gates) {
        if (gate.locked &&
          p.x + PLAYER_W > gate.x &&
          p.x < gate.x + gate.w &&
          p.y + PLAYER_H > gate.y
        ) {
          // Push player back
          p.x = gate.x - PLAYER_W - 2;
          p.vx = 0;
          g.paused = true;
          setShowGate(true);
          setGateIdx(gate.questionIdx);
          setSelectedAnswer(null);
          setFeedback(null);
          setShowExplanation(false);
          break;
        }
      }

      // Finish line check
      if (p.x + PLAYER_W >= g.totalW - 80 && !g.finished) {
        g.finished = true;
        setLevelComplete(true);
        setPhase("result");
        return;
      }

      // Camera
      g.cameraX = Math.max(0, p.x - CANVAS_W / 3);

      render(ctx, g);
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [phase]);

  function render(ctx, g) {
    if (!g) return;
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    g.frameCount = (g.frameCount || 0) + 1;

    const theme = LEVEL_THEMES[(g.levelNum || 1) - 1] || LEVEL_THEMES[0];
    drawParallax(ctx, g.cameraX, CANVAS_W, CANVAS_H, g.levelNum, g.frameCount);

    g.platforms.forEach(p => drawPlatform(ctx, p, g.cameraX, theme));
    g.gates.forEach(gate => drawGate(ctx, gate, g.cameraX));

    // Draw enemies
    g.enemies.forEach(en => {
      if (en.type === "skulkin") drawSkulkin(ctx, en, g.cameraX);
      else if (en.type === "serpentine") drawSerpentine(ctx, en, g.cameraX);
      else if (en.type === "stoneWarrior") drawStoneWarrior(ctx, en, g.cameraX);
      else if (en.type === "dragon") drawDragonEnemy(ctx, en, g.cameraX);
    });

    // Draw energy balls
    g.energyBalls.forEach(ball => {
      drawEnergyBall(ctx, { sx: ball.x - g.cameraX, sy: ball.y, vx: ball.vx }, chosenNinja.shootColor);
    });

    // Draw stone projectiles
    g.projectiles.forEach(proj => {
      drawProjectile(ctx, { sx: proj.x - g.cameraX, sy: proj.y });
    });

    drawFinishFlag(ctx, g.totalW, g.cameraX, chosenNinja.color);
    drawNinja(ctx, {
      x: g.player.x - g.cameraX,
      y: g.player.y,
      facingRight: g.player.facingRight,
      frame: g.player.frame,
      onGround: g.player.onGround,
      invincible: g.player.invincible,
    }, chosenNinja.color);
    drawHUD(ctx, g.lives, g.gatesOpened, g.gateCount, g.player.powerCooldown, chosenNinja.shootColor);
  }

  // ─── Touch controls ───
  const touchStart = useRef(null);

  const handleTouchMove = (dir) => {
    keysRef.current = {};
    if (dir === "left") keysRef.current["ArrowLeft"] = true;
    if (dir === "right") keysRef.current["ArrowRight"] = true;
  };

  const handleTouchEnd = () => {
    keysRef.current["ArrowLeft"] = false;
    keysRef.current["ArrowRight"] = false;
  };

  const handleJump = () => {
    keysRef.current["ArrowUp"] = true;
    setTimeout(() => { keysRef.current["ArrowUp"] = false; }, 150);
  };
  
  const handlePower = () => {
    keysRef.current._firePower = true;
    setTimeout(() => { keysRef.current["_firePower"] = false; }, 150);
  };

  // ─── Answer handling ───
  const handleAnswer = () => {
    if (selectedAnswer === null || feedback) return;
    const q = gateQuestions[gateIdx];
    if (!q) return;

    const isCorrect = selectedAnswer === q.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    if (!isCorrect) {
      const g = gameRef.current;
      g.lives--;
      setLives(g.lives);
    }

    setTimeout(() => setShowExplanation(true), 500);
  };

  const closeGate = () => {
    const g = gameRef.current;
    const q = gateQuestions[gateIdx];
    const isCorrect = feedback === "correct";

    if (isCorrect) {
      // Unlock gate
      const gate = g.gates.find(gt => gt.questionIdx === gateIdx);
      if (gate) gate.locked = false;
      g.gatesOpened++;

      // Move player past gate
      if (gate) g.player.x = gate.x + gate.w + 10;
    } else {
      // Push player back
      const gate = g.gates.find(gt => gt.questionIdx === gateIdx);
      if (gate) g.player.x = gate.x - PLAYER_W - 40;

      if (g.lives <= 0) {
        setPhase("result");
        return;
      }
    }

    setShowGate(false);
    setSelectedAnswer(null);
    setFeedback(null);
    setShowExplanation(false);
    g.paused = false;
  };

  // ─── Finish level ───
  const finishLevel = useCallback(() => {
    const currentLives = gameRef.current?.lives ?? lives;
    let stars = 0;
    if (currentLives >= 3) stars = 3;
    else if (currentLives >= 2) stars = 2;
    else if (currentLives >= 1) stars = 1;

    if (levelComplete && stars > 0) {
      playSound("celebrate");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
      const earned = SPARKS_REWARDS.gameLevelPass + (stars === 3 ? SPARKS_REWARDS.gameLevelThreeStars : 0);
      setSparksEarned(earned);
      if (addSparks) addSparks(earned);
    } else {
      setSparksEarned(0);
    }

    const existingStars = gp[selectedLevel]?.stars || 0;
    const newGp = {
      ...gameProgress,
      ninja: { ...gp, [selectedLevel]: { stars: Math.max(existingStars, stars) } }
    };
    saveGameProgress(newGp);
  }, [levelComplete, lives, gp, selectedLevel, gameProgress, saveGameProgress, playSound, addSparks]);

  useEffect(() => {
    if (phase === "result") finishLevel();
  }, [phase]);

  // ─── RENDER: Level Select ───
  if (phase === "levelSelect") {
    const displayLevel = hoveredLevel || selectedLevel;
    const displayConfig = displayLevel ? levels[displayLevel - 1] : null;
    const worlds = [
      { name: "דוג'ו האימונים", range: [1, 5], emoji: "🏯", color: "#22c55e" },
      { name: "מערות הסרפנטין", range: [6, 10], emoji: "🐍", color: "#a855f7" },
      { name: "האי האפל", range: [11, 15], emoji: "🌑", color: "#64748b" },
      { name: "מגדל השליט", range: [16, 20], emoji: "🗼", color: "#ef4444" },
    ];

    return (
      <div className="container">
        <div className="page-content">
          <div className="page-header">
            <button onClick={() => setScreen("practice-games")} className="back-btn">→ חזרה</button>
            <h2>🥷 נינג'גו</h2>
          </div>

          {/* Ninja picker */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
            {NINJAS.map(n => {
              const unlocked = unlockedNinjas.some(u => u.id === n.id);
              const isChosen = chosenNinjaId === n.id;
              const basePath = import.meta.env.BASE_URL;
              return (
                <button
                  key={n.id}
                  onClick={() => unlocked && setChosenNinjaId(n.id)}
                  disabled={!unlocked}
                  title={unlocked ? `${n.nameHe} - ${n.elementHe}` : `${n.nameHe} - נעול (${n.unlockAt} ניצוצות)`}
                  style={{
                    width: isChosen ? 56 : 44,
                    height: isChosen ? 56 : 44,
                    borderRadius: '50%',
                    border: isChosen ? `3px solid #fbbf24` : `2px solid ${unlocked ? n.color : '#334155'}`,
                    overflow: 'hidden',
                    background: unlocked ? n.color + '33' : '#1e293b',
                    cursor: unlocked ? 'pointer' : 'default',
                    opacity: unlocked ? 1 : 0.35,
                    filter: unlocked ? 'none' : 'grayscale(1)',
                    transition: 'all 0.2s',
                    padding: 0,
                    position: 'relative',
                  }}
                >
                  {unlocked ? (
                    <img src={`${basePath}/${n.img}`} alt={n.nameHe} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: isChosen ? 22 : 18 }}>🔒</span>
                  )}
                </button>
              );
            })}
          </div>
          {/* Selected ninja name */}
          <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 13, color: chosenNinja.color, fontWeight: 600 }}>
            {chosenNinja.nameHe} - {chosenNinja.elementHe}
          </div>

          <div className="level-name-tooltip">
            {displayConfig ? displayConfig.nameHe : "בחרו שלב"}
          </div>

          {worlds.map((world, wi) => {
            const worldLevels = levels.filter(l => l.level >= world.range[0] && l.level <= world.range[1]);
            if (worldLevels.length === 0) return null;
            const anyUnlocked = worldLevels.some(l => isUnlocked(l.level));
            return (
              <div key={wi} style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, opacity: anyUnlocked ? 1 : 0.4 }}>
                  <span style={{ fontSize: 18 }}>{world.emoji}</span>
                  <span style={{ color: world.color, fontWeight: 600, fontSize: 13 }}>{world.name}</span>
                </div>
                <div className="level-grid">
                  {worldLevels.map((lvl) => {
                    const unlocked = isUnlocked(lvl.level);
                    const stars = getStars(lvl.level);
                    return (
                      <button
                        key={lvl.level}
                        className={`level-card ${unlocked ? "unlocked" : "locked"}${hoveredLevel === lvl.level ? " current" : ""}`}
                        onClick={() => unlocked && startLevel(lvl.level)}
                        onMouseEnter={() => unlocked && setHoveredLevel(lvl.level)}
                        onMouseLeave={() => setHoveredLevel(null)}
                        disabled={!unlocked}
                        style={unlocked ? { borderColor: world.color + "44" } : undefined}
                      >
                        <span className="level-num">{unlocked ? lvl.level : "🔒"}</span>
                        {unlocked && stars > 0 && (
                          <span className="level-stars">{getStarsDisplay(stars)}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── RENDER: Playing ───
  if (phase === "playing") {
    const currentQ = showGate ? gateQuestions[gateIdx] : null;
    const isTopic4 = currentQ?.topic === 4;
    const isTopic5 = currentQ?.topic === 5;
    const isImage = currentQ?.type === "image";
    const basePath = isImage ? `${import.meta.env.BASE_URL}/${currentQ.imagePath}`.replace("//", "/") : "";

    return (
      <div className="container" style={{ padding: 0 }}>
        <Confetti active={showConfetti} />

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            width: "100%",
            maxWidth: 800,
            height: "auto",
            display: "block",
            background: "#0c1445",
            borderRadius: 8,
            touchAction: "none",
          }}
        />

        {/* Touch Controls */}
        <div className="ninja-controls">
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="ninja-ctrl-btn"
              onTouchStart={() => handleTouchMove("left")}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchMove("left")}
              onMouseUp={handleTouchEnd}
            >
              ◀
            </button>
            <button
              className="ninja-ctrl-btn"
              onTouchStart={() => handleTouchMove("right")}
              onTouchEnd={handleTouchEnd}
              onMouseDown={() => handleTouchMove("right")}
              onMouseUp={handleTouchEnd}
            >
              ▶
            </button>
          </div>
          <button
            className="ninja-ctrl-btn"
            onTouchStart={handlePower}
            onMouseDown={handlePower}
            style={{
              backgroundColor: "rgba(34,197,94,0.3)",
              borderColor: "#22c55e",
              opacity: gameRef.current?.player?.powerCooldown > 0 ? 0.4 : 1,
            }}
          >
            ⚡
          </button>
          <button
            className="ninja-ctrl-btn ninja-jump-btn"
            onTouchStart={handleJump}
            onMouseDown={handleJump}
          >
            ▲
          </button>
        </div>

        {/* Back button */}
        <div style={{ position: "fixed", top: 8, right: 8, zIndex: 20 }}>
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

        {/* Gate Question Overlay */}
        {showGate && currentQ && (
          <div className="ninja-gate-overlay">
            <div className="ninja-gate-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ color: "#fbbf24", fontWeight: 700, fontSize: 14 }}>🚧 שער {gateIdx + 1}</span>
                <div style={{ display: "flex", gap: 4, fontSize: 18 }}>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} style={{ opacity: i < lives ? 1 : 0.2 }}>❤️</span>
                  ))}
                </div>
              </div>

              {/* Question */}
              <div className="question-card" style={{ marginBottom: 12 }}>
                {isImage ? (
                  <div>
                    <p className="visual-prompt">{currentQ.question}</p>
                    <img src={`${basePath}/q.png`} alt="שאלה" style={{ maxWidth: "100%", borderRadius: 8 }} />
                  </div>
                ) : isTopic4 && currentQ.visual ? (
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
                  if (isTopic5 || isImage) cls += " topic5";
                  if (isSelected && !feedback) cls += " selected";
                  if (isCorrect) cls += " correct";
                  if (isWrong) cls += " wrong";

                  return (
                    <button
                      key={i}
                      onClick={() => { if (!isDisabled) { setSelectedAnswer(i); playSound("click"); } }}
                      disabled={isDisabled}
                      className={cls}
                      style={{ cursor: isDisabled ? "default" : "pointer" }}
                    >
                      <span className="option-num">{i + 1}</span>
                      {isCorrect && <span style={{ color: "#4ade80" }}>✓</span>}
                      {isWrong && <span style={{ color: "#f87171" }}>✗</span>}
                      {isImage ? <img src={`${basePath}/a${i + 1}.png`} alt={`תשובה ${i + 1}`} style={{ maxWidth: "100%", maxHeight: 80, objectFit: "contain" }} />
                        : isTopic5 && typeof opt === "object" ? <Topic5Option opt={opt} size={40} />
                        : <span className="option-text" style={{ color: "#e2e8f0" }}>{typeof opt === "string" ? opt : opt?.label || ""}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Action */}
              {!feedback ? (
                <button
                  onClick={handleAnswer}
                  disabled={selectedAnswer === null}
                  className={`primary-btn w-full${selectedAnswer === null ? " disabled" : ""}`}
                >
                  ✓ אישור תשובה
                </button>
              ) : showExplanation ? (
                <div>
                  <div className="explanation-card" style={{ marginBottom: 10 }}>
                    <div className="explanation-title">💡 הסבר</div>
                    <p className="explanation-text">{currentQ.explanation}</p>
                  </div>
                  <button className="primary-btn w-full" onClick={closeGate}>
                    {feedback === "correct" ? "← המשך ריצה!" : lives > 0 ? "← נסו שוב" : "📊 לתוצאות"}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: Result ───
  if (phase === "result") {
    const currentLives = gameRef.current?.lives ?? lives;
    let stars = 0;
    if (levelComplete && currentLives >= 3) stars = 3;
    else if (levelComplete && currentLives >= 2) stars = 2;
    else if (levelComplete && currentLives >= 1) stars = 1;

    const passed = stars > 0;
    const hasNext = selectedLevel < levels.length && passed;
    const gatesOpened = gameRef.current?.gatesOpened ?? 0;
    const totalGates = gameRef.current?.gateCount ?? 0;

    return (
      <div className="container">
        <div className="page-content">
          <Confetti active={showConfetti} />

          <div className={`level-result-card ${passed ? "passed" : "failed"}`}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>{passed ? "🥷" : "😔"}</div>
            <h2 style={{ color: '#e2e8f0', margin: '6px 0' }}>
              {passed ? "נינג'ה אמיתי!" : "לא נורא, נסו שוב!"}
            </h2>
            <div style={{ color: '#94a3b8', fontSize: 14 }}>
              שלב {selectedLevel} - {levels[selectedLevel - 1]?.nameHe}
            </div>

            <div className={`result-score ${passed ? "pass" : "fail"}`}>
              {gatesOpened}/{totalGates}
            </div>
            <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>שערים שנפתחו</div>

            {stars > 0 && <div className="result-stars">{getStarsDisplay(stars)}</div>}

            <div style={{ display: "flex", gap: 4, justifyContent: "center", fontSize: 20, margin: '8px 0' }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} style={{ opacity: i < currentLives ? 1 : 0.2 }}>❤️</span>
              ))}
            </div>

            {sparksEarned > 0 && (
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                ✨ +{sparksEarned} ניצוצות
              </div>
            )}

            <div className="flex-col gap-8" style={{ marginTop: 16 }}>
              <button className="primary-btn w-full" onClick={() => startLevel(selectedLevel)}>
                🔄 נסו שוב
              </button>
              {hasNext && (
                <button className="primary-btn w-full" style={{ backgroundColor: '#22c55e' }} onClick={() => startLevel(selectedLevel + 1)}>
                  ▶ השלב הבא
                </button>
              )}
              <button className="secondary-btn w-full" onClick={() => setPhase("levelSelect")}>
                ← חזרה לשלבים
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
