import { useState, useEffect, useCallback, useRef } from 'react';
import { FRACTION_QUESTIONS, FRACTION_LEVELS } from '../constants/fractions';
import { SPARKS_REWARDS } from '../constants/ninjago';
import { Confetti } from '../components/ui/Confetti';
import { SparksPopup } from '../components/ui/SparksPopup';

// ─── Star thresholds for 8 questions ───
const STAR_THRESHOLDS_8 = { 1: 6, 2: 7, 3: 8 };
const PASS_THRESHOLD_8 = 6;

// ─── SVG Helper ───
const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

// ─── FractionCircle ───
const FractionCircle = ({ total, filled, size = 100, color = "#4f46e5" }) => {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;

  if (total === 1) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill={filled >= 1 ? color : "#e2e8f0"} stroke="#94a3b8" strokeWidth={2} />
      </svg>
    );
  }

  const slices = [];
  for (let i = 0; i < total; i++) {
    const startAngle = (i * 360 / total) - 90;
    const endAngle = ((i + 1) * 360 / total) - 90;
    const start = polarToCartesian(cx, cy, r, startAngle);
    const end = polarToCartesian(cx, cy, r, endAngle);
    const largeArc = (360 / total) > 180 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
    slices.push(
      <path
        key={i}
        d={d}
        fill={i < filled ? color : "#e2e8f0"}
        stroke="#94a3b8"
        strokeWidth={1.5}
      />
    );
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#64748b" strokeWidth={2} />
    </svg>
  );
};

// ─── FractionBar ───
const FractionBar = ({ total, filled, width = 200, height = 40, color = "#4f46e5" }) => {
  const segW = width / total;
  const segments = [];
  for (let i = 0; i < total; i++) {
    segments.push(
      <rect
        key={i}
        x={i * segW}
        y={0}
        width={segW}
        height={height}
        fill={i < filled ? color : "#e2e8f0"}
        stroke="#94a3b8"
        strokeWidth={1.5}
      />
    );
  }
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {segments}
      <rect x={0} y={0} width={width} height={height} fill="none" stroke="#64748b" strokeWidth={2} rx={4} />
    </svg>
  );
};

// ─── FractionLabel ───
const FractionLabel = ({ numerator, denominator }) => (
  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', margin: '0 8px' }}>
    <span style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{numerator}</span>
    <div style={{ width: 30, height: 2, background: '#1e293b', margin: '2px 0' }} />
    <span style={{ fontSize: 22, fontWeight: 700, color: '#1e293b' }}>{denominator}</span>
  </div>
);

// ─── Render question visual ───
const QuestionVisual = ({ question }) => {
  const { type, visual } = question;

  if (type === "compare") {
    const { left, right } = visual;
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          {left.shape === "circle"
            ? <FractionCircle total={left.total} filled={left.filled} size={100} color="#4f46e5" />
            : <FractionBar total={left.total} filled={left.filled} width={160} height={36} color="#4f46e5" />}
          <FractionLabel numerator={left.filled} denominator={left.total} />
        </div>
        <span style={{ fontSize: 28, fontWeight: 700, color: '#94a3b8' }}>⚡</span>
        <div style={{ textAlign: 'center' }}>
          {right.shape === "circle"
            ? <FractionCircle total={right.total} filled={right.filled} size={100} color="#f59e0b" />
            : <FractionBar total={right.total} filled={right.filled} width={160} height={36} color="#f59e0b" />}
          <FractionLabel numerator={right.filled} denominator={right.total} />
        </div>
      </div>
    );
  }

  if (type === "wordProblem") {
    const { emoji, parts, filled } = visual;
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>{emoji}</div>
        <FractionBar total={parts} filled={filled} width={Math.min(parts * 50, 250)} height={32} color="#22c55e" />
        <div style={{ marginTop: 6 }}>
          <FractionLabel numerator={filled} denominator={parts} />
        </div>
      </div>
    );
  }

  // identify type
  const { total, filled, shape } = visual;
  return (
    <div style={{ textAlign: 'center' }}>
      {shape === "circle"
        ? <FractionCircle total={total} filled={filled} size={120} color="#4f46e5" />
        : <FractionBar total={total} filled={filled} width={Math.min(total * 50, 250)} height={40} color="#4f46e5" />}
      <div style={{ marginTop: 6 }}>
        <FractionLabel numerator={filled} denominator={total} />
      </div>
    </div>
  );
};

// ─── Concept content per level ───
const ConceptContent = ({ level }) => {
  const headingStyle = { fontSize: 20, fontWeight: 700, color: '#e2e8f0', marginBottom: 12 };
  const textStyle = { fontSize: 16, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 12 };
  const visualRow = { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 16, flexWrap: 'wrap' };

  if (level === 1) {
    return (
      <div>
        <div style={headingStyle}>מה זה שבר? 🍕</div>
        <div style={textStyle}>
          שבר מראה כמה חלקים לקחנו מתוך כל החלקים.
          <br />
          למשל, אם חותכים פיצה ל-2 חלקים שווים ואוכלים חלק אחד - אכלנו <strong>חצי!</strong>
        </div>
        <div style={visualRow}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>חצי (1/2)</div>
            <FractionCircle total={2} filled={1} size={90} color="#4f46e5" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>רבע (1/4)</div>
            <FractionCircle total={4} filled={1} size={90} color="#22c55e" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>שלושה רבעים (3/4)</div>
            <FractionCircle total={4} filled={3} size={90} color="#f59e0b" />
          </div>
        </div>
        <div style={textStyle}>
          כשחותכים ל-4 חלקים שווים, כל חלק נקרא <strong>רבע</strong>.
          <br />
          3 חלקים מתוך 4 זה <strong>שלושה רבעים</strong>!
        </div>
      </div>
    );
  }

  if (level === 2) {
    return (
      <div>
        <div style={headingStyle}>שלישים וחמישיות 🍰</div>
        <div style={textStyle}>
          אפשר לחתוך דברים גם ל-3 חלקים או ל-5 חלקים שווים!
        </div>
        <div style={visualRow}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>שליש (1/3)</div>
            <FractionCircle total={3} filled={1} size={90} color="#4f46e5" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>שני שלישים (2/3)</div>
            <FractionCircle total={3} filled={2} size={90} color="#22c55e" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>חומש (1/5)</div>
            <FractionCircle total={5} filled={1} size={90} color="#f59e0b" />
          </div>
        </div>
        <div style={textStyle}>
          ככל שחותכים ליותר חלקים - כל חלק <strong>קטן יותר</strong>!
          <br />
          חומש קטן משליש, ושליש קטן מחצי.
        </div>
      </div>
    );
  }

  if (level === 3) {
    return (
      <div>
        <div style={headingStyle}>מי גדול יותר? ⚖️</div>
        <div style={textStyle}>
          עכשיו נלמד להשוות בין שברים! מי יותר גדול, חצי או שליש?
        </div>
        <div style={visualRow}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>חצי (1/2)</div>
            <FractionCircle total={2} filled={1} size={90} color="#4f46e5" />
          </div>
          <span style={{ fontSize: 24, color: '#fbbf24' }}>{">"}</span>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 14, color: '#94a3b8', marginBottom: 4 }}>שליש (1/3)</div>
            <FractionCircle total={3} filled={1} size={90} color="#ef4444" />
          </div>
        </div>
        <div style={textStyle}>
          <strong>טיפ:</strong> כשהמונה (למעלה) זהה, ככל שהמכנה (למטה) גדול יותר - השבר <strong>קטן יותר</strong>!
          <br />
          כי מחלקים את אותו דבר ליותר חלקים.
        </div>
      </div>
    );
  }

  if (level === 4) {
    return (
      <div>
        <div style={headingStyle}>שברים בחיים! 🍕🍰🍎</div>
        <div style={textStyle}>
          שברים מופיעים בכל מקום! בפיצה, בעוגה, במשחקים...
        </div>
        <div style={visualRow}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🍕</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>פיצה חתוכה ל-4</div>
            <FractionCircle total={4} filled={1} size={80} color="#f59e0b" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🍰</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>עוגה חתוכה ל-3</div>
            <FractionCircle total={3} filled={2} size={80} color="#ec4899" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40 }}>🧃</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>כוס מלאה חצי</div>
            <FractionBar total={2} filled={1} width={60} height={80} color="#22c55e" />
          </div>
        </div>
        <div style={textStyle}>
          עכשיו נתרגל לפתור בעיות מהחיים עם שברים!
        </div>
      </div>
    );
  }

  // level 5
  return (
    <div>
      <div style={headingStyle}>אתגר שברים! 🏆</div>
      <div style={textStyle}>
        הגעתם לשלב האתגר! כאן נשלב הכל:
      </div>
      <div style={{ ...textStyle, paddingRight: 16 }}>
        ✅ זיהוי שברים
        <br />
        ✅ השוואת שברים
        <br />
        ✅ בעיות מילוליות
        <br />
        ✅ שברים שווים (כמו 2/4 = 1/2)
      </div>
      <div style={visualRow}>
        <FractionCircle total={6} filled={3} size={80} color="#4f46e5" />
        <span style={{ fontSize: 20, color: '#fbbf24' }}>=</span>
        <FractionCircle total={2} filled={1} size={80} color="#4f46e5" />
      </div>
      <div style={textStyle}>
        מוכנים? בואו נראה מה למדתם! 💪
      </div>
    </div>
  );
};

// ─── Main Game Component ───
export function FractionsGame({ settings, gameProgress, saveGameProgress, playSound, setScreen, addSparks, isAdmin }) {
  const [phase, setPhase] = useState("levelSelect");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [feedbackIdx, setFeedbackIdx] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [sparksEarned, setSparksEarned] = useState(0);
  const [sparksTrigger, setSparksTrigger] = useState(0);
  const advanceTimer = useRef(null);

  const grade = settings.grade;
  const gp = gameProgress.fractions || {};

  const isUnlocked = (lvl) => isAdmin || lvl === 1 || (gp[lvl - 1]?.stars > 0);
  const getStars = (lvl) => gp[lvl]?.stars || 0;
  const getStarsDisplay = (stars) => "\u2B50".repeat(stars) + "\u2606".repeat(3 - stars);

  const startLevel = useCallback((lvlNum) => {
    const config = FRACTION_LEVELS[lvlNum - 1];
    if (!config) return;

    // Filter questions by level config and grade
    const byTypeAndDiff = FRACTION_QUESTIONS.filter(q =>
      config.filter.types.includes(q.type) && config.filter.difficulties.includes(q.difficulty)
    );
    // Prefer grade-matched questions; fall back to all if too few (covers admin + edge cases)
    const gradeFiltered = byTypeAndDiff.filter(q => q.grades.includes(grade));
    const filtered = gradeFiltered.length >= 4 ? gradeFiltered : byTypeAndDiff;

    // Shuffle and pick questionsPerRound
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, config.questionsPerRound);

    // If not enough unique questions, pad with repeats from the pool
    const pool = filtered.length > 0 ? filtered : FRACTION_QUESTIONS;
    while (picked.length < config.questionsPerRound) {
      picked.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    setQuestions(picked);
    setQIdx(0);
    setSelectedLevel(lvlNum);
    setScore(0);
    setResults([]);
    setFeedback(null);
    setFeedbackIdx(null);
    setShowExplanation(false);
    setPhase("playing");
  }, [grade]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, []);

  const handleAnswer = (optionIdx) => {
    if (feedback) return;

    const q = questions[qIdx];
    const isCorrect = optionIdx === q.correct;

    setFeedback(isCorrect ? "correct" : "wrong");
    setFeedbackIdx(optionIdx);
    setTimeout(() => playSound(isCorrect ? "correct" : "wrong"), 0);

    const newScore = isCorrect ? score + 1 : score;
    const newResults = [...results, isCorrect];
    setScore(newScore);
    setResults(newResults);

    // Show explanation after short delay
    setTimeout(() => setShowExplanation(true), 1200);

    // Auto-advance after explanation
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

    const passed = finalScore >= PASS_THRESHOLD_8;

    let stars = 0;
    if (finalScore >= STAR_THRESHOLDS_8[3]) stars = 3;
    else if (finalScore >= STAR_THRESHOLDS_8[2]) stars = 2;
    else if (finalScore >= STAR_THRESHOLDS_8[1]) stars = 1;

    if (passed) {
      playSound("celebrate");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);

      const earned = (SPARKS_REWARDS.gameLevelPass || 10) + (stars === 3 ? (SPARKS_REWARDS.gameLevelThreeStars || 5) : 0);
      setSparksEarned(earned);
      setSparksTrigger(t => t + 1);
      if (addSparks) addSparks(earned);
    } else {
      setSparksEarned(0);
    }

    // Save progress
    const existingStars = gp[selectedLevel]?.stars || 0;
    const newGp = {
      ...gameProgress,
      fractions: {
        ...gp,
        [selectedLevel]: {
          stars: Math.max(existingStars, stars),
          bestScore: Math.max(gp[selectedLevel]?.bestScore || 0, finalScore),
        }
      }
    };
    saveGameProgress(newGp);

    setScore(finalScore);
    setResults(finalResults);
    setPhase("result");
  };

  // ─── RENDER: Level Select ───
  if (phase === "levelSelect") {
    const displayLevel = hoveredLevel || selectedLevel;
    const displayConfig = displayLevel ? FRACTION_LEVELS[displayLevel - 1] : null;
    const availableLevels = FRACTION_LEVELS.filter(l => isAdmin || l.grades.includes(grade));

    return (
      <div className="container">
        <div className="page-content">
          <div className="page-header">
            <button onClick={() => setScreen("practices")} className="back-btn">{"\u2192"} חזרה</button>
            <h2>🧩 בניית שברים</h2>
          </div>

          <div className="level-name-tooltip">
            {displayConfig ? displayConfig.nameHe : "בחרו שלב"}
          </div>

          <div className="level-grid">
            {availableLevels.map((lvl) => {
              const unlocked = isUnlocked(lvl.level);
              const stars = getStars(lvl.level);
              return (
                <button
                  key={lvl.level}
                  className={`level-card ${unlocked ? "unlocked" : "locked"}${hoveredLevel === lvl.level ? " current" : ""}`}
                  onClick={() => {
                    if (unlocked) {
                      setSelectedLevel(lvl.level);
                      setPhase("concept");
                    }
                  }}
                  onMouseEnter={() => unlocked && setHoveredLevel(lvl.level)}
                  onMouseLeave={() => setHoveredLevel(null)}
                  disabled={!unlocked}
                >
                  <span className="level-num">{unlocked ? lvl.level : "\u{1F512}"}</span>
                  {unlocked && stars > 0 && (
                    <span className="level-stars">{getStarsDisplay(stars)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Concept ───
  if (phase === "concept") {
    return (
      <div className="container">
        <div className="page-content">
          <div className="page-header">
            <button onClick={() => setPhase("levelSelect")} className="back-btn">{"\u2192"} חזרה</button>
            <h2>🧩 שלב {selectedLevel}: {FRACTION_LEVELS[selectedLevel - 1]?.nameHe}</h2>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #1e293b, #334155)',
            borderRadius: 16,
            padding: 24,
            margin: '16px 0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}>
            <ConceptContent level={selectedLevel} />
          </div>

          <button
            className="primary-btn w-full"
            style={{ marginTop: 16, fontSize: 18, padding: '14px 0' }}
            onClick={() => startLevel(selectedLevel)}
          >
            {"!\u{1F680} בואו נתרגל"} {"\u2190"}
          </button>
        </div>
      </div>
    );
  }

  // ─── RENDER: Playing ───
  if (phase === "playing") {
    const q = questions[qIdx];

    return (
      <div className="container">
        <div className="page-content">
          <Confetti active={showConfetti} />

          {/* Header */}
          <div className="game-hud">
            <div className="game-hud-section">
              <button
                onClick={() => {
                  if (advanceTimer.current) clearTimeout(advanceTimer.current);
                  setPhase("levelSelect");
                }}
                className="back-btn"
                style={{ padding: '4px 10px' }}
              >
                {"\u2715"}
              </button>
              <span className="text-muted" style={{ fontSize: 12 }}>שלב {selectedLevel}</span>
            </div>
            <div className="game-hud-section">
              <span className="points-display">{score}/{questions.length} ✓</span>
            </div>
          </div>

          {/* Progress dots */}
          <div className="game-dots">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`game-dot${i === qIdx ? " current" : ""}${results[i] === true ? " correct" : ""}${results[i] === false ? " wrong" : ""}`}
              />
            ))}
          </div>

          {/* Question card */}
          {q && (
            <div style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              margin: '12px 0',
              boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: '#1e293b', marginBottom: 16, lineHeight: 1.6 }}>
                {q.question}
              </div>

              <QuestionVisual question={q} />

              {/* Answer buttons */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 10,
                marginTop: 20,
              }}>
                {q.options.map((opt, i) => {
                  let bg = '#f1f5f9';
                  let border = '2px solid #e2e8f0';
                  let textColor = '#1e293b';

                  if (feedback) {
                    if (i === q.correct) {
                      bg = '#dcfce7';
                      border = '2px solid #22c55e';
                      textColor = '#166534';
                    } else if (i === feedbackIdx && feedback === "wrong") {
                      bg = '#fef2f2';
                      border = '2px solid #ef4444';
                      textColor = '#991b1b';
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      disabled={!!feedback}
                      style={{
                        background: bg,
                        border,
                        color: textColor,
                        borderRadius: 12,
                        padding: '10px 18px',
                        fontSize: 16,
                        fontWeight: 600,
                        cursor: feedback ? 'default' : 'pointer',
                        transition: 'all 0.2s',
                        minWidth: 100,
                        opacity: feedback && i !== q.correct && i !== feedbackIdx ? 0.5 : 1,
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Explanation */}
              {showExplanation && (
                <div style={{
                  marginTop: 16,
                  padding: '10px 16px',
                  background: feedback === "correct" ? '#f0fdf4' : '#fff7ed',
                  borderRadius: 10,
                  fontSize: 14,
                  color: '#334155',
                  lineHeight: 1.6,
                  border: `1px solid ${feedback === "correct" ? '#bbf7d0' : '#fed7aa'}`,
                }}>
                  {feedback === "correct" ? "✅ " : "💡 "}
                  {q.explanation}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RENDER: Result ───
  if (phase === "result") {
    const total = questions.length;
    const passed = score >= PASS_THRESHOLD_8;

    let stars = 0;
    if (score >= STAR_THRESHOLDS_8[3]) stars = 3;
    else if (score >= STAR_THRESHOLDS_8[2]) stars = 2;
    else if (score >= STAR_THRESHOLDS_8[1]) stars = 1;

    return (
      <div className="container">
        <div className="page-content">
          <Confetti active={showConfetti} />
          <SparksPopup amount={sparksEarned} trigger={sparksTrigger} />

          <div className={`level-result-card ${passed ? "passed" : "failed"}`}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>{passed ? "\u{1F389}" : "\u{1F614}"}</div>
            <h2 style={{ color: '#e2e8f0', margin: '6px 0' }}>
              {passed ? "!כל הכבוד" : "!לא נורא, נסו שוב"}
            </h2>
            <div className="result-score-label" style={{ color: '#94a3b8', fontSize: 14 }}>
              שלב {selectedLevel} - {FRACTION_LEVELS[selectedLevel - 1]?.nameHe}
            </div>

            <div className={`result-score ${passed ? "pass" : "fail"}`}>
              {score}/{total}
            </div>

            {stars > 0 && <div className="result-stars">{getStarsDisplay(stars)}</div>}

            {sparksEarned > 0 && (
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 16, marginTop: 4 }}>
                {"\u2728"} +{sparksEarned} ניצוצות
              </div>
            )}

            <div className="flex-col gap-8" style={{ marginTop: 16 }}>
              <button className="primary-btn w-full" onClick={() => startLevel(selectedLevel)}>
                🔄 שחק שוב
              </button>
              <button className="secondary-btn w-full" onClick={() => setPhase("levelSelect")}>
                {"\u2190"} חזרה לשלבים
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
