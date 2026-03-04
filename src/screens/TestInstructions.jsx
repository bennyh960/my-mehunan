import { TOPIC_COLORS, TEST_INSTRUCTIONS } from '../constants/topics';

export function TestInstructions({ testInstructionTopic, testQuestions, setScreen }) {
  const inst = TEST_INSTRUCTIONS[testInstructionTopic];
  const topicNum = testInstructionTopic;
  const topicQsInTest = testQuestions.filter(q=>q.topic===topicNum).length;
  return (
    <div className="container">
      <div className="card" style={{maxWidth:520,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>{inst?.icon || "📋"}</div>
        <h2 className="text-light" style={{fontSize:20,marginBottom:6}}>{inst?.title || `חלק ${topicNum}`}</h2>
        <div style={{color:TOPIC_COLORS[topicNum],fontSize:13,marginBottom:16}}>{topicQsInTest} שאלות בחלק זה</div>
        <div className="instructions-box">
          <p className="text-muted" style={{fontSize:13,marginBottom:10,fontWeight:600}}>:הוראות</p>
          <p className="text-light" style={{fontSize:13,lineHeight:2,whiteSpace:"pre-line"}}>{inst?.text || ""}</p>
        </div>
        <button onClick={()=>setScreen("test")} className="primary-btn w-full">
          !בואו נתחיל ←
        </button>
      </div>
    </div>
  );
}
