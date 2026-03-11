import { useState, useRef } from 'react';
import { SPARKS_REWARDS } from '../constants/ninjago';
import { Confetti } from '../components/ui/Confetti';
import { SparksPopup } from '../components/ui/SparksPopup';

// ─── Thresholds (8 questions per round) ───
const PASS_THRESHOLD = 6;
const STAR_THRESHOLDS = { 1: 6, 2: 7, 3: 8 };

// ─── Level themes ───
const LEVEL_THEMES = {
  2:  { emoji: "👟", color: "#6366f1", name: "נעליים — זוגות" },
  3:  { emoji: "🍀", color: "#22c55e", name: "תלתן — שלישיות" },
  4:  { emoji: "🐾", color: "#f97316", name: "טביעות — רביעיות" },
  5:  { emoji: "⭐", color: "#eab308", name: "כוכבים — חמישיות" },
  6:  { emoji: "🎲", color: "#e11d48", name: "קוביות — שישיות" },
  7:  { emoji: "🌈", color: "#8b5cf6", name: "קשתות — שביעיות" },
  8:  { emoji: "🐙", color: "#0891b2", name: "תמנונים — שמיניות" },
  9:  { emoji: "🕯️", color: "#ca8a04", name: "נרות — תשיעיות" },
  10: { emoji: "💰", color: "#15803d", name: "מטבעות — עשיריות" },
};

const getStarsDisplay = (stars) => "⭐".repeat(stars) + "☆".repeat(3 - stars);
const getStars = (score) => {
  if (score >= STAR_THRESHOLDS[3]) return 3;
  if (score >= STAR_THRESHOLDS[2]) return 2;
  if (score >= STAR_THRESHOLDS[1]) return 1;
  return 0;
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const generateWrongOptions = (answer, multiplier, factor) => {
  const candidates = new Set([
    answer + multiplier,
    answer - multiplier > 0 ? answer - multiplier : null,
    (factor + 1) * multiplier,
    factor > 1 ? (factor - 1) * multiplier : null,
    answer + factor,
    answer - factor > 0 ? answer - factor : null,
  ].filter(Boolean));
  candidates.delete(answer);
  const pool = shuffle([...candidates].filter(n => n > 0));
  const result = pool.slice(0, 3);
  let pad = 2;
  while (result.length < 3) { result.push(answer + multiplier * pad++); }
  return result;
};

const generateQuestions = (multiplier, count = 8) => {
  const factors = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, count);
  return factors.map((factor, i) => {
    const answer = factor * multiplier;
    const type = i < 3 ? "array" : i < 6 ? "groups" : "tableRow";
    const wrongs = generateWrongOptions(answer, multiplier, factor);
    const options = shuffle([answer, ...wrongs]);
    return { type, factor, multiplier, answer, options, correctIdx: options.indexOf(answer) };
  });
};

// ─── SVG: Dot array (rows × cols) ───
const ArrayDots = ({ rows, cols, color = "#6366f1" }) => {
  const maxW = 260;
  const dotSize = Math.min(22, Math.floor((maxW - (cols - 1) * 4) / cols));
  const gap = 4;
  const w = cols * dotSize + (cols - 1) * gap;
  const h = rows * dotSize + (rows - 1) * gap;
  const circles = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      circles.push(
        <circle key={`${r}-${c}`}
          cx={c * (dotSize + gap) + dotSize / 2}
          cy={r * (dotSize + gap) + dotSize / 2}
          r={dotSize / 2 - 1} fill={color} opacity={0.85}
        />
      );
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', margin: '0 auto' }}>
      {circles}
    </svg>
  );
};

// ─── Groups of emoji ───
const GroupsDisplay = ({ groups, itemsPerGroup, emoji, color }) => {
  const visible = Math.min(groups, 5);
  const cols = itemsPerGroup <= 4 ? itemsPerGroup : 3;
  const emojiSize = itemsPerGroup <= 4 ? 22 : itemsPerGroup <= 6 ? 18 : 14;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
      {Array.from({ length: visible }, (_, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 2,
            background: '#f8fafc', border: `2px solid ${color}`,
            borderRadius: 10, padding: '8px 10px', minWidth: 48,
          }}>
            {Array.from({ length: itemsPerGroup }, (_, j) => (
              <span key={j} style={{ fontSize: emojiSize, lineHeight: 1.3 }}>{emoji}</span>
            ))}
          </div>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>קבוצה {i + 1}</span>
        </div>
      ))}
      {groups > 5 && (
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: '#94a3b8' }}>
          +{groups - 5} עוד
        </div>
      )}
    </div>
  );
};

// ─── Scrollable table row with blank ───
const TableRowStrip = ({ multiplier, blankAt, color }) => (
  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', direction: 'ltr', padding: '4px 0' }}>
    <div style={{ display: 'flex', gap: 6, width: 'max-content', padding: '4px 8px' }}>
      {Array.from({ length: 10 }, (_, i) => {
        const factor = i + 1;
        const product = factor * multiplier;
        const isBlank = i === blankAt;
        return (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: 48, padding: '8px 4px', borderRadius: 10,
            background: isBlank ? '#fff' : '#f1f5f9',
            border: `2px solid ${isBlank ? color : '#cbd5e1'}`,
            boxShadow: isBlank ? `0 0 0 3px ${color}33` : 'none',
          }}>
            <span style={{ fontSize: 10, color: '#94a3b8' }}>{factor}×{multiplier}</span>
            <span style={{ fontSize: isBlank ? 22 : 14, fontWeight: isBlank ? 900 : 500, color: isBlank ? color : '#64748b', marginTop: 2 }}>
              {isBlank ? "?" : product}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Concept explanation per multiplier ───
const ConceptContent = ({ multiplier }) => {
  const theme = LEVEL_THEMES[multiplier];
  const c = theme.color;
  const heading = { fontSize: 20, fontWeight: 800, color: '#1e293b', marginBottom: 10 };
  const text = { fontSize: 15, color: '#334155', lineHeight: 1.8, marginBottom: 12 };
  const row = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' };

  const examples = [2, 3, 4, 5].map(f => ({ factor: f, product: f * multiplier }));

  return (
    <div>
      <div style={heading}>כפל ב-{multiplier} {theme.emoji}</div>
      <div style={text}>
        כשכופלים ב-<strong>{multiplier}</strong>, זה אומר {multiplier} קבוצות של אותו מספר!
        <br />
        <strong>{multiplier === 2 ? "כמו זוג נעליים — תמיד 2 יחד" :
          multiplier === 3 ? "כמו תלתן — 3 עלים בכל פרח" :
          multiplier === 4 ? "כמו חתול — 4 טביעות רגל" :
          multiplier === 5 ? "כמו יד — 5 אצבעות" :
          multiplier === 6 ? "כמו קובייה — 6 פאות" :
          multiplier === 7 ? "כמו קשת — 7 צבעים" :
          multiplier === 8 ? "כמו תמנון — 8 זרועות" :
          multiplier === 9 ? "כמו חנוכיה — 9 נרות" :
          "כמו ספרות — 10 עד 100"}</strong>
      </div>

      {/* Visual array: 2 × multiplier example */}
      <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 14, border: `2px solid ${c}33` }}>
        <div style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginBottom: 8 }}>
          2 × {multiplier} = {2 * multiplier}
        </div>
        <div style={{ ...row, marginBottom: 4 }}>
          <ArrayDots rows={2} cols={multiplier} color={c} />
        </div>
        <div style={{ textAlign: 'center', fontSize: 13, color: '#94a3b8' }}>
          2 שורות של {multiplier} נקודות
        </div>
      </div>

      {/* Groups example */}
      <div style={{ background: '#f8fafc', borderRadius: 14, padding: 16, marginBottom: 14, border: `2px solid ${c}33` }}>
        <div style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginBottom: 10 }}>
          3 × {multiplier} = {3 * multiplier} {theme.emoji}
        </div>
        <GroupsDisplay groups={3} itemsPerGroup={multiplier} emoji={theme.emoji} color={c} />
      </div>

      {/* Quick reference */}
      <div style={{ background: `${c}11`, borderRadius: 14, padding: 14, border: `1px solid ${c}33` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: c, marginBottom: 8, textAlign: 'center' }}>
          לוח ×{multiplier} — מבט מהיר
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
          {examples.map(({ factor, product }) => (
            <div key={factor} style={{
              textAlign: 'center', background: '#fff', borderRadius: 8,
              padding: '6px 2px', border: `1.5px solid ${c}44`,
            }}>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{factor}×{multiplier}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c }}>{product}</div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8 }}>
          תראו עוד שאלות בתרגול! 👇
        </div>
      </div>
    </div>
  );
};

// ─── Question visual ───
const QuestionVisual = ({ q }) => {
  const theme = LEVEL_THEMES[q.multiplier];
  if (q.type === "array") return (
    <div style={{ textAlign: 'center', margin: '12px 0' }}>
      <ArrayDots rows={q.factor} cols={q.multiplier} color={theme.color} />
      <div style={{ marginTop: 6, color: '#64748b', fontSize: 13 }}>
        {q.factor} שורות של {q.multiplier}
      </div>
    </div>
  );
  if (q.type === "groups") return (
    <div style={{ margin: '12px 0' }}>
      <GroupsDisplay groups={q.factor} itemsPerGroup={q.multiplier} emoji={theme.emoji} color={theme.color} />
    </div>
  );
  return (
    <div style={{ margin: '12px 0' }}>
      <TableRowStrip multiplier={q.multiplier} blankAt={q.factor - 1} color={theme.color} />
    </div>
  );
};

const getQuestionText = (q) => {
  const theme = LEVEL_THEMES[q.multiplier];
  if (q.type === "array") return `כמה נקודות יש? (${q.factor} × ${q.multiplier})`;
  if (q.type === "groups") return `כמה ${theme.emoji} יש בסה״כ? (${q.factor} × ${q.multiplier})`;
  return `מה חסר בלוח הכפל? (${q.factor} × ${q.multiplier} = ?)`;
};

// ═══════════════════════════════════════════
export function MultiplicationGame({ gameProgress, saveGameProgress, playSound, setScreen, addSparks, isAdmin }) {
  const [phase, setPhase] = useState("levelSelect");
  const [multiplier, setMultiplier] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [feedbackIdx, setFeedbackIdx] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  const [sparksEarned, setSparksEarned] = useState(0);
  const [sparksTrigger, setSparksTrigger] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  const advanceTimer = useRef(null);

  const gp = gameProgress.multiplication || {};
  const isUnlocked = (n) => isAdmin || n === 2 || (gp[n - 1]?.stars > 0);
  const getStoredStars = (n) => gp[n]?.stars || 0;

  const startLevel = (n) => {
    const qs = generateQuestions(n);
    setQuestions(qs);
    setQIdx(0);
    setScore(0);
    setResults([]);
    setFeedback(null);
    setFeedbackIdx(null);
    setShowExplanation(false);
    setSparksEarned(0);
    setPhase("playing");
  };

  const handleAnswer = (optionIdx) => {
    if (feedback) return;
    const q = questions[qIdx];
    const isCorrect = optionIdx === q.correctIdx;

    setFeedback(isCorrect ? "correct" : "wrong");
    setFeedbackIdx(optionIdx);
    setTimeout(() => playSound(isCorrect ? "correct" : "wrong"), 0);

    const newScore = isCorrect ? score + 1 : score;
    const newResults = [...results, isCorrect];
    setScore(newScore);
    setResults(newResults);

    setTimeout(() => setShowExplanation(true), 1200);

    advanceTimer.current = setTimeout(() => {
      const nextIdx = qIdx + 1;
      if (nextIdx >= questions.length) {
        finishLevel(newScore, newResults);
      } else {
        setQIdx(nextIdx);
        setFeedback(null);
        setFeedbackIdx(null);
        setShowExplanation(false);
      }
    }, 2500);
  };

  const finishLevel = (finalScore, finalResults) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    const passed = finalScore >= PASS_THRESHOLD;
    const stars = getStars(finalScore);

    if (passed) {
      const earned = SPARKS_REWARDS.gameLevelPass + (stars === 3 ? SPARKS_REWARDS.gameLevelThreeStars : 0);
      setSparksEarned(earned);
      setSparksTrigger(t => t + 1);
      if (addSparks) addSparks(earned);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }

    const existing = gp[multiplier] || {};
    saveGameProgress({
      ...gameProgress,
      multiplication: {
        ...gp,
        [multiplier]: {
          stars: Math.max(existing.stars || 0, stars),
          bestScore: Math.max(existing.bestScore || 0, finalScore),
        }
      }
    });

    setResults(finalResults);
    setScore(finalScore);
    setPhase("result");
  };

  // ── Level Select ──
  if (phase === "levelSelect") {
    return (
      <div className="container">
        <div className="page-content">
          <div className="page-header">
            <button onClick={() => setScreen("practices")} className="back-btn">→ חזרה</button>
            <h2>🔢 לוח הכפל</h2>
          </div>
          <div className="level-name-tooltip">
            {hoveredLevel
              ? `לוח ×${hoveredLevel} — ${LEVEL_THEMES[hoveredLevel].name}`
              : "בחרו איזה לוח לתרגל"}
          </div>
          <div className="level-grid">
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => {
              const unlocked = isUnlocked(n);
              const stars = getStoredStars(n);
              const th = LEVEL_THEMES[n];
              return (
                <button
                  key={n}
                  className={`level-card ${unlocked ? "unlocked" : "locked"}${hoveredLevel === n ? " current" : ""}`}
                  onClick={() => { if (unlocked) { setMultiplier(n); setPhase("concept"); } }}
                  onMouseEnter={() => unlocked && setHoveredLevel(n)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  disabled={!unlocked}
                  style={unlocked ? { borderColor: th.color } : {}}
                >
                  {unlocked ? (
                    <>
                      <span style={{ fontSize: 22 }}>{th.emoji}</span>
                      <span className="level-num" style={{ color: th.color }}>×{n}</span>
                      {stars > 0 && <span className="level-stars">{getStarsDisplay(stars)}</span>}
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: 20 }}>🔒</span>
                      <span style={{ fontSize: 12, color: '#64748b' }}>×{n}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── Concept ──
  if (phase === "concept") {
    const theme = LEVEL_THEMES[multiplier];
    return (
      <div className="container">
        <div className="page-content">
          <div className="page-header">
            <button onClick={() => setPhase("levelSelect")} className="back-btn">→ חזרה</button>
            <h2>{theme.emoji} לוח ×{multiplier}</h2>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, margin: '12px 0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
            <ConceptContent multiplier={multiplier} />
          </div>
          <button
            className="primary-btn w-full"
            style={{ marginTop: 8, fontSize: 18, padding: '14px 0', background: `linear-gradient(135deg, ${theme.color}, ${theme.color}cc)` }}
            onClick={() => startLevel(multiplier)}
          >
            🚀 בואו נתרגל! ←
          </button>
        </div>
      </div>
    );
  }

  // ── Playing ──
  if (phase === "playing") {
    const q = questions[qIdx];
    const theme = LEVEL_THEMES[multiplier];
    if (!q) return null;

    return (
      <div className="container">
        <div className="page-content">
          <Confetti active={showConfetti} />

          <div className="game-hud">
            <div className="game-hud-section">
              <button onClick={() => { if (advanceTimer.current) clearTimeout(advanceTimer.current); setPhase("levelSelect"); }} className="back-btn" style={{ padding: '4px 10px' }}>✕</button>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{theme.emoji} ×{multiplier}</span>
            </div>
            <div className="game-hud-section">
              <span style={{ fontSize: 12, color: '#94a3b8' }}>{score}/{questions.length} ✓</span>
            </div>
          </div>

          <div className="game-dots">
            {questions.map((_, i) => (
              <div key={i} className={`game-dot${i === qIdx ? " current" : ""}${results[i] === true ? " correct" : ""}${results[i] === false ? " wrong" : ""}`} />
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: 16, padding: 20, margin: '8px 0', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1e293b', marginBottom: 12, lineHeight: 1.6 }}>
              {getQuestionText(q)}
            </div>

            <QuestionVisual q={q} />

            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 18 }}>
              {q.options.map((opt, i) => {
                let bg = '#f1f5f9', border = '2px solid #e2e8f0', color = '#1e293b';
                if (feedback) {
                  if (i === q.correctIdx) { bg = '#dcfce7'; border = '2px solid #22c55e'; color = '#166534'; }
                  else if (i === feedbackIdx && feedback === "wrong") { bg = '#fef2f2'; border = '2px solid #ef4444'; color = '#991b1b'; }
                }
                return (
                  <button key={i} onClick={() => handleAnswer(i)} disabled={!!feedback} style={{
                    background: bg, border, color, borderRadius: 12,
                    padding: '10px 22px', fontSize: 20, fontWeight: 700,
                    cursor: feedback ? 'default' : 'pointer', minWidth: 80,
                    opacity: feedback && i !== q.correctIdx && i !== feedbackIdx ? 0.45 : 1,
                    transition: 'all 0.15s',
                  }}>
                    {opt}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div style={{
                marginTop: 14, padding: '10px 14px', borderRadius: 10, fontSize: 14, lineHeight: 1.6,
                background: feedback === "correct" ? '#f0fdf4' : '#fff7ed',
                border: `1px solid ${feedback === "correct" ? '#bbf7d0' : '#fed7aa'}`,
                color: '#334155',
              }}>
                {feedback === "correct" ? "✅ " : "💡 "}
                {feedback === "correct"
                  ? `נכון! ${q.factor} × ${q.multiplier} = ${q.answer}`
                  : `התשובה הנכונה: ${q.factor} × ${q.multiplier} = ${q.answer}`}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Result ──
  if (phase === "result") {
    const passed = score >= PASS_THRESHOLD;
    const stars = getStars(score);
    const theme = LEVEL_THEMES[multiplier];
    return (
      <div className="container">
        <div className="page-content">
          <Confetti active={showConfetti} />
          <SparksPopup amount={sparksEarned} trigger={sparksTrigger} />
          <div className={`level-result-card ${passed ? "passed" : "failed"}`}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>{passed ? "🎉" : "💪"}</div>
            <h2 style={{ color: '#e2e8f0', margin: '6px 0' }}>{passed ? "כל הכבוד!" : "כמעט! נסו שוב"}</h2>
            <div style={{ color: '#94a3b8', fontSize: 14, marginBottom: 8 }}>{theme.emoji} לוח ×{multiplier}</div>
            <div className={`result-score ${passed ? "pass" : "fail"}`}>{score}/{questions.length}</div>
            {stars > 0 && <div className="result-stars">{getStarsDisplay(stars)}</div>}
            {sparksEarned > 0 && <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 16, marginTop: 4 }}>✨ +{sparksEarned} ניצוצות</div>}
            <div className="flex-col gap-8" style={{ marginTop: 16 }}>
              <button className="primary-btn w-full" onClick={() => { setPhase("concept"); }}>🔄 שחק שוב</button>
              <button className="secondary-btn w-full" onClick={() => { setPhase("levelSelect"); setMultiplier(null); }}>← בחר לוח אחר</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
