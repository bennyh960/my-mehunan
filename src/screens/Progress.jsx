import { TOPIC_NAMES, TOPIC_ICONS, TOPIC_COLORS } from '../constants/topics';

export function Progress({ progress, getTopicStats, goHome }) {
  let total=0,correct=0;
  Object.values(progress.answers).forEach(a=>{total+=a.attempts;correct+=a.correct;});
  const pct=total>0?Math.round(correct/total*100):0;
  let weakest=null,wp=101;
  [1,2,3,4,5].forEach(t=>{const s=getTopicStats(t);if(s.total>0&&s.pct<wp){wp=s.pct;weakest=t;}});
  return (
    <div className="container">
      <div className="page-content">
        <div className="page-header">
          <button onClick={goHome} className="back-btn">← חזרה</button>
          <h2>📊 התקדמות</h2>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
          {[{l:"שאלות",v:total,ic:"📝"},{l:"הצלחה",v:`${pct}%`,ic:"🎯"},{l:"נקודות",v:progress.points,ic:"⭐"}].map((s,i)=>(
            <div key={i} className="stat-card">
              <span style={{fontSize:22}}>{s.ic}</span>
              <div className="text-light" style={{fontSize:18,fontWeight:"bold"}}>{s.v}</div>
              <div className="text-muted-dark" style={{fontSize:11}}>{s.l}</div>
            </div>
          ))}
        </div>
        <h3 className="text-light" style={{fontSize:13,marginBottom:10}}>:לפי נושא</h3>
        {[1,2,3,4,5].map(t=>{const s=getTopicStats(t);return(
          <div key={t} className="topic-row">
            <span style={{fontSize:18}}>{TOPIC_ICONS[t]}</span>
            <div className="flex-1">
              <div className="text-light" style={{fontSize:12}}>{TOPIC_NAMES[t]}</div>
              <div className="progress-track-lg">
                <div style={{width:`${s.pct}%`,height:"100%",backgroundColor:TOPIC_COLORS[t],borderRadius:3}}/>
              </div>
            </div>
            <span style={{color:TOPIC_COLORS[t],fontWeight:"bold",fontSize:13,minWidth:36,textAlign:"center"}}>{s.pct}%</span>
          </div>
        );})}
        {progress.tests.length>0&&<>
          <h3 className="text-light" style={{fontSize:13,margin:"16px 0 8px"}}>:מבחנים</h3>
          {[...progress.tests].reverse().slice(0,8).map((t,i)=>(
            <div key={i} className="test-row">
              <span className="text-muted" style={{fontSize:12}}>{new Date(t.date).toLocaleDateString("he-IL")}</span>
              <span style={{color:t.pct>=80?"#4ade80":t.pct>=60?"#fbbf24":"#f87171",fontWeight:"bold",fontSize:12}}>{t.pct}%</span>
            </div>
          ))}
        </>}
        {weakest&&wp<80&&<div className="weak-hint">
          <p style={{color:"#fbbf24",fontSize:13}}>💡 כדאי לתרגל עוד: {TOPIC_NAMES[weakest]} ({wp}%)</p>
        </div>}
      </div>
    </div>
  );
}
