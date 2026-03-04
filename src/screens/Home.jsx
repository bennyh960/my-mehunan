import { TOPIC_NAMES, TOPIC_ICONS, TOPIC_COLORS } from '../constants/topics';

export function Home({ settings, progress, getTopicStats, startTopic, startTest, setScreen }) {
  return (
    <div className="container">
      <div className="page-content">
        <div className="home-header">
          <div>
            <h1 className="main-title-sm">
              {settings.playerName?`${settings.playerName} שלום`:"!שלום"} 👋
            </h1>
            <p className="home-subtitle">
              כיתה {settings.grade===2?"ב׳":settings.grade===3?"ג׳":"ד׳"} • {progress.points} נק׳
              {progress.streak>0&&` • 🔥 ${progress.streak} ימים`}
            </p>
          </div>
          <div className="flex-row gap-6">
            <button onClick={()=>setScreen("settings")} className="icon-btn">⚙️</button>
            <button onClick={()=>setScreen("admin-login")} className="icon-btn">🔐</button>
          </div>
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
        <button onClick={()=>setScreen("practice-games")} className="primary-btn w-full" style={{ marginBottom: 8, backgroundColor: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.3)' }}>
          🎮 משחקי תרגול
        </button>
        <div className="flex-row gap-8">
          <button onClick={startTest} className="primary-btn flex-1">📝 מבחן מלא</button>
          <button onClick={()=>setScreen("progress")} className="secondary-btn flex-1">📊 התקדמות</button>
        </div>
      </div>
    </div>
  );
}
