import { TOPIC_ICONS } from '../constants/topics';

export function Settings({ settings, saveSettings, resetProgress, goHome }) {
  return (
    <div className="container">
      <div className="page-content-narrow">
        <div className="page-header">
          <button onClick={goHome} className="back-btn">← חזרה</button>
          <h2>⚙️ הגדרות</h2>
        </div>
        <div className="flex-col gap-12">
          <div className="setting-row">
            <label className="setting-label">שם</label>
            <input type="text" value={settings.playerName} onChange={e=>saveSettings({...settings,playerName:e.target.value})} className="input" style={{width:140}} />
          </div>
          <div className="setting-row">
            <label className="setting-label">כיתה</label>
            <div className="flex-row gap-4">
              {[2,3,4].map(g=><button key={g} onClick={()=>saveSettings({...settings,grade:g})}
                className={`chip${settings.grade===g?" active":""}`} style={{fontSize:12}}>
                {g===2?"ב׳":g===3?"ג׳":"ד׳"}</button>)}
            </div>
          </div>
          <div className="setting-row">
            <label className="setting-label">אנימציות</label>
            <div className="flex-row gap-4">
              {[["full","מלאות"],["fast","מהירות"],["off","כבויות"]].map(([v,l])=><button key={v} onClick={()=>saveSettings({...settings,animations:v})}
                className={`chip-sm${settings.animations===v?" active":""}`}>{l}</button>)}
            </div>
          </div>
          <div className="setting-row">
            <label className="setting-label">סאונד</label>
            <button onClick={()=>saveSettings({...settings,sound:!settings.sound})}
              className={`toggle-btn ${settings.sound?"on":"off"}`}>{settings.sound?"מופעל":"כבוי"}</button>
          </div>
          <div className="setting-row">
            <label className="setting-label">טיימר</label>
            <button onClick={()=>saveSettings({...settings,timerEnabled:!settings.timerEnabled})}
              className={`toggle-btn ${settings.timerEnabled?"on":"off"}`}>{settings.timerEnabled?"מופעל":"כבוי"}</button>
          </div>
          {settings.timerEnabled&&<div className="timer-panel">
            <label className="setting-label" style={{marginBottom:8,display:"block"}}>:זמן לשאלה (שניות)</label>
            {[1,2,3,4,5].map(t=><div key={t} className="timer-row">
              <span className="text-muted" style={{fontSize:11}}>{TOPIC_ICONS[t]} חלק {t}</span>
              <input type="number" min="10" max="300" value={settings.timerSeconds[t]}
                onChange={e=>saveSettings({...settings,timerSeconds:{...settings.timerSeconds,[t]:parseInt(e.target.value)||60}})}
                className="input" style={{width:65,textAlign:"center",fontSize:12,padding:"4px 6px"}} />
            </div>)}
          </div>}
          <div className="setting-row">
            <label className="setting-label">טיימר במשחקים</label>
            <button onClick={()=>saveSettings({...settings,gameTimerEnabled:!settings.gameTimerEnabled})}
              className={`toggle-btn ${settings.gameTimerEnabled?"on":"off"}`}>{settings.gameTimerEnabled?"מופעל":"כבוי"}</button>
          </div>
          {settings.gameTimerEnabled&&<div className="timer-panel">
            <label className="setting-label" style={{marginBottom:8,display:"block"}}>⏱️ זמן לשאלה במשחקים (שניות)</label>
            <div className="flex-row gap-4" style={{flexWrap:'wrap',justifyContent:'center'}}>
              {[{v:0,l:"ברירת מחדל"},{v:15,l:"15"},{v:20,l:"20"},{v:25,l:"25"},{v:30,l:"30"},{v:40,l:"40"},{v:60,l:"60"}].map(({v,l})=>
                <button key={v} onClick={()=>saveSettings({...settings,gameTimerSeconds:v})}
                  className={`chip-sm${(settings.gameTimerSeconds||0)===v?" active":""}`}>{l}</button>)}
            </div>
            <span className="text-muted" style={{fontSize:10,display:'block',textAlign:'center',marginTop:6}}>
              {(settings.gameTimerSeconds||0)===0?"כל משחק משתמש בזמן שלו":"זמן אחיד לכל המשחקים"}
            </span>
          </div>}
          <div className="setting-row">
            <label className="setting-label">מצב מהיר (הורה לחוץ)</label>
            <button onClick={()=>saveSettings({...settings,rushMode:!settings.rushMode})}
              className={`toggle-btn ${settings.rushMode?"danger-on":"off"}`}>{settings.rushMode?"מופעל":"כבוי"}</button>
          </div>
          <div className="setting-row">
            <label className="setting-label">שאלות במבחן</label>
            <div className="flex-row gap-4">
              {[10,15,20].map(n=><button key={n} onClick={()=>saveSettings({...settings,testQuestionCount:n})}
                className={`chip${settings.testQuestionCount===n?" active":""}`} style={{fontSize:12}}>{n}</button>)}
            </div>
          </div>
          <button onClick={()=>{if(confirm("לאפס את כל ההתקדמות?"))resetProgress();}} className="danger-btn">🗑️ איפוס התקדמות</button>
        </div>
      </div>
    </div>
  );
}
