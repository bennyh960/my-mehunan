import { useState, useRef } from 'react';
import { GAME_UNLOCKS } from '../constants/ninjago.js';
import { GAME_LIST } from '../constants/games.js';

// ─── Questions Data ───
const MARKET_QUESTIONS = {
  1: [
    { id:"m1-1", theme:"pokemon", emoji:"🃏", story:"אתה עובד בחנות קלפים! חבילת פוקימון עולה 5 שקל. אורי רוצה לקנות 4 חבילות.", question:"כמה שקלים עליו לשלם?", answer:20, explanation:"5 × 4 = 20 שקל" },
    { id:"m1-2", theme:"marbles", emoji:"🔮", story:"לנועם יש 35 גולות. הוא הפסיד 12 גולות למשחק נגד תום.", question:"כמה גולות נשארו לנועם?", answer:23, explanation:"35 − 12 = 23 גולות" },
    { id:"m1-3", theme:"ninjago", emoji:"🌪️", story:"קאי ניצח 3 נינג'ים ואסף 24 ניצוצות. ג'יי ניצח 2 נינג'ים ואסף 16 ניצוצות.", question:"כמה ניצוצות יש להם יחד?", answer:40, explanation:"24 + 16 = 40 ניצוצות" },
    { id:"m1-4", theme:"pokemon", emoji:"⚡", story:"יש לך 18 קלפי פוקימון. אתה רוצה לחלק אותם שווה בשווה בין 3 חברים.", question:"כמה קלפים יקבל כל חבר?", answer:6, explanation:"18 ÷ 3 = 6 קלפים" },
    { id:"m1-5", theme:"ninjago", emoji:"🐉", story:"לויד יכול לנצח 4 שדים בשעה.", question:"כמה שדים ינצח לויד ב-5 שעות?", answer:20, explanation:"4 × 5 = 20 שדים" },
    { id:"m1-6", theme:"market", emoji:"💰", story:"תמר קנתה חבילת פוקימון ב-6 שקל ומכרה אותה ב-10 שקל.", question:"כמה שקל הרוויחה תמר?", answer:4, explanation:"10 − 6 = 4 שקל רווח" },
    { id:"m1-7", theme:"pokemon", emoji:"🃏", story:"ל-גולגולת יש 130 נקודות חיים ול-פיצ'ו יש 40 נקודות חיים.", question:"כמה נקודות חיים יש לשניהם יחד?", answer:170, explanation:"130 + 40 = 170 נקודות" },
    { id:"m1-8", theme:"marbles", emoji:"🔮", story:"ניר מכר 6 גולות ב-3 שקל כל אחת.", question:"כמה שקל קיבל ניר?", answer:18, explanation:"6 × 3 = 18 שקל" },
  ],
  2: [
    { id:"m2-1", theme:"market", emoji:"🏪", story:"אמא הגיעה לחנות קלפים לקנות לבנה. חבילה רגילה עולה 4 שקל וחבילת זהב עולה 6 שקל. האמא שילמה 30 שקל וקנתה 3 חבילות רגילות.", question:"כמה חבילות זהב קיבלה בשאר הכסף?", answer:3, explanation:"3 × 4 = 12 שקל לרגילות. נשאר: 30 − 12 = 18 שקל. חבילות זהב: 18 ÷ 6 = 3" },
    { id:"m2-2", theme:"ninjago", emoji:"🌪️", story:"המתקפה של לויד יכולה להרים 6 שרירנים באוויר כשהוא משתמש בחצי מהכוח שלו.", question:"כמה שרירנים יוכל לויד להרים אם ישתמש בכל הכוח שלו?", answer:12, explanation:"חצי כוח = 6 שרירנים → כוח מלא = 6 × 2 = 12 שרירנים" },
    { id:"m2-3", theme:"pokemon", emoji:"⚡", story:"לדן יש 5 קלפי פיקאצ'ו ששווים 8 שקל כל אחד, וגם 3 קלפי מיוטו ששווים 15 שקל כל אחד.", question:"כמה שקל שווה האוסף של דן בסך הכל?", answer:85, explanation:"פיקאצ'ו: 5 × 8 = 40 שקל. מיוטו: 3 × 15 = 45 שקל. סה\"כ: 40 + 45 = 85 שקל" },
    { id:"m2-4", theme:"marbles", emoji:"🔮", story:"ידין הביא 20 גולות למשחק. הוא ניצח 3 משחקים וקיבל 5 גולות בכל ניצחון. אחר כך הפסיד 2 משחקים ונתן 4 גולות בכל הפסד.", question:"כמה גולות יש לידין עכשיו?", answer:27, explanation:"ניצח: 3 × 5 = 15. הפסיד: 2 × 4 = 8. סה\"כ: 20 + 15 − 8 = 27 גולות" },
    { id:"m2-5", theme:"ninjago", emoji:"⚡", story:"קאי, ג'יי וקול חוסכים ניצוצות לקנות ספינת נינג'ה ב-120 ניצוצות. קאי חסך 45 וג'יי חסך 38.", question:"כמה ניצוצות צריך קול לחסוך?", answer:37, explanation:"120 − 45 − 38 = 37 ניצוצות" },
    { id:"m2-6", theme:"market", emoji:"💰", story:"בחנות יש מבצע: 4 חבילות פוקימון ב-20 שקל, במקום 6 שקל לחבילה בלי מבצע.", question:"כמה שקל חוסכים אם קונים את המבצע?", answer:4, explanation:"מחיר רגיל: 4 × 6 = 24 שקל. מחיר מבצע: 20 שקל. חיסכון: 24 − 20 = 4 שקל" },
    { id:"m2-7", theme:"ninjago", emoji:"🐉", story:"מיוטו יכול להרים 3 סנורלאקסים אם ישתמש בשליש מהכוח שלו.", question:"כמה סנורלאקסים יוכל מיוטו להרים אם ישתמש בכל הכוח שלו?", answer:9, explanation:"שליש כוח = 3 → כוח מלא = 3 × 3 = 9 סנורלאקסים" },
    { id:"m2-8", theme:"pokemon", emoji:"🃏", story:"לגל יש 3 קלפים נדירים ששווים 12 שקל כל אחד, ו-8 קלפים רגילים ששווים 3 שקל כל אחד.", question:"כמה שקל שווה האוסף של גל?", answer:60, explanation:"נדירים: 3 × 12 = 36 שקל. רגילים: 8 × 3 = 24 שקל. סה\"כ: 36 + 24 = 60 שקל" },
  ],
  3: [
    { id:"m3-1", theme:"market", emoji:"🏪", story:"פתחת חנות קלפים! קנית 10 חבילות ב-4 שקל כל חבילה. מכרת 6 מהן ב-7 שקל כל חבילה ואת השאר מכרת ב-5 שקל כל חבילה.", question:"כמה שקל הרווחת בסך הכל?", answer:22, explanation:"עלות: 10 × 4 = 40 שקל. מכירות: 6 × 7 + 4 × 5 = 42 + 20 = 62 שקל. רווח: 62 − 40 = 22 שקל" },
    { id:"m3-2", theme:"ninjago", emoji:"🌪️", story:"בטורניר נינג'ה יש 3 שלבים. בשלב הראשון יש 48 נינג'ים. בשלב השני נשאר שליש. בשלב השלישי נשאר חצי מהשלב השני.", question:"כמה נינג'ים הגיעו לגמר?", answer:8, explanation:"שלב ב': 48 ÷ 3 = 16. גמר: 16 ÷ 2 = 8 נינג'ים" },
    { id:"m3-3", theme:"pokemon", emoji:"💰", story:"אמא נתנה לך 100 שקל. קנית 8 חבילות פוקימון ב-7 שקל כל חבילה. בכל חבילה יש 5 קלפים. מכרת 15 קלפים ב-4 שקל כל אחד.", question:"כמה כסף יש לך עכשיו?", answer:104, explanation:"הוצאה: 8 × 7 = 56 שקל. נשאר: 100 − 56 = 44 שקל. הכנסה ממכירה: 15 × 4 = 60 שקל. סה\"כ: 44 + 60 = 104 שקל" },
    { id:"m3-4", theme:"ninjago", emoji:"⚡", story:"קאי, ג'יי, קול ולויד אספו 140 ניצוצות יחד. ג'יי אסף פי שניים מקאי. קול אסף כמו קאי. לויד אסף פי שלושה מקאי.", question:"כמה ניצוצות אסף לויד?", answer:60, explanation:"קאי=x, ג'יי=2x, קול=x, לויד=3x. יחד: 7x=140. x=20. לויד = 3×20 = 60 ניצוצות" },
    { id:"m3-5", theme:"market", emoji:"🃏", story:"לאיתי יש 50 שקל. חבילה של 5 קלפים עולה 8 שקל. איתי קנה כמה שיכול, ואחר כך מכר 10 קלפים ב-3 שקל כל אחד.", question:"כמה שקל יש לאיתי עכשיו?", answer:32, explanation:"חבילות: 50÷8=6 חבילות (48 שקל). עודף: 50−48=2 שקל. מכירה: 10×3=30 שקל. סה\"כ: 2+30=32 שקל" },
    { id:"m3-6", theme:"pokemon", emoji:"⚡", story:"בטורניר פוקימון: בשלב א' יש 48 שחקנים. בשלב ב' עובר שליש. בשלב ג' עוברים 4 פחות ממחצית שלב ב'.", question:"כמה שחקנים הגיעו לשלב ג'?", answer:4, explanation:"שלב ב': 48÷3=16. חצי מ-16=8. שלב ג': 8−4=4 שחקנים" },
    { id:"m3-7", theme:"ninjago", emoji:"🐉", story:"נינג'ה אחד מנצח 6 שדים בשעה כשהוא עייף. כשהוא נח הוא מנצח פי שלושה. שלושה נינג'ות נחים עובדים יחד שעה שלמה.", question:"כמה שדים מנצחים שלושתם יחד?", answer:54, explanation:"נח = 6×3 = 18 שדים לשעה. שלושה נינג'ות: 18×3 = 54 שדים" },
    { id:"m3-8", theme:"market", emoji:"💰", story:"יש לך חנות גולות. קנית 60 גולות ב-2 שקל כל 5 גולות. מכרת 30 גולות ב-3 שקל כל 10 גולות. מכרת עוד 20 גולות ב-4 שקל כל 4 גולות.", question:"כמה שקל הרווחת?", answer:5, explanation:"עלות: 60÷5×2=24 שקל. מכירה א': 30÷10×3=9 שקל. מכירה ב': 20÷4×4=20 שקל. הכנסה: 9+20=29 שקל. רווח: 29−24=5 שקל" },
  ],
};

const LEVELS = [
  { id: "1", name: "מתחיל", emoji: "🛒", color: "#22c55e", borderColor: "#16a34a", sparksPass: 15, sparksBonus: 5 },
  { id: "2", name: "מתקדם", emoji: "🏪", color: "#eab308", borderColor: "#ca8a04", sparksPass: 20, sparksBonus: 5 },
  { id: "3", name: "אלוף", emoji: "👑", color: "#ef4444", borderColor: "#dc2626", sparksPass: 25, sparksBonus: 5 },
];

const THEME_COLORS = {
  pokemon: "#f59e0b",
  ninjago: "#22c55e",
  marbles: "#8b5cf6",
  market: "#e67e22",
};

const THEME_LABELS = {
  pokemon: "פוקימון",
  ninjago: "נינג'גו",
  marbles: "גולות",
  market: "שוק",
};

const TOTAL_QUESTIONS = 8;
const STAR_THRESHOLDS = { 1: 5, 2: 7, 3: 8 };
const SPARKS_PER_CORRECT = 3;

const getNextUnlock = (sparks) => {
  const sorted = [...GAME_UNLOCKS].sort((a, b) => a.sparksNeeded - b.sparksNeeded);
  const next = sorted.find(g => g.sparksNeeded > sparks);
  if (!next) return null;
  const gameInfo = GAME_LIST.find(g => g.id === next.gameId);
  return { ...next, nameHe: gameInfo?.nameHe || next.gameId, icon: gameInfo?.icon || "🎮" };
};

const getStars = (score) => {
  if (score >= STAR_THRESHOLDS[3]) return 3;
  if (score >= STAR_THRESHOLDS[2]) return 2;
  if (score >= STAR_THRESHOLDS[1]) return 1;
  return 0;
};

const getStarsDisplay = (count) => {
  let s = "";
  for (let i = 0; i < 3; i++) s += i < count ? "⭐" : "☆";
  return s;
};

// ─── Styles ───
const MS = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #1a0533 0%, #0f172a 100%)",
    direction: "rtl",
    padding: "16px",
    fontFamily: "inherit",
    color: "#e2e8f0",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backBtn: {
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.2)",
    color: "#e2e8f0",
    borderRadius: 10,
    padding: "8px 16px",
    cursor: "pointer",
    fontSize: 15,
    fontWeight: 600,
  },
  title: {
    fontSize: 24,
    fontWeight: 800,
    textAlign: "center",
    margin: 0,
    background: "linear-gradient(135deg, #f59e0b, #e67e22)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  levelGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    maxWidth: 400,
    margin: "0 auto",
  },
  levelCard: (color, borderColor, locked) => ({
    background: locked ? "rgba(255,255,255,0.05)" : `linear-gradient(135deg, ${color}22, ${color}11)`,
    border: `2px solid ${locked ? "rgba(255,255,255,0.1)" : borderColor}`,
    borderRadius: 16,
    padding: "20px 24px",
    cursor: locked ? "not-allowed" : "pointer",
    opacity: locked ? 0.5 : 1,
    transition: "transform 0.2s, box-shadow 0.2s",
    display: "flex",
    alignItems: "center",
    gap: 16,
  }),
  levelEmoji: {
    fontSize: 40,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 20,
    fontWeight: 700,
    color: "#e2e8f0",
    margin: 0,
  },
  levelStars: {
    fontSize: 18,
    marginTop: 4,
    letterSpacing: 2,
  },
  lockIcon: {
    fontSize: 24,
    color: "#64748b",
  },
  lockText: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  // Playing phase
  progressBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 16,
  },
  progressDot: (answered, correct) => ({
    width: 12,
    height: 12,
    borderRadius: "50%",
    background: answered ? (correct ? "#4ade80" : "#f87171") : "rgba(255,255,255,0.15)",
    border: "2px solid rgba(255,255,255,0.2)",
    transition: "background 0.3s",
  }),
  progressDotCurrent: {
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "#fbbf24",
    border: "2px solid #f59e0b",
    boxShadow: "0 0 8px rgba(251,191,36,0.5)",
  },
  questionCounter: {
    textAlign: "center",
    fontSize: 14,
    color: "#94a3b8",
    marginBottom: 8,
  },
  storyCard: {
    background: "#ffffff",
    borderRadius: 20,
    padding: "24px 20px",
    margin: "0 auto 20px",
    maxWidth: 500,
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  themeHeader: (color) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    padding: "6px 12px",
    background: `${color}18`,
    borderRadius: 10,
    width: "fit-content",
  }),
  themeEmoji: {
    fontSize: 22,
  },
  themeLabel: (color) => ({
    fontSize: 13,
    fontWeight: 700,
    color: color,
  }),
  storyText: {
    fontSize: 18,
    lineHeight: 1.7,
    color: "#1e293b",
    marginBottom: 16,
    direction: "rtl",
  },
  questionText: {
    fontSize: 20,
    fontWeight: 800,
    color: "#0f172a",
    lineHeight: 1.5,
    direction: "rtl",
  },
  inputRow: {
    display: "flex",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
    maxWidth: 500,
    margin: "0 auto 16px",
  },
  numberInput: {
    width: 140,
    padding: "14px 16px",
    fontSize: 24,
    fontWeight: 700,
    textAlign: "center",
    borderRadius: 14,
    border: "2px solid rgba(255,255,255,0.2)",
    background: "rgba(255,255,255,0.1)",
    color: "#e2e8f0",
    outline: "none",
    direction: "ltr",
  },
  submitBtn: {
    padding: "14px 32px",
    fontSize: 18,
    fontWeight: 700,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
  },
  submitBtnDisabled: {
    padding: "14px 32px",
    fontSize: 18,
    fontWeight: 700,
    borderRadius: 14,
    border: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#64748b",
    cursor: "not-allowed",
  },
  skipBtn: {
    display: "block",
    margin: "0 auto",
    padding: "10px 24px",
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.15)",
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
  },
  feedbackCard: {
    maxWidth: 500,
    margin: "0 auto 16px",
    borderRadius: 16,
    padding: "16px 20px",
    textAlign: "center",
  },
  feedbackCorrect: {
    background: "rgba(74,222,128,0.15)",
    border: "2px solid #4ade80",
  },
  feedbackWrong: {
    background: "rgba(248,113,113,0.15)",
    border: "2px solid #f87171",
  },
  feedbackTitle: (correct) => ({
    fontSize: 22,
    fontWeight: 800,
    color: correct ? "#4ade80" : "#f87171",
    marginBottom: 8,
  }),
  feedbackExplanation: {
    fontSize: 16,
    color: "#cbd5e1",
    lineHeight: 1.6,
    direction: "rtl",
  },
  continueBtn: {
    display: "block",
    margin: "12px auto 0",
    padding: "12px 40px",
    fontSize: 17,
    fontWeight: 700,
    borderRadius: 14,
    border: "none",
    background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(139,92,246,0.3)",
  },
  // Result phase
  resultCard: {
    maxWidth: 420,
    margin: "40px auto 0",
    background: "rgba(255,255,255,0.06)",
    borderRadius: 24,
    padding: "32px 24px",
    textAlign: "center",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  resultEmoji: {
    fontSize: 56,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: 800,
    color: "#e2e8f0",
    margin: "8px 0",
  },
  resultScore: (passed) => ({
    fontSize: 48,
    fontWeight: 900,
    color: passed ? "#4ade80" : "#f87171",
    margin: "12px 0",
  }),
  resultStars: {
    fontSize: 32,
    letterSpacing: 4,
    marginBottom: 12,
  },
  resultSparks: {
    fontSize: 18,
    fontWeight: 700,
    color: "#fbbf24",
    marginBottom: 16,
  },
  resultBtnGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 20,
  },
  resultBtn: (bg) => ({
    padding: "14px 24px",
    fontSize: 17,
    fontWeight: 700,
    borderRadius: 14,
    border: "none",
    background: bg,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  }),
};

export function MarketGame({ settings, gameProgress, saveGameProgress, playSound, setScreen, addSparks, isAdmin, sparks = 0 }) {
  const [phase, setPhase] = useState("levelSelect");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [qIdx, setQIdx] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [answers, setAnswers] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastCorrect, setLastCorrect] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [sparksFlash, setSparksFlash] = useState(false);
  const [sessionSparks, setSessionSparks] = useState(0);
  const inputRef = useRef(null);

  const marketProgress = gameProgress.market || {};

  const isLevelUnlocked = (levelId) => {
    if (isAdmin) return true;
    if (levelId === "1") return true;
    const prevId = String(Number(levelId) - 1);
    return (marketProgress[prevId]?.score || 0) >= 5;
  };

  const startLevel = (levelId) => {
    const qs = [...MARKET_QUESTIONS[Number(levelId)]].sort(() => Math.random() - 0.5);
    setQuestions(qs);
    setSelectedLevel(levelId);
    setQIdx(0);
    setInputValue("");
    setAnswers([]);
    setShowFeedback(false);
    setLastCorrect(false);
    setSessionSparks(0);
    setPhase("playing");
  };

  const handleSubmit = () => {
    if (!inputValue.trim()) return;
    const q = questions[qIdx];
    const userAnswer = Number(inputValue.trim());
    const correct = userAnswer === q.answer;

    setLastCorrect(correct);
    setShowFeedback(true);
    setAnswers(prev => [...prev, { correct, userAnswer }]);

    if (correct) {
      playSound("correct");
      addSparks(SPARKS_PER_CORRECT);
      setSessionSparks(prev => prev + SPARKS_PER_CORRECT);
      setSparksFlash(true);
      setTimeout(() => setSparksFlash(false), 600);
    } else {
      playSound("wrong");
    }
  };

  const handleSkip = () => {
    setLastCorrect(false);
    setShowFeedback(true);
    setAnswers(prev => [...prev, { correct: false, userAnswer: null }]);
    playSound("wrong");
  };

  const handleContinue = () => {
    if (qIdx < TOTAL_QUESTIONS - 1) {
      setQIdx(prev => prev + 1);
      setInputValue("");
      setShowFeedback(false);
      setLastCorrect(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      finishLevel();
    }
  };

  const finishLevel = () => {
    const score = answers.length > 0 ? answers.filter(a => a.correct).length : 0;
    const stars = getStars(score);
    const passed = score >= STAR_THRESHOLDS[1];
    const levelConfig = LEVELS.find(l => l.id === selectedLevel);

    // Calculate sparks
    let earned = 0;
    if (passed && levelConfig) {
      earned = levelConfig.sparksPass;
      if (score === TOTAL_QUESTIONS) earned += levelConfig.sparksBonus;
      addSparks(earned);
    }

    if (passed) {
      playSound("complete");
    }

    // Save progress (keep best)
    const existing = marketProgress[selectedLevel] || {};
    const newEntry = {
      score: Math.max(existing.score || 0, score),
      stars: Math.max(existing.stars || 0, stars),
      completed: true,
    };
    saveGameProgress({
      ...gameProgress,
      market: { ...marketProgress, [selectedLevel]: newEntry },
    });

    setPhase("result");
  };

  const currentScore = answers.filter(a => a.correct).length;

  // ─── RENDER: Level Select ───
  if (phase === "levelSelect") {
    const nextUnlock = getNextUnlock(sparks);
    const prevUnlock = nextUnlock
      ? [...GAME_UNLOCKS].sort((a,b) => a.sparksNeeded - b.sparksNeeded)
          .filter(g => g.sparksNeeded <= sparks).slice(-1)[0]
      : null;
    const progressFrom = prevUnlock?.sparksNeeded || 0;
    const progressPct = nextUnlock
      ? Math.min(100, Math.round(((sparks - progressFrom) / (nextUnlock.sparksNeeded - progressFrom)) * 100))
      : 100;

    return (
      <div style={MS.container}>
        <div style={MS.header}>
          <button style={MS.backBtn} onClick={() => setScreen("practice-games")}>
            → חזרה
          </button>
          <h2 style={MS.title}>🏪 שוק הקלפים</h2>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#fbbf24" }}>⚡ {sparks}</div>
        </div>

        {/* Next unlock progress bar */}
        {nextUnlock && (
          <div style={{ maxWidth: 400, margin: "0 auto 20px", background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: "12px 16px", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: "#94a3b8" }}>עוד {nextUnlock.sparksNeeded - sparks} ⚡ לפתיחת:</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0" }}>{nextUnlock.icon} {nextUnlock.nameHe}</span>
            </div>
            <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #f59e0b, #e67e22)", borderRadius: 4, transition: "width 0.5s" }} />
            </div>
            <div style={{ textAlign: "left", fontSize: 11, color: "#64748b", marginTop: 4 }}>{progressPct}%</div>
          </div>
        )}

        <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 15, marginBottom: 24 }}>
          ענה נכון וצבור ⚡ ניצוצות לפתיחת משחקים!
        </p>

        <div style={MS.levelGrid}>
          {LEVELS.map((level) => {
            const unlocked = isLevelUnlocked(level.id);
            const savedStars = marketProgress[level.id]?.stars || 0;

            return (
              <div
                key={level.id}
                style={MS.levelCard(level.color, level.borderColor, !unlocked)}
                onClick={() => unlocked && startLevel(level.id)}
                onMouseEnter={(e) => { if (unlocked) e.currentTarget.style.transform = "scale(1.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <div style={MS.levelEmoji}>{unlocked ? level.emoji : "🔒"}</div>
                <div style={MS.levelInfo}>
                  <p style={MS.levelName}>{level.name}</p>
                  {unlocked && (
                    <div style={MS.levelStars}>{getStarsDisplay(savedStars)}</div>
                  )}
                  {!unlocked && (
                    <p style={MS.lockText}>יש לעבור את השלב הקודם עם 5 תשובות נכונות</p>
                  )}
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
    const q = questions[qIdx];
    const themeColor = THEME_COLORS[q.theme] || "#94a3b8";
    const themeLabel = THEME_LABELS[q.theme] || "";

    return (
      <div style={MS.container}>
        {/* Header */}
        <div style={MS.header}>
          <button style={MS.backBtn} onClick={() => setPhase("levelSelect")}>✕</button>
          <span style={{ fontSize: 14, color: "#94a3b8" }}>
            {LEVELS.find(l => l.id === selectedLevel)?.name}
          </span>
          <span style={{
            fontSize: 16, fontWeight: 800,
            color: sparksFlash ? "#fde68a" : "#fbbf24",
            transition: "color 0.2s, transform 0.2s",
            transform: sparksFlash ? "scale(1.3)" : "scale(1)",
            display: "inline-block",
          }}>
            ⚡ {sparks}{sessionSparks > 0 && <span style={{ fontSize: 12, color: "#4ade80", marginRight: 4 }}> +{sessionSparks}</span>}
          </span>
        </div>

        {/* Progress dots */}
        <div style={MS.progressBar}>
          {questions.map((_, i) => (
            i === qIdx
              ? <div key={i} style={MS.progressDotCurrent} />
              : <div key={i} style={MS.progressDot(i < answers.length, answers[i]?.correct)} />
          ))}
        </div>

        {/* Question counter */}
        <div style={MS.questionCounter}>
          שאלה {qIdx + 1} מתוך {TOTAL_QUESTIONS}
        </div>

        {/* Story card */}
        <div style={MS.storyCard}>
          <div style={MS.themeHeader(themeColor)}>
            <span style={MS.themeEmoji}>{q.emoji}</span>
            <span style={MS.themeLabel(themeColor)}>{themeLabel}</span>
          </div>
          <p style={MS.storyText}>{q.story}</p>
          <p style={MS.questionText}>{q.question}</p>
        </div>

        {/* Input + submit OR feedback */}
        {!showFeedback ? (
          <>
            <div style={MS.inputRow}>
              <input
                ref={inputRef}
                type="number"
                inputMode="numeric"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                placeholder="?"
                style={MS.numberInput}
                autoFocus
              />
              <button
                style={inputValue.trim() ? MS.submitBtn : MS.submitBtnDisabled}
                onClick={handleSubmit}
                disabled={!inputValue.trim()}
              >
                בדוק
              </button>
            </div>
            <button style={MS.skipBtn} onClick={handleSkip}>
              דלג →
            </button>
          </>
        ) : (
          <>
            <div style={{
              ...MS.feedbackCard,
              ...(lastCorrect ? MS.feedbackCorrect : MS.feedbackWrong),
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <span style={MS.feedbackTitle(lastCorrect)}>
                  {lastCorrect ? "🎉 נכון!" : "❌ לא נכון"}
                </span>
                {lastCorrect && (
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#fbbf24", animation: "none" }}>
                    +{SPARKS_PER_CORRECT} ⚡
                  </span>
                )}
              </div>
              {!lastCorrect && (
                <div style={{ fontSize: 18, fontWeight: 700, color: "#fbbf24", marginBottom: 8 }}>
                  התשובה הנכונה: {q.answer}
                </div>
              )}
              <div style={MS.feedbackExplanation}>
                {q.explanation}
              </div>
            </div>
            <button style={MS.continueBtn} onClick={handleContinue}>
              {qIdx < TOTAL_QUESTIONS - 1 ? "המשך →" : "סיום"}
            </button>
          </>
        )}
      </div>
    );
  }

  // ─── RENDER: Result ───
  if (phase === "result") {
    const score = answers.filter(a => a.correct).length;
    const stars = getStars(score);
    const passed = score >= STAR_THRESHOLDS[1];
    const levelConfig = LEVELS.find(l => l.id === selectedLevel);
    let bonusSparks = 0;
    if (passed && levelConfig) {
      bonusSparks = levelConfig.sparksPass;
      if (score === TOTAL_QUESTIONS) bonusSparks += levelConfig.sparksBonus;
    }
    const totalEarned = sessionSparks + bonusSparks;
    const nextUnlock = getNextUnlock(sparks);
    const prevUnlock = nextUnlock
      ? [...GAME_UNLOCKS].sort((a,b) => a.sparksNeeded - b.sparksNeeded)
          .filter(g => g.sparksNeeded <= sparks).slice(-1)[0]
      : null;
    const progressFrom = prevUnlock?.sparksNeeded || 0;
    const progressPct = nextUnlock
      ? Math.min(100, Math.round(((sparks - progressFrom) / (nextUnlock.sparksNeeded - progressFrom)) * 100))
      : 100;

    return (
      <div style={MS.container}>
        <div style={MS.resultCard}>
          <div style={MS.resultEmoji}>{passed ? "🎉" : "😔"}</div>
          <div style={MS.resultTitle}>
            {passed ? "כל הכבוד!" : "לא נורא, נסו שוב!"}
          </div>

          <div style={MS.resultScore(passed)}>
            {score}/{TOTAL_QUESTIONS}
          </div>

          {stars > 0 && (
            <div style={MS.resultStars}>{getStarsDisplay(stars)}</div>
          )}

          {/* Sparks breakdown */}
          <div style={{ background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 12, padding: "12px 16px", marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 6 }}>ניצוצות שנצברו:</div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#fbbf24", marginBottom: 4 }}>
              <span>תשובות נכונות ({score} × {SPARKS_PER_CORRECT})</span>
              <span>+{sessionSparks} ⚡</span>
            </div>
            {bonusSparks > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#fbbf24", marginBottom: 4 }}>
                <span>בונוס השלב</span>
                <span>+{bonusSparks} ⚡</span>
              </div>
            )}
            <div style={{ borderTop: "1px solid rgba(251,191,36,0.2)", paddingTop: 6, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800, color: "#fde68a" }}>
              <span>סה"כ הפגישה הזו</span>
              <span>+{totalEarned} ⚡</span>
            </div>
          </div>

          {/* Next unlock progress */}
          {nextUnlock && (
            <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 12, padding: "10px 14px", marginBottom: 4 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: "#94a3b8" }}>עוד {nextUnlock.sparksNeeded - sparks} ⚡</span>
                <span style={{ color: "#e2e8f0", fontWeight: 700 }}>{nextUnlock.icon} {nextUnlock.nameHe}</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: "linear-gradient(90deg, #f59e0b, #e67e22)", borderRadius: 3 }} />
              </div>
            </div>
          )}
          {!nextUnlock && (
            <div style={{ fontSize: 15, color: "#4ade80", fontWeight: 700, marginBottom: 8 }}>🏆 פתחת את כל המשחקים!</div>
          )}

          <div style={MS.resultBtnGroup}>
            <button
              style={MS.resultBtn("linear-gradient(135deg, #3b82f6, #2563eb)")}
              onClick={() => startLevel(selectedLevel)}
            >
              🔄 שחק שוב
            </button>
            <button
              style={MS.resultBtn("linear-gradient(135deg, #8b5cf6, #7c3aed)")}
              onClick={() => setPhase("levelSelect")}
            >
              ← חזרה לבחירת שלב
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
