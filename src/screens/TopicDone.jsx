import { TOPIC_NAMES, TOPIC_COLORS } from '../constants/topics';

export function TopicDone({ currentTopic, getTopicStats, startTopic, goHome }) {
  const st=getTopicStats(currentTopic);
  const medal=st.pct>=90?"🥇":st.pct>=75?"🥈":st.pct>=50?"🥉":"💪";
  return (
    <div className="container">
      <div className="card text-center" style={{maxWidth:400}}>
        <div style={{fontSize:56,marginBottom:10}}>{medal}</div>
        <h2 className="text-light" style={{marginBottom:6}}>!סיימת</h2>
        <p className="text-muted" style={{marginBottom:16}}>{TOPIC_NAMES[currentTopic]}</p>
        <div style={{color:TOPIC_COLORS[currentTopic],fontSize:34,fontWeight:"bold",marginBottom:16}}>{st.pct}%</div>
        <div className="flex-row gap-8">
          <button onClick={()=>startTopic(currentTopic)} className="secondary-btn flex-1">🔄 שוב</button>
          <button onClick={goHome} className="primary-btn flex-1">🏠 ראשי</button>
        </div>
      </div>
    </div>
  );
}
