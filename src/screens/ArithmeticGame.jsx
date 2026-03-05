import { useState, useEffect, useRef, useCallback } from 'react';
import { ARITHMETIC_LEVELS, PASS_THRESHOLD, STAR_THRESHOLDS } from '../constants/games';
import { SPARKS_REWARDS } from '../constants/ninjago';
import { generateRound } from '../utils/arithmetic';
import { NumKeypad } from '../components/ui/NumKeypad';
import { Confetti } from '../components/ui/Confetti';
import { SparksPopup } from '../components/ui/SparksPopup';

export function ArithmeticGame({ settings, gameProgress, saveGameProgress, playSound, setScreen, addSparks, isAdmin }) {
  const [phase, setPhase] = useState("levelSelect"); // levelSelect | playing | result
  const [sparksEarned, setSparksEarned] = useState(0);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx] = useState(0);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [points, setPoints] = useState(0);
  const [results, setResults] = useState([]); // per-question: true/false
  const [answerMode, setAnswerMode] = useState("choice"); // choice | input
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [feedbackIdx, setFeedbackIdx] = useState(null); // which choice was clicked
  const [showConfetti, setShowConfetti] = useState(false);
  const [pointsPopup, setPointsPopup] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);
  const questionStartRef = useRef(null);

  const grade = settings.grade;
  const levels = ARITHMETIC_LEVELS[grade] || [];
  const gp = gameProgress.arithmetic || {};
  const gameTimerOn = settings.gameTimerEnabled !== false;
  const getTime = (config) => !gameTimerOn ? 9999 : (settings.gameTimerSeconds || 0) > 0 ? settings.gameTimerSeconds : config.timePerQuestion;

  const isUnlocked = (lvl) => isAdmin || lvl === 1 || (gp[lvl - 1]?.stars > 0);
  const getStars = (lvl) => gp[lvl]?.stars || 0;

  const getStarsDisplay = (stars) => {
    return "⭐".repeat(stars) + "☆".repeat(3 - stars);
  };

  const startLevel = useCallback((lvlNum) => {
    const config = levels[lvlNum - 1];
    if (!config) return;

    const round = generateRound(config);
    setQuestions(round);
    setQIdx(0);
    setSelectedLevel(lvlNum);
    setLives(lvlNum <= 3 ? 5 : 3);
    setScore(0);
    setStreak(0);
    setPoints(0);
    setResults([]);
    setFeedback(null);
    setFeedbackIdx(null);
    setInputValue("");

    // Set answer mode based on config
    if (config.answerMode === "choice") setAnswerMode("choice");
    else if (config.answerMode === "input") setAnswerMode("input");
    else setAnswerMode("choice"); // mixed defaults to choice, user can toggle

    setTimeLeft(getTime(config));
    questionStartRef.current = Date.now();
    setPhase("playing");
  }, [levels]);

  // Timer
  useEffect(() => {
    if (phase !== "playing" || feedback) return;

    const config = levels[selectedLevel - 1];
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

      // Speed bonus
      const elapsed = (Date.now() - questionStartRef.current) / 1000;
      const config = levels[selectedLevel - 1];
      if (elapsed < getTime(config) / 3) earnedPoints += 5;

      // Streak
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
      advanceOrEnd(newLives, newResults, newScore, earnedPoints);
    }, 800);
  };

  const handleInputSubmit = () => {
    if (feedback || !inputValue) return;
    clearInterval(timerRef.current);

    const q = questions[qIdx];
    const isCorrect = parseInt(inputValue) === q.answer;

    setFeedback(isCorrect ? "correct" : "wrong");
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
      const config = levels[selectedLevel - 1];
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
      advanceOrEnd(newLives, newResults, newScore, earnedPoints);
    }, 800);
  };

  const showPointsAnim = (pts, isWrong) => {
    setPointsPopup({ pts, isWrong, key: Date.now() });
    setTimeout(() => setPointsPopup(null), 800);
  };

  const advanceOrEnd = (currentLives, currentResults, currentScore, lastEarned) => {
    const totalAnswered = currentResults.length;
    const correctCount = currentResults.filter(Boolean).length;
    const finalScore = currentScore !== undefined ? currentScore : correctCount;

    // Out of lives
    if (currentLives <= 0) {
      finishLevel(finalScore, currentResults);
      return;
    }

    // All questions answered
    if (totalAnswered >= questions.length) {
      finishLevel(finalScore, currentResults);
      return;
    }

    // Next question
    setQIdx(totalAnswered);
    setFeedback(null);
    setFeedbackIdx(null);
    setInputValue("");
    const config = levels[selectedLevel - 1];
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

    // Save progress
    const existingStars = gp[selectedLevel]?.stars || 0;
    const newGp = {
      ...gameProgress,
      arithmetic: {
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
    const displayConfig = displayLevel ? levels[displayLevel - 1] : null;

    return (
      <div className="container">
        <div className="page-content">
          <div className="page-header">
            <button onClick={() => setScreen("practice-games")} className="back-btn">→ חזרה</button>
            <h2>🧮 חשבון מהיר</h2>
          </div>

          <div className="level-name-tooltip">
            {displayConfig ? displayConfig.nameHe : "בחרו שלב"}
          </div>

          <div className="level-grid">
            {levels.map((lvl) => {
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
      </div>
    );
  }

  // ─── RENDER: Playing ───
  if (phase === "playing") {
    const q = questions[qIdx];
    const config = levels[selectedLevel - 1];
    const timerPct = (timeLeft / getTime(config)) * 100;
    const timerColor = timerPct > 50 ? "#4ade80" : timerPct > 25 ? "#fbbf24" : "#f87171";
    const isMixed = config.answerMode === "mixed";
    const showChoice = answerMode === "choice";

    return (
      <div className="container">
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
              <span className="text-muted" style={{ fontSize: 12 }}>שלב {selectedLevel}</span>
            </div>
            <div className="game-hud-section">
              {streak >= 3 && <span className="streak-badge">🔥 {streak}</span>}
              <span className="points-display">{points} נק׳</span>
            </div>
          </div>

          {/* Lives */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="hearts-row">
              {Array.from({ length: selectedLevel <= 3 ? 5 : 3 }).map((_, i) => (
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

          {/* Expression */}
          {q && (
            <div className="expression-display">
              {q.expression} <span className="eq-mark">= ?</span>
            </div>
          )}

          {/* Mode toggle for mixed levels */}
          {isMixed && !feedback && (
            <div className="mode-toggle">
              <button className={`mode-toggle-btn${showChoice ? " active" : ""}`} onClick={() => setAnswerMode("choice")}>בחירה</button>
              <button className={`mode-toggle-btn${!showChoice ? " active" : ""}`} onClick={() => { setAnswerMode("input"); setInputValue(""); }}>הקלדה</button>
            </div>
          )}

          {/* Answer area */}
          {q && showChoice ? (
            <div className="game-choices">
              {q.choices.map((c, i) => {
                let cls = "game-choice-btn";
                if (feedback) {
                  if (c === q.answer) cls += " correct";
                  else if (i === feedbackIdx && feedback === "wrong") cls += " wrong";
                }
                return (
                  <button key={i} className={cls} onClick={() => handleChoiceAnswer(c, i)} disabled={!!feedback}>
                    {c}
                  </button>
                );
              })}
            </div>
          ) : q ? (
            <>
              <div className={`answer-input-display${inputValue ? " has-value" : ""}`}>
                {inputValue || ""}<span className="answer-cursor" />
              </div>
              {feedback && (
                <div style={{ textAlign: 'center', marginBottom: 8, fontSize: 14, color: feedback === "correct" ? "#4ade80" : "#f87171" }}>
                  {feedback === "wrong" && `התשובה הנכונה: ${q.answer}`}
                </div>
              )}
              <NumKeypad
                value={inputValue}
                onChange={setInputValue}
                onSubmit={handleInputSubmit}
              />
            </>
          ) : null}
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

    const hasNext = selectedLevel < levels.length && passed;

    return (
      <div className="container">
        <div className="page-content">
          <Confetti active={showConfetti} />

          <div className={`level-result-card ${passed ? "passed" : "failed"}`}>
            <div style={{ fontSize: 40, marginBottom: 6 }}>{passed ? "🎉" : "😔"}</div>
            <h2 style={{ color: '#e2e8f0', margin: '6px 0' }}>
              {passed ? "כל הכבוד!" : "לא נורא, נסו שוב!"}
            </h2>
            <div className="result-score-label" style={{ color: '#94a3b8', fontSize: 14 }}>
              שלב {selectedLevel} - {levels[selectedLevel - 1]?.nameHe}
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
