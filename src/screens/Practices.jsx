import { FRACTION_LEVELS } from '../constants/fractions';

const PRACTICE_LIST = [
  {
    id: "fractions",
    nameHe: "בניית שברים",
    icon: "🍕",
    color: "#4f46e5",
    description: "למדו שברים עם פיצה, עוגה ועוד! חצי, שליש, רבע ויותר!",
  },
  {
    id: "multiplication",
    nameHe: "לוח הכפל",
    icon: "🔢",
    color: "#6366f1",
    description: "למדו את לוח הכפל עם תמונות, קבוצות ותרגול מהנה! ×2 עד ×10",
  },
];

export function Practices({ settings, gameProgress, setScreen }) {
  const getProgress = (id) => {
    if (id === "fractions") {
      const fp = gameProgress.fractions || {};
      const completed = FRACTION_LEVELS.filter((_, i) => fp[i + 1]?.stars > 0).length;
      return `שלב ${completed}/${FRACTION_LEVELS.length}`;
    }
    if (id === "multiplication") {
      const mp = gameProgress.multiplication || {};
      const completed = Object.keys(mp).filter(k => mp[k]?.stars > 0).length;
      return completed > 0 ? `${completed}/9 לוחות` : "";
    }
    return "";
  };

  return (
    <div className="container">
      <div className="page-content">
        <div className="page-header">
          <button onClick={() => setScreen("home")} className="back-btn">→ חזרה</button>
          <h2>📚 תרגול</h2>
        </div>

        <div className="flex-col gap-10">
          {PRACTICE_LIST.map(item => (
            <button
              key={item.id}
              className="game-card"
              onClick={() => setScreen(`${item.id}-game`)}
              style={{ borderRight: `4px solid ${item.color}` }}
            >
              <span className="game-card-icon">{item.icon}</span>
              <div className="game-card-info">
                <div className="game-card-name">{item.nameHe}</div>
                <div className="game-card-desc">{item.description}</div>
                <div className="game-card-progress">{getProgress(item.id)}</div>
              </div>
              <span style={{ color: '#64748b', fontSize: 18 }}>←</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
