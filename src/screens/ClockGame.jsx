import { useState, useEffect, useRef, useCallback } from 'react';
import { PASS_THRESHOLD, STAR_THRESHOLDS } from '../constants/games';
import { SPARKS_REWARDS, getGameLevelCap, getLevelLockReason } from '../constants/ninjago';
import { CLOCK_LEVELS, generateClockRound } from '../utils/clock';
import { Confetti } from '../components/ui/Confetti';

// Simple analog clock SVG component
function AnalogClock({ h, m, size = 140 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 8;
  const hourAngle = ((h % 12) + m / 60) * 30 - 90;
  const minAngle = m * 6 - 90;
  const hourLen = r * 0.5;
  const minLen = r * 0.75;

  const hourX = cx + hourLen * Math.cos(hourAngle * Math.PI / 180);
  const hourY = cy + hourLen * Math.sin(hourAngle * Math.PI / 180);
  const minX = cx + minLen * Math.cos(minAngle * Math.PI / 180);
  const minY = cy + minLen * Math.sin(minAngle * Math.PI / 180);

  return (
    <svg width={size} height={size} style={{ display: 'block', margin: '0 auto 12px' }}>
      <circle cx={cx} cy={cy} r={r} fill="#1e293b" stroke="#4ade80" strokeWidth={3} />
      {/* Hour markers */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 - 90) * Math.PI / 180;
        const x1 = cx + (r - 8) * Math.cos(angle);
        const y1 = cy + (r - 8) * Math.sin(angle);
        const x2 = cx + (r - 2) * Math.cos(angle);
        const y2 = cy + (r - 2) * Math.sin(angle);
        const numR = r - 18;
        const nx = cx + numR * Math.cos(angle);
        const ny = cy + numR * Math.sin(angle);
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94a3b8" strokeWidth={2} />
            <text x={nx} y={ny} textAnchor="middle" dominantBaseline="central" fill="#94a3b8" fontSize={size < 120 ? 9 : 11}>
              {i === 0 ? 12 : i}
            </text>
          </g>
        );
      })}
      {/* Minute hand */}
      <line x1={cx} y1={cy} x2={minX} y2={minY} stroke="#e2e8f0" strokeWidth={2} strokeLinecap="round" />
      {/* Hour hand */}
      <line x1={cx} y1={cy} x2={hourX} y2={hourY} stroke="#4ade80" strokeWidth={3.5} strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={cx} cy={cy} r={3} fill="#4ade80" />
    </svg>
  );
}

// Digital clock display
function DigitalClock({ h, m, size = "large" }) {
  const fontSize = size === "large" ? 48 : 32;
  return (
    <div style={{
      textAlign: 'center', margin: '0 auto 12px',
      fontFamily: 'monospace', fontSize, fontWeight: 700,
      color: '#4ade80', background: '#0f172a',
      borderRadius: 12, padding: '8px 24px', display: 'inline-block',
      border: '2px solid #1e3a3a',
      letterSpacing: 4,
    }}>
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}
    </div>
  );
}

export function ClockGame({ settings, gameProgress, saveGameProgress, playSound, setScreen, addSparks, isAdmin }) {
  const [sparksEarned, setSparksEarned] = useState(0);
  const [phase, setPhase] = useState("levelSelect");
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [results, setResults] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [feedbackIdx, setFeedbackIdx] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointsPopup, setPointsPopup] = useState(null);
  const [lockedMsg, setLockedMsg] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const questionStartRef = useRef(null);

  const gp = gameProgress.clock || {};
  const gameTimerOn = settings.gameTimerEnabled !== false;
  const getTime = (config) => !gameTimerOn ? 9999 : (settings.gameTimerSeconds || 0) > 0 ? settings.gameTimerSeconds : config.timePerQuestion;

  const levelCap = getGameLevelCap("clock", gameProgress, isAdmin);
  const isUnlocked = (lvl) => isAdmin || (lvl <= levelCap && (lvl === 1 || gp[lvl - 1]?.stars > 0));
  const getStars = (lvl) => gp[lvl]?.stars || 0;
  const getStarsDisplay = (stars) => "⭐".repeat(stars) + "☆".repeat(3 - stars);

  const startLevel = useCallback((lvlNum) => {
    const config = CLOCK_LEVELS[lvlNum - 1];
    if (!config) return;

    const round = generateClockRound(lvlNum, config.questionsPerRound);
    setQuestions(round);
    setQIdx(0);
    setSelectedLevel(lvlNum);
    setLives(lvlNum <= 5 ? 5 : 3);
    setScore(0);
    setStreak(0);
    setPoints(0);
    setResults([]);
    setFeedback(null);
    setFeedbackIdx(null);
    setTimeLeft(getTime(config));
    questionStartRef.current = Date.now();
    setPhase("playing");
  }, []);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || feedback) return;
    const config = CLOCK_LEVELS[selectedLevel - 1];
    if (!config) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase, qIdx, feedback, selectedLevel]);

  const handleTimeout = () => {
    playSound("wrong");
    setFeedback("wrong");
    setLives(prev => prev - 1);
    setStreak(0);
    setResults(prev => [...prev, false]);
    showPointsAnim(0, true);
    setTimeout(() => {
      advanceOrEnd(lives - 1, [...results, false]);
    }, 800);
  };

  const handleChoiceAnswer = (choiceValue, idx) => {
    if (feedback) return;
    clearInterval(timerRef.current);

    const q = questions[qIdx];
    const isCorrect = choiceValue === q.answer;

    setFeedback(isCorrect ? "correct" : "wrong");
    setFeedbackIdx(idx);
    playSound(isCorrect ? "correct" : "wrong");

    let earnedPoints = 0;
    let newStreak = streak;
    let newLives = lives;
    let newScore = score;
    const newResults = [...results, isCorrect];

    if (isCorrect) {
      newScore = score + 1;
      earnedPoints = 10;
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const config = CLOCK_LEVELS[selectedLevel - 1];
      if (elapsed < getTime(config) / 3) earnedPoints += 5;
      newStreak = streak + 1;
      if (newStreak > 0 && newStreak % 3 === 0) earnedPoints += 5;
    } else {
      newStreak = 0;
      newLives = lives - 1;
    }

    setScore(newScore);
    setStreak(newStreak);
    setLives(newLives);
    setResults(newResults);
    setPoints(prev => prev + earnedPoints);
    showPointsAnim(earnedPoints, !isCorrect);

    setTimeout(() => {
      advanceOrEnd(newLives, newResults, newScore);
    }, 800);
  };

  const showPointsAnim = (pts, isWrong) => {
    setPointsPopup({ pts, isWrong, key: Date.now() });
    setTimeout(() => setPointsPopup(null), 800);
  };

  const advanceOrEnd = (currentLives, currentResults, currentScore) => {
    const totalAnswered = currentResults.length;
    const correctCount = currentResults.filter(Boolean).length;
    const finalScore = currentScore !== undefined ? currentScore : correctCount;

    if (currentLives <= 0 || totalAnswered >= questions.length) {
      finishLevel(finalScore, currentResults);
      return;
    }

    setQIdx(totalAnswered);
    setFeedback(null);
    setFeedbackIdx(null);
    const config = CLOCK_LEVELS[selectedLevel - 1];
    setTimeLeft(getTime(config));
    questionStartRef.current = Date.now();
  };

  const finishLevel = (finalScore, finalResults) => {
    clearInterval(timerRef.current);

    const passed = finalScore >= PASS_THRESHOLD;
    let stars = 0;
    if (finalScore >= STAR_THRESHOLDS[3]) stars = 3;
    else if (finalScore >= STAR_THRESHOLDS[2]) stars = 2;
    else if (finalScore >= STAR_THRESHOLDS[1]) stars = 1;

    const levelBonus = passed ? 50 : 0;
    setPoints(prev => prev + levelBonus);

    if (passed) {
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
      clock: {
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
    const displayConfig = displayLevel ? CLOCK_LEVELS[displayLevel - 1] : null;

    return (
      <div className="container" style={{ direction: 'rtl' }}>
        <div className="page-content">
          <div className="page-header">
            <button onClick={() => setScreen("practice-games")} className="back-btn">← חזרה</button>
            <h2>🕐 לימוד השעון</h2>
          </div>

          <div className="level-name-tooltip">
            {lockedMsg || (displayConfig ? `${displayConfig.icon} ${displayConfig.nameHe}` : "בחרו שלב")}
          </div>

          <div className="level-grid">
            {CLOCK_LEVELS.map((lvl) => {
              const unlocked = isUnlocked(lvl.level);
              const stars = getStars(lvl.level);
              const lockReason = !unlocked && lvl.level > levelCap ? getLevelLockReason("clock", lvl.level) : null;
              return (
                <button
                  key={lvl.level}
                  className={`level-card ${unlocked ? "unlocked" : "locked"}${hoveredLevel === lvl.level ? " current" : ""}`}
                  onClick={() => {
                    if (unlocked) { startLevel(lvl.level); }
                    else if (lockReason) { setLockedMsg(lockReason); setTimeout(() => setLockedMsg(null), 3000); }
                  }}
                  onMouseEnter={() => unlocked && setHoveredLevel(lvl.level)}
                  onMouseLeave={() => setHoveredLevel(null)}
                >
                  <span className="level-num">{unlocked ? lvl.icon : "🔒"}</span>
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

  // ─── RENDER: Playing ───
  if (phase === "playing") {
    const q = questions[qIdx];
    const config = CLOCK_LEVELS[selectedLevel - 1];
    const timerPct = (timeLeft / getTime(config)) * 100;
    const timerColor = timerPct > 50 ? "#4ade80" : timerPct > 25 ? "#fbbf24" : "#f87171";

    return (
      <div className="container" style={{ direction: 'rtl' }}>
        <div className="page-content">
          <Confetti active={showConfetti} />
          {pointsPopup && (
            <div className={`points-popup${pointsPopup.isWrong ? " wrong" : ""}`} key={pointsPopup.key}>
              {pointsPopup.isWrong ? "✗" : `+${pointsPopup.pts}`}
            </div>
          )}

          {/* Header */}
          <div className="game-hud">
            <div className="game-hud-section">
              <button onClick={() => { clearInterval(timerRef.current); setPhase("levelSelect"); }} className="back-btn" style={{ padding: '4px 10px' }}>✕</button>
              <span className="text-muted" style={{ fontSize: 12 }}>{config.icon} {config.nameHe}</span>
            </div>
            <div className="game-hud-section">
              {streak >= 3 && <span className="streak-badge">🔥 {streak}</span>}
              <span className="points-display">{points} נק׳</span>
            </div>
          </div>

          {/* Lives */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="hearts-row">
              {Array.from({ length: selectedLevel <= 5 ? 5 : 3 }).map((_, i) => (
                <span key={i} className={i >= lives ? "heart-lost" : ""}>❤️</span>
              ))}
            </div>
            <span className="text-muted" style={{ fontSize: 12 }}>{qIdx + 1}/{questions.length}</span>
          </div>

          {/* Timer bar */}
          {gameTimerOn && <div className="game-timer-bar">
            <div className="game-timer-fill" style={{ width: `${timerPct}%`, backgroundColor: timerColor }} />
          </div>}

          {/* Progress dots */}
          <div className="game-dots">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`game-dot${i === qIdx ? " current" : ""}${results[i] === true ? " correct" : ""}${results[i] === false ? " wrong" : ""}`}
              />
            ))}
          </div>

          {/* Clock visual for levels 1-3 */}
          {q && q.clockDisplay && (
            <div style={{ textAlign: 'center', margin: '8px 0' }}>
              <AnalogClock h={q.clockDisplay.h} m={q.clockDisplay.m} />
              <DigitalClock h={q.clockDisplay.h} m={q.clockDisplay.m} size="small" />
            </div>
          )}

          {/* Question */}
          {q && (
            <div style={{
              textAlign: 'right', fontSize: 17, fontWeight: 600,
              color: '#e2e8f0', margin: '12px 0 16px',
              lineHeight: 1.6, padding: '0 4px',
              direction: 'rtl',
            }}>
              {q.question}
            </div>
          )}

          {/* Choices */}
          {q && (
            <div className="game-choices" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {q.choices.map((c, i) => {
                let cls = "game-choice-btn";
                if (feedback) {
                  if (c === q.answer) cls += " correct";
                  else if (i === feedbackIdx && feedback === "wrong") cls += " wrong";
                }
                return (
                  <button key={i} className={cls} onClick={() => handleChoiceAnswer(c, i)} disabled={!!feedback}
                    style={{ fontSize: 15, padding: '12px 8px', minHeight: 48, textAlign: 'right', direction: 'rtl' }}>
                    {c}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── RENDER: Result ───
  if (phase === "result") {
    const passed = score >= PASS_THRESHOLD;
    let stars = 0;
    if (score >= STAR_THRESHOLDS[3]) stars = 3;
    else if (score >= STAR_THRESHOLDS[2]) stars = 2;
    else if (score >= STAR_THRESHOLDS[1]) stars = 1;

    const hasNext = selectedLevel < CLOCK_LEVELS.length && passed;

    return (
      <div className="container" style={{ direction: 'rtl' }}>
        <div className="page-content">
          <Confetti active={showConfetti} />

          <div className={`level-result-card ${passed ? "passed" : "failed"}`}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>{passed ? "🎉" : "😔"}</div>
            <h2 style={{ color: '#e2e8f0', margin: '6px 0' }}>
              {passed ? "מעולה! אתה מבין שעון!" : "לא נורא, ננסה שוב!"}
            </h2>
            <div className="result-score-label" style={{ color: '#94a3b8', fontSize: 14 }}>
              {CLOCK_LEVELS[selectedLevel - 1]?.icon} {CLOCK_LEVELS[selectedLevel - 1]?.nameHe}
            </div>

            <div className={`result-score ${passed ? "pass" : "fail"}`}>
              {score}/{questions.length}
            </div>

            {stars > 0 && <div className="result-stars">{getStarsDisplay(stars)}</div>}

            <div className="result-points-total">
              {points} נקודות ⭐
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
                <button className="primary-btn w-full" style={{ backgroundColor: '#4ade80' }} onClick={() => startLevel(selectedLevel + 1)}>
                  ▶ שלב הבא
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
