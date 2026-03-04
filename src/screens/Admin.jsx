import { TOPIC_NAMES, TOPIC_ICONS, TOPIC_COLORS } from '../constants/topics';

export function Admin({ adminAuth, editingQ, setEditingQ, allQ, customQuestions, saveCQ, adminTopic, setAdminTopic, settings, setAdminAuth, goHome }) {
  if (editingQ) {
    return (
      <div className="container">
        <div className="page-content">
          <h2 className="text-light" style={{marginBottom:14,fontSize:17}}>{editingQ.id?"עריכת שאלה":"שאלה חדשה"}</h2>
          <div className="flex-col gap-10">
            <div><label className="setting-label">נושא</label>
              <select value={editingQ.topic} onChange={e=>setEditingQ({...editingQ,topic:parseInt(e.target.value)})} className="input">
                {[1,2,3,4,5].map(t=><option key={t} value={t}>{TOPIC_NAMES[t]}</option>)}</select></div>
            <div><label className="setting-label">כיתות</label>
              <div className="grades-check-row">
                {[2,3,4].map(g=>{
                  const grades = editingQ.grades || [editingQ.grade || 3];
                  const checked = grades.includes(g);
                  return <label key={g} className="grade-check-label">
                    <input type="checkbox" checked={checked} onChange={e=>{
                      const newG = e.target.checked ? [...grades,g].sort() : grades.filter(x=>x!==g);
                      setEditingQ({...editingQ,grades:newG.length?newG:[g]});
                    }} />
                    {g===2?"ב׳":g===3?"ג׳":"ד׳"}
                  </label>;
                })}
              </div></div>
            <div><label className="setting-label">קושי</label>
              <select value={editingQ.difficulty} onChange={e=>setEditingQ({...editingQ,difficulty:e.target.value})} className="input">
                <option value="easy">קל</option><option value="medium">בינוני</option><option value="hard">קשה</option></select></div>
            <div><label className="setting-label">שאלה</label>
              <textarea value={editingQ.question} onChange={e=>setEditingQ({...editingQ,question:e.target.value})} className="input" style={{minHeight:50}} /></div>
            {[0,1,2,3].map(i=><div key={i}><label className="setting-label">תשובה {i+1} {editingQ.correct===i&&"✓"}</label>
              <div className="flex-row gap-6"><input type="text" value={editingQ.options[i]||""} onChange={e=>{const o=[...editingQ.options];o[i]=e.target.value;setEditingQ({...editingQ,options:o});}} className="input flex-1" />
              <button onClick={()=>setEditingQ({...editingQ,correct:i})} className={`correct-mark-btn ${editingQ.correct===i?"active":"inactive"}`}>✓</button></div></div>)}
            <div><label className="setting-label">הסבר</label>
              <textarea value={editingQ.explanation} onChange={e=>setEditingQ({...editingQ,explanation:e.target.value})} className="input" style={{minHeight:70}} /></div>
            <div className="flex-row gap-8" style={{marginTop:6}}>
              <button onClick={()=>setEditingQ(null)} className="secondary-btn flex-1">ביטול</button>
              <button onClick={()=>{const q={...editingQ};if(!q.id)q.id=`c-${Date.now()}`;const ex=customQuestions.findIndex(cq=>cq.id===q.id);let nq;if(ex>=0){nq=[...customQuestions];nq[ex]=q;}else nq=[...customQuestions,q];saveCQ(nq);setEditingQ(null);}} className="primary-btn flex-1">💾 שמור</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  const fqs = allQ.filter(q=>q.topic===adminTopic);
  return (
    <div className="container">
      <div className="page-content">
        <div className="page-header" style={{marginBottom:16}}>
          <button onClick={()=>{setAdminAuth(false);goHome();}} className="back-btn">← חזרה</button>
          <h2 style={{fontSize:17}}>🔐 ניהול</h2>
        </div>
        <div className="admin-topic-tabs">
          {[1,2,3,4,5].map(t=><button key={t} onClick={()=>setAdminTopic(t)}
            className="admin-topic-btn"
            style={adminTopic===t?{backgroundColor:TOPIC_COLORS[t]+"33",borderColor:TOPIC_COLORS[t],color:TOPIC_COLORS[t]}:undefined}>
            {TOPIC_ICONS[t]} {t}</button>)}
        </div>
        <button onClick={()=>setEditingQ({id:"",topic:adminTopic,grades:[settings.grade],difficulty:"medium",question:"",options:["","","",""],correct:0,explanation:""})}
          className="primary-btn w-full" style={{marginBottom:12,fontSize:13}}>➕ שאלה חדשה</button>
        {fqs.map(q=>{const isC=customQuestions.some(c=>c.id===q.id);
          return(<div key={q.id} className={`admin-q-row${isC?" custom":""}`}>
            <div className="flex-1"><div className="text-light" style={{fontSize:12}}>{typeof q.question==="string"&&q.question.length>45?q.question.slice(0,45)+"...":q.question}</div>
              <div className="text-muted-dark" style={{fontSize:10}}>{(q.grades||[q.grade]).map(g=>g===2?"ב׳":g===3?"ג׳":"ד׳").join(",")} • {q.difficulty==="easy"?"🟢 קל":q.difficulty==="medium"?"🟡 בינוני":"🔴 קשה"}{isC&&" • מותאם"}</div></div>
            {isC&&<div className="flex-row gap-4">
              <button onClick={()=>setEditingQ({...q})} className="admin-action-btn edit">✏️</button>
              <button onClick={()=>{if(confirm("למחוק?"))saveCQ(customQuestions.filter(c=>c.id!==q.id));}} className="admin-action-btn delete">🗑️</button>
            </div>}
          </div>);})}
      </div>
    </div>
  );
}
