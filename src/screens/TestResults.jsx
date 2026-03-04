import { TOPIC_NAMES, TOPIC_ICONS, TOPIC_COLORS } from '../constants/topics';
import { Confetti } from '../components/ui/Confetti';

export function TestResults({ testAnswers, testQuestions, testStartTime, saveProgress, progress, goHome }) {
  const fa={...testAnswers};
  const cc=testQuestions.filter((q,i)=>fa[i]===q.correct).length;
  const pct=Math.round(cc/testQuestions.length*100);
  const totalTime=Math.round((Date.now()-testStartTime)/1000);
  const tb={};
  testQuestions.forEach((q,i)=>{if(!tb[q.topic])tb[q.topic]={total:0,correct:0};tb[q.topic].total++;if(fa[i]===q.correct)tb[q.topic].correct++;});
  return (
    <div className="container">
      <Confetti active={pct>=80} />
      <div className="card text-center" style={{maxWidth:480}}>
        <div style={{fontSize:50,marginBottom:10}}>{pct>=90?"🏆":pct>=70?"⭐":"💪"}</div>
        <h2 className="text-light" style={{marginBottom:4}}>!סיום מבחן</h2>
        <div className="score-big">{pct}%</div>
        <p className="text-muted" style={{marginBottom:18}}>{cc} מתוך {testQuestions.length} • {Math.floor(totalTime/60)}:{(totalTime%60).toString().padStart(2,"0")}</p>
        <div className="text-right" style={{marginBottom:18}}>
          {Object.entries(tb).map(([t,d])=>(
            <div key={t} className="result-row">
              <span className="text-muted" style={{fontSize:12}}>{TOPIC_ICONS[t]} {TOPIC_NAMES[t]}</span>
              <span style={{color:TOPIC_COLORS[t],fontWeight:"bold",fontSize:12}}>{d.correct}/{d.total}</span>
            </div>
          ))}
        </div>
        <button onClick={goHome} className="primary-btn w-full">🏠 חזרה</button>
      </div>
    </div>
  );
}
