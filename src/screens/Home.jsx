import { TOPIC_NAMES, TOPIC_ICONS, TOPIC_COLORS } from '../constants/topics';
import { getCurrentNinja, getNinjaRank, getUnlockedNinjas, getUnlockedDragons, getNextNinjaUnlock, getNextRankUnlock } from '../constants/ninjago';

export function Home({ settings, progress, getTopicStats, startTopic, startTest, setScreen, sparks, isAdmin }) {
  const basePath = import.meta.env.BASE_URL;
  const currentNinja = getCurrentNinja(sparks, isAdmin);
  const rank = getNinjaRank(sparks);
  const unlockedNinjas = getUnlockedNinjas(sparks, isAdmin);
  const nextNinja = isAdmin ? null : getNextNinjaUnlock(sparks);
  const nextRank = isAdmin ? null : getNextRankUnlock(sparks);

  return (
    <div className="container">
      <div className="page-content">
        {/* Ninja banner */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, marginBottom: 12, padding: 16, background: `linear-gradient(135deg, ${currentNinja.color}22, #0f172a)` }}>

          <div className="home-header" style={{ position: 'relative', zIndex: 1 }}>
            <div>
              <h1 className="main-title-sm">
                {settings.playerName?`${settings.playerName} שלום`:"!שלום"} 👋
              </h1>
              <p className="home-subtitle">
                כיתה {settings.grade===2?"ב׳":settings.grade===3?"ג׳":"ד׳"}
                {progress.streak>0&&` • 🔥 ${progress.streak} ימים`}
                {isAdmin && " • 🔑 מנהל"}
              </p>
            </div>
            <div className="flex-row gap-6">
              <button onClick={()=>setScreen("settings")} className="icon-btn">⚙️</button>
              <button onClick={()=>setScreen("admin-login")} className="icon-btn">🔐</button>
            </div>
          </div>

          {/* Sparks + Rank display */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>{rank.icon}</span>
              <div>
                <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: 18 }}>✨ {sparks}</div>
                <div style={{ color: '#94a3b8', fontSize: 11 }}>{rank.nameHe}</div>
              </div>
            </div>

            {/* Unlocked ninja avatars */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {unlockedNinjas.map(n => {
                const isCurrent = n.id === currentNinja.id;
                const size = isCurrent ? 44 : 32;
                return (
                  <div
                    key={n.id}
                    title={`${n.nameHe} - ${n.elementHe}`}
                    style={{
                      width: size,
                      height: size,
                      borderRadius: '50%',
                      border: isCurrent ? `2px solid #fbbf24` : `1px solid ${n.color}66`,
                      overflow: 'hidden',
                      background: n.color + '33',
                      transition: 'all 0.3s',
                    }}
                  >
                    <img
                      src={`${basePath}/${n.img}`}
                      alt={n.nameHe}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next unlock hint */}
          {nextNinja && (
            <div style={{ marginTop: 6, fontSize: 11, color: '#64748b', textAlign: 'center', position: 'relative', zIndex: 1 }}>
              הבא: {nextNinja.nameHe} ({nextNinja.elementHe}) - {nextNinja.unlockAt - sparks} ניצוצות נוספות
            </div>
          )}
          {!nextNinja && nextRank && (
            <div style={{ marginTop: 6, fontSize: 11, color: '#64748b', textAlign: 'center', position: 'relative', zIndex: 1 }}>
              דרגה הבאה: {nextRank.nameHe} - {nextRank.minSparks - sparks} ניצוצות נוספות
            </div>
          )}
        </div>

        <div className="topic-list">
          {[1,2,3,4,5].map(t=>{
            const st=getTopicStats(t);
            return (
              <button key={t} onClick={()=>startTopic(t)} className="topic-card">
                <div className="topic-card-inner">
                  <span style={{fontSize:26}}>{TOPIC_ICONS[t]}</span>
                  <div className="text-right flex-1">
                    <div className="topic-name">{TOPIC_NAMES[t]}</div>
                    <div className="topic-meta">{st.count} שאלות • {st.pct}%</div>
                  </div>
                </div>
                <div className="topic-progress-bar">
                  <div style={{width:`${st.pct}%`,height:"100%",backgroundColor:TOPIC_COLORS[t],transition:"width 0.5s"}}/>
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex-row gap-8" style={{ marginBottom: 8 }}>
          <button onClick={()=>setScreen("practice-games")} className="primary-btn flex-1" style={{ backgroundColor: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)' }}>
            🎮 משחקי תרגול
          </button>
          <button onClick={()=>setScreen("practices")} className="primary-btn flex-1" style={{ backgroundColor: 'rgba(79,70,229,0.15)', color: '#818cf8', border: '1px solid rgba(79,70,229,0.3)' }}>
            📚 תרגול
          </button>
        </div>
        <div className="flex-row gap-8">
          <button onClick={startTest} className="primary-btn flex-1">📝 מבחן מלא</button>
          <button onClick={()=>setScreen("progress")} className="secondary-btn flex-1">📊 התקדמות</button>
        </div>
      </div>
    </div>
  );
}
