import { useState, useCallback } from 'react';
import { ADVENTURE_CONFIGS, ADVENTURE_ROOM_THEMES } from '../constants/games';
import { buildAdventureRooms } from '../utils/adventure';
import { Topic4Visual } from '../components/visuals/Topic4Visual';
import { Topic5Visual } from '../components/visuals/Topic5Visual';
import { Topic5Option } from '../components/visuals/Topic5Option';
import { Confetti } from '../components/ui/Confetti';

export function AdventureGame({ settings, gradeQ, gameProgress, saveGameProgress, playSound, setScreen }) {
  const [phase, setPhase] = useState("levelSelect"); // levelSelect | playing | result
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomIdx, setRoomIdx] = useState(0);
  const [roomPhase, setRoomPhase] = useState("narrative"); // narrative | question
  const [keys, setKeys] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [feedback, setFeedback] = useState(null); // null | "correct" | "wrong"
  const [roomResults, setRoomResults] = useState([]); // per-room: true/false
  const [eliminatedOption, setEliminatedOption] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const grade = settings.grade;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const levels = ADVENTURE_CONFIGS[grade] || [];
  const gp = gameProgress.adventure || {};

  const isUnlocked = (lvl) => lvl === 1 || (gp[lvl - 1]?.stars > 0);
  const getStars = (lvl) => gp[lvl]?.stars || 0;
  const getStarsDisplay = (stars) => "⭐".repeat(stars) + "☆".repeat(3 - stars);

  const startLevel = useCallback((lvlNum) => {
    const config = levels[lvlNum - 1];
    if (!config) return;

    const builtRooms = buildAdventureRooms(config, gradeQ, ADVENTURE_ROOM_THEMES);
    setRooms(builtRooms);
    setSelectedLevel(lvlNum);
    setRoomIdx(0);
    setRoomPhase("narrative");
    setKeys(3);
    setSelectedAnswer(null);
    setFeedback(null);
    setRoomResults([]);
    setEliminatedOption(null);
    setShowExplanation(false);
    setPhase("playing");
  }, [levels, gradeQ]);

  const handleAnswer = () => {
    if (selectedAnswer === null || feedback) return;
    const room = rooms[roomIdx];
    if (!room?.question) return;

    const isCorrect = selectedAnswer === room.question.correct;
    setFeedback(isCorrect ? "correct" : "wrong");
    playSound(isCorrect ? "correct" : "wrong");

    let newKeys = keys;
    if (!isCorrect) {
      newKeys = keys - 1;
      setKeys(newKeys);
    }

    const newResults = [...roomResults, isCorrect];
    setRoomResults(newResults);

    // Show explanation after a delay
    setTimeout(() => {
      setShowExplanation(true);
    }, 500);
  };

  const advanceRoom = () => {
    // Check if game over (no keys left)
    if (keys <= 0) {
      finishLevel();
      return;
    }

    const nextRoom = roomIdx + 1;
    if (nextRoom >= 6) {
      finishLevel();
      return;
    }

    setRoomIdx(nextRoom);
    setRoomPhase("narrative");
    setSelectedAnswer(null);
    setFeedback(null);
    setEliminatedOption(null);
    setShowExplanation(false);
  };

  const useHint = () => {
    if (keys <= 1 || feedback || eliminatedOption !== null) return;
    const room = rooms[roomIdx];
    if (!room?.question) return;

    // Find a wrong option to eliminate
    const wrongOptions = room.question.options
      .map((_, i) => i)
      .filter(i => i !== room.question.correct && i !== selectedAnswer);

    if (wrongOptions.length === 0) return;

    const randomWrong = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    setEliminatedOption(randomWrong);
    setKeys(prev => prev - 1);
    playSound("click");
  };

  const finishLevel = () => {
    const keysLeft = keys;
    let stars = 0;
    if (keysLeft >= 3) stars = 3;
    else if (keysLeft >= 2) stars = 2;
    else if (keysLeft >= 1) stars = 1;

    if (stars > 0) {
      playSound("celebrate");
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2500);
    }

    // Save progress
    const existingStars = gp[selectedLevel]?.stars || 0;
    const newGp = {
      ...gameProgress,
      adventure: {
        ...gp,
        [selectedLevel]: {
          stars: Math.max(existingStars, stars),
        }
      }
    };
    saveGameProgress(newGp);
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
            <h2>🏰 הרפתקת החשיבה</h2>
          </div>

          <div className="level-name-tooltip">
            {displayConfig ? displayConfig.nameHe : "בחרו הרפתקה"}
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
    const room = rooms[roomIdx];
    if (!room) return null;

    const q = room.question;

    // ─── Narrative sub-phase ───
    if (roomPhase === "narrative") {
      return (
        <div className="container">
          <div className="page-content">
            <div className="game-hud">
              <div className="game-hud-section">
                <button onClick={() => setPhase("levelSelect")} className="back-btn" style={{ padding: '4px 10px' }}>✕</button>
                <span className="text-muted" style={{ fontSize: 12 }}>הרפתקה {selectedLevel}</span>
              </div>
              <div className="keys-display">
                {Array.from({ length: 3 }).map((_, i) => (
                  <span key={i}>{i < keys ? "🔑" : "🔒"}</span>
                ))}
              </div>
            </div>

            <div className="game-dots">
              {rooms.map((_, i) => (
                <div
                  key={i}
                  className={`game-dot${i === roomIdx ? " current" : ""}${roomResults[i] === true ? " correct" : ""}${roomResults[i] === false ? " wrong" : ""}`}
                />
              ))}
            </div>

            <div className="adventure-narrative-card">
              <div className="adventure-room-emoji">{room.theme.emoji}</div>
              <div className="adventure-room-name">חדר {roomIdx + 1}: {room.theme.name}</div>
              <div className="adventure-narrative-text">{room.theme.narrative}</div>
              <button className="primary-btn w-full" style={{ backgroundColor: '#f59e0b' }} onClick={() => setRoomPhase("question")}>
                🚪 להיכנס לחדר
              </button>
            </div>
          </div>
        </div>
      );
    }

    // ─── Question sub-phase ───
    if (!q) {
      // No question available, auto-advance
      advanceRoom();
      return null;
    }

    const isTopic4 = q.topic === 4;
    const isTopic5 = q.topic === 5;
    const isImage = q.type === "image";
    const basePath = isImage ? `${import.meta.env.BASE_URL}/${q.imagePath}`.replace("//", "/") : "";

    return (
      <div className="container">
        <div className="page-content">
          <Confetti active={showConfetti} />

          {/* HUD */}
          <div className="game-hud">
            <div className="game-hud-section">
              <button onClick={() => setPhase("levelSelect")} className="back-btn" style={{ padding: '4px 10px' }}>✕</button>
              <span className="text-muted" style={{ fontSize: 12 }}>חדר {roomIdx + 1}/6</span>
            </div>
            <div className="keys-display">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i}>{i < keys ? "🔑" : "🔒"}</span>
              ))}
            </div>
          </div>

          {/* Progress dots */}
          <div className="game-dots">
            {rooms.map((_, i) => (
              <div
                key={i}
                className={`game-dot${i === roomIdx ? " current" : ""}${roomResults[i] === true ? " correct" : ""}${roomResults[i] === false ? " wrong" : ""}`}
              />
            ))}
          </div>

          {/* Question card */}
          <div className="question-card">
            {isImage ? (
              <div>
                <p className="visual-prompt">{q.question}</p>
                <img src={`${basePath}/q.png`} alt="שאלה" style={{ maxWidth: "100%", borderRadius: 8 }} />
              </div>
            ) : isTopic4 && q.visual ? (
              <div>
                <p className="visual-prompt">מצאו את המספר החסר (?)</p>
                <Topic4Visual visual={q.visual} />
              </div>
            ) : isTopic5 && q.visual ? (
              <div>
                <p className="visual-prompt">מה הצורה הבאה?</p>
                <Topic5Visual visual={q.visual} />
              </div>
            ) : (
              <p className="question-text">{q.question}</p>
            )}
          </div>

          {/* Hint button */}
          {!feedback && (
            <div style={{ textAlign: 'center', marginBottom: 10 }}>
              <button
                className="adventure-hint-btn"
                onClick={useHint}
                disabled={keys <= 1 || eliminatedOption !== null}
              >
                🔑 רמז (עולה מפתח)
              </button>
            </div>
          )}

          {/* Options */}
          <div className="options-grid">
            {q.options.map((opt, i) => {
              const isEliminated = eliminatedOption === i;
              const isSelected = selectedAnswer === i;
              const isCorrect = feedback && i === q.correct;
              const isWrong = feedback && isSelected && i !== q.correct;
              const isDisabled = !!feedback || isEliminated;

              let cls = "option-btn";
              if (isTopic5 || isImage) cls += " topic5";
              if (isEliminated) cls += " first-wrong";
              else if (isSelected && !feedback) cls += " selected";
              if (isCorrect) cls += " correct";
              if (isWrong) cls += " wrong";

              return (
                <button
                  key={i}
                  onClick={() => { if (!isDisabled) { setSelectedAnswer(i); playSound("click"); } }}
                  disabled={isDisabled}
                  className={cls}
                  style={{ cursor: isDisabled ? "default" : "pointer" }}
                >
                  <span className="option-num">{i + 1}</span>
                  {isCorrect && <span style={{ color: "#4ade80" }}>✓</span>}
                  {isWrong && <span style={{ color: "#f87171" }}>✗</span>}
                  {isEliminated && <span className="first-wrong-x">✗</span>}
                  {isImage ? <img src={`${basePath}/a${i + 1}.png`} alt={`תשובה ${i + 1}`} style={{ maxWidth: "100%", maxHeight: 80, objectFit: "contain" }} />
                    : isTopic5 && typeof opt === "object" ? <Topic5Option opt={opt} size={40} />
                    : <span className={`option-text${isEliminated ? " disabled" : ""}`} style={{ color: isEliminated ? undefined : "#e2e8f0" }}>{typeof opt === "string" ? opt : opt?.label || ""}</span>}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          {!feedback ? (
            <button
              onClick={handleAnswer}
              disabled={selectedAnswer === null}
              className={`primary-btn w-full${selectedAnswer === null ? " disabled" : ""}`}
            >
              ✓ אישור תשובה
            </button>
          ) : showExplanation ? (
            <div>
              <div className="explanation-card">
                <div className="explanation-title">💡 הסבר</div>
                <p className="explanation-text">{q.explanation}</p>
              </div>
              <button className="primary-btn w-full" style={{ marginTop: 10 }} onClick={advanceRoom}>
                {roomIdx < 5 && keys > 0 ? "← לחדר הבא" : "📊 לתוצאות"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ─── RENDER: Result ───
  if (phase === "result") {
    const correctCount = roomResults.filter(Boolean).length;
    let stars = 0;
    if (keys >= 3) stars = 3;
    else if (keys >= 2) stars = 2;
    else if (keys >= 1) stars = 1;

    const passed = stars > 0;
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
              הרפתקה {selectedLevel} - {levels[selectedLevel - 1]?.nameHe}
            </div>

            <div className={`result-score ${passed ? "pass" : "fail"}`}>
              {correctCount}/6
            </div>

            {stars > 0 && <div className="result-stars">{getStarsDisplay(stars)}</div>}

            <div style={{ color: '#f59e0b', fontSize: 16, fontWeight: 600, margin: '8px 0' }}>
              {"🔑".repeat(keys)} {keys > 0 ? `${keys} מפתחות נותרו` : "אין מפתחות"}
            </div>

            <div className="flex-col gap-8" style={{ marginTop: 16 }}>
              <button className="primary-btn w-full" onClick={() => startLevel(selectedLevel)}>
                🔄 נסו שוב
              </button>
              {hasNext && (
                <button className="primary-btn w-full" style={{ backgroundColor: '#4ade80' }} onClick={() => startLevel(selectedLevel + 1)}>
                  ▶ הרפתקה הבאה
                </button>
              )}
              <button className="secondary-btn w-full" onClick={() => setPhase("levelSelect")}>
                ← חזרה להרפתקאות
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
