// ─── Ninjago Progression System ───

// Currency: Spinjitzu Sparks (ניצוצות ספינג'יטסו)
// Earned by correct answers, completing levels, tests, and streaks

// ─── Sparks Earning Rates ───
export const SPARKS_REWARDS = {
  practiceCorrectFirst: 3,    // correct on first attempt in practice
  practiceCorrectSecond: 1,   // correct on second attempt
  topicComplete: 5,           // finish all questions in a practice topic
  gameLevelPass: 10,          // pass a game level
  gameLevelThreeStars: 5,     // bonus for 3 stars on a level
  ninjaGateCorrect: 3,        // correct gate answer in ninjago game
  testComplete: 20,           // complete a full test
  testHighScore: 10,          // bonus: test score >= 80%
};

// ─── Ninja Characters ───
export const NINJAS = [
  { id: "kai",   nameHe: "קאי",   color: "#ef4444", element: "fire",      elementHe: "אש 🔥",    shootColor: "#f97316", unlockAt: 0,    img: "ninjago/kai.png" },
  { id: "jay",   nameHe: "ג'יי",  color: "#3b82f6", element: "lightning", elementHe: "ברק ⚡",    shootColor: "#60a5fa", unlockAt: 100,  img: "ninjago/jay.png" },
  { id: "cole",  nameHe: "קול",   color: "#1e293b", element: "earth",     elementHe: "אדמה 🪨",   shootColor: "#78716c", unlockAt: 250,  img: "ninjago/cole.png" },
  { id: "zane",  nameHe: "זיין",  color: "#e2e8f0", element: "ice",       elementHe: "קרח ❄️",    shootColor: "#93c5fd", unlockAt: 450,  img: "ninjago/zane.png" },
  { id: "nya",   nameHe: "ניה",   color: "#06b6d4", element: "water",     elementHe: "מים 🌊",    shootColor: "#22d3ee", unlockAt: 700,  img: "ninjago/nya.png" },
  { id: "lloyd", nameHe: "לויד",  color: "#22c55e", element: "energy",    elementHe: "אנרגיה ⚡", shootColor: "#facc15", unlockAt: 1000, img: "ninjago/lloyd.png" },
];

// ─── Dragons ───
export const DRAGONS = [
  { id: "fire",      nameHe: "דרקון האש",    color: "#ef4444", ninja: "kai",   unlockAt: 150 },
  { id: "lightning", nameHe: "דרקון הברק",   color: "#3b82f6", ninja: "jay",   unlockAt: 400 },
  { id: "earth",     nameHe: "דרקון האדמה",  color: "#78716c", ninja: "cole",  unlockAt: 600 },
  { id: "ice",       nameHe: "דרקון הקרח",   color: "#e2e8f0", ninja: "zane",  unlockAt: 850 },
  { id: "ultra",     nameHe: "האולטרה דרקון", color: "#facc15", ninja: "lloyd", unlockAt: 1200 },
];

// ─── Ninja Ranks ───
export const NINJA_RANKS = [
  { minSparks: 0,    nameHe: "נינג'ה מתחיל",  icon: "🥋" },
  { minSparks: 50,   nameHe: "נינג'ה מתאמן",  icon: "⚔️" },
  { minSparks: 150,  nameHe: "נינג'ה כסף",    icon: "🥈" },
  { minSparks: 350,  nameHe: "נינג'ה זהב",    icon: "🥇" },
  { minSparks: 600,  nameHe: "מאסטר נינג'ה",  icon: "🏆" },
  { minSparks: 1000, nameHe: "נינג'ה אגדי",   icon: "👑" },
];

// ─── Game Unlock Thresholds ───
// Dynamic: games are ordered, each has a sparks requirement
export const GAME_UNLOCKS = [
  { gameId: "arithmetic",    sparksNeeded: 0 },
  { gameId: "adventure",     sparksNeeded: 50 },
  { gameId: "clock",         sparksNeeded: 150 },
  { gameId: "space-invaders", sparksNeeded: 200 },
  { gameId: "ninjago",       sparksNeeded: 500 },
  { gameId: "ninja-quest",   sparksNeeded: 350 },
];

// ─── Game Progression (level cap from previous game) ───
// Order matches GAME_LIST display: arithmetic → clock → adventure → ninjago
// prevGameId: which game's progress caps levels in this game
// prevGameName: Hebrew name for lock messages
// levelCapMultiplier: cap = prevGameCompleted * multiplier (ninjago has 20 levels vs 10)
export const GAME_PROGRESSION = [
  { gameId: "arithmetic", prevGameId: null,         prevGameName: null,               levelCapMultiplier: 1 },
  { gameId: "clock",      prevGameId: "arithmetic", prevGameName: "חשבון מהיר",       levelCapMultiplier: 1 },
  { gameId: "adventure",  prevGameId: "clock",      prevGameName: "לימוד השעון",      levelCapMultiplier: 1 },
  { gameId: "ninjago",    prevGameId: "adventure",  prevGameName: "הרפתקת החשיבה",    levelCapMultiplier: 2 },
];

// ─── Ninja Stats (unique per character) ───
// All values are multipliers (1.0 = base)
export const NINJA_STATS = {
  kai:   { speed: 1.0,  jump: 1.0,  size: 1.0,  weaponPower: 2, weaponCooldown: 90,  range: 1.0,  descHe: "כוח אש חזק" },
  jay:   { speed: 1.35, jump: 1.05, size: 0.9,  weaponPower: 1, weaponCooldown: 70,  range: 0.9,  descHe: "מהירות ברק" },
  cole:  { speed: 0.85, jump: 0.9,  size: 1.2,  weaponPower: 2, weaponCooldown: 110, range: 0.8,  descHe: "חזק ועמיד" },
  zane:  { speed: 1.0,  jump: 1.0,  size: 1.0,  weaponPower: 1, weaponCooldown: 80,  range: 1.4,  descHe: "טווח קרח ארוך" },
  nya:   { speed: 1.1,  jump: 1.25, size: 0.95, weaponPower: 1, weaponCooldown: 85,  range: 1.0,  descHe: "קפיצה גבוהה" },
  lloyd: { speed: 1.15, jump: 1.1,  size: 1.0,  weaponPower: 2, weaponCooldown: 75,  range: 1.2,  descHe: "נינג'ה מאוזן" },
};

// ─── Special Abilities (unlocked by sparks) ───
export const SPECIAL_ABILITIES = [
  { id: "doubleJump",  nameHe: "קפיצה כפולה",    descHe: "קפצו פעם נוספת באוויר!", icon: "🦘", sparksNeeded: 100 },
  { id: "powerShot",   nameHe: "ירי חזק",         descHe: "כדורי אנרגיה חזקים x2",  icon: "💥", sparksNeeded: 250 },
  { id: "extraLife",   nameHe: "חיים נוספים",      descHe: "התחילו עם 4 לבבות",       icon: "💖", sparksNeeded: 400 },
  { id: "dashBoost",   nameHe: "דאש מהיר",        descHe: "לחצו פעמיים לדאש קדימה",  icon: "💨", sparksNeeded: 600 },
  { id: "shield",      nameHe: "מגן הגנה",         descHe: "מגן שסופג מכה אחת",       icon: "🛡️", sparksNeeded: 850 },
];

// ─── Question Answer Boost ───
export const ANSWER_BOOST = {
  duration: 1000,       // ~16 seconds at 60fps
  speedMult: 1.3,      // +30% speed
  jumpMult: 1.2,       // +20% jump
  sizeMult: 1.25,      // +25% size
};

export const getUnlockedAbilities = (sparks, isAdmin) =>
  isAdmin ? SPECIAL_ABILITIES : SPECIAL_ABILITIES.filter(a => sparks >= a.sparksNeeded);

export const hasAbility = (abilityId, sparks, isAdmin) =>
  isAdmin || SPECIAL_ABILITIES.find(a => a.id === abilityId)?.sparksNeeded <= sparks;

export const getNextAbilityUnlock = (sparks) =>
  SPECIAL_ABILITIES.find(a => sparks < a.sparksNeeded) || null;

// ─── Helper Functions ───

export const getUnlockedNinjas = (sparks, isAdmin) =>
  isAdmin ? NINJAS : NINJAS.filter(n => sparks >= n.unlockAt);

export const getCurrentNinja = (sparks, isAdmin) => {
  const unlocked = getUnlockedNinjas(sparks, isAdmin);
  return unlocked[unlocked.length - 1] || NINJAS[0];
};

export const getUnlockedDragons = (sparks, isAdmin) =>
  isAdmin ? DRAGONS : DRAGONS.filter(d => sparks >= d.unlockAt);

export const getNinjaRank = (sparks) => {
  let rank = NINJA_RANKS[0];
  for (const r of NINJA_RANKS) {
    if (sparks >= r.minSparks) rank = r;
  }
  return rank;
};

export const getNextNinjaUnlock = (sparks) =>
  NINJAS.find(n => sparks < n.unlockAt) || null;

export const getNextDragonUnlock = (sparks) =>
  DRAGONS.find(d => sparks < d.unlockAt) || null;

export const getNextRankUnlock = (sparks) =>
  NINJA_RANKS.find(r => sparks < r.minSparks) || null;

export const isGameUnlocked = (gameId, sparks, isAdmin) => {
  if (isAdmin) return true;
  const entry = GAME_UNLOCKS.find(g => g.gameId === gameId);
  if (!entry) return true; // unknown game = unlocked
  return sparks >= entry.sparksNeeded;
};

export const getGameUnlockInfo = (gameId) =>
  GAME_UNLOCKS.find(g => g.gameId === gameId) || null;

// Returns max level accessible in a game based on previous game progress
// Level N requires level ceil(N / multiplier) completed in prev game
export const getGameLevelCap = (gameId, gameProgress, isAdmin) => {
  if (isAdmin) return Infinity;
  const prog = GAME_PROGRESSION.find(g => g.gameId === gameId);
  if (!prog || !prog.prevGameId) return Infinity;
  const prevGp = gameProgress[prog.prevGameId] || {};
  const prevCompleted = Object.keys(prevGp).filter(k => prevGp[k]?.stars > 0).length;
  return Math.max(1, prevCompleted * prog.levelCapMultiplier);
};

// Returns Hebrew message explaining why a level is locked due to prev game requirement
export const getLevelLockReason = (gameId, level) => {
  const prog = GAME_PROGRESSION.find(g => g.gameId === gameId);
  if (!prog || !prog.prevGameId) return null;
  const requiredPrevLevel = Math.ceil(level / prog.levelCapMultiplier);
  return `סיימו שלב ${requiredPrevLevel} ב${prog.prevGameName} כדי לפתוח`;
};

export const getNinjaById = (id) =>
  NINJAS.find(n => n.id === id) || NINJAS[0];

// Admin username
export const ADMIN_USERNAME = "benny123";
