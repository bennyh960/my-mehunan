export function GradeSelection({ settings, setSettings, setGradeSelected, saveSettings, playSound }) {
  return (
    <div className="container">
      <div className="card" style={{maxWidth:480,textAlign:"center"}}>
        <div style={{fontSize:56,marginBottom:12}}>🧒</div>
        <h1 className="main-title">GeniusPrep</h1>
        <p className="text-muted" style={{fontSize:15,marginBottom:24}}>הכנה למבחן מחוננים שלב ב׳</p>
        <div style={{marginBottom:20}}>
          <label className="field-label">?מה השם שלך</label>
          <input type="text" value={settings.playerName} onChange={e=>setSettings(s=>({...s,playerName:e.target.value}))}
            placeholder="...הכנס שם" className="input" style={{textAlign:"center"}} />
        </div>
        <div style={{marginBottom:28}}>
          <label className="field-label" style={{marginBottom:12}}>?באיזו כיתה את/ה</label>
          <div className="flex-row gap-12" style={{justifyContent:"center"}}>
            {[2,3,4].map(g=>(
              <button key={g} onClick={()=>setSettings(s=>({...s,grade:g}))}
                className={`grade-btn${settings.grade===g?" active":""}`}>
                <span className="grade-label">{g===2?"ב׳":g===3?"ג׳":"ד׳"}</span>
                <span className="grade-sublabel">כיתה</span>
              </button>
            ))}
          </div>
          <p className="grade-desc">
            {settings.grade===2?"שאלות קלות ובסיסיות":settings.grade===3?"שאלות ברמה בינונית":"שאלות מאתגרות ומורכבות"}
          </p>
        </div>
        <button onClick={()=>{setGradeSelected(true);saveSettings(settings);playSound("click");}}
          className="primary-btn">!בואו נתחיל 🚀</button>
      </div>
    </div>
  );
}
