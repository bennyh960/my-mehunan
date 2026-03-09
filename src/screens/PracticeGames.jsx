import { GAME_LIST, ARITHMETIC_LEVELS, ADVENTURE_CONFIGS, NINJA_CONFIGS } from '../constants/games';
import { CLOCK_LEVELS } from '../utils/clock';
import { isGameUnlocked, getGameUnlockInfo } from '../constants/ninjago';

export function PracticeGames({ settings, gameProgress, setScreen, sparks, isAdmin }) {
  const getGameProgress = (gameId) => {
    // For ninjago, check both 'ninjago' and legacy 'ninja' keys
    const gpKey = gameId === "ninjago" ? (gameProgress.ninjago && Object.keys(gameProgress.ninjago).length > 0 ? "ninjago" : "ninja") : gameId;
    const gp = gameProgress[gpKey] || {};
    if (gameId === "arithmetic") {
      const levels = ARITHMETIC_LEVELS[settings.grade] || [];
      const completed = levels.filter((_, i) => gp[i + 1]?.stars > 0).length;
      return `שלב ${completed}/${levels.length}`;
    }
    if (gameId === "adventure") {
      const levels = ADVENTURE_CONFIGS[settings.grade] || [];
      const completed = levels.filter((_, i) => gp[i + 1]?.stars > 0).length;
      return `הרפתקה ${completed}/${levels.length}`;
    }
    if (gameId === "clock") {
      const completed = CLOCK_LEVELS.filter((_, i) => gp[i + 1]?.stars > 0).length;
      return `שלב ${completed}/${CLOCK_LEVELS.length}`;
    }
    if (gameId === "ninjago" || gameId === "ninja") {
      const levels = NINJA_CONFIGS[settings.grade] || [];
      const completed = levels.filter((_, i) => gp[i + 1]?.stars > 0).length;
      return `שלב ${completed}/${levels.length}`;
    }
    if (gameId === "ninja-quest") {
      const qp = gameProgress.quest || {};
      const worldsDone = Object.values(qp.worlds || {}).filter(w => w.stagesComplete >= 5).length;
      const currentWorld = qp.worlds ? Object.values(qp.worlds).reduce((acc, w) => acc + (w.stagesComplete || 0), 0) : 0;
      return `${currentWorld}/20 שלבים • ${worldsDone}/4 עולמות`;
    }
    return "";
  };

  return (
    <div className="container">
      <div className="page-content">
        <div className="page-header">
          <button onClick={() => setScreen("home")} className="back-btn">→ חזרה</button>
          <h2>🎮 משחקי תרגול</h2>
        </div>

        {/* Sparks display */}
        <div style={{ textAlign: 'center', marginBottom: 12, padding: '8px 0', color: '#fbbf24', fontSize: 16, fontWeight: 600 }}>
          ✨ {sparks} ניצוצות
          {isAdmin && <span style={{ marginRight: 8, fontSize: 12, color: '#94a3b8' }}>🔑 מנהל</span>}
        </div>

        <div className="flex-col gap-10">
          {GAME_LIST.map(game => {
            const unlocked = isGameUnlocked(game.id, sparks, isAdmin);
            const unlockInfo = getGameUnlockInfo(game.id);
            const sparksNeeded = unlockInfo ? unlockInfo.sparksNeeded - sparks : 0;

            return (
              <button
                key={game.id}
                className={`game-card${!unlocked ? " locked" : ""}`}
                onClick={() => unlocked && setScreen(`${game.id}-game`)}
                disabled={!unlocked}
                style={!unlocked ? { opacity: 0.5, filter: 'grayscale(0.6)' } : undefined}
              >
                <span className="game-card-icon">{unlocked ? game.icon : "🔒"}</span>
                <div className="game-card-info">
                  <div className="game-card-name">{game.nameHe}</div>
                  <div className="game-card-desc">
                    {unlocked ? game.description : `צריך ${unlockInfo?.sparksNeeded || 0} ניצוצות (עוד ${sparksNeeded})`}
                  </div>
                  {unlocked && <div className="game-card-progress">{getGameProgress(game.id)}</div>}
                </div>
                <span style={{ color: '#64748b', fontSize: 18 }}>{unlocked ? "←" : ""}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
