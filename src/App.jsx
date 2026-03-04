import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { SoundEngine } from './utils/sound';
import { DEFAULT_SETTINGS, DEFAULT_PROGRESS } from './constants/settings';
import { QUESTIONS } from './constants/questions';
import { TOPIC_COLORS } from './constants/topics';

import { GradeSelection } from './screens/GradeSelection';
import { Home } from './screens/Home';
import { Practice } from './screens/Practice';
import { TestInstructions } from './screens/TestInstructions';
import { TopicDone } from './screens/TopicDone';
import { TestResults } from './screens/TestResults';
import { Progress } from './screens/Progress';
import { Settings } from './screens/Settings';
import { AdminLogin } from './screens/AdminLogin';
import { Admin } from './screens/Admin';
import { PracticeGames } from './screens/PracticeGames';
import { ArithmeticGame } from './screens/ArithmeticGame';
import { DEFAULT_GAME_PROGRESS } from './constants/games';

export default function App() {
  const [screen, setScreen] = useState("home");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [customQuestions, setCustomQuestions] = useState([]);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [testQuestions, setTestQuestions] = useState([]);
  const [testAnswers, setTestAnswers] = useState({});
  const [testStartTime, setTestStartTime] = useState(null);
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPwInput, setAdminPwInput] = useState("");
  const [editingQ, setEditingQ] = useState(null);
  const [gradeSelected, setGradeSelected] = useState(false);
  const [adminTopic, setAdminTopic] = useState(1);
  const [gameProgress, setGameProgress] = useState(DEFAULT_GAME_PROGRESS);
  const [loaded, setLoaded] = useState(false);
  const [testInstructionTopic, setTestInstructionTopic] = useState(null);
  const [attemptNum, setAttemptNum] = useState(1);
  const [wrongFirstChoice, setWrongFirstChoice] = useState(null);
  const [shuffledTopicQ, setShuffledTopicQ] = useState([]);
  const [qStates, setQStates] = useState({});
  const qStatesRef = useRef({});
  qStatesRef.current = qStates;

  // Load
  useEffect(() => {
    try { const s = localStorage.getItem("gp_settings"); if (s) { setSettings(p=>({...p,...JSON.parse(s)})); setGradeSelected(true); } } catch {}
    try { const p = localStorage.getItem("gp_progress"); if (p) setProgress(JSON.parse(p)); } catch {}
    try { const q = localStorage.getItem("gp_questions"); if (q) setCustomQuestions(JSON.parse(q)); } catch {}
    try { const g = localStorage.getItem("gp_games"); if (g) setGameProgress(JSON.parse(g)); } catch {}
    setLoaded(true);
  }, []);

  const save = useCallback((key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, []);
  const saveSettings = useCallback(s => { setSettings(s); save("gp_settings", s); }, [save]);
  const saveProgress = useCallback(p => { setProgress(p); save("gp_progress", p); }, [save]);
  const saveCQ = useCallback(q => { setCustomQuestions(q); save("gp_questions", q); }, [save]);
  const saveGameProgress = useCallback(g => { setGameProgress(g); save("gp_games", g); }, [save]);

  const allQ = useMemo(() => [...QUESTIONS, ...customQuestions], [customQuestions]);
  const gradeQ = useMemo(() => allQ.filter(q => {
    if (q.grades) return q.grades.includes(settings.grade);
    return q.grade === settings.grade;
  }), [allQ, settings.grade]);
  const topicQ = useMemo(() => currentTopic ? gradeQ.filter(q => q.topic === currentTopic) : [], [gradeQ, currentTopic]);

  const playSound = useCallback(t => { if (settings.sound) SoundEngine.play(t); }, [settings.sound]);

  const getTopicStats = t => {
    const tqs = gradeQ.filter(q => q.topic === t);
    let total=0,correct=0;
    tqs.forEach(q => { const a = progress.answers[q.id]; if(a){total+=a.attempts;correct+=a.correct;} });
    return { total, correct, pct: total>0?Math.round(correct/total*100):0, count: tqs.length };
  };

  const goHome = () => { setScreen("home"); setTestMode(false); setCurrentTopic(null); };

  const startTopic = t => {
    setCurrentTopic(t); setCurrentQuestionIdx(0); setQStates({});
    setSelectedAnswer(null); setShowResult(false); setShowExplanation(false);
    setAttemptNum(1); setWrongFirstChoice(null); setScreen("practice");
    setShuffledTopicQ(() => {
      const tqs = gradeQ.filter(q => q.topic === t);
      return [...tqs].sort(() => Math.random() - 0.5);
    });
  };

  const startTest = () => {
    const qs = [];
    const perTopic = Math.ceil(settings.testQuestionCount / 5);
    for (let t=1;t<=5;t++) {
      const tqs = gradeQ.filter(q=>q.topic===t).sort(()=>Math.random()-0.5);
      qs.push(...tqs.slice(0,perTopic));
    }
    const finalQs = qs.slice(0,settings.testQuestionCount);
    setTestQuestions(finalQs);
    setTestAnswers({}); setTestStartTime(Date.now()); setCurrentQuestionIdx(0); setQStates({});
    setSelectedAnswer(null); setShowResult(false); setShowExplanation(false);
    setAttemptNum(1); setWrongFirstChoice(null);
    setTestMode(true);
    setTestInstructionTopic(finalQs.length > 0 ? finalQs[0].topic : null);
    setScreen("test-instructions");
  };

  const practiceQ = shuffledTopicQ.length > 0 ? shuffledTopicQ : topicQ;
  const currentQuestion = testMode ? testQuestions[currentQuestionIdx] : practiceQ[currentQuestionIdx];
  const totalQs = testMode ? testQuestions.length : practiceQ.length;

  const getQState = (idx) => qStatesRef.current[idx] || { answer: null, showResult: false, showExplanation: false, attemptNum: 1, wrongFirst: null, submitted: false };

  useEffect(() => {
    const s = getQState(currentQuestionIdx);
    setSelectedAnswer(s.answer);
    setShowResult(s.showResult);
    setShowExplanation(s.showExplanation);
    setAttemptNum(s.attemptNum);
    setWrongFirstChoice(s.wrongFirst);
  }, [currentQuestionIdx]);

  const saveQState = (idx, patch) => {
    setQStates(prev => ({ ...prev, [idx]: { ...getQState(idx), ...patch } }));
  };

  const resetQuestionState = (idx) => {
    const target = idx !== undefined ? idx : currentQuestionIdx;
    setQStates(prev => ({
      ...prev,
      [target]: { answer: null, showResult: false, showExplanation: false, attemptNum: 1, wrongFirst: null, submitted: false }
    }));
    if (target === currentQuestionIdx) {
      setSelectedAnswer(null); setShowResult(false); setShowExplanation(false);
      setAttemptNum(1); setWrongFirstChoice(null);
    }
  };

  const submitAnswer = () => {
    if (selectedAnswer===null) return;
    const isCorrect = selectedAnswer === currentQuestion.correct;

    if (!isCorrect && attemptNum === 1 && !testMode) {
      playSound("wrong");
      setWrongFirstChoice(selectedAnswer);
      setAttemptNum(2);
      setSelectedAnswer(null);
      saveQState(currentQuestionIdx, { wrongFirst: selectedAnswer, attemptNum: 2, answer: null });
      return;
    }

    setShowResult(true);
    playSound(isCorrect?"correct":"wrong");
    if (isCorrect && !testMode) { setShowConfetti(true); setTimeout(()=>setShowConfetti(false),2000); }

    const newProg = {...progress};
    const today = new Date().toDateString();
    if (newProg.lastDate !== today) {
      const yesterday = new Date(Date.now()-86400000).toDateString();
      newProg.streak = newProg.lastDate === yesterday ? newProg.streak+1 : 1;
      newProg.lastDate = today;
    }
    const k = currentQuestion.id;
    if (!newProg.answers[k]) newProg.answers[k] = {attempts:0,correct:0};
    newProg.answers[k].attempts += 1;
    if (isCorrect) { newProg.answers[k].correct += 1; newProg.points += attemptNum===1?10:5; }
    saveProgress(newProg);

    if (testMode) setTestAnswers(prev=>({...prev,[currentQuestionIdx]:selectedAnswer}));

    saveQState(currentQuestionIdx, { answer: selectedAnswer, showResult: true, submitted: true, attemptNum, wrongFirst: wrongFirstChoice });

    const delay = settings.rushMode?300:settings.animations==="off"?500:1200;
    if (!testMode) {
      setTimeout(() => {
        setShowExplanation(true);
        saveQState(currentQuestionIdx, { answer: selectedAnswer, showResult: true, showExplanation: true, submitted: true, attemptNum, wrongFirst: wrongFirstChoice });
      }, delay);
    }
  };

  const goToQuestion = (idx) => {
    if (!showResult && selectedAnswer !== null) {
      saveQState(currentQuestionIdx, { answer: selectedAnswer, attemptNum, wrongFirst: wrongFirstChoice });
    }
    setCurrentQuestionIdx(idx);
  };

  const prevQuestion = () => {
    if (currentQuestionIdx > 0) goToQuestion(currentQuestionIdx - 1);
  };

  const resetCurrentAnswer = () => {
    resetQuestionState(currentQuestionIdx);
  };

  const skipQuestion = () => {
    if (testMode && !getQState(currentQuestionIdx).submitted) {
      setTestAnswers(prev=>({...prev,[currentQuestionIdx]:-1}));
    }
    if (currentQuestionIdx < totalQs - 1) {
      const nextIdx = currentQuestionIdx + 1;
      const nextQ = testMode ? testQuestions[nextIdx] : practiceQ[nextIdx];
      const currQ = currentQuestion;
      if (testMode && nextQ && currQ && nextQ.topic !== currQ.topic) {
        goToQuestion(nextIdx);
        setTestInstructionTopic(nextQ.topic);
        setScreen("test-instructions");
        return;
      }
      goToQuestion(nextIdx);
    } else {
      if (testMode) {
        const fa = {...testAnswers};
        const totalTime = Math.round((Date.now()-testStartTime)/1000);
        const cc = testQuestions.filter((q,i)=>fa[i]===q.correct).length;
        const pct = Math.round(cc/testQuestions.length*100);
        saveProgress({...progress, tests:[...progress.tests,{date:new Date().toISOString(),pct,time:totalTime,correct:cc,total:testQuestions.length}]});
        setScreen("test-results");
      } else {
        setScreen("topic-done");
      }
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIdx < totalQs-1) {
      const nextIdx = currentQuestionIdx + 1;
      const nextQ = testMode ? testQuestions[nextIdx] : practiceQ[nextIdx];
      const currQ = testMode ? testQuestions[currentQuestionIdx] : practiceQ[currentQuestionIdx];
      if (testMode && nextQ && currQ && nextQ.topic !== currQ.topic) {
        goToQuestion(nextIdx);
        setTestInstructionTopic(nextQ.topic);
        setScreen("test-instructions");
        return;
      }
      goToQuestion(nextIdx);
    } else {
      if (testMode) {
        const fa = {...testAnswers,[currentQuestionIdx]:selectedAnswer};
        const totalTime = Math.round((Date.now()-testStartTime)/1000);
        const cc = testQuestions.filter((q,i)=>fa[i]===q.correct).length;
        const pct = Math.round(cc/testQuestions.length*100);
        saveProgress({...progress, tests:[...progress.tests,{date:new Date().toISOString(),pct,time:totalTime,correct:cc,total:testQuestions.length}]});
        setScreen("test-results");
      } else { setScreen("topic-done"); }
    }
  };

  const handleTimerExpire = useCallback(() => { if (selectedAnswer!==null) submitAnswer(); }, [selectedAnswer]);

  const resetProgress = useCallback(() => {
    const fresh = { ...DEFAULT_PROGRESS };
    setProgress(fresh);
    try { localStorage.setItem("gp_progress", JSON.stringify(fresh)); } catch {}
  }, []);

  if (!loaded) return <div className="container"><p className="loading-text">...טוען</p></div>;

  if (!gradeSelected) {
    return <GradeSelection settings={settings} setSettings={setSettings} setGradeSelected={setGradeSelected} saveSettings={saveSettings} playSound={playSound} />;
  }

  if (screen === "home") {
    return <Home settings={settings} progress={progress} getTopicStats={getTopicStats} startTopic={startTopic} startTest={startTest} setScreen={setScreen} />;
  }

  if ((screen==="practice"||screen==="test") && currentQuestion) {
    return <Practice
      currentQuestion={currentQuestion} currentQuestionIdx={currentQuestionIdx} totalQs={totalQs} testMode={testMode}
      selectedAnswer={selectedAnswer} setSelectedAnswer={setSelectedAnswer} showResult={showResult} showExplanation={showExplanation} showConfetti={showConfetti}
      attemptNum={attemptNum} wrongFirstChoice={wrongFirstChoice} settings={settings} playSound={playSound}
      testQuestions={testQuestions} practiceQ={practiceQ} getQState={getQState}
      goHome={goHome} submitAnswer={submitAnswer} nextQuestion={nextQuestion} prevQuestion={prevQuestion} skipQuestion={skipQuestion} resetCurrentAnswer={resetCurrentAnswer} goToQuestion={goToQuestion}
      handleTimerExpire={handleTimerExpire}
    />;
  }

  if (screen === "test-instructions" && testInstructionTopic) {
    return <TestInstructions testInstructionTopic={testInstructionTopic} testQuestions={testQuestions} setScreen={setScreen} />;
  }

  if (screen==="topic-done") {
    return <TopicDone currentTopic={currentTopic} getTopicStats={getTopicStats} startTopic={startTopic} goHome={goHome} />;
  }

  if (screen==="test-results") {
    return <TestResults testAnswers={testAnswers} testQuestions={testQuestions} testStartTime={testStartTime} saveProgress={saveProgress} progress={progress} goHome={goHome} />;
  }

  if (screen==="progress") {
    return <Progress progress={progress} getTopicStats={getTopicStats} goHome={goHome} />;
  }

  if (screen === "practice-games") {
    return <PracticeGames settings={settings} gameProgress={gameProgress} setScreen={setScreen} />;
  }

  if (screen === "arithmetic-game") {
    return <ArithmeticGame settings={settings} gameProgress={gameProgress} saveGameProgress={saveGameProgress} playSound={playSound} setScreen={setScreen} />;
  }

  if (screen==="settings") {
    return <Settings settings={settings} saveSettings={saveSettings} resetProgress={resetProgress} goHome={goHome} />;
  }

  if (screen==="admin-login") {
    return <AdminLogin adminPwInput={adminPwInput} setAdminPwInput={setAdminPwInput} settings={settings} setAdminAuth={setAdminAuth} setScreen={setScreen} goHome={goHome} />;
  }

  if (screen==="admin"&&adminAuth) {
    return <Admin adminAuth={adminAuth} editingQ={editingQ} setEditingQ={setEditingQ} allQ={allQ} customQuestions={customQuestions} saveCQ={saveCQ} adminTopic={adminTopic} setAdminTopic={setAdminTopic} settings={settings} setAdminAuth={setAdminAuth} goHome={goHome} />;
  }

  return <div className="container"><button onClick={goHome} className="primary-btn">🏠 חזרה</button></div>;
}
