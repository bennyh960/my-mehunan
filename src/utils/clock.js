// Clock question generator for time practice game

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = arr => arr[Math.floor(Math.random() * arr.length)];

const pad = n => String(n).padStart(2, '0');
const fmt24 = (h, m) => `${pad(h)}:${pad(m)}`;

// Period labels for Hebrew time description
const getPeriod = (h) => {
  if (h >= 0 && h < 5) return "בלילה";
  if (h >= 5 && h < 12) return "בבוקר";
  if (h >= 12 && h < 16) return "בצהריים";
  if (h >= 16 && h < 20) return "בערב";
  return "בלילה"; // 20-23
};

const h12 = (h) => {
  if (h === 0) return 12;
  if (h > 12) return h - 12;
  return h;
};

// Format time as descriptive Hebrew: "5 בבוקר" or "3 וחצי בצהריים"
const fmtHebrewDesc = (h, m) => {
  const hour = h12(h);
  const period = getPeriod(h);
  if (m === 0) return `${hour}:00 ${period}`;
  if (m === 30) return `${hour} וחצי ${period}`;
  if (m === 15) return `${hour} ורבע ${period}`;
  if (m === 45) {
    const nextH24 = (h + 1) % 24;
    const nextHour = h12(nextH24);
    const nextPeriod = getPeriod(nextH24);
    return `רבע ל-${nextHour} ${nextPeriod}`;
  }
  return `${hour}:${pad(m)} ${period}`;
};

// Shuffle array
const shuffle = arr => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// Generate wrong choices for time answers (HH:MM format)
const timeChoices = (correctH, correctM, count = 3) => {
  const correct = fmt24(correctH, correctM);
  const wrong = new Set();
  let attempts = 0;
  while (wrong.size < count && attempts < 50) {
    attempts++;
    const dh = pick([-2, -1, 0, 1, 2]);
    const dm = pick([-30, -15, -10, -5, 0, 5, 10, 15, 30]);
    if (dh === 0 && dm === 0) continue;
    let h = (correctH + dh + 24) % 24;
    let m = (correctM + dm + 60) % 60;
    const w = fmt24(h, m);
    if (w !== correct) wrong.add(w);
  }
  return [...wrong].slice(0, count);
};

// Generate wrong choices for duration answers (minutes or "X שעות ו-Y דקות")
const durationChoices = (correctMins, count = 3) => {
  const wrong = new Set();
  let attempts = 0;
  while (wrong.size < count && attempts < 50) {
    attempts++;
    const d = pick([-60, -30, -20, -15, -10, -5, 5, 10, 15, 20, 30, 60]);
    const w = correctMins + d;
    if (w > 0 && w !== correctMins) wrong.add(w);
  }
  return [...wrong].slice(0, count);
};

const formatDuration = (mins) => {
  if (mins < 60) return `${mins} דקות`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return h === 1 ? `שעה` : `${h} שעות`;
  if (h === 1) return `שעה ו-${m} דקות`;
  return `${h} שעות ו-${m} דקות`;
};

const formatDurationShort = (mins) => {
  if (mins < 60) return `${mins} דק׳`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} שע׳`;
  return `${h}:${pad(m)}`;
};

// Names and activities for word problems
const KIDS = ["דני", "נועה", "יובל", "מיכל", "אורי", "שירה", "עידו", "רוני", "תמר", "גיל"];
const SHOWS = ["יובל המבולבל", "כוכב נולד", "רוני ורפי", "הופ ילדות ישראלית"];
const ACTIVITIES = [
  { name: "שיעור חוגים", icon: "🎨" },
  { name: "אימון כדורגל", icon: "⚽" },
  { name: "שיעור פסנתר", icon: "🎹" },
  { name: "שיעורי בית", icon: "📚" },
  { name: "משחק בפארק", icon: "🌳" },
  { name: "שיעור שחייה", icon: "🏊" },
];

// Generate descriptive Hebrew choices for clock-reading levels
// Returns { correct, confusing, unrelated1, unrelated2 }
const makeClockChoices = (h, m) => {
  const correct = fmtHebrewDesc(h, m);

  // Confusing: same hour number, opposite period (5 afternoon → 5 morning)
  const oppositeH = h < 12 ? h + 12 : h - 12;
  const confusing = fmtHebrewDesc(oppositeH, m);

  // 2 unrelated: random different hours in random periods
  const unrelated = new Set();
  let attempts = 0;
  while (unrelated.size < 2 && attempts < 30) {
    attempts++;
    const rh = rand(0, 23);
    const rm = m; // keep same minute style for consistency
    const desc = fmtHebrewDesc(rh, rm);
    if (desc !== correct && desc !== confusing) unrelated.add(desc);
  }

  return shuffle([correct, confusing, ...unrelated]);
};

// ─── QUESTION GENERATORS BY TYPE ───

// Level 1: What time does the clock show? (full hours)
function genReadFullHour() {
  const h = rand(0, 23);
  const m = 0;
  const correct = fmtHebrewDesc(h, m);
  const allChoices = makeClockChoices(h, m);
  return {
    question: `🕐 השעון מראה ${fmt24(h, m)}. מה השעה?`,
    choices: allChoices,
    answer: correct,
    answerIdx: allChoices.indexOf(correct),
    clockDisplay: { h, m },
  };
}

// Level 2: What time? (half hours)
function genReadHalfHour() {
  const h = rand(0, 23);
  const m = pick([0, 30]);
  const correct = fmtHebrewDesc(h, m);
  const allChoices = makeClockChoices(h, m);
  return {
    question: `🕐 השעון מראה ${fmt24(h, m)}. מה השעה?`,
    choices: allChoices,
    answer: correct,
    answerIdx: allChoices.indexOf(correct),
    clockDisplay: { h, m },
  };
}

// Level 3: What time? (quarter hours)
function genReadQuarter() {
  const h = rand(0, 23);
  const m = pick([0, 15, 30, 45]);
  const correct = fmtHebrewDesc(h, m);
  const allChoices = makeClockChoices(h, m);
  return {
    question: `🕐 השעון מראה ${fmt24(h, m)}. מה השעה?`,
    choices: allChoices,
    answer: correct,
    answerIdx: allChoices.indexOf(correct),
    clockDisplay: { h, m },
  };
}

// Level 4: Simple time difference (same period, up to 3 hours)
function genSimpleDiff() {
  const h1 = rand(8, 19);
  const m1 = pick([0, 15, 30, 45]);
  const diffMins = pick([15, 30, 45, 60, 90, 120]);
  const totalMins = h1 * 60 + m1 + diffMins;
  const h2 = Math.floor(totalMins / 60);
  const m2 = totalMins % 60;

  if (h2 > 23) return genSimpleDiff();

  const kid = pick(KIDS);
  const correct = formatDuration(diffMins);
  const wrongMins = durationChoices(diffMins);
  const wrongs = wrongMins.map(formatDuration);
  const allChoices = shuffle([correct, ...wrongs]);

  return {
    question: `${kid} יצא מהבית בשעה ${fmt24(h1, m1)} והגיע לבית הספר בשעה ${fmt24(h2, m2)}. כמה זמן לקח לו?`,
    choices: allChoices,
    answer: correct,
    answerIdx: allChoices.indexOf(correct),
  };
}

// Level 5: How much time until...? (bedtime, event, etc.)
function genTimeUntil() {
  const scenarios = [
    () => {
      const nowH = rand(18, 20);
      const nowM = pick([0, 15, 30, 45]);
      const bedH = 21;
      const bedM = 0;
      const diff = (bedH * 60 + bedM) - (nowH * 60 + nowM);
      if (diff <= 0) return null;
      return { q: `השעה עכשיו ${fmt24(nowH, nowM)} ואני הולך לישון ב-${fmt24(bedH, bedM)}. עוד כמה זמן נשאר לי?`, diff };
    },
    () => {
      const nowH = rand(7, 9);
      const nowM = pick([0, 10, 15, 20, 30]);
      const startH = 10;
      const startM = 0;
      const diff = (startH * 60 + startM) - (nowH * 60 + nowM);
      if (diff <= 0) return null;
      return { q: `השעה ${fmt24(nowH, nowM)}. בית הספר מתחיל ב-${fmt24(startH, startM)}. עוד כמה זמן?`, diff };
    },
    () => {
      const nowH = rand(14, 17);
      const nowM = pick([0, 15, 30, 45]);
      const act = pick(ACTIVITIES);
      const actH = nowH + rand(1, 2);
      const actM = pick([0, 30]);
      const diff = (actH * 60 + actM) - (nowH * 60 + nowM);
      if (diff <= 0 || actH > 20) return null;
      return { q: `השעה ${fmt24(nowH, nowM)}. ${act.icon} ${act.name} מתחיל ב-${fmt24(actH, actM)}. עוד כמה זמן?`, diff };
    },
  ];

  let result = null;
  let attempts = 0;
  while (!result && attempts < 10) {
    result = pick(scenarios)();
    attempts++;
  }
  if (!result) return genSimpleDiff();

  const correct = formatDuration(result.diff);
  const wrongMins = durationChoices(result.diff);
  const wrongs = wrongMins.map(formatDuration);
  const allChoices = shuffle([correct, ...wrongs]);

  return {
    question: result.q,
    choices: allChoices,
    answer: correct,
    answerIdx: allChoices.indexOf(correct),
  };
}

// Level 6: Schedule word problems
function genScheduleProblem() {
  const show = pick(SHOWS);
  const startH = pick([10, 14, 16, 18]);
  const durationMins = pick([60, 90, 120]);
  const endH = startH + Math.floor(durationMins / 60);
  const endM = durationMins % 60;

  const type = rand(1, 2);
  if (type === 1) {
    // When does it end?
    const correct = fmt24(endH, endM);
    const wrongs = timeChoices(endH, endM);
    const allChoices = shuffle([correct, ...wrongs]);
    return {
      question: `📺 ההופעה של ${show} מתחילה ב-${fmt24(startH, 0)} ונמשכת ${formatDuration(durationMins)}. מתי היא נגמרת?`,
      choices: allChoices,
      answer: correct,
      answerIdx: allChoices.indexOf(correct),
    };
  } else {
    // How long is it?
    const correct = formatDuration(durationMins);
    const wrongMins = durationChoices(durationMins);
    const wrongs = wrongMins.map(formatDuration);
    const allChoices = shuffle([correct, ...wrongs]);
    return {
      question: `📺 ההופעה של ${show} מתחילה ב-${fmt24(startH, 0)} ונגמרת ב-${fmt24(endH, endM)}. כמה זמן היא נמשכת?`,
      choices: allChoices,
      answer: correct,
      answerIdx: allChoices.indexOf(correct),
    };
  }
}

// Level 7: Weekly schedule problem (like Yuval HaMebulbal)
function genWeeklySchedule() {
  const show = pick(SHOWS);
  const timesPerDay = rand(1, 2);
  const hoursPerSession = pick([1, 1.5, 2]);
  const daysPerWeek = pick([3, 4, 5]);
  const dayNames = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳"];
  const days = dayNames.slice(0, daysPerWeek).join("-");

  const totalHours = timesPerDay * hoursPerSession * daysPerWeek;
  const totalMins = totalHours * 60;

  let questionText;
  if (timesPerDay === 1) {
    const sessH = rand(10, 18);
    const durMins = hoursPerSession * 60;
    const endTotal = sessH * 60 + durMins;
    const endH = Math.floor(endTotal / 60);
    const endM = endTotal % 60;
    questionText = `📺 ${show} מופיע כל יום ${days}, מ-${fmt24(sessH, 0)} עד ${fmt24(endH, endM)}. כמה שעות בשבוע הוא מופיע?`;
  } else {
    const sess1H = rand(9, 11);
    const dur1 = hoursPerSession * 60;
    const end1Total = sess1H * 60 + dur1;
    const end1H = Math.floor(end1Total / 60);
    const end1M = end1Total % 60;
    const sess2H = rand(16, 19);
    const dur2 = hoursPerSession * 60;
    const end2Total = sess2H * 60 + dur2;
    const end2H = Math.floor(end2Total / 60);
    const end2M = end2Total % 60;
    if (end2H > 23) return genWeeklySchedule();
    questionText = `📺 ${show} מופיע פעמיים ביום: מ-${fmt24(sess1H, 0)} עד ${fmt24(end1H, end1M)} ומ-${fmt24(sess2H, 0)} עד ${fmt24(end2H, end2M)}, בימים ${days}. כמה שעות בשבוע?`;
  }

  const correct = formatDuration(totalMins);
  const wrongMins = durationChoices(totalMins);
  const wrongs = wrongMins.map(formatDuration);
  const allChoices = shuffle([correct, ...wrongs]);

  return {
    question: questionText,
    choices: allChoices,
    answer: correct,
    answerIdx: allChoices.indexOf(correct),
  };
}

// Level 8: 24-hour clock conversions
function gen24hConversion() {
  const h24 = rand(13, 23);
  const m = pick([0, 15, 30, 45]);
  const h12 = h24 - 12;
  const period = "אחה״צ";

  const type = rand(1, 2);
  if (type === 1) {
    // 24h to description
    const correct = `${h12}:${pad(m)} ${period}`;
    const wrongs = [
      `${h12 + 1}:${pad(m)} ${period}`,
      `${h12 - 1}:${pad(m)} ${period}`,
      `${h12}:${pad((m + 30) % 60)} ${period}`,
    ].filter(w => w !== correct);
    const allChoices = shuffle([correct, ...wrongs.slice(0, 3)]);
    return {
      question: `השעה ${fmt24(h24, m)} בשעון דיגיטלי. מה השעה?`,
      choices: allChoices,
      answer: correct,
      answerIdx: allChoices.indexOf(correct),
    };
  } else {
    // What time in 24h format?
    const correct = fmt24(h24, m);
    const wrongs = timeChoices(h24, m);
    const allChoices = shuffle([correct, ...wrongs]);
    return {
      question: `השעה ${h12}:${pad(m)} בערב. מה השעה בשעון דיגיטלי (24 שעות)?`,
      choices: allChoices,
      answer: correct,
      answerIdx: allChoices.indexOf(correct),
    };
  }
}

// Level 9: What time will it be after X hours/minutes?
function genTimeAfter() {
  const h = rand(8, 20);
  const m = pick([0, 10, 15, 20, 30, 45]);
  const addH = rand(0, 3);
  const addM = pick([0, 15, 30, 45]);
  if (addH === 0 && addM === 0) return genTimeAfter();

  const totalM = h * 60 + m + addH * 60 + addM;
  const resultH = Math.floor(totalM / 60) % 24;
  const resultM = totalM % 60;

  const addStr = addH > 0 && addM > 0 ? `${addH} שעות ו-${addM} דקות`
    : addH > 0 ? (addH === 1 ? `שעה` : `${addH} שעות`)
    : `${addM} דקות`;

  const correct = fmt24(resultH, resultM);
  const wrongs = timeChoices(resultH, resultM);
  const allChoices = shuffle([correct, ...wrongs]);

  return {
    question: `השעה ${fmt24(h, m)}. מה תהיה השעה עוד ${addStr}?`,
    choices: allChoices,
    answer: correct,
    answerIdx: allChoices.indexOf(correct),
  };
}

// Level 10: Mixed complex - multi-step time problems
function genComplexProblem() {
  const type = rand(1, 3);

  if (type === 1) {
    // Travel with stops
    const kid = pick(KIDS);
    const startH = rand(8, 14);
    const startM = pick([0, 15, 30]);
    const leg1 = pick([20, 30, 45]);
    const stopDur = pick([10, 15, 30]);
    const leg2 = pick([15, 20, 30, 45]);
    const total = leg1 + stopDur + leg2;
    const endTotal = startH * 60 + startM + total;
    const endH = Math.floor(endTotal / 60) % 24;
    const endM = endTotal % 60;

    const correct = fmt24(endH, endM);
    const wrongs = timeChoices(endH, endM);
    const allChoices = shuffle([correct, ...wrongs]);

    return {
      question: `${kid} יצא מהבית ב-${fmt24(startH, startM)}. הנסיעה לקחה ${leg1} דקות, עצר ל-${stopDur} דקות הפסקה, ואז נסע עוד ${leg2} דקות. מתי הגיע?`,
      choices: allChoices,
      answer: correct,
      answerIdx: allChoices.indexOf(correct),
    };
  }

  if (type === 2) {
    // Multiple activities in a day
    const kid = pick(KIDS);
    const wakeH = rand(6, 8);
    const act1Dur = pick([30, 45, 60]);
    const act2Dur = pick([60, 90, 120]);
    const act3Dur = pick([30, 45]);
    const total = act1Dur + act2Dur + act3Dur;
    const endTotal = wakeH * 60 + total;
    const endH = Math.floor(endTotal / 60) % 24;
    const endM = endTotal % 60;

    const correct = formatDuration(total);
    const wrongMins = durationChoices(total);
    const wrongs = wrongMins.map(formatDuration);
    const allChoices = shuffle([correct, ...wrongs]);

    return {
      question: `${kid} קם ב-${fmt24(wakeH, 0)}. הכין שיעורים ${formatDuration(act1Dur)}, הלך לחוג ${formatDuration(act2Dur)}, ואכל ארוחה ${formatDuration(act3Dur)}. כמה זמן עבר בסה״כ?`,
      choices: allChoices,
      answer: correct,
      answerIdx: allChoices.indexOf(correct),
    };
  }

  // type 3: Time before
  const eventH = rand(14, 20);
  const eventM = pick([0, 30]);
  const beforeMins = pick([30, 45, 60, 90]);
  const startTotal = eventH * 60 + eventM - beforeMins;
  const startH = Math.floor(startTotal / 60);
  const startM = startTotal % 60;

  if (startH < 0) return genComplexProblem();

  const kid = pick(KIDS);
  const correct = fmt24(startH, startM);
  const wrongs = timeChoices(startH, startM);
  const allChoices = shuffle([correct, ...wrongs]);

  return {
    question: `${kid} צריך להגיע למסיבה ב-${fmt24(eventH, eventM)}. ההכנה לוקחת ${formatDuration(beforeMins)}. מתי צריך להתחיל להתכונן?`,
    choices: allChoices,
    answer: correct,
    answerIdx: allChoices.indexOf(correct),
  };
}

// ─── LEVEL CONFIGS ───

const GENERATORS = {
  1: genReadFullHour,
  2: genReadHalfHour,
  3: genReadQuarter,
  4: genSimpleDiff,
  5: genTimeUntil,
  6: genScheduleProblem,
  7: genWeeklySchedule,
  8: gen24hConversion,
  9: genTimeAfter,
  10: genComplexProblem,
};

export function generateClockRound(levelNum, count = 10) {
  const gen = GENERATORS[levelNum] || genReadFullHour;
  const questions = [];
  for (let i = 0; i < count; i++) {
    const q = gen();
    questions.push(q);
  }
  return questions;
}

export const CLOCK_LEVELS = [
  { level: 1, nameHe: "קריאת שעות עגולות", icon: "🕐", questionsPerRound: 10, timePerQuestion: 15 },
  { level: 2, nameHe: "חצי שעות", icon: "🕧", questionsPerRound: 10, timePerQuestion: 15 },
  { level: 3, nameHe: "רבעי שעות", icon: "🕞", questionsPerRound: 10, timePerQuestion: 15 },
  { level: 4, nameHe: "כמה זמן עבר?", icon: "⏱️", questionsPerRound: 10, timePerQuestion: 20 },
  { level: 5, nameHe: "עוד כמה זמן נשאר?", icon: "⏳", questionsPerRound: 10, timePerQuestion: 20 },
  { level: 6, nameHe: "לוח זמנים", icon: "📺", questionsPerRound: 10, timePerQuestion: 25 },
  { level: 7, nameHe: "חישוב שבועי", icon: "📅", questionsPerRound: 10, timePerQuestion: 30 },
  { level: 8, nameHe: "שעון 24 שעות", icon: "🔢", questionsPerRound: 10, timePerQuestion: 20 },
  { level: 9, nameHe: "מה תהיה השעה?", icon: "🔮", questionsPerRound: 10, timePerQuestion: 20 },
  { level: 10, nameHe: "אתגר הזמן", icon: "🏆", questionsPerRound: 10, timePerQuestion: 30 },
];
