import { useState, useEffect, useCallback, useRef } from 'react';
import { NINJAS } from '../constants/ninjago';

// ─── World & Enemy Data ───
const QUEST_WORLDS = [
  {
    id: 'fire', name: 'מקדש האש', icon: '🌋',
    bg: 'linear-gradient(160deg, #1a0500 0%, #3d0f00 50%, #6b1a00 100%)',
    accent: '#ff6b35', glowColor: '#ff4500',
    enemies: [
      { id: 'skull1', name: 'לוחם גולגולת', art: '💀', hp: 36, atk: 15, xp: 15 },
      { id: 'skull2', name: 'קשת גולגולת', art: '🏹', hp: 48, atk: 18, xp: 20 },
      { id: 'skull3', name: 'מפקד גולגולת', art: '⚔️', hp: 60, atk: 22, xp: 28 },
    ],
    boss: { id: 'samukai', name: 'סמוקאי', art: '👑', hp: 120, atk: 28, xp: 60, isBoss: true },
    storyIntro: 'גרמאדון שלח את הגולגולות לגנוב את נשק האש! עצור אותם!',
    storyVictory: 'ניצחת את הגולגולות! נשק האש בטוח שוב! ✨',
  },
  {
    id: 'lightning', name: 'ארמון הברק', icon: '⚡',
    bg: 'linear-gradient(160deg, #050a1a 0%, #0a1a3d 50%, #102060 100%)',
    accent: '#60a5fa', glowColor: '#3b82f6',
    enemies: [
      { id: 'serp1', name: 'נחש ונומינוס', art: '🐍', hp: 54, atk: 18, xp: 20 },
      { id: 'serp2', name: 'נחש ביטאנג', art: '🐉', hp: 66, atk: 22, xp: 26 },
      { id: 'serp3', name: 'גנרל פייתור', art: '👁️', hp: 84, atk: 26, xp: 35 },
    ],
    boss: { id: 'pythor', name: 'פייתור', art: '🌀', hp: 160, atk: 32, xp: 80, isBoss: true },
    storyIntro: 'שבטי הנחשים מנסים להעיר את הגרמאטאי הגדול! עצור אותם!',
    storyVictory: 'הנחשים נסוגו! הגרמאטאי ישן שוב! ⚡',
  },
  {
    id: 'earth', name: 'מבצר האבן', icon: '🗿',
    bg: 'linear-gradient(160deg, #0d0a00 0%, #1a1400 50%, #2d2200 100%)',
    accent: '#d97706', glowColor: '#92400e',
    enemies: [
      { id: 'stone1', name: 'לוחם אבן', art: '🗿', hp: 72, atk: 22, xp: 26 },
      { id: 'stone2', name: 'קשת אבן', art: '🏹', hp: 90, atk: 25, xp: 32 },
      { id: 'stone3', name: 'חרב האבן', art: '⚔️', hp: 108, atk: 28, xp: 40 },
    ],
    boss: { id: 'kozu', name: 'גנרל קוזו', art: '👑', hp: 200, atk: 35, xp: 100, isBoss: true },
    storyIntro: 'צבא האבן התעורר! הם רוצים לכבוש את ניניאגו!',
    storyVictory: 'צבא האבן הובס! ניניאגו בטוחה! 🗿',
  },
  {
    id: 'ice', name: 'ממלכת הקרח', icon: '❄️',
    bg: 'linear-gradient(160deg, #000a14 0%, #001428 50%, #002040 100%)',
    accent: '#67e8f9', glowColor: '#06b6d4',
    enemies: [
      { id: 'ana1', name: 'לוחם אנקונדרי', art: '🐲', hp: 90, atk: 26, xp: 32 },
      { id: 'ana2', name: 'אנקונדרי מכונף', art: '🦕', hp: 110, atk: 30, xp: 40 },
      { id: 'ana3', name: 'שומר המקדש', art: '🛡️', hp: 130, atk: 34, xp: 50 },
    ],
    boss: { id: 'chen', name: "אדון צ'ן", art: '🌑', hp: 260, atk: 40, xp: 140, isBoss: true },
    storyIntro: "אדון צ'ן מנסה לגנוב את כוחות הנינג'ות! זה הקרב הסופי!",
    storyVictory: "ניצחת! ניניאגו בטוחה לנצח! אתה נינג'ה אגדי! 🎉",
  },
];

const NINJA_ELEMENT_ATTACKS = {
  fire: ['כדור אש 🔥', 'מכת להבה 🔥', 'גל אש 🔥'],
  lightning: ['ברק ⚡', 'זרם חשמלי ⚡', 'סופת ברקים ⚡'],
  earth: ["רעידת אדמה 🌍", "מכת סלע 🌍", "ספינג'יטזו אדמה 🌍"],
  ice: ["קרח ❄️", "סנטר קפוא ❄️", "ספינג'יטזו קרח ❄️"],
  water: ['גל 🌊', 'מצולות 🌊', 'סופת ים 🌊'],
  energy: ['כוח הזהב ✨', 'נשק הזהב ✨', 'ספינג\'יטזו אנרגיה ✨'],
};

const SPECIAL_ATTACK_NAMES = {
  fire: 'ספינג\'יטזו האש הגדול! 🔥🔥🔥',
  lightning: 'פלדת הברק! ⚡⚡⚡',
  earth: 'כוח ההר! 🌍🌍🌍',
  ice: 'סופת השלג! ❄️❄️❄️',
  water: 'גל הצונאמי! 🌊🌊🌊',
  energy: 'כוח נשק הזהב! ✨✨✨',
};

const KEYFRAMES = `
@keyframes enemyShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
@keyframes playerShake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(8px)} 75%{transform:translateX(-8px)} }
@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
@keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
@keyframes attackFlash { 0%,100%{filter:brightness(1)} 50%{filter:brightness(2.2)} }
@keyframes starPop { 0%{transform:scale(0) rotate(-30deg);opacity:0} 60%{transform:scale(1.3) rotate(5deg);opacity:1} 100%{transform:scale(1) rotate(0);opacity:1} }
@keyframes glow { 0%,100%{box-shadow:0 0 10px currentColor} 50%{box-shadow:0 0 28px currentColor, 0 0 48px currentColor} }
@keyframes floatUp { 0%{opacity:1;transform:translateY(0)} 100%{opacity:0;transform:translateY(-40px)} }
`;

// ─── Helpers ───

function buildStageEnemies(worldIdx, stageIdx) {
  const world = QUEST_WORLDS[worldIdx];
  if (stageIdx === 4) return [world.enemies[0], world.enemies[2], world.boss];
  return [
    world.enemies[stageIdx % 3],
    world.enemies[(stageIdx + 1) % 3],
    world.enemies[(stageIdx + 2) % 3],
  ];
}

function calcStars(hpLost) {
  if (hpLost <= 30) return 3;
  if (hpLost <= 60) return 2;
  return 1;
}

function getBattleQuestions(gradeQ) {
  // Only use text-based questions (topics 1-3) — topic 4/5 have object options that can't be rendered as text
  const textQ = gradeQ.filter(q => q.topic <= 3 && q.options.every(o => typeof o === 'string'));
  return [...textQ].sort(() => Math.random() - 0.5).slice(0, 30);
}

// ─── Sub-components ───

function HPBar({ current, max, color = '#22c55e', label }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const barColor = pct > 60 ? '#22c55e' : pct > 30 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ width: '100%' }}>
      {label && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 2 }}>{label}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ flex: 1, height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden', border: '1px solid #334155' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color !== '#22c55e' ? color : barColor, borderRadius: 5, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: 11, color: '#cbd5e1', whiteSpace: 'nowrap' }}>{current}/{max}</span>
      </div>
    </div>
  );
}

function StarDisplay({ stars, animated }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
      {[1, 2, 3].map(i => (
        <span key={i} style={{
          fontSize: 40,
          opacity: i <= stars ? 1 : 0.2,
          animation: animated && i <= stars ? `starPop 0.4s ease ${i * 0.15}s both` : 'none',
          display: 'inline-block',
        }}>⭐</span>
      ))}
    </div>
  );
}

// ─── Main Component ───

export function NinjaQuestGame({ gradeQ, gameProgress, saveGameProgress, playSound, setScreen, addSparks, isAdmin, sparks }) {
  const [phase, setPhase] = useState('ninja-select');
  const [selectedNinja, setSelectedNinja] = useState(null);

  // World / stage navigation
  const [currentWorldIdx, setCurrentWorldIdx] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);

  // Battle state
  const [stageEnemies, setStageEnemies] = useState([]);
  const [currentEnemyIdx, setCurrentEnemyIdx] = useState(0);
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(0);
  const [maxEnemyHP, setMaxEnemyHP] = useState(0);
  const [combo, setCombo] = useState(0);
  const [specialCharge, setSpecialCharge] = useState(0);
  const [battleQuestions, setBattleQuestions] = useState([]);
  const [currentQIdx, setCurrentQIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [attemptNum, setAttemptNum] = useState(1);
  const [wrongFirst, setWrongFirst] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [sparksThisBattle, setSparksThisBattle] = useState(0);
  const [playerHPLost, setPlayerHPLost] = useState(0);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [animation, setAnimation] = useState(null); // 'enemy-shake' | 'player-shake'
  const [stageResult, setStageResult] = useState(null); // { stars, sparksEarned }
  const [dmgPopup, setDmgPopup] = useState(null); // { text, key }

  const animTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);

  // Derived
  const questProgress = gameProgress.quest || { currentWorld: 0, worlds: {} };
  const currentWorld = QUEST_WORLDS[currentWorldIdx];
  const currentEnemy = stageEnemies[currentEnemyIdx] || null;
  const currentQ = battleQuestions[currentQIdx] || null;

  // ─── Helpers ───

  const triggerAnimation = useCallback((type) => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setAnimation(type);
    animTimerRef.current = setTimeout(() => setAnimation(null), 500);
  }, []);

  const addBattleLog = useCallback((msg) => {
    setBattleLog(prev => [msg, ...prev].slice(0, 5));
  }, []);

  const showDmgPopup = useCallback((text) => {
    setDmgPopup({ text, key: Date.now() });
    setTimeout(() => setDmgPopup(null), 900);
  }, []);

  const getAttackName = useCallback((ninja) => {
    const attacks = NINJA_ELEMENT_ATTACKS[ninja?.element] || NINJA_ELEMENT_ATTACKS.fire;
    return attacks[Math.floor(Math.random() * attacks.length)];
  }, []);

  // ─── Battle Logic ───

  const startBattle = useCallback((worldIdx, stageIdx) => {
    const enemies = buildStageEnemies(worldIdx, stageIdx);
    setCurrentWorldIdx(worldIdx);
    setCurrentStageIdx(stageIdx);
    setStageEnemies(enemies);
    setCurrentEnemyIdx(0);
    setPlayerHP(100);
    setEnemyHP(enemies[0].hp);
    setMaxEnemyHP(enemies[0].hp);
    setCombo(0);
    setSpecialCharge(0);
    setBattleQuestions(getBattleQuestions(gradeQ));
    setCurrentQIdx(0);
    setSelectedAnswer(null);
    setAnswered(false);
    setAttemptNum(1);
    setWrongFirst(null);
    setBattleLog(['הקרב התחיל! ענה נכון כדי לתקוף! 🥷']);
    setSparksThisBattle(0);
    setPlayerHPLost(0);
    setEnemiesDefeated(0);
    setAnimation(null);
    setPhase('battle');
  }, [gradeQ]);

  const advanceToNextQuestion = useCallback(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setAttemptNum(1);
    setWrongFirst(null);
    setCurrentQIdx(prev => prev + 1);
  }, []);

  const defeatEnemy = useCallback((curEnemyIdx, curStageEnemies) => {
    const enemy = curStageEnemies[curEnemyIdx];
    const isBoss = enemy?.isBoss;
    let extraSparks = isBoss ? 30 : 0;
    if (extraSparks > 0) {
      addSparks(extraSparks);
      addBattleLog(`${isBoss ? '👑 ניצחת בוס!' : '💥 אויב הובס!'} +${extraSparks} ניצוצות!`);
    } else {
      addBattleLog(`💥 אויב הובס!`);
    }
    const newEnemiesDefeated = curEnemyIdx + 1;
    setEnemiesDefeated(newEnemiesDefeated);

    const nextEnemyIdx = curEnemyIdx + 1;
    if (nextEnemyIdx < curStageEnemies.length) {
      const nextEnemy = curStageEnemies[nextEnemyIdx];
      setCurrentEnemyIdx(nextEnemyIdx);
      setEnemyHP(nextEnemy.hp);
      setMaxEnemyHP(nextEnemy.hp);
      addBattleLog(`נינג'ה חדש מופיע: ${nextEnemy.name} ${nextEnemy.art}`);
      setTimeout(advanceToNextQuestion, 600);
    } else {
      // Stage complete
      setTimeout(() => {
        setPhase('stage-complete');
      }, 600);
    }
  }, [addSparks, addBattleLog, advanceToNextQuestion]);

  const handleAnswer = useCallback((answerIdx) => {
    if (answered) return;
    if (selectedAnswer !== null && attemptNum === 1 && !answered) return; // already picked, waiting

    const q = currentQ;
    if (!q) return;
    const isCorrect = answerIdx === q.correct;

    if (isCorrect) {
      setSelectedAnswer(answerIdx);
      setAnswered(true);

      const newCombo = attemptNum === 1 ? combo + 1 : 0;
      const newSpecialCharge = attemptNum === 1 ? Math.min(5, specialCharge + 1) : specialCharge;
      const isComboBonus = attemptNum === 1 && newCombo > 0 && newCombo % 3 === 0;
      const baseDmg = attemptNum === 1
        ? Math.floor(currentEnemy.hp / 3)
        : Math.floor(currentEnemy.hp / 5);
      const actualDmg = isComboBonus ? Math.floor(baseDmg * 1.5) : baseDmg;
      const sparkGain = attemptNum === 1 ? 8 : 4;

      setCombo(newCombo);
      setSpecialCharge(newSpecialCharge);
      addSparks(sparkGain);
      setSparksThisBattle(prev => prev + sparkGain);

      const newEnemyHP = Math.max(0, enemyHP - actualDmg);
      setEnemyHP(newEnemyHP);
      triggerAnimation('enemy-shake');
      showDmgPopup(`-${actualDmg} 💥`);

      const attackName = getAttackName(selectedNinja);
      let logMsg = `${attackName} נזק: ${actualDmg}`;
      if (isComboBonus) logMsg += ' 🔥 קומבו +50%!';
      if (newSpecialCharge === 5) logMsg += ' ⚡ מתקפה מיוחדת מוכנה!';
      addBattleLog(logMsg);
      playSound && playSound('correct');

      if (newEnemyHP <= 0) {
        defeatEnemy(currentEnemyIdx, stageEnemies);
      } else {
        advanceTimerRef.current = setTimeout(advanceToNextQuestion, 1000);
      }
    } else {
      // Wrong answer handling
      if (attemptNum === 1) {
        setSelectedAnswer(answerIdx);
        setWrongFirst(answerIdx);
        setAttemptNum(2);
        addBattleLog('שגוי! יש לך עוד ניסיון אחד...');
        playSound && playSound('wrong');
      } else {
        // Second wrong — enemy attacks
        setSelectedAnswer(answerIdx);
        setAnswered(true);
        const dmg = currentEnemy.atk;
        const newPlayerHP = Math.max(0, playerHP - dmg);
        setPlayerHP(newPlayerHP);
        setPlayerHPLost(prev => prev + dmg);
        setCombo(0);
        triggerAnimation('player-shake');
        showDmgPopup(`-${dmg} ❤️`);
        addBattleLog(`הייתה שגיאה — האויב תוקף! -${dmg} ❤️`);
        playSound && playSound('hit');

        if (newPlayerHP <= 0) {
          setTimeout(() => setPhase('defeat'), 800);
        } else {
          advanceTimerRef.current = setTimeout(advanceToNextQuestion, 1200);
        }
      }
    }
  }, [
    answered, selectedAnswer, attemptNum, currentQ, combo, specialCharge,
    currentEnemy, enemyHP, playerHP, selectedNinja, currentEnemyIdx, stageEnemies,
    addSparks, addBattleLog, triggerAnimation, showDmgPopup,
    getAttackName, playSound, defeatEnemy, advanceToNextQuestion,
  ]);

  const handleSpecialAttack = useCallback(() => {
    if (specialCharge < 5 || !currentEnemy) return;
    const dmg = Math.floor(currentEnemy.hp * 0.6);
    const newEnemyHP = Math.max(0, enemyHP - dmg);
    setEnemyHP(newEnemyHP);
    setSpecialCharge(0);
    setCombo(0);
    triggerAnimation('enemy-shake');
    showDmgPopup(`-${dmg} ⚡`);
    const specialName = SPECIAL_ATTACK_NAMES[selectedNinja?.element] || 'מתקפה מיוחדת!';
    addBattleLog(`${specialName} נזק: ${dmg}!`);
    playSound && playSound('correct');

    if (newEnemyHP <= 0) {
      defeatEnemy(currentEnemyIdx, stageEnemies);
    }
  }, [
    specialCharge, currentEnemy, enemyHP, selectedNinja, currentEnemyIdx,
    stageEnemies, triggerAnimation, showDmgPopup, addBattleLog, playSound, defeatEnemy,
  ]);

  // Stage complete — calculate stars and save progress
  useEffect(() => {
    if (phase !== 'stage-complete') return;
    const stars = calcStars(playerHPLost);
    const stageBonus = 20 + (stars - 1) * 10;
    addSparks(stageBonus);
    setSparksThisBattle(prev => prev + stageBonus);
    setStageResult({ stars, sparksEarned: sparksThisBattle + stageBonus });

    // Save progress
    const worldId = QUEST_WORLDS[currentWorldIdx].id;
    const prevWorldData = questProgress.worlds?.[worldId] || { stagesComplete: 0, bestStars: [] };
    const newStagesComplete = Math.max(prevWorldData.stagesComplete, currentStageIdx + 1);
    const newBestStars = [...(prevWorldData.bestStars || [])];
    newBestStars[currentStageIdx] = Math.max(newBestStars[currentStageIdx] || 0, stars);
    const newQuestProgress = {
      ...questProgress,
      currentWorld: currentWorldIdx,
      worlds: {
        ...questProgress.worlds,
        [worldId]: { stagesComplete: newStagesComplete, bestStars: newBestStars },
      },
    };
    saveGameProgress({ ...gameProgress, quest: newQuestProgress });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    };
  }, []);

  // Deduct sparks on defeat
  useEffect(() => {
    if (phase === 'defeat' && sparks > 0) {
      addSparks(-10);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const isWorldUnlocked = useCallback((idx) => {
    if (isAdmin || idx === 0) return true;
    const prevWorld = QUEST_WORLDS[idx - 1];
    const prevData = questProgress.worlds?.[prevWorld.id];
    return prevData && prevData.stagesComplete >= 5;
  }, [isAdmin, questProgress.worlds]);

  const getStagesComplete = useCallback((worldId) => {
    return questProgress.worlds?.[worldId]?.stagesComplete || 0;
  }, [questProgress.worlds]);

  const getWorldBestStars = useCallback((worldId) => {
    return questProgress.worlds?.[worldId]?.bestStars || [];
  }, [questProgress.worlds]);

  // ─── Guard: not enough questions ───
  const textQuestions = (gradeQ || []).filter(q => q.topic <= 3 && q.options.every(o => typeof o === 'string'));
  if (textQuestions.length < 10) {
    return (
      <div style={{ minHeight: '100vh', direction: 'rtl', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
        <style>{KEYFRAMES}</style>
        <div style={{ fontSize: 48 }}>🥷</div>
        <div style={{ color: '#f1f5f9', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>אין מספיק שאלות לטורניר</div>
        <div style={{ color: '#94a3b8', textAlign: 'center' }}>צריך לפחות 10 שאלות. נסה שכבה אחרת.</div>
        <button onClick={() => setScreen('practice-games')} style={{ background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 28px', fontSize: 16, cursor: 'pointer', marginTop: 8 }}>
          ← חזרה למשחקים
        </button>
      </div>
    );
  }

  // ─── Render: Ninja Select ───
  const renderNinjaSelect = () => (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', padding: '24px 16px', direction: 'rtl' }}>
      <style>{KEYFRAMES}</style>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <button onClick={() => setScreen('practice-games')} style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer', marginBottom: 20 }}>
          ← חזרה
        </button>
        <h1 style={{ color: '#f1f5f9', textAlign: 'center', fontSize: 26, fontWeight: 900, marginBottom: 4 }}>
          🏆 טורניר היסודות
        </h1>
        <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: 24, fontSize: 14 }}>בחר את הנינג'ה שלך</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {NINJAS.map(ninja => {
            const locked = !isAdmin && ninja.unlockAt > sparks;
            return (
              <div
                key={ninja.id}
                onClick={() => { if (!locked) { setSelectedNinja(ninja); setPhase('world-map'); } }}
                style={{
                  background: locked ? 'rgba(15,23,42,0.6)' : `linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.9))`,
                  border: `2px solid ${locked ? '#334155' : ninja.color}`,
                  borderRadius: 16,
                  padding: 16,
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.6 : 1,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  boxShadow: locked ? 'none' : `0 0 12px ${ninja.color}44`,
                  textAlign: 'center',
                  animation: 'fadeIn 0.3s ease',
                }}
                onMouseEnter={e => { if (!locked) e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <img
                  src={`${import.meta.env.BASE_URL}${ninja.img}`}
                  alt={ninja.nameHe}
                  onError={e => { e.target.style.display = 'none'; }}
                  style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8, marginBottom: 8, filter: locked ? 'grayscale(1)' : 'none' }}
                />
                <div style={{ color: locked ? '#64748b' : '#f1f5f9', fontWeight: 800, fontSize: 16 }}>{ninja.nameHe}</div>
                <div style={{ color: locked ? '#475569' : ninja.color, fontSize: 12, marginTop: 2 }}>{ninja.elementHe}</div>
                {locked && (
                  <div style={{ color: '#f59e0b', fontSize: 11, marginTop: 6 }}>🔒 צריך {ninja.unlockAt} ניצוצות</div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', color: '#64748b', fontSize: 13, marginTop: 20 }}>
          ✨ ניצוצות: {sparks}
        </div>
      </div>
    </div>
  );

  // ─── Render: World Map ───
  const renderWorldMap = () => (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 100%)', padding: '24px 16px', direction: 'rtl' }}>
      <style>{KEYFRAMES}</style>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button onClick={() => setPhase('ninja-select')} style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer' }}>
            ← החלף נינג'ה
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src={`${import.meta.env.BASE_URL}${selectedNinja?.img}`} alt="" onError={e => e.target.style.display='none'} style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6, border: `2px solid ${selectedNinja?.color}` }} />
            <span style={{ color: selectedNinja?.color, fontWeight: 700 }}>{selectedNinja?.nameHe}</span>
          </div>
        </div>
        <h2 style={{ color: '#f1f5f9', textAlign: 'center', fontSize: 22, fontWeight: 900, marginBottom: 6 }}>מפת ניניאגו 🗺️</h2>
        <div style={{ textAlign: 'center', color: '#f59e0b', fontSize: 14, marginBottom: 20 }}>✨ {sparks} ניצוצות</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {QUEST_WORLDS.map((world, wIdx) => {
            const locked = !isWorldUnlocked(wIdx);
            const stagesComplete = getStagesComplete(world.id);
            const bestStars = getWorldBestStars(world.id);
            const firstIncompleteStage = Math.min(stagesComplete, 4);
            return (
              <div
                key={world.id}
                onClick={() => {
                  if (locked) return;
                  startBattle(wIdx, firstIncompleteStage);
                }}
                style={{
                  background: locked ? 'rgba(15,23,42,0.5)' : world.bg,
                  border: `2px solid ${locked ? '#1e293b' : world.accent}`,
                  borderRadius: 16,
                  padding: '14px 18px',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  opacity: locked ? 0.5 : 1,
                  transition: 'transform 0.15s',
                  boxShadow: locked ? 'none' : `0 0 16px ${world.glowColor}44`,
                  animation: 'fadeIn 0.3s ease',
                }}
                onMouseEnter={e => { if (!locked) e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 24 }}>{world.icon}</span>
                      <span style={{ color: locked ? '#475569' : world.accent, fontWeight: 800, fontSize: 16 }}>{world.name}</span>
                      {locked && <span style={{ fontSize: 14 }}>🔒</span>}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>{stagesComplete}/5 שלבים</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[0,1,2,3,4].map(sIdx => (
                      <div key={sIdx} style={{
                        width: 12, height: 12, borderRadius: '50%',
                        background: sIdx < stagesComplete ? world.accent : 'rgba(255,255,255,0.1)',
                        border: `1px solid ${world.accent}`,
                      }} />
                    ))}
                  </div>
                </div>
                {bestStars.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, marginTop: 6 }}>
                    {bestStars.map((s, i) => (
                      <span key={i} style={{ fontSize: 10 }}>{s >= 3 ? '⭐⭐⭐' : s >= 2 ? '⭐⭐' : s >= 1 ? '⭐' : ''}</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={() => setScreen('practice-games')} style={{ background: 'rgba(255,255,255,0.08)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '8px 20px', fontSize: 14, cursor: 'pointer' }}>
            ← חזרה למשחקים
          </button>
        </div>
      </div>
    </div>
  );

  // ─── Render: Battle ───
  const renderBattle = () => {
    if (!currentEnemy || !currentQ) return null;
    const world = currentWorld;
    const optionLabels = ['א', 'ב', 'ג', 'ד'];

    return (
      <div style={{ minHeight: '100vh', background: world.bg, direction: 'rtl', display: 'flex', flexDirection: 'column' }}>
        <style>{KEYFRAMES}</style>

        {/* TOP BAR */}
        <div style={{ background: 'rgba(0,0,0,0.6)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${world.accent}44` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setPhase('world-map')}
              style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 7, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}
            >
              ← מפה
            </button>
            <div style={{ color: world.accent, fontWeight: 700, fontSize: 14 }}>
              {world.icon} שלב {currentStageIdx + 1}/5 — {currentEnemy.name}
              {currentEnemy.isBoss && <span style={{ marginRight: 6, background: '#7c3aed', borderRadius: 4, padding: '1px 6px', fontSize: 11 }}>👑 בוס</span>}
            </div>
          </div>
          <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 14 }}>✨ +{sparksThisBattle}</div>
        </div>

        {/* ARENA */}
        <div style={{ padding: '16px 16px 8px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>

          {/* Player side */}
          <div style={{
            flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 12,
            border: `1px solid ${selectedNinja?.color}44`,
            animation: animation === 'player-shake' ? 'playerShake 0.5s ease' : 'none',
          }}>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, textAlign: 'center' }}>הנינג'ה שלך</div>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <img
                src={`${import.meta.env.BASE_URL}${selectedNinja?.img}`}
                alt={selectedNinja?.nameHe}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: '50%', border: `3px solid ${selectedNinja?.color}`, boxShadow: `0 0 16px ${selectedNinja?.color}88` }}
              />
              <div style={{ display: 'none', fontSize: 40 }}>🥷</div>
            </div>
            <HPBar current={playerHP} max={100} label={`❤️ ${playerHP}/100`} />
          </div>

          {/* VS */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 24 }}>
            <div style={{ color: world.accent, fontWeight: 900, fontSize: 18 }}>VS</div>
            {/* Damage popup */}
            {dmgPopup && (
              <div key={dmgPopup.key} style={{ color: '#fbbf24', fontWeight: 900, fontSize: 18, animation: 'floatUp 0.9s ease forwards', whiteSpace: 'nowrap' }}>
                {dmgPopup.text}
              </div>
            )}
          </div>

          {/* Enemy side */}
          <div style={{
            flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: 12,
            border: `1px solid ${world.accent}44`,
            animation: animation === 'enemy-shake' ? 'enemyShake 0.5s ease' : 'none',
          }}>
            <div style={{ color: '#94a3b8', fontSize: 11, marginBottom: 6, textAlign: 'center' }}>אויב</div>
            <div style={{
              fontSize: 52, textAlign: 'center', marginBottom: 8,
              textShadow: `0 0 20px ${world.glowColor}`,
              animation: animation === 'enemy-shake' ? 'attackFlash 0.5s ease' : 'none',
            }}>
              {currentEnemy.art}
            </div>
            <div style={{ color: world.accent, fontSize: 12, textAlign: 'center', marginBottom: 6, fontWeight: 700 }}>{currentEnemy.name}</div>
            <HPBar current={enemyHP} max={maxEnemyHP} color={world.accent} />
          </div>
        </div>

        {/* COMBO + SPECIAL */}
        <div style={{ textAlign: 'center', minHeight: 36, padding: '0 16px' }}>
          {combo >= 2 && (
            <span style={{ color: '#f59e0b', fontWeight: 900, fontSize: 18, animation: 'pulse 1s infinite', display: 'inline-block' }}>
              🔥 קומבו x{combo}!
            </span>
          )}
          {specialCharge >= 5 && (
            <button
              onClick={handleSpecialAttack}
              style={{
                display: 'block', margin: '4px auto 0',
                background: `linear-gradient(90deg, ${selectedNinja?.color}, ${world.accent})`,
                color: '#fff', border: 'none', borderRadius: 10, padding: '8px 20px',
                fontWeight: 900, fontSize: 15, cursor: 'pointer',
                boxShadow: `0 0 20px ${selectedNinja?.color}`,
                animation: 'pulse 1s infinite',
              }}
            >
              ⚡ {SPECIAL_ATTACK_NAMES[selectedNinja?.element] || 'מתקפה מיוחדת!'}
            </button>
          )}
        </div>

        {/* BATTLE LOG */}
        <div style={{ margin: '8px 16px 0', background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '8px 12px', minHeight: 36, border: `1px solid ${world.accent}22` }}>
          <div style={{ color: '#cbd5e1', fontSize: 12 }}>{battleLog[0] || ''}</div>
        </div>

        {/* QUESTION CARD */}
        <div style={{ margin: '8px 16px 16px', background: 'rgba(15,23,42,0.9)', borderRadius: 14, padding: 16, border: `1px solid ${world.accent}44`, animation: 'fadeIn 0.3s ease', flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ color: '#64748b', fontSize: 12 }}>🎯 ניסיון {attemptNum}/2</div>
            <div style={{ color: '#64748b', fontSize: 12 }}>שאלה {currentQIdx + 1}</div>
          </div>
          <div style={{ color: '#f1f5f9', fontSize: 15, fontWeight: 600, marginBottom: 14, lineHeight: 1.5, textAlign: 'right' }}>
            {currentQ.question}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {currentQ.options.map((opt, i) => {
              const isWrong1 = wrongFirst === i && i !== currentQ.correct;
              const isCorrectAndAnswered = answered && i === currentQ.correct;
              const isWrongAndAnswered = answered && i === selectedAnswer && i !== currentQ.correct;
              let bg = 'rgba(30,41,59,0.8)';
              let border = '1px solid #334155';
              let color = '#e2e8f0';
              if (isWrong1 && !answered) { bg = 'rgba(239,68,68,0.2)'; border = '1px solid #ef4444'; color = '#fca5a5'; }
              if (isCorrectAndAnswered) { bg = 'rgba(34,197,94,0.25)'; border = '1px solid #22c55e'; color = '#86efac'; }
              if (isWrongAndAnswered) { bg = 'rgba(239,68,68,0.25)'; border = '1px solid #ef4444'; color = '#fca5a5'; }
              const disabled = (answered) || (attemptNum === 2 && i === wrongFirst);

              return (
                <button
                  key={i}
                  onClick={() => { if (!disabled) handleAnswer(i); }}
                  style={{
                    background: bg, border, color,
                    borderRadius: 10, padding: '10px 12px',
                    fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'right', lineHeight: 1.4, fontWeight: 500,
                    transition: 'all 0.15s',
                    opacity: disabled && !isCorrectAndAnswered ? 0.5 : 1,
                  }}
                >
                  <span style={{ color: '#64748b', marginLeft: 6 }}>{optionLabels[i]}.</span>{opt}
                </button>
              );
            })}
          </div>
          {answered && currentQ.explanation && (
            <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.35)', borderRadius: 10, color: '#93c5fd', fontSize: 13, lineHeight: 1.6, animation: 'fadeIn 0.3s ease' }}>
              💡 {currentQ.explanation}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Render: Stage Complete ───
  const renderStageComplete = () => {
    const world = currentWorld;
    const isLastStage = currentStageIdx === 4;
    const stagesComplete = getStagesComplete(world.id);
    const isWorldDone = stagesComplete >= 5;
    return (
      <div style={{ minHeight: '100vh', background: world.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, direction: 'rtl', textAlign: 'center' }}>
        <style>{KEYFRAMES}</style>
        <div style={{ fontSize: 64, animation: 'pulse 1.5s infinite' }}>{world.icon}</div>
        <h2 style={{ color: world.accent, fontSize: 26, fontWeight: 900, margin: '16px 0 4px' }}>
          {isLastStage ? (isWorldDone ? 'עולם הושלם! 🎉' : 'שלב הושלם! 🎉') : 'שלב הושלם! 🎉'}
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: 8 }}>שלב {currentStageIdx + 1}/5 — {world.name}</p>
        {stageResult && <StarDisplay stars={stageResult.stars} animated />}
        {stageResult && (
          <div style={{ color: '#f59e0b', fontSize: 20, fontWeight: 900, margin: '12px 0' }}>
            ✨ +{stageResult.sparksEarned} ניצוצות!
          </div>
        )}
        {isLastStage && isWorldDone && (
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 12, padding: '12px 20px', marginBottom: 16, color: '#f1f5f9', fontSize: 14, maxWidth: 340 }}>
            {world.storyVictory}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
          {!isLastStage && (
            <button
              onClick={() => startBattle(currentWorldIdx, currentStageIdx + 1)}
              style={{ background: world.accent, color: '#000', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: `0 0 20px ${world.accent}88` }}
            >
              המשך לשלב {currentStageIdx + 2} ←
            </button>
          )}
          {isLastStage && currentWorldIdx < QUEST_WORLDS.length - 1 && (
            <button
              onClick={() => { setCurrentWorldIdx(currentWorldIdx + 1); setPhase('world-map'); }}
              style={{ background: world.accent, color: '#000', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 16, fontWeight: 800, cursor: 'pointer', boxShadow: `0 0 20px ${world.accent}88` }}
            >
              עולם הבא ←
            </button>
          )}
          <button
            onClick={() => setPhase('world-map')}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#f1f5f9', border: `1px solid ${world.accent}66`, borderRadius: 12, padding: '12px 24px', fontSize: 15, cursor: 'pointer' }}
          >
            חזרה למפה 🗺️
          </button>
        </div>
      </div>
    );
  };

  // ─── Render: Defeat ───
  const renderDefeat = () => (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #1a0000 0%, #3d0000 50%, #5a0000 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, direction: 'rtl', textAlign: 'center' }}>
      <style>{KEYFRAMES}</style>
      <div style={{ fontSize: 72, animation: 'pulse 2s infinite' }}>😢</div>
      <h2 style={{ color: '#ef4444', fontSize: 26, fontWeight: 900, margin: '16px 0 8px' }}>הפסדת! נסה שוב</h2>
      <p style={{ color: '#94a3b8', marginBottom: 16, fontSize: 15 }}>הובסת {enemiesDefeated} אויבים לפני שנפלת</p>
      {sparks > 0 && (
        <div style={{ color: '#f59e0b', fontSize: 14, marginBottom: 20 }}>-10 ניצוצות ❌</div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => startBattle(currentWorldIdx, currentStageIdx)}
          style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 12, padding: '12px 28px', fontSize: 16, fontWeight: 800, cursor: 'pointer' }}
        >
          נסה שוב 🥷
        </button>
        <button
          onClick={() => setPhase('world-map')}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#f1f5f9', border: '1px solid #ef444466', borderRadius: 12, padding: '12px 24px', fontSize: 15, cursor: 'pointer' }}
        >
          חזרה למפה
        </button>
      </div>
    </div>
  );

  // ─── Root Render ───
  return (
    <div style={{ minHeight: '100vh', direction: 'rtl', fontFamily: 'inherit' }}>
      <style>{KEYFRAMES}</style>
      {phase === 'ninja-select' && renderNinjaSelect()}
      {phase === 'world-map' && renderWorldMap()}
      {phase === 'battle' && renderBattle()}
      {phase === 'stage-complete' && renderStageComplete()}
      {phase === 'defeat' && renderDefeat()}
    </div>
  );
}
