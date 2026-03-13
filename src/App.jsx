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
import { AdventureGame } from './screens/AdventureGame';
import { ClockGame } from './screens/ClockGame';
import { NinjaGame } from './screens/NinjaGame';
// import { DungeonGame } from './screens/DungeonGame';
import { SpaceInvadersGame } from './screens/SpaceInvadersGame';
import { FractionsGame } from './screens/FractionsGame';
import { MultiplicationGame } from './screens/MultiplicationGame';
import { MarketGame } from './screens/MarketGame';
import { Practices } from './screens/Practices';
import { DEFAULT_GAME_PROGRESS } from './constants/games';
import { SPARKS_REWARDS, ADMIN_USERNAME, isGameUnlocked } from './constants/ninjago';
import { GAME_LIST } from './constants/games';
import { STORY_EVENTS } from './constants/story';
import { StoryModal } from './components/ui/StoryModal';

export default function App() {
  const [screen, _setScreen] = useState("home");
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
  const [sparks, setSparks] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [testInstructionTopic, setTestInstructionTopic] = useState(null);
  const [attemptNum, setAttemptNum] = useState(1);
  const [wrongFirstChoice, setWrongFirstChoice] = useState(null);
  const [shuffledTopicQ, setShuffledTopicQ] = useState([]);
  const [qStates, setQStates] = useState({});
  const qStatesRef = useRef({});
  qStatesRef.current = qStates;

  const seenStoryRef = useRef(new Set());
  const [pendingStory, setPendingStory] = useState(null);

  const [masteryData, setMasteryData] = useState({});
  const masteryRef = useRef({});
  masteryRef.current = masteryData;
  const questionStartTimeRef = useRef(null);
  const MASTERY_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
  const MIN_MASTERY_RESPONSE_MS = 4000;

  // Load
  useEffect(() => {
    try { const s = localStorage.getItem("gp_settings"); if (s) { setSettings(p=>({...p,...JSON.parse(s)})); setGradeSelected(true); } } catch {}
    try { const p = localStorage.getItem("gp_progress"); if (p) setProgress(JSON.parse(p)); } catch {}
    try { const q = localStorage.getItem("gp_questions"); if (q) setCustomQuestions(JSON.parse(q)); } catch {}
    try { const g = localStorage.getItem("gp_games"); if (g) setGameProgress(JSON.parse(g)); } catch {}
    try { const sp = localStorage.getItem("gp_sparks"); if (sp) setSparks(JSON.parse(sp)); } catch {}
    try { const st = localStorage.getItem("gp_story"); if (st) seenStoryRef.current = new Set(JSON.parse(st)); } catch {}
    try {
      const m = localStorage.getItem("gp_mastery");
      if (m) {
        const parsed = JSON.parse(m);
        const now = Date.now();
        const cleaned = {};
        Object.entries(parsed).forEach(([k, v]) => {
          if (now - v.ts < 7 * 24 * 60 * 60 * 1000) cleaned[k] = v;
        });
        setMasteryData(cleaned);
        localStorage.setItem("gp_mastery", JSON.stringify(cleaned));
      }
    } catch {}
    setLoaded(true);
  }, []);

  const save = useCallback((key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, []);
  const saveSettings = useCallback(s => { setSettings(s); save("gp_settings", s); }, [save]);
  const saveProgress = useCallback(p => { setProgress(p); save("gp_progress", p); }, [save]);
  const saveCQ = useCallback(q => { setCustomQuestions(q); save("gp_questions", q); }, [save]);
  const saveGameProgress = useCallback(g => { setGameProgress(g); save("gp_games", g); }, [save]);
  const addSparks = useCallback((amount) => {
    setSparks(prev => {
      const next = prev + amount;
      try { localStorage.setItem("gp_sparks", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const triggerStory = useCallback((eventId) => {
    if (seenStoryRef.current.has(eventId)) return;
    const ev = STORY_EVENTS[eventId];
    if (!ev) return;
    seenStoryRef.current.add(eventId);
    try { localStorage.setItem("gp_story", JSON.stringify([...seenStoryRef.current])); } catch {}
    setPendingStory(ev);
  }, []);

  const currentTopicRef = useRef(null);
  useEffect(() => { currentTopicRef.current = currentTopic; }, [currentTopic]);

  const setScreen = useCallback((newScreen) => {
    _setScreen(newScreen);
    if (newScreen === "topic-done") {
      triggerStory(`topic_done_${currentTopicRef.current}`);
    } else if (newScreen === "test-results") {
      triggerStory("test_done");
    } else {
      const gameIdx = GAME_LIST.findIndex(g => `${g.id}-game` === newScreen);
      if (gameIdx >= 0) triggerStory(`game_intro_${gameIdx}`);
    }
  }, [triggerStory]);

  useEffect(() => {
    if (gradeSelected && loaded) triggerStory("intro");
  }, [gradeSelected, loaded, triggerStory]);

  const saveMastery = useCallback((data) => {
    setMasteryData(data);
    try { localStorage.setItem("gp_mastery", JSON.stringify(data)); } catch {}
  }, []);

  const isAdmin = settings.playerName?.trim().toLowerCase() === ADMIN_USERNAME;

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
      const now = Date.now();
      const mastery = masteryRef.current;
      const unmastered = tqs.filter(q => {
        const m = mastery[q.id];
        if (!m) return true; // never answered
        if (m.responseTime >= MIN_MASTERY_RESPONSE_MS) return true; // slow answer — likely guessed, keep showing
        if (now - m.ts >= MASTERY_EXPIRY_MS) return true; // mastery expired (> 1 week)
        return false; // mastered: correct on 1st attempt, good response time, within 1 week
      });
      const pool = unmastered.length > 0 ? unmastered : tqs; // fallback: show all if all mastered
      return [...pool].sort(() => Math.random() - 0.5);
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

  useEffect(() => {
    if (screen === "practice") questionStartTimeRef.current = Date.now();
  }, [currentQuestionIdx, screen]);

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
    if (isCorrect) {
      newProg.answers[k].correct += 1;
      newProg.points += attemptNum===1?10:5;
      addSparks(attemptNum === 1 ? SPARKS_REWARDS.practiceCorrectFirst : SPARKS_REWARDS.practiceCorrectSecond);
      if (!testMode && attemptNum === 1) {
        const responseTime = questionStartTimeRef.current ? Date.now() - questionStartTimeRef.current : 0;
        const newMastery = { ...masteryRef.current, [currentQuestion.id]: { ts: Date.now(), responseTime } };
        saveMastery(newMastery);
      }
    }
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
        addSparks(SPARKS_REWARDS.testComplete);
        if (pct >= 80) addSparks(SPARKS_REWARDS.testHighScore);
        setScreen("test-results");
      } else {
        addSparks(SPARKS_REWARDS.topicComplete);
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
        addSparks(SPARKS_REWARDS.testComplete);
        if (pct >= 80) addSparks(SPARKS_REWARDS.testHighScore);
        setScreen("test-results");
      } else { addSparks(SPARKS_REWARDS.topicComplete); setScreen("topic-done"); }
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

  let content = <div className="container"><button onClick={goHome} className="primary-btn">🏠 חזרה</button></div>;

  if (screen === "home") {
    content = <Home settings={settings} progress={progress} getTopicStats={getTopicStats} startTopic={startTopic} startTest={startTest} setScreen={setScreen} sparks={sparks} isAdmin={isAdmin} />;
  }

  if ((screen==="practice"||screen==="test") && currentQuestion) {
    content = <Practice
      currentQuestion={currentQuestion} currentQuestionIdx={currentQuestionIdx} totalQs={totalQs} testMode={testMode}
      selectedAnswer={selectedAnswer} setSelectedAnswer={setSelectedAnswer} showResult={showResult} showExplanation={showExplanation} showConfetti={showConfetti}
      attemptNum={attemptNum} wrongFirstChoice={wrongFirstChoice} settings={settings} playSound={playSound}
      testQuestions={testQuestions} practiceQ={practiceQ} getQState={getQState}
      goHome={goHome} submitAnswer={submitAnswer} nextQuestion={nextQuestion} prevQuestion={prevQuestion} skipQuestion={skipQuestion} resetCurrentAnswer={resetCurrentAnswer} goToQuestion={goToQuestion}
      handleTimerExpire={handleTimerExpire}
    />;
  }

  if (screen === "test-instructions" && testInstructionTopic) {
    content = <TestInstructions testInstructionTopic={testInstructionTopic} testQuestions={testQuestions} setScreen={setScreen} />;
  }

  if (screen==="topic-done") {
    content = <TopicDone currentTopic={currentTopic} getTopicStats={getTopicStats} startTopic={startTopic} goHome={goHome} />;
  }

  if (screen==="test-results") {
    content = <TestResults testAnswers={testAnswers} testQuestions={testQuestions} testStartTime={testStartTime} saveProgress={saveProgress} progress={progress} goHome={goHome} />;
  }

  if (screen==="progress") {
    content = <Progress progress={progress} getTopicStats={getTopicStats} goHome={goHome} />;
  }

  if (screen === "practice-games") {
    content = <PracticeGames settings={settings} gameProgress={gameProgress} setScreen={setScreen} sparks={sparks} isAdmin={isAdmin} />;
  }

  if (screen === "arithmetic-game") {
    content = <ArithmeticGame settings={settings} gameProgress={gameProgress} saveGameProgress={saveGameProgress} playSound={playSound} setScreen={setScreen} addSparks={addSparks} isAdmin={isAdmin} />;
  }

  if (screen === "adventure-game") {
    content = <AdventureGame settings={settings} gradeQ={gradeQ} gameProgress={gameProgress} saveGameProgress={saveGameProgress} playSound={playSound} setScreen={setScreen} addSparks={addSparks} isAdmin={isAdmin} />;
  }

  if (screen === "clock-game") {
    content = <ClockGame settings={settings} gameProgress={gameProgress} saveGameProgress={saveGameProgress} playSound={playSound} setScreen={setScreen} addSparks={addSparks} isAdmin={isAdmin} />;
  }

  if (screen === "ninja-game" || screen === "ninjago-game") {
    content = <NinjaGame settings={settings} gradeQ={gradeQ} gameProgress={gameProgress} saveGameProgress={saveGameProgress} playSound={playSound} setScreen={setScreen} addSparks={addSparks} isAdmin={isAdmin} sparks={sparks} />;
  }

  if (screen === "space-invaders-game") {
    content = <SpaceInvadersGame gradeQ={gradeQ} sparks={sparks} isAdmin={isAdmin} addSparks={addSparks} gameProgress={gameProgress} saveGameProgress={saveGameProgress} onExit={() => setScreen("practice-games")} playSound={playSound} />;
  }

  if (screen === "practices") {
    content = <Practices settings={settings} gameProgress={gameProgress} setScreen={setScreen} />;
  }

  if (screen === "fractions-game") {
    content = <FractionsGame settings={settings} gameProgress={gameProgress} saveGameProgress={saveGameProgress} playSound={playSound} setScreen={setScreen} addSparks={addSparks} isAdmin={isAdmin} />;
  }

  if (screen === "multiplication-game") {
    content = <MultiplicationGame settings={settings} gameProgress={gameProgress} saveGameProgress={saveGameProgress} playSound={playSound} setScreen={setScreen} addSparks={addSparks} isAdmin={isAdmin} />;
  }

  if (screen === "market-game") {
    content = <MarketGame settings={settings} gameProgress={gameProgress} saveGameProgress={saveGameProgress} playSound={playSound} setScreen={setScreen} addSparks={addSparks} isAdmin={isAdmin} sparks={sparks} />;
  }

  if (screen==="settings") {
    content = <Settings settings={settings} saveSettings={saveSettings} resetProgress={resetProgress} goHome={goHome} />;
  }

  if (screen==="admin-login") {
    content = <AdminLogin adminPwInput={adminPwInput} setAdminPwInput={setAdminPwInput} settings={settings} setAdminAuth={setAdminAuth} setScreen={setScreen} goHome={goHome} />;
  }

  if (screen==="admin"&&adminAuth) {
    content = <Admin adminAuth={adminAuth} editingQ={editingQ} setEditingQ={setEditingQ} allQ={allQ} customQuestions={customQuestions} saveCQ={saveCQ} adminTopic={adminTopic} setAdminTopic={setAdminTopic} settings={settings} setAdminAuth={setAdminAuth} goHome={goHome} />;
  }

  return (
    <>
      {content}
      {pendingStory && <StoryModal event={pendingStory} onClose={() => setPendingStory(null)} />}
    </>
  );
}
