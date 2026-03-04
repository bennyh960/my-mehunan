export const PASS_THRESHOLD = 7;
export const STAR_THRESHOLDS = { 1: 7, 2: 9, 3: 10 };

export const GAME_LIST = [
  { id: "arithmetic", nameHe: "חשבון מהיר", icon: "🧮", color: "#818cf8", description: "תרגול פעולות חשבון בזמן מוגבל" },
];

export const DEFAULT_GAME_PROGRESS = {
  arithmetic: {},
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
