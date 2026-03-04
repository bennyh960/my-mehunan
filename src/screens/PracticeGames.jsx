import { GAME_LIST, ARITHMETIC_LEVELS } from '../constants/games';

export function PracticeGames({ settings, gameProgress, setScreen }) {
  const getGameProgress = (gameId) => {
    const gp = gameProgress[gameId] || {};
    const levels = ARITHMETIC_LEVELS[settings.grade] || [];
    const completed = levels.filter((_, i) => gp[i + 1]?.stars > 0).length;
    return `שלב ${completed}/${levels.length}`;
  };

  return (
    <div className="container">
      <div className="page-content">
        <div className="page-header">
          <button onClick={() => setScreen("home")} className="back-btn">→ חזרה</button>
          <h2>🎮 משחקי תרגול</h2>
        </div>

        <div className="flex-col gap-10">
          {GAME_LIST.map(game => (
            <button
              key={game.id}
              className="game-card"
              onClick={() => setScreen("arithmetic-game")}
            >
              <span className="game-card-icon">{game.icon}</span>
              <div className="game-card-info">
                <div className="game-card-name">{game.nameHe}</div>
                <div className="game-card-desc">{game.description}</div>
                <div className="game-card-progress">{getGameProgress(game.id)}</div>
              </div>
              <span style={{ color: '#64748b', fontSize: 18 }}>←</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
