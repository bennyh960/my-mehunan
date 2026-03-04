function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickOp(operations) {
  return operations[Math.floor(Math.random() * operations.length)];
}

export function generateQuestion(levelConfig) {
  const { operations, range, level } = levelConfig;
  const [min, max] = range;

  // Level 8 for grade 4 = order of operations
  if (level === 8 && operations.includes("×") && operations.includes("+")) {
    return generateOrderOfOps(levelConfig);
  }

  const op = pickOp(operations);

  let a, b, answer, expression;

  switch (op) {
    case "+": {
      a = randInt(min, max);
      b = randInt(min, max);
      answer = a + b;
      expression = `${a} + ${b}`;
      break;
    }
    case "-": {
      a = randInt(min, max);
      b = randInt(min, Math.min(a, max)); // ensure non-negative
      answer = a - b;
      expression = `${a} - ${b}`;
      break;
    }
    case "×": {
      // Keep factors reasonable
      const mMax = Math.min(max, 30);
      a = randInt(Math.max(min, 2), mMax);
      b = randInt(Math.max(min, 2), Math.min(mMax, 12));
      answer = a * b;
      expression = `${a} × ${b}`;
      break;
    }
    case "÷": {
      // Generate clean division: pick b and answer, compute a = b * answer
      b = randInt(Math.max(min, 2), Math.min(max, 12));
      const quotient = randInt(Math.max(min, 1), Math.min(max, 12));
      a = b * quotient;
      answer = quotient;
      expression = `${a} ÷ ${b}`;
      break;
    }
    default: {
      a = randInt(min, max);
      b = randInt(min, max);
      answer = a + b;
      expression = `${a} + ${b}`;
    }
  }

  return { expression, answer, displayParts: [expression, "= ?"] };
}

function generateOrderOfOps(levelConfig) {
  const [min, max] = levelConfig.range;
  // e.g. a + b × c  or  a × b - c
  const a = randInt(min, max);
  const b = randInt(Math.max(min, 2), Math.min(max, 10));
  const c = randInt(Math.max(min, 2), Math.min(max, 10));

  const templates = [
    { expr: `${a} + ${b} × ${c}`, ans: a + b * c },
    { expr: `${b} × ${c} + ${a}`, ans: b * c + a },
    { expr: `${a} - ${b} × ${c}`, ans: a - b * c },
    { expr: `${b} × ${c} - ${a}`, ans: b * c - a },
  ];

  // Filter out negative answers
  const valid = templates.filter(t => t.ans >= 0);
  const pick = valid[Math.floor(Math.random() * valid.length)] || templates[0];

  // Fallback if still negative
  if (pick.ans < 0) {
    const safe = { expr: `${a} + ${b} × ${c}`, ans: a + b * c };
    return { expression: safe.expr, answer: safe.ans, displayParts: [safe.expr, "= ?"] };
  }

  return { expression: pick.expr, answer: pick.ans, displayParts: [pick.expr, "= ?"] };
}

export function generateDistractors(answer, count = 3) {
  const distractors = new Set();
  const absAns = Math.abs(answer);
  const spread = Math.max(5, Math.ceil(absAns * 0.3));

  let attempts = 0;
  while (distractors.size < count && attempts < 50) {
    attempts++;
    let d;
    const r = Math.random();
    if (r < 0.4) {
      // Close to answer
      d = answer + randInt(1, Math.max(3, Math.ceil(spread / 2))) * (Math.random() > 0.5 ? 1 : -1);
    } else if (r < 0.7) {
      // Off by common mistake amounts (±1, ±10, digit swap)
      const offsets = [1, -1, 2, -2, 10, -10];
      d = answer + offsets[Math.floor(Math.random() * offsets.length)];
    } else {
      // Random in range
      d = answer + randInt(-spread, spread);
    }

    if (d !== answer && d >= 0 && !distractors.has(d)) {
      distractors.add(d);
    }
  }

  // Fill if not enough
  let fill = 1;
  while (distractors.size < count) {
    const d = answer + fill;
    if (d !== answer && d >= 0 && !distractors.has(d)) distractors.add(d);
    fill = fill > 0 ? -fill : -fill + 1;
  }

  return [...distractors];
}

export function generateRound(levelConfig) {
  const questions = [];
  const seen = new Set();
  let attempts = 0;

  while (questions.length < levelConfig.questionsPerRound && attempts < 100) {
    attempts++;
    const q = generateQuestion(levelConfig);
    if (!seen.has(q.expression)) {
      seen.add(q.expression);

      // Generate choices
      const distractors = generateDistractors(q.answer);
      const choices = [q.answer, ...distractors].sort(() => Math.random() - 0.5);
      q.choices = choices;
      q.correctIndex = choices.indexOf(q.answer);

      questions.push(q);
    }
  }

  return questions;
}
