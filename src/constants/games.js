export const PASS_THRESHOLD = 7;
export const STAR_THRESHOLDS = { 1: 7, 2: 9, 3: 10 };

export const GAME_LIST = [
  { id: "arithmetic", nameHe: "חשבון מהיר", icon: "🧮", color: "#818cf8", description: "תרגול פעולות חשבון בזמן מוגבל" },
  { id: "clock", nameHe: "לימוד השעון", icon: "🕐", color: "#06b6d4", description: "תרגול קריאת שעון וחישובי זמן" },
  { id: "adventure", nameHe: "הרפתקת החשיבה", icon: "🏰", color: "#f59e0b", description: "פתרו חידות בחדרים מסתוריים" },
  { id: "market", nameHe: "קרב הקלפים", icon: "⚔️", color: "#e67e22", description: "קנו, מכרו וסחרו עם פוקימון ונינג'ות!", totalLevels: 3 },
  { id: "ninjago", nameHe: "נינג'גו", icon: "🥷", color: "#22c55e", description: "קפצו בין פלטפורמות ופתרו חידות!" },
  { id: "space-invaders", nameHe: "פלישת הסרפנטין", icon: "🛸", color: "#7c3aed", description: "עצרו את פלישת הסרפנטין! ירו למעלה וענו על שאלות!" },
];

export const DEFAULT_GAME_PROGRESS = {
  arithmetic: {},
  adventure: {},
  clock: {},
  "space-invaders": {},
  ninja: {},
  ninjago: {},
  multiplication: {},
  market: {},
};

export const ADVENTURE_ROOM_THEMES = [
  { emoji: "🏰", name: "טירת המילים", narrative: "דלת עץ עתיקה נפתחת לאולם טירה מלא באותיות מרחפות..." },
  { emoji: "🌊", name: "מערת הים", narrative: "גלים זוהרים מאירים מערה תת-ימית עם חידה על הקיר..." },
  { emoji: "🌋", name: "הר הגעש", narrative: "לבה זורמת סביב שביל צר. שלט אבן חוסם את הדרך..." },
  { emoji: "🌙", name: "יער הלילה", narrative: "עצים זוהרים מקיפים פינה קסומה. ינשוף חכם שואל..." },
  { emoji: "🏛️", name: "המקדש העתיק", narrative: "עמודים ענקיים מעוטרים בסמלים. מנגנון סודי דורש פתרון..." },
  { emoji: "❄️", name: "ארמון הקרח", narrative: "קירות קריסטל נוצצים. פתית שלג ענק מסתיר חידה..." },
  { emoji: "🎪", name: "הקרקס הקסום", narrative: "ליצן מסתורי מציג חידה לפני שהוא מרשה לעבור..." },
  { emoji: "🚀", name: "תחנת החלל", narrative: "מסכים מהבהבים בתחנת חלל. המחשב דורש תשובה נכונה..." },
  { emoji: "🏜️", name: "מדבר הסודות", narrative: "סופת חול נרגעת וחושפת ספינקס עם חידה..." },
  { emoji: "🌈", name: "גשר הקשת", narrative: "גשר צבעוני מוביל לענן. שומר הענן מציב תנאי..." },
  { emoji: "🗝️", name: "מבוך המפתחות", narrative: "מסדרונות מתפתלים בכל כיוון. דלת נעולה חוסמת את הדרך..." },
  { emoji: "🐉", name: "מאורת הדרקון", narrative: "דרקון ישן שומר על אוצר. רק תשובה נכונה תעיר אותו בשלום..." },
];

const makeLevelConfigs = (difficulty) => {
  return Array.from({ length: 10 }, (_, i) => ({
    level: i + 1,
    nameHe: `הרפתקה ${i + 1}`,
    themeStart: (i * 6) % 12,
    difficulty: difficulty[Math.min(i, difficulty.length - 1)],
  }));
};

export const ADVENTURE_CONFIGS = {
  2: makeLevelConfigs([
    ["easy","easy","easy","easy","easy","easy"],
    ["easy","easy","easy","easy","easy","medium"],
    ["easy","easy","easy","medium","easy","medium"],
    ["easy","easy","medium","medium","easy","medium"],
    ["easy","medium","medium","medium","easy","medium"],
    ["medium","medium","medium","medium","medium","medium"],
    ["medium","medium","medium","medium","medium","hard"],
    ["medium","medium","medium","hard","medium","hard"],
    ["medium","medium","hard","hard","medium","hard"],
    ["medium","hard","hard","hard","hard","hard"],
  ]),
  3: makeLevelConfigs([
    ["easy","easy","easy","easy","easy","easy"],
    ["easy","easy","easy","easy","easy","medium"],
    ["easy","easy","medium","medium","easy","medium"],
    ["easy","medium","medium","medium","medium","medium"],
    ["medium","medium","medium","medium","medium","medium"],
    ["medium","medium","medium","medium","medium","hard"],
    ["medium","medium","hard","hard","medium","hard"],
    ["medium","hard","hard","hard","medium","hard"],
    ["hard","hard","hard","hard","medium","hard"],
    ["hard","hard","hard","hard","hard","hard"],
  ]),
  4: makeLevelConfigs([
    ["easy","easy","easy","easy","easy","medium"],
    ["easy","easy","medium","medium","easy","medium"],
    ["easy","medium","medium","medium","medium","medium"],
    ["medium","medium","medium","medium","medium","medium"],
    ["medium","medium","medium","medium","medium","hard"],
    ["medium","medium","hard","hard","medium","hard"],
    ["medium","hard","hard","hard","medium","hard"],
    ["hard","hard","hard","hard","medium","hard"],
    ["hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard"],
  ]),
};

// Grade 2: small numbers, build up to all 4 ops
const GRADE_2_LEVELS = [
  { level: 1, nameHe: "חיבור עד 10",       operations: ["+"],       range: [1, 10],  questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 2, nameHe: "חיסור עד 10",       operations: ["-"],       range: [1, 10],  questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 3, nameHe: "חיבור וחיסור עד 10", operations: ["+", "-"], range: [1, 10],  questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 4, nameHe: "חיבור עד 20",       operations: ["+"],       range: [1, 20],  questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 5, nameHe: "חיסור עד 20",       operations: ["-"],       range: [1, 20],  questionsPerRound: 10, timePerQuestion: 12, answerMode: "input" },
  { level: 6, nameHe: "חיבור וחיסור עד 20", operations: ["+", "-"], range: [1, 20],  questionsPerRound: 10, timePerQuestion: 12, answerMode: "input" },
  { level: 7, nameHe: "כפל עד 5",          operations: ["×"],       range: [1, 5],   questionsPerRound: 10, timePerQuestion: 12, answerMode: "input" },
  { level: 8, nameHe: "כפל עד 10",         operations: ["×"],       range: [1, 10],  questionsPerRound: 10, timePerQuestion: 10, answerMode: "mixed" },
  { level: 9, nameHe: "כל הפעולות עד 20",  operations: ["+", "-", "×"], range: [1, 20], questionsPerRound: 10, timePerQuestion: 10, answerMode: "mixed" },
  { level: 10, nameHe: "אתגר כיתה ב׳",    operations: ["+", "-", "×", "÷"], range: [1, 20], questionsPerRound: 10, timePerQuestion: 8, answerMode: "mixed" },
];

// Grade 3: larger numbers, multiplication tables, division
const GRADE_3_LEVELS = [
  { level: 1, nameHe: "חיבור עד 100",       operations: ["+"],       range: [1, 100],  questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 2, nameHe: "חיסור עד 100",       operations: ["-"],       range: [1, 100],  questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 3, nameHe: "חיבור וחיסור עד 100", operations: ["+", "-"], range: [1, 100],  questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 4, nameHe: "לוח הכפל עד 10",    operations: ["×"],       range: [1, 10],   questionsPerRound: 10, timePerQuestion: 12, answerMode: "choice" },
  { level: 5, nameHe: "חילוק עד 10",       operations: ["÷"],       range: [1, 10],   questionsPerRound: 10, timePerQuestion: 12, answerMode: "input" },
  { level: 6, nameHe: "כפל וחילוק",        operations: ["×", "÷"],  range: [1, 10],   questionsPerRound: 10, timePerQuestion: 12, answerMode: "input" },
  { level: 7, nameHe: "כל הפעולות עד 100",  operations: ["+", "-", "×", "÷"], range: [1, 100], questionsPerRound: 10, timePerQuestion: 10, answerMode: "input" },
  { level: 8, nameHe: "כפל דו-ספרתי",      operations: ["×"],       range: [2, 20],   questionsPerRound: 10, timePerQuestion: 15, answerMode: "mixed" },
  { level: 9, nameHe: "תרגיל מעורב",       operations: ["+", "-", "×", "÷"], range: [1, 100], questionsPerRound: 10, timePerQuestion: 10, answerMode: "mixed" },
  { level: 10, nameHe: "אתגר כיתה ג׳",    operations: ["+", "-", "×", "÷"], range: [1, 100], questionsPerRound: 10, timePerQuestion: 8, answerMode: "mixed" },
];

// Grade 4: up to 1000, multi-digit, order of operations
const GRADE_4_LEVELS = [
  { level: 1, nameHe: "חיבור עד 1000",      operations: ["+"],       range: [1, 1000], questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 2, nameHe: "חיסור עד 1000",      operations: ["-"],       range: [1, 1000], questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 3, nameHe: "חיבור וחיסור עד 1000", operations: ["+", "-"], range: [1, 1000], questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 4, nameHe: "כפל דו-ספרתי",      operations: ["×"],       range: [2, 30],   questionsPerRound: 10, timePerQuestion: 15, answerMode: "choice" },
  { level: 5, nameHe: "חילוק עד 100",      operations: ["÷"],       range: [1, 100],  questionsPerRound: 10, timePerQuestion: 12, answerMode: "input" },
  { level: 6, nameHe: "כפל וחילוק מתקדם",  operations: ["×", "÷"],  range: [2, 50],   questionsPerRound: 10, timePerQuestion: 12, answerMode: "input" },
  { level: 7, nameHe: "כל הפעולות עד 1000", operations: ["+", "-", "×", "÷"], range: [1, 1000], questionsPerRound: 10, timePerQuestion: 12, answerMode: "input" },
  { level: 8, nameHe: "סדר פעולות חשבון",   operations: ["+", "-", "×"], range: [1, 20], questionsPerRound: 10, timePerQuestion: 20, answerMode: "mixed" },
  { level: 9, nameHe: "תרגיל מעורב מתקדם", operations: ["+", "-", "×", "÷"], range: [1, 1000], questionsPerRound: 10, timePerQuestion: 10, answerMode: "mixed" },
  { level: 10, nameHe: "אתגר כיתה ד׳",    operations: ["+", "-", "×", "÷"], range: [1, 1000], questionsPerRound: 10, timePerQuestion: 8, answerMode: "mixed" },
];

export const ARITHMETIC_LEVELS = {
  2: GRADE_2_LEVELS,
  3: GRADE_3_LEVELS,
  4: GRADE_4_LEVELS,
};

// Ninjago: 20 levels across 4 themed worlds
const NINJA_LEVEL_NAMES = [
  // World 1: Training Dojo (1-5)
  "שביל הבמבוק",
  "גשר הענן",
  "מגדל הצל",
  "יער הסתרים",
  "חצר הדוג'ו",
  // World 2: Serpentine Caves (6-10)
  "מערת הנחשים",
  "נהר הדרקון",
  "מערת הרוח",
  "מנהרת הארס",
  "מאורת הסרפנטין",
  // World 3: Dark Island (11-15)
  "חוף האי האפל",
  "יער הצללים",
  "גג המקדש",
  "שדה הכוכבים",
  "מבצר החושך",
  // World 4: Overlord's Tower (16-20)
  "שער המגדל",
  "מדרגות הלהבה",
  "ארמון הקרח",
  "חדר השליט",
  "פסגת הנינג'גו",
];

// World themes for level-select UI
export const NINJA_WORLDS = [
  { name: "דוג'ו האימונים", levels: [1,5],  emoji: "🏯", color: "#22c55e" },
  { name: "מערות הסרפנטין", levels: [6,10], emoji: "🐍", color: "#a855f7" },
  { name: "האי האפל",       levels: [11,15], emoji: "🌑", color: "#64748b" },
  { name: "מגדל השליט",     levels: [16,20], emoji: "🗼", color: "#ef4444" },
];

// questionsPerGate: how many questions the kid must answer to unlock each gate
const makeNinjaConfigs = (difficulty) => {
  return Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    nameHe: NINJA_LEVEL_NAMES[i],
    gates: 3 + Math.floor(i / 3),                       // 3→9 gates across 20 levels
    questionsPerGate: i < 5 ? 2 : i < 10 ? 3 : i < 15 ? 3 : 4,  // 2→4 questions per gate
    difficulty: difficulty[Math.min(i, difficulty.length - 1)],
    world: i < 5 ? 0 : i < 10 ? 1 : i < 15 ? 2 : 3,
    hasEnemyDragon: i >= 10, // Dark Island and beyond
  }));
};

export const NINJA_CONFIGS = {
  2: makeNinjaConfigs([
    // World 1: Training Dojo
    ["easy","easy","easy"],
    ["easy","easy","medium"],
    ["easy","medium","medium","medium"],
    ["easy","medium","medium","medium","medium"],
    ["medium","medium","medium","medium","medium"],
    // World 2: Serpentine Caves
    ["medium","medium","medium","medium","hard"],
    ["medium","medium","medium","hard","hard","hard"],
    ["medium","medium","hard","hard","hard","hard"],
    ["medium","hard","hard","hard","hard","hard"],
    ["medium","hard","hard","hard","hard","hard","hard"],
    // World 3: Dark Island
    ["hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    // World 4: Overlord's Tower
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard","hard"],
  ]),
  3: makeNinjaConfigs([
    ["easy","easy","easy"],
    ["easy","easy","medium"],
    ["easy","medium","medium","medium"],
    ["medium","medium","medium","medium","medium"],
    ["medium","medium","medium","medium","hard"],
    ["medium","medium","medium","hard","hard"],
    ["medium","medium","hard","hard","hard","hard"],
    ["medium","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard","hard"],
  ]),
  4: makeNinjaConfigs([
    ["easy","easy","medium"],
    ["easy","medium","medium"],
    ["medium","medium","medium","medium"],
    ["medium","medium","medium","hard","hard"],
    ["medium","medium","hard","hard","hard"],
    ["medium","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard","hard"],
    ["hard","hard","hard","hard","hard","hard","hard","hard","hard","hard"],
  ]),
};
