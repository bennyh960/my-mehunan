import { TOPIC_NAMES, TOPIC_COLORS } from '../constants/topics';
import { Topic4Visual } from '../components/visuals/Topic4Visual';
import { Topic5Visual } from '../components/visuals/Topic5Visual';
import { Topic5Option } from '../components/visuals/Topic5Option';
import { Timer } from '../components/ui/Timer';
import { Confetti } from '../components/ui/Confetti';

export function Practice({
  currentQuestion, currentQuestionIdx, totalQs, testMode,
  selectedAnswer, setSelectedAnswer, showResult, showExplanation, showConfetti,
  attemptNum, wrongFirstChoice, settings, playSound,
  testQuestions, practiceQ, getQState,
  goHome, submitAnswer, nextQuestion, prevQuestion, skipQuestion, resetCurrentAnswer, goToQuestion,
  handleTimerExpire,
}) {
  const isTopic4 = currentQuestion.topic===4;
  const isTopic5 = currentQuestion.topic===5;
  const timerSecs = settings.timerEnabled ? (settings.timerSeconds[currentQuestion.topic]||60) : 0;

  return (
    <div className="container">
      <Confetti active={showConfetti} />
      <div className="page-content">
        <div className="practice-header">
          <button onClick={goHome} className="back-btn">← חזרה</button>
          <div className="text-center flex-1">
            <span className="practice-topic-label" style={{color:TOPIC_COLORS[currentQuestion.topic]}}>
              {testMode?"מבחן מלא":TOPIC_NAMES[currentQuestion.topic]}
            </span>
            <div className="practice-counter">שאלה {currentQuestionIdx+1} / {totalQs}</div>
          </div>
          {timerSecs>0&&!showResult&&<Timer seconds={timerSecs} running={!showResult} onExpire={handleTimerExpire}/>}
        </div>
        <div className="progress-track-thin">
          <div style={{width:`${((currentQuestionIdx+1)/totalQs)*100}%`,height:"100%",backgroundColor:TOPIC_COLORS[currentQuestion.topic],borderRadius:2,transition:"width 0.3s"}}/>
        </div>
        {/* Question dots - clickable mini-map */}
        {totalQs <= 25 && (
          <div className="q-dots">
            {Array.from({length:totalQs},(_,i) => {
              const qs = getQState(i);
              const isCurrent = i === currentQuestionIdx;
              const q = testMode ? testQuestions[i] : practiceQ[i];
              const answered = qs.submitted;
              const isCorrect = answered && qs.answer === q?.correct;
              let bg = "#1e293b";
              if (answered && isCorrect) bg = "#4ade80";
              else if (answered && !isCorrect) bg = "#f87171";
              else if (qs.answer !== null && !qs.submitted) bg = "#818cf8";
              return (
                <button key={i} onClick={()=>goToQuestion(i)}
                  className={`q-dot${isCurrent?" current":""}`}
                  style={{backgroundColor:bg,borderColor:isCurrent?TOPIC_COLORS[currentQuestion.topic]:undefined}} />
              );
            })}
          </div>
        )}

        {/* Question area - stable height container */}
        <div className="question-area">
        <div className="question-card">
          {isTopic4 && currentQuestion.visual ? (
            <div>
              <p className="visual-prompt">מצאו את המספר החסר (?)</p>
              <Topic4Visual visual={currentQuestion.visual} />
            </div>
          ) : isTopic5 && currentQuestion.visual ? (
            <div>
              <p className="visual-prompt">מה הצורה הבאה?</p>
              <Topic5Visual visual={currentQuestion.visual} />
            </div>
          ) : (
            <p className="question-text">
              {currentQuestion.question}
            </p>
          )}
        </div>

        {/* Second chance hint */}
        {attemptNum===2 && !showResult && !testMode && (
          <div className="hint-box">
            <span className="hint-text">🤔 לא מדויק... נסה שוב! נשארו עוד {currentQuestion.options.length - 1} אפשרויות</span>
          </div>
        )}

        {/* Options */}
        <div className="options-grid">
          {currentQuestion.options.map((opt, i) => {
            const isSelected = selectedAnswer===i;
            const isCorrect = showResult && i===currentQuestion.correct;
            const isWrong = showResult && isSelected && i!==currentQuestion.correct;
            const wasFirstWrong = wrongFirstChoice===i;
            const isDisabled = showResult || wasFirstWrong;

            let cls = "option-btn";
            if (isTopic5) cls += " topic5";
            if (wasFirstWrong && !showResult) cls += " first-wrong";
            else if (isSelected && !showResult) cls += " selected";
            if (isCorrect) cls += " correct";
            if (isWrong) cls += " wrong";

            return (
              <button key={i} onClick={()=>{if(!isDisabled){setSelectedAnswer(i);playSound("click");}}}
                disabled={isDisabled}
                className={cls}
                style={{cursor:isDisabled?"default":"pointer"}}>
                <span className="option-num">{i+1}</span>
                {isCorrect&&<span style={{color:"#4ade80"}}>✓</span>}
                {isWrong&&<span style={{color:"#f87171"}}>✗</span>}
                {wasFirstWrong&&!showResult&&<span className="first-wrong-x">✗</span>}
                {isTopic5 && typeof opt === "object" ? <Topic5Option opt={opt} size={40} />
                  : <span className={`option-text${wasFirstWrong&&!showResult?" disabled":""}`} style={{color:wasFirstWrong&&!showResult?undefined:"#e2e8f0"}}>{typeof opt==="string"?opt:opt?.label||""}</span>}
              </button>
            );
          })}
        </div>

        </div>
        {/* Action buttons */}
        {!showResult ? (
          <div className="flex-col gap-8">
            <button onClick={submitAnswer} disabled={selectedAnswer===null}
              className={`primary-btn w-full${selectedAnswer===null?" disabled":""}`}>
              ✓ אישור תשובה
            </button>
            <div className="flex-row gap-8">
              {currentQuestionIdx > 0 && (
                <button onClick={prevQuestion} className="nav-btn">→ קודמת</button>
              )}
              <button onClick={skipQuestion} className="nav-btn skip flex-1">
                {currentQuestionIdx<totalQs-1?"דלג ←":"סיום ←"}
              </button>
            </div>
          </div>
        ) : !testMode ? (
          showExplanation ? (
            <div>
              <div className="explanation-card">
                <div className="explanation-title">💡 הסבר</div>
                <p className="explanation-text">{currentQuestion.explanation}</p>
              </div>
              <div className="flex-row gap-8" style={{marginTop:8}}>
                {currentQuestionIdx > 0 && (
                  <button onClick={prevQuestion} className="nav-btn">→</button>
                )}
                <button onClick={resetCurrentAnswer} className="nav-btn retry">↺ נסה שוב</button>
                <button onClick={nextQuestion} className="primary-btn flex-1">
                  {currentQuestionIdx<totalQs-1?"← שאלה הבאה":"🎉 סיום"}
                </button>
              </div>
            </div>
          ) : null
        ) : (
          /* Test mode - after answering */
          <div className="flex-row gap-8">
            {currentQuestionIdx > 0 && (
              <button onClick={prevQuestion} className="nav-btn">→</button>
            )}
            <button onClick={resetCurrentAnswer} className="nav-btn retry">↺ שנה</button>
            <button onClick={nextQuestion} className="primary-btn flex-1">
              {currentQuestionIdx<totalQs-1?"← שאלה הבאה":"🎉 סיום מבחן"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
