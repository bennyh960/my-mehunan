import { useState, useEffect, useCallback, useMemo, useRef } from "react";

// ============================================================
// SOUND ENGINE
// ============================================================
const SoundEngine = {
  ctx: null,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  play(type) {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "correct") {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === "wrong") {
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === "click") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.08);
      } else if (type === "celebrate") {
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.frequency.setValueAtTime(f, ctx.currentTime + i * 0.15);
          g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.15);
          g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.3);
          o.start(ctx.currentTime + i * 0.15);
          o.stop(ctx.currentTime + i * 0.15 + 0.3);
        });
      }
    } catch (e) {}
  }
};

// ============================================================
// CONSTANTS
// ============================================================
const DEFAULT_SETTINGS = {
  playerName: "",
  grade: 3,
  animations: "full",
  sound: true,
  timerEnabled: true,
  timerSeconds: { 1: 45, 2: 60, 3: 90, 4: 75, 5: 60 },
  transitionSpeed: 3,
  testQuestionCount: 15,
  testTimeMinutes: 30,
  explanationMode: "full",
  rushMode: false,
  adminPassword: "1234",
};

const TOPIC_NAMES = { 1: "מה הקשר בין המילים?", 2: "מהן המילים החסרות?", 3: "מה הפתרון לבעיה?", 4: "מה המספר החסר?", 5: "מה הצורה הבאה?" };
const TOPIC_ICONS = { 1: "🔤", 2: "✏️", 3: "🧮", 4: "🔢", 5: "🔷" };
const TOPIC_COLORS = { 1: "#6ee7b7", 2: "#fbbf24", 3: "#f87171", 4: "#818cf8", 5: "#22d3ee" };

const DEFAULT_PROGRESS = { answers: {}, tests: [], streak: 0, lastDate: null, points: 0 };

// ============================================================
// SVG DRAWING HELPERS
// ============================================================
const polygon = (cx, cy, r, sides, rot = -Math.PI/2) =>
  Array.from({ length: sides }, (_, i) => {
    const a = rot + (i * 2 * Math.PI / sides);
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
  }).join(" ");

function Shape({ type, size = 40, fill = "none", stroke = "#22d3ee", strokeWidth = 2.2, rotation = 0, innerShape, innerColor, dotPos, dotColor }) {
  const s = size, c = s / 2, r = s / 2 - 3;
  const transform = rotation ? `rotate(${rotation} ${c} ${c})` : undefined;
  let main = null;
  switch (type) {
    case "triangle": main = <polygon points={polygon(c, c, r, 3)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "square": main = <rect x="3" y="3" width={s-6} height={s-6} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "pentagon": main = <polygon points={polygon(c, c, r, 5)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "hexagon": main = <polygon points={polygon(c, c, r, 6)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "heptagon": main = <polygon points={polygon(c, c, r, 7)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "octagon": main = <polygon points={polygon(c, c, r, 8)} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "circle": main = <circle cx={c} cy={c} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "diamond": main = <polygon points={`${c},3 ${s-3},${c} ${c},${s-3} 3,${c}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "star": main = <polygon points={Array.from({length:10},(_,i)=>{const a=(i*Math.PI/5)-Math.PI/2;const rr=i%2===0?r:r*0.4;return `${c+rr*Math.cos(a)},${c+rr*Math.sin(a)}`;}).join(" ")} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "arrow_up": main = <polygon points={`${c},4 ${s-6},${c+4} ${c+5},${c+4} ${c+5},${s-4} ${c-5},${s-4} ${c-5},${c+4} 6,${c+4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "cross": main = <polygon points={`${c-4},3 ${c+4},3 ${c+4},${c-4} ${s-3},${c-4} ${s-3},${c+4} ${c+4},${c+4} ${c+4},${s-3} ${c-4},${s-3} ${c-4},${c+4} 3,${c+4} 3,${c-4} ${c-4},${c-4}`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    case "semicircle": main = <path d={`M ${3} ${c} A ${r} ${r} 0 0 1 ${s-3} ${c} Z`} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />; break;
    default: main = <circle cx={c} cy={c} r={r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />;
  }
  let inner = null;
  if (innerShape) {
    const ir = r * 0.4;
    const ic = innerColor || stroke;
    switch (innerShape) {
      case "circle": inner = <circle cx={c} cy={c} r={ir} fill={ic} stroke="none" />; break;
      case "square": inner = <rect x={c-ir} y={c-ir} width={ir*2} height={ir*2} fill={ic} stroke="none" />; break;
      case "dot": inner = <circle cx={c} cy={c} r={3} fill={ic} stroke="none" />; break;
      case "triangle": inner = <polygon points={polygon(c, c, ir, 3)} fill={ic} stroke="none" />; break;
    }
  }
  let dot = null;
  if (dotPos) {
    const dc = dotColor || "#fbbf24";
    const positions = { top: [c, 6], bottom: [c, s-6], left: [6, c], right: [s-6, c], center: [c, c], tl: [8,8], tr: [s-8,8], bl: [8,s-8], br: [s-8,s-8] };
    const p = positions[dotPos] || positions.center;
    dot = <circle cx={p[0]} cy={p[1]} r={3.5} fill={dc} stroke="none" />;
  }
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: "block" }}>
      <g transform={transform}>{main}{inner}{dot}</g>
    </svg>
  );
}

// Compose complex figure from description
function CompositeShape({ desc, size = 52 }) {
  if (!desc) return null;
  return (
    <Shape
      type={desc.shape || "circle"}
      size={size}
      fill={desc.fill || "none"}
      stroke={desc.stroke || "#22d3ee"}
      strokeWidth={desc.strokeWidth || 2.2}
      rotation={desc.rotation || 0}
      innerShape={desc.inner}
      innerColor={desc.innerColor}
      dotPos={desc.dot}
      dotColor={desc.dotColor}
    />
  );
}

// ============================================================
// QUESTION BANK
// ============================================================
const QUESTIONS = [
  // =================== TOPIC 1: Analogies ===================
  { id:"1-1",topic:1,grades:[2, 3],difficulty:"easy",
    question:"כלב : נביחה", options:["ברווז : כנפיים","גמל : מים","ציפור : ציוץ","חתול : ליקוק"], correct:2,
    explanation:"הקשר: חיה והקול שהיא משמיעה. כלב נובח, ציפור מצייצת. חתול לא מליקוק (ליקוק זה פעולה לא קול), ברווז וכנפיים זה חיה ואיבר." },
  { id:"1-2",topic:1,grades:[2, 3],difficulty:"easy",
    question:"עין : לראות", options:["אוזן : לשמוע","יד : כפפה","פה : שיניים","רגל : נעל"], correct:0,
    explanation:"הקשר: איבר בגוף והפעולה שלו. עין לראות, אוזן לשמוע." },
  { id:"1-3",topic:1,grades:[2, 3],difficulty:"easy",
    question:"חם : קר", options:["גבוה : נמוך","ירוק : עץ","מהיר : רכב","גדול : בית"], correct:0,
    explanation:"הקשר: מילים הפוכות (ניגודים). חם↔קר, גבוה↔נמוך." },
  { id:"1-4",topic:1,grades:[2],difficulty:"easy",
    question:"לילה : חושך", options:["יום : אור","ערב : ירח","בוקר : ארוחה","צהריים : שמש"], correct:0,
    explanation:"הקשר: זמן ביום והתכונה שלו. לילה=חושך, יום=אור." },
  { id:"1-5",topic:1,grades:[2],difficulty:"easy",
    question:"גשם : מטרייה", options:["שמש : כובע","רוח : עץ","שלג : חורף","עננים : שמיים"], correct:0,
    explanation:"הקשר: תופעת מזג אוויר וחפץ שמגן ממנה. גשם→מטרייה, שמש→כובע." },
  { id:"1-6",topic:1,grades:[2],difficulty:"medium",
    question:"רופא : חולה", options:["מורה : תלמיד","שוטר : ניידת","טייס : מטוס","נהג : כביש"], correct:0,
    explanation:"הקשר: בעל מקצוע והאדם שהוא משרת. רופא מטפל בחולה, מורה מלמד תלמיד." },
  { id:"1-7",topic:1,grades:[2],difficulty:"medium",
    question:"כנף : ציפור", options:["סנפיר : דג","רגל : שולחן","גלגל : מכונית","זנב : חתול"], correct:0,
    explanation:"הקשר: איבר תנועה ייחודי של חיה. כנף=ציפור עפה, סנפיר=דג שוחה." },

  { id:"1-8",topic:1,grades:[2, 3],difficulty:"easy",
    question:"טבח : מטבח", options:["מורה : לימודים","שופט : בית משפט","שליח : משלוח","חולה : בית חולים"], correct:1,
    explanation:"הקשר: בעל מקצוע ומקום עבודתו. טבח→מטבח, שופט→בית משפט." },
  { id:"1-9",topic:1,grades:[3, 4],difficulty:"medium",
    question:"לטרוק : לסגור", options:["לשמוע : להקשיב","להבין : לנחש","לצעוק : לדבר","לתת : להשאיל"], correct:2,
    explanation:"הקשר: פעולה חזקה ופעולה רגילה. לטרוק=לסגור בחוזקה, לצעוק=לדבר בחוזקה." },
  { id:"1-10",topic:1,grades:[2, 3, 4],difficulty:"medium",
    question:"ספר : מדף", options:["כביש : מכונית","מכתב : מעטפה","בגד : ארון","עט : דיו"], correct:2,
    explanation:"הקשר: חפץ ומקום אחסון. ספר במדף, בגד בארון." },
  { id:"1-11",topic:1,grades:[3, 4],difficulty:"medium",
    question:"צמא : שתייה", options:["עייפות : מיטה","רעב : אוכל","קור : מעיל","שמחה : חיוך"], correct:1,
    explanation:"הקשר: צורך ומה שפותר אותו. צמא→שתייה, רעב→אוכל." },
  { id:"1-12",topic:1,grades:[2, 3],difficulty:"medium",
    question:"דבש : מתוק", options:["לימון : חמוץ","מלח : ים","סוכר : עוגה","שוקולד : חום"], correct:0,
    explanation:"הקשר: מאכל והטעם שלו. דבש=מתוק, לימון=חמוץ." },
  { id:"1-13",topic:1,grades:[3, 4],difficulty:"hard",
    question:"אצבע : כפפה", options:["ראש : כובע","עין : משקפיים","רגל : נעל","גוף : חולצה"], correct:2,
    explanation:"הקשר: איבר ולבוש צמוד שמכסה אותו בדיוק. אצבע→כפפה (צמוד), רגל→נעל (צמוד). כובע לא צמוד כמו כפפה." },
  { id:"1-14",topic:1,grades:[3],difficulty:"hard",
    question:"צייר : מכחול", options:["נגר : מסור","שחקן : במה","זמר : שיר","סופר : ספרייה"], correct:0,
    explanation:"הקשר: בעל מקצוע וכלי העבודה שלו. צייר+מכחול, נגר+מסור." },

  { id:"1-15",topic:1,grades:[3, 4],difficulty:"medium",
    question:"זחל : פרפר", options:["ביצה : תרנגולת","ראשן : צפרדע","גור : כלב","זרע : פרח"], correct:1,
    explanation:"הקשר: שלב צעיר ובוגר עם מטמורפוזה (שינוי צורה). זחל→פרפר, ראשן→צפרדע. גור→כלב אין שינוי צורה." },
  { id:"1-16",topic:1,grades:[3, 4],difficulty:"medium",
    question:"שעון : זמן", options:["מד-חום : טמפרטורה","טלפון : שיחה","מפה : דרך","מחשב : חשמל"], correct:0,
    explanation:"הקשר: מכשיר מדידה והדבר שהוא מודד. שעון→זמן, מד-חום→טמפרטורה." },
  { id:"1-17",topic:1,grades:[4],difficulty:"hard",
    question:"מספריים : גזירה", options:["מחט : תפירה","מסרק : שיער","עיפרון : נייר","סיר : מטבח"], correct:0,
    explanation:"הקשר: כלי והפעולה שעושים איתו. מספריים→גזירה, מחט→תפירה." },
  { id:"1-18",topic:1,grades:[4],difficulty:"hard",
    question:"נמלה : שקדנית", options:["שועל : ערמומי","אריה : גדול","דג : מים","ציפור : כנפיים"], correct:0,
    explanation:"הקשר: חיה ותכונת אופי מיוחסת. נמלה=שקדנית, שועל=ערמומי. 'אריה גדול' זו תכונה פיזית לא אופי." },
  { id:"1-19",topic:1,grades:[4],difficulty:"hard",
    question:"מילה : משפט", options:["אות : מילה","פסקה : טקסט","ספרה : מספר","צליל : שיר"], correct:0,
    explanation:"הקשר: יחידה קטנה שמרכיבה יחידה גדולה בדרגה אחת למעלה. מילים→משפט, אותיות→מילה." },
  { id:"1-20",topic:1,grades:[4],difficulty:"medium",
    question:"עלה : עץ", options:["גלגל : אופניים","חלון : בית","כפתור : חולצה","דף : מחברת"], correct:3,
    explanation:"הקשר: חלק אחד מתוך הרבה חלקים זהים בשלם. עלים רבים על עץ, דפים רבים במחברת." },

  // =================== TOPIC 2: Missing Words ===================
  { id:"2-1",topic:2,grades:[2, 3],difficulty:"easy",
    question:'הילד רץ ______ כי הוא ______ לאוטובוס.',
    options:["לאט / חיכה","מהר / איחר","הביתה / חזר","שמח / אהב"], correct:1,
    explanation:'מהר/איחר - יש קשר סיבתי: הוא רץ מהר בגלל שאיחר.' },
  { id:"2-2",topic:2,grades:[2, 3],difficulty:"easy",
    question:'הכלב ______ כאשר הוא ______ אדם זר.',
    options:["ישן / ראה","נבח / שמע","שתק / פגש","אכל / הריח"], correct:1,
    explanation:'כלבים נובחים כששומעים אדם זר - תגובה טבעית.' },
  { id:"2-3",topic:2,grades:[2],difficulty:"easy",
    question:'אמא ביקשה ממני ______ את החדר כי הוא היה ______.',
    options:["לנקות / מלוכלך","לצבוע / גדול","לפתוח / סגור","לסגור / פתוח"], correct:0,
    explanation:'ביקשה לנקות כי מלוכלך - קשר סיבתי ברור.' },
  { id:"2-4",topic:2,grades:[2],difficulty:"easy",
    question:'בחורף אני אוהב לשתות ______ כי בחוץ ______.',
    options:["שוקו חם / קר","מים / חם","מיץ / יפה","תה / בוקר"], correct:0,
    explanation:'בחורף קר, לכן שותים שוקו חם.' },
  { id:"2-5",topic:2,grades:[2],difficulty:"medium",
    question:'הציפור בנתה ______ על ______ הגבוה של העץ.',
    options:["קן / הענף","בית / הגזע","גשר / השורש","חור / העלה"], correct:0,
    explanation:'ציפורים בונות קן על ענפים גבוהים.' },
  { id:"2-6",topic:2,grades:[2],difficulty:"medium",
    question:'אני ______ בבוקר ו______ בלילה.',
    options:["קם / ישן","ישן / קם","אוכל / שותה","שמח / עצוב"], correct:0,
    explanation:'סדר יום: בבוקר קמים, בלילה ישנים.' },

  { id:"2-7",topic:2,grades:[2, 3],difficulty:"medium",
    question:'תמר לומדת לנגן ______ בפסנתר ______ בגיטרה.',
    options:["רק / וגם","גם / ורק","גם / וגם","רק / ורק"], correct:2,
    explanation:'"גם / וגם" - היחידה שהגיונית. אם מנגנת בשניהם, הגיוני לומר "גם בפסנתר וגם בגיטרה".' },
  { id:"2-8",topic:2,grades:[3, 4],difficulty:"medium",
    question:'זכרתי בעל-פה את כל ______ אף על פי ש______.',
    options:["המילים של השיר / שמעתי אותו רק פעם אחת","רשימת המכולת / היא כללה רק לחם","שמות המקומות / לא הייתי בהם","מערכת השעות / היא לא השתנתה"], correct:0,
    explanation:'"אף על פי ש" = ניגוד. מפתיע שזכרתי למרות שרק שמעתי פעם אחת.' },
  { id:"2-9",topic:2,grades:[3, 4],difficulty:"hard",
    question:'הספר הזה כל כך ______ שלא יכולתי ______ לקרוא אותו.',
    options:["מעניין / להפסיק","ארוך / לסיים","כבד / להרים","יקר / לקנות"], correct:0,
    explanation:'ספר מעניין → לא יכולתי להפסיק לקרוא. ביטוי נפוץ.' },
  { id:"2-10",topic:2,grades:[3, 4],difficulty:"hard",
    question:'______ שירד גשם, הילדים ______ בחוץ כאילו שום דבר לא ______.',
    options:["למרות / שיחקו / קרה","כי / ישבו / השתנה","בגלל / נשארו / עזר","אחרי / רקדו / נגמר"], correct:0,
    explanation:'"למרות" = ניגוד. למרות הגשם, שיחקו כאילו כלום לא קרה.' },
  { id:"2-11",topic:2,grades:[3],difficulty:"medium",
    question:'ככל שהתרגלתי ______, כך נהיה לי ______ יותר.',
    options:["יותר / קל","פחות / קשה","מהר / משעמם","שוב / עצוב"], correct:0,
    explanation:'"ככל ש...כך" = קשר ישיר. תרגול→קל יותר.' },

  { id:"2-12",topic:2,grades:[4],difficulty:"medium",
    question:'מתן קנה בחנות ______ שמלא ב______ שהוא אוהב ______.',
    options:["זר / פרחים / מים","קופסה / צבעים / לצייר","חבילה / דפים / לקרוא","אסף / קלפים / לשיר"], correct:1,
    explanation:'קנה קופסה מלאה בצבעים שהוא אוהב לצייר - הגיוני ושלם.' },
  { id:"2-13",topic:2,grades:[4],difficulty:"hard",
    question:'יעל אמרה: "______ כי מחר יש לי מבחן ______."',
    options:["היום למדתי / שהיה לי השבוע","מחר אלמד / שיש לי עכשיו","שלשום למדתי / שאתמול היה לי","אני לומדת / שהיה לי שלשום"], correct:2,
    explanation:'סדר זמנים: שלשום למדתי, אתמול היה מבחן, מחר יש עוד. התאמת זמנים.' },
  { id:"2-14",topic:2,grades:[4],difficulty:"hard",
    question:'______ שהמשחק יתחיל, הקהל כבר ______ את המקומות.',
    options:["לפני / מילא","אחרי / פינה","בזמן / חיפש","למרות / שמר"], correct:0,
    explanation:'לפני שהמשחק התחיל, הקהל כבר מילא את המקומות.' },
  { id:"2-15",topic:2,grades:[4],difficulty:"hard",
    question:'דווקא כשחשבתי ש______, גיליתי ש______.',
    options:["הכל אבוד / יש עוד סיכוי","הצלחתי / עשיתי טוב","זה קל / אני יכול","אין בעיה / הכל בסדר"], correct:0,
    explanation:'"דווקא" = הפתעה וניגוד. חשבתי שאבוד → גיליתי שיש סיכוי.' },

  // =================== TOPIC 3: Word Problems ===================
  { id:"3-1",topic:3,grades:[2],difficulty:"easy",
    question:"לדנה יש 24 סוכריות. היא רוצה לחלק שווה בשווה בין 4 חברות. כמה סוכריות תקבל כל חברה?",
    options:["4","6","8","20"], correct:1,
    explanation:"24 ÷ 4 = 6 סוכריות לכל חברה." },
  { id:"3-2",topic:3,grades:[2],difficulty:"easy",
    question:"לתומר יש 15 גולות. הוא נתן 4 ליוסי וקיבל 7 מרוני. כמה גולות יש לו עכשיו?",
    options:["8","12","18","26"], correct:2,
    explanation:"15 - 4 + 7 = 18 גולות." },
  { id:"3-3",topic:3,grades:[2, 3],difficulty:"medium",
    question:"ברכבת 8 קרונות, בכל קרון 30 מקומות. כמה אנשים יכולים לשבת?",
    options:["38","80","240","300"], correct:2,
    explanation:"8 × 30 = 240 מקומות." },
  { id:"3-4",topic:3,grades:[2, 3],difficulty:"medium",
    question:"בחניון 5 שורות של מכוניות, בכל שורה 8. נסעו 7 מכוניות. כמה נשארו?",
    options:["28","33","35","40"], correct:1,
    explanation:"5 × 8 = 40. 40 - 7 = 33." },
  { id:"3-5",topic:3,grades:[2, 3],difficulty:"medium",
    question:"בגן חיות 4 פילים, 6 קופים ו-10 ציפורים. כמה רגליים יש לכולם?",
    options:["40","60","80","100"], correct:1,
    explanation:"פילים: 4×4=16, קופים: 6×4=24, ציפורים: 10×2=20. סה\"כ: 60." },

  { id:"3-6",topic:3,grades:[2, 3],difficulty:"medium",
    question:"כל משפחת לוי הלכה לגלידרייה. לכל אחד 2 כדורים. סה\"כ 14 כדורים. כמה בני משפחה?",
    options:["6","7","12","16"], correct:1,
    explanation:"14 ÷ 2 = 7 בני משפחה." },
  { id:"3-7",topic:3,grades:[3, 4],difficulty:"medium",
    question:"אורי קנה 3 מחברות ב-12 ₪ כל אחת ו-2 עטים ב-5 ₪. שילם 100 ₪. כמה עודף?",
    options:["46","54","64","83"], correct:1,
    explanation:"3×12=36, 2×5=10. סה\"כ 46. עודף: 100-46=54." },
  { id:"3-8",topic:3,grades:[3, 4],difficulty:"hard",
    question:"שעון מראה 3:45. כמה דקות עברו מ-2:20?",
    options:["65","75","85","125"], correct:2,
    explanation:"מ-2:20 עד 3:20 = 60 דקות. עוד 25 = 85 דקות." },
  { id:"3-9",topic:3,grades:[3, 4],difficulty:"hard",
    question:"חנות מוכרת תפוחים בשקיות של 6. אמא צריכה 50. כמה שקיות לפחות?",
    options:["7","8","9","10"], correct:2,
    explanation:"50÷6=8 שארית 2. 8 שקיות=48 לא מספיק. צריך 9 שקיות=54." },

  { id:"3-10",topic:3,grades:[4],difficulty:"medium",
    question:"באולם 17 שורות, בכל שורה 11 כסאות. כמה כסאות יש?",
    options:["28","107","170","187"], correct:3,
    explanation:"17×11 = 17×10+17 = 170+17 = 187." },
  { id:"3-11",topic:3,grades:[4],difficulty:"hard",
    question:"בכיתה 28 תלמידים. הבנות פי 3 מהבנים. כמה בנים?",
    options:["4","7","9","14"], correct:1,
    explanation:"בנים=x, בנות=3x. x+3x=28, 4x=28, x=7." },
  { id:"3-12",topic:3,grades:[4],difficulty:"hard",
    question:"מספר אי-זוגי דו-ספרתי, סכום ספרותיו 11, ספרת עשרות גדולה ב-3 מאחדות. מהו?",
    options:["11","36","47","83"], correct:2,
    explanation:"אם אחדות=x, עשרות=x+3. x+(x+3)=11, x=4. המספר: 74. אבל 74 זוגי! הפוך: 47. 4+7=11, 7-4=3, 47 אי-זוגי ✓" },
  { id:"3-13",topic:3,grades:[4],difficulty:"hard",
    question:"בניין 5 קומות. בראשונה 2 דירות, בכל קומה דירה נוספת. כמה דירות?",
    options:["10","15","20","25"], correct:2,
    explanation:"קומה 1:2, 2:3, 3:4, 4:5, 5:6. סה\"כ 2+3+4+5+6=20." },
  { id:"3-14",topic:3,grades:[4],difficulty:"hard",
    question:"מיכל גדולה מנועה ב-3. נועה גדולה מעידו ב-2. מיכל בת 10. סכום גילאיהם?",
    options:["22","24","25","27"], correct:0,
    explanation:"מיכל=10, נועה=7, עידו=5. סה\"כ 10+7+5=22." },

  // =================== TOPIC 4: Missing Number ===================
  { id:"4-1",topic:4,grades:[2, 3],difficulty:"easy",
    question:"circles_sum",
    visual:{type:"circles_trio",circles:[{top:[5,4],bottom:9},{top:[8,3],bottom:11},{top:[7,6],bottom:"?"}]},
    options:["9","10","13","42"], correct:2,
    explanation:"הכלל: למטה = סכום למעלה. 5+4=9, 8+3=11, 7+6=13." },
  { id:"4-2",topic:4,grades:[2],difficulty:"easy",
    question:"circles_plus1",
    visual:{type:"circles_trio",circles:[{top:[3,4],bottom:8},{top:[6,2],bottom:9},{top:[5,5],bottom:"?"}]},
    options:["10","11","12","15"], correct:1,
    explanation:"הכלל: למטה = סכום +1. 3+4+1=8, 6+2+1=9, 5+5+1=11." },
  { id:"4-3",topic:4,grades:[2, 3],difficulty:"medium",
    question:"circles_mult",
    visual:{type:"circles_trio",circles:[{top:[3,2],bottom:6},{top:[4,3],bottom:12},{top:[5,4],bottom:"?"}]},
    options:["9","15","20","24"], correct:2,
    explanation:"הכלל: למטה = מכפלת למעלה. 3×2=6, 4×3=12, 5×4=20." },
  { id:"4-4",topic:4,grades:[2, 3],difficulty:"medium",
    question:"circles_mult2",
    visual:{type:"circles_trio",circles:[{top:[2,5],bottom:10},{top:[3,4],bottom:12},{top:[6,3],bottom:"?"}]},
    options:["9","12","18","21"], correct:2,
    explanation:"הכלל: למטה = מכפלת למעלה. 2×5=10, 3×4=12, 6×3=18." },
  { id:"4-5",topic:4,grades:[2],difficulty:"medium",
    question:"seq_add2",
    visual:{type:"sequence",numbers:[1,3,5,7,"?"]},
    options:["8","9","10","11"], correct:1,
    explanation:"סדרה: +2 בכל פעם. 1,3,5,7,9." },
  { id:"4-6",topic:4,grades:[2],difficulty:"hard",
    question:"circles_div",
    visual:{type:"circles_trio",circles:[{top:[12,3],bottom:4},{top:[20,4],bottom:5},{top:[18,6],bottom:"?"}]},
    options:["2","3","12","24"], correct:1,
    explanation:"הכלל: למטה = חלוקה. 12÷3=4, 20÷4=5, 18÷6=3." },

  { id:"4-7",topic:4,grades:[3, 4],difficulty:"medium",
    question:"circles_product",
    visual:{type:"circles_trio",circles:[{top:[10,2],bottom:20},{top:[9,3],bottom:27},{top:[8,"?"],bottom:32}]},
    options:["4","6","12","24"], correct:0,
    explanation:"הכלל: למטה = מכפלה. 10×2=20, 9×3=27, 8×?=32, ?=4." },
  { id:"4-8",topic:4,grades:[3, 4],difficulty:"medium",
    question:"seq_mult2",
    visual:{type:"sequence",numbers:[2,4,8,16,"?"]},
    options:["18","24","32","64"], correct:2,
    explanation:"סדרה: ×2 בכל פעם. 2,4,8,16,32." },
  { id:"4-9",topic:4,grades:[3],difficulty:"medium",
    question:"triangle1",
    visual:{type:"triangle_pyramid",numbers:{top:"?",midLeft:4,midRight:9,botLeft:7,botMid:11,botRight:20}},
    options:["5","13","14","29"], correct:1,
    explanation:"הכלל: כל מספר = סכום שניים מתחתיו. 4+9=13. ?=13." },
  { id:"4-10",topic:4,grades:[3],difficulty:"hard",
    question:"seq_growing",
    visual:{type:"sequence",numbers:[1,2,4,7,11,"?"]},
    options:["14","15","16","22"], correct:2,
    explanation:"הפרשים גדלים: +1,+2,+3,+4,+5. 11+5=16." },
  { id:"4-11",topic:4,grades:[3],difficulty:"hard",
    question:"circles_diff",
    visual:{type:"circles_trio",circles:[{top:[15,6],bottom:9},{top:[20,8],bottom:12},{top:[18,5],bottom:"?"}]},
    options:["10","13","23","90"], correct:1,
    explanation:"הכלל: למטה = הפרש. 15-6=9, 20-8=12, 18-5=13." },

  { id:"4-12",topic:4,grades:[4],difficulty:"medium",
    question:"sq_arrows",
    visual:{type:"squares_arrows",rows:[{left:16,center:2,right:8},{left:"?",center:4,right:10}]},
    options:["14","20","40","80"], correct:2,
    explanation:"הכלל: שמאל = אמצע × ימין. 2×8=16, 4×10=40." },
  { id:"4-13",topic:4,grades:[4],difficulty:"hard",
    question:"circles_prodplus",
    visual:{type:"circles_trio",circles:[{top:[3,2],bottom:8},{top:[4,3],bottom:14},{top:[5,2],bottom:"?"}]},
    options:["10","12","14","22"], correct:1,
    explanation:"הכלל: למטה = מכפלה +2. 3×2+2=8, 4×3+2=14, 5×2+2=12." },
  { id:"4-14",topic:4,grades:[4],difficulty:"hard",
    question:"circles_avg",
    visual:{type:"circles_trio",circles:[{top:[6,4],bottom:5},{top:[10,8],bottom:9},{top:[14,2],bottom:"?"}]},
    options:["6","8","12","16"], correct:1,
    explanation:"הכלל: למטה = ממוצע. (6+4)/2=5, (10+8)/2=9, (14+2)/2=8." },
  { id:"4-15",topic:4,grades:[4],difficulty:"hard",
    question:"seq_down",
    visual:{type:"sequence",numbers:[81,27,9,3,"?"]},
    options:["0","1","2","3"], correct:1,
    explanation:"סדרה: ÷3 בכל פעם. 81,27,9,3,1." },
  { id:"4-16",topic:4,grades:[4],difficulty:"hard",
    question:"sq_complex",
    visual:{type:"squares_arrows",rows:[{left:5,center:3,right:8},{left:7,center:"?",right:12}]},
    options:["3","5","7","19"], correct:1,
    explanation:"הכלל: ימין = שמאל + אמצע. 5+3=8, 7+?=12, ?=5." },

  // =================== TOPIC 5: Next Shape (ALL VISUAL) ===================
  // --- GRADE 2: simpler patterns ---
  { id:"5-1",topic:5,grades:[2, 3],difficulty:"easy",
    question:"shape_sides_inc",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"triangle",stroke:"#22d3ee"},{shape:"square",stroke:"#22d3ee"},{shape:"pentagon",stroke:"#22d3ee"}
      ]
    },
    options:[
      {shape:"hexagon",stroke:"#22d3ee"},
      {shape:"circle",stroke:"#22d3ee"},
      {shape:"triangle",stroke:"#22d3ee"},
      {shape:"octagon",stroke:"#22d3ee"}
    ],
    correct:0,
    explanation:"הכלל: מספר הצלעות עולה ב-1. משולש(3)→ריבוע(4)→מחומש(5)→משושה(6)." },

  { id:"5-2",topic:5,grades:[2, 3],difficulty:"easy",
    question:"alternating_shapes",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"circle",stroke:"#f87171"},{shape:"square",stroke:"#f87171"},{shape:"circle",stroke:"#f87171"},{shape:"square",stroke:"#f87171"}
      ]
    },
    options:[
      {shape:"circle",stroke:"#f87171"},
      {shape:"square",stroke:"#f87171"},
      {shape:"triangle",stroke:"#f87171"},
      {shape:"diamond",stroke:"#f87171"}
    ],
    correct:0,
    explanation:"הכלל: הצורות מתחלפות - עיגול, ריבוע, עיגול, ריבוע, עיגול." },

  { id:"5-3",topic:5,grades:[2, 3],difficulty:"medium",
    question:"growing_fill",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"circle",stroke:"#4ade80",fill:"none"},
        {shape:"circle",stroke:"#4ade80",fill:"rgba(74,222,128,0.3)"},
        {shape:"circle",stroke:"#4ade80",fill:"rgba(74,222,128,0.6)"}
      ]
    },
    options:[
      {shape:"circle",stroke:"#4ade80",fill:"none"},
      {shape:"circle",stroke:"#4ade80",fill:"#4ade80"},
      {shape:"circle",stroke:"#4ade80",fill:"rgba(74,222,128,0.3)"},
      {shape:"square",stroke:"#4ade80",fill:"#4ade80"}
    ],
    correct:1,
    explanation:"הכלל: העיגול מתמלא בהדרגה - ריק→שליש→שני שליש→מלא." },

  { id:"5-4",topic:5,grades:[2, 3],difficulty:"medium",
    question:"rotation_arrow",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"arrow_up",stroke:"#818cf8",rotation:0},
        {shape:"arrow_up",stroke:"#818cf8",rotation:90},
        {shape:"arrow_up",stroke:"#818cf8",rotation:180},
        {shape:"arrow_up",stroke:"#818cf8",rotation:270}
      ]
    },
    options:[
      {shape:"arrow_up",stroke:"#818cf8",rotation:0},
      {shape:"arrow_up",stroke:"#818cf8",rotation:45},
      {shape:"arrow_up",stroke:"#818cf8",rotation:180},
      {shape:"arrow_up",stroke:"#818cf8",rotation:270}
    ],
    correct:0,
    explanation:"הכלל: החץ מסתובב 90° בכיוון השעון. ↑→→↓→←→↑ (חוזר)." },

  { id:"5-5",topic:5,grades:[2],difficulty:"hard",
    question:"color_alt_shape",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"circle",stroke:"#f87171",fill:"#f87171"},
        {shape:"circle",stroke:"#60a5fa",fill:"none"},
        {shape:"circle",stroke:"#f87171",fill:"#f87171"},
        {shape:"circle",stroke:"#60a5fa",fill:"none"}
      ]
    },
    options:[
      {shape:"circle",stroke:"#f87171",fill:"#f87171"},
      {shape:"circle",stroke:"#60a5fa",fill:"none"},
      {shape:"circle",stroke:"#f87171",fill:"none"},
      {shape:"square",stroke:"#f87171",fill:"#f87171"}
    ],
    correct:0,
    explanation:"הכלל: עיגול אדום מלא, עיגול כחול ריק, חוזר. הבא: אדום מלא." },

  // --- GRADE 3: more complex patterns ---
  { id:"5-6",topic:5,grades:[3, 4],difficulty:"medium",
    question:"shape_color_double",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"triangle",stroke:"#f87171"},{shape:"square",stroke:"#60a5fa"},{shape:"pentagon",stroke:"#4ade80"},{shape:"hexagon",stroke:"#f87171"}
      ]
    },
    options:[
      {shape:"heptagon",stroke:"#60a5fa"},
      {shape:"heptagon",stroke:"#4ade80"},
      {shape:"hexagon",stroke:"#60a5fa"},
      {shape:"octagon",stroke:"#f87171"}
    ],
    correct:0,
    explanation:"שני כללים: 1) צלעות עולות: 3,4,5,6,7. 2) צבע מתחלף: אדום,כחול,ירוק,אדום,כחול. הבא: 7 צלעות + כחול." },

  { id:"5-7",topic:5,grades:[3, 4],difficulty:"medium",
    question:"inner_shape_change",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"square",stroke:"#818cf8",inner:"circle",innerColor:"#fbbf24"},
        {shape:"square",stroke:"#818cf8",inner:"square",innerColor:"#fbbf24"},
        {shape:"square",stroke:"#818cf8",inner:"triangle",innerColor:"#fbbf24"}
      ]
    },
    options:[
      {shape:"square",stroke:"#818cf8",inner:"circle",innerColor:"#fbbf24"},
      {shape:"circle",stroke:"#818cf8",inner:"square",innerColor:"#fbbf24"},
      {shape:"square",stroke:"#818cf8",inner:"dot",innerColor:"#fbbf24"},
      {shape:"triangle",stroke:"#818cf8",inner:"circle",innerColor:"#fbbf24"}
    ],
    correct:0,
    explanation:"הכלל: הצורה החיצונית נשארת ריבוע, הפנימית מתחלפת: עיגול→ריבוע→משולש→עיגול (חוזר)." },

  { id:"5-8",topic:5,grades:[3, 4],difficulty:"hard",
    question:"matrix_color_shape",
    visual:{
      type:"matrix_3x3",
      grid:[
        [{shape:"circle",stroke:"#f87171",fill:"#f87171"},{shape:"circle",stroke:"#60a5fa",fill:"#60a5fa"},{shape:"circle",stroke:"#4ade80",fill:"#4ade80"}],
        [{shape:"square",stroke:"#f87171",fill:"#f87171"},{shape:"square",stroke:"#60a5fa",fill:"#60a5fa"},{shape:"square",stroke:"#4ade80",fill:"#4ade80"}],
        [{shape:"triangle",stroke:"#f87171",fill:"#f87171"},{shape:"triangle",stroke:"#60a5fa",fill:"#60a5fa"},null]
      ]
    },
    options:[
      {shape:"triangle",stroke:"#4ade80",fill:"#4ade80"},
      {shape:"triangle",stroke:"#f87171",fill:"#f87171"},
      {shape:"square",stroke:"#4ade80",fill:"#4ade80"},
      {shape:"circle",stroke:"#4ade80",fill:"#4ade80"}
    ],
    correct:0,
    explanation:"שורות: אותה צורה, צבעים אדום-כחול-ירוק. עמודות: אותו צבע, צורות עיגול-ריבוע-משולש. חסר: משולש ירוק." },

  { id:"5-9",topic:5,grades:[3, 4],difficulty:"hard",
    question:"rotation_with_size",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"triangle",stroke:"#22d3ee",rotation:0,strokeWidth:2},
        {shape:"triangle",stroke:"#22d3ee",rotation:90,strokeWidth:2},
        {shape:"triangle",stroke:"#22d3ee",rotation:180,strokeWidth:2}
      ]
    },
    options:[
      {shape:"triangle",stroke:"#22d3ee",rotation:270},
      {shape:"triangle",stroke:"#22d3ee",rotation:0},
      {shape:"square",stroke:"#22d3ee",rotation:270},
      {shape:"triangle",stroke:"#22d3ee",rotation:180}
    ],
    correct:0,
    explanation:"הכלל: המשולש מסתובב 90° בכל פעם. 0°→90°→180°→270°." },

  { id:"5-10",topic:5,grades:[3],difficulty:"hard",
    question:"dot_position",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"circle",stroke:"#818cf8",dot:"top",dotColor:"#fbbf24"},
        {shape:"circle",stroke:"#818cf8",dot:"right",dotColor:"#fbbf24"},
        {shape:"circle",stroke:"#818cf8",dot:"bottom",dotColor:"#fbbf24"}
      ]
    },
    options:[
      {shape:"circle",stroke:"#818cf8",dot:"left",dotColor:"#fbbf24"},
      {shape:"circle",stroke:"#818cf8",dot:"top",dotColor:"#fbbf24"},
      {shape:"circle",stroke:"#818cf8",dot:"center",dotColor:"#fbbf24"},
      {shape:"square",stroke:"#818cf8",dot:"left",dotColor:"#fbbf24"}
    ],
    correct:0,
    explanation:"הכלל: הנקודה הצהובה זזה בכיוון השעון: למעלה→ימין→למטה→שמאל." },

  // --- GRADE 4: complex matrices ---
  { id:"5-11",topic:5,grades:[4],difficulty:"medium",
    question:"matrix_rotation_fill",
    visual:{
      type:"matrix_3x3",
      grid:[
        [{shape:"triangle",stroke:"#f87171",rotation:0},{shape:"triangle",stroke:"#f87171",rotation:90},{shape:"triangle",stroke:"#f87171",rotation:180}],
        [{shape:"square",stroke:"#60a5fa",rotation:0},{shape:"square",stroke:"#60a5fa",rotation:90},{shape:"square",stroke:"#60a5fa",rotation:180}],
        [{shape:"diamond",stroke:"#4ade80",rotation:0},{shape:"diamond",stroke:"#4ade80",rotation:90},null]
      ]
    },
    options:[
      {shape:"diamond",stroke:"#4ade80",rotation:180},
      {shape:"diamond",stroke:"#4ade80",rotation:270},
      {shape:"triangle",stroke:"#4ade80",rotation:180},
      {shape:"square",stroke:"#4ade80",rotation:180}
    ],
    correct:0,
    explanation:"שורות: אותה צורה+צבע, סיבוב 0°→90°→180°. עמודות: אותו סיבוב, צורה משתנה. חסר: מעוין ירוק 180°." },

  { id:"5-12",topic:5,grades:[4],difficulty:"hard",
    question:"matrix_inner_outer",
    visual:{
      type:"matrix_3x3",
      grid:[
        [{shape:"square",stroke:"#f87171",inner:"circle",innerColor:"#f87171"},{shape:"square",stroke:"#60a5fa",inner:"circle",innerColor:"#60a5fa"},{shape:"square",stroke:"#4ade80",inner:"circle",innerColor:"#4ade80"}],
        [{shape:"circle",stroke:"#f87171",inner:"square",innerColor:"#f87171"},{shape:"circle",stroke:"#60a5fa",inner:"square",innerColor:"#60a5fa"},{shape:"circle",stroke:"#4ade80",inner:"square",innerColor:"#4ade80"}],
        [{shape:"triangle",stroke:"#f87171",inner:"dot",innerColor:"#f87171"},{shape:"triangle",stroke:"#60a5fa",inner:"dot",innerColor:"#60a5fa"},null]
      ]
    },
    options:[
      {shape:"triangle",stroke:"#4ade80",inner:"dot",innerColor:"#4ade80"},
      {shape:"triangle",stroke:"#f87171",inner:"dot",innerColor:"#f87171"},
      {shape:"circle",stroke:"#4ade80",inner:"dot",innerColor:"#4ade80"},
      {shape:"square",stroke:"#4ade80",inner:"circle",innerColor:"#4ade80"}
    ],
    correct:0,
    explanation:"שורות: אותה צורה חיצונית+פנימית, צבע משתנה (אדום,כחול,ירוק). עמודות: אותו צבע, צורה חיצונית משתנה. חסר: משולש ירוק עם נקודה." },

  { id:"5-13",topic:5,grades:[4],difficulty:"hard",
    question:"triple_rule",
    visual:{
      type:"shape_row",
      sequence:[
        {shape:"circle",stroke:"#f87171",fill:"none"},
        {shape:"square",stroke:"#60a5fa",fill:"#60a5fa"},
        {shape:"triangle",stroke:"#4ade80",fill:"none"},
        {shape:"diamond",stroke:"#fbbf24",fill:"#fbbf24"},
        {shape:"pentagon",stroke:"#f87171",fill:"none"}
      ]
    },
    options:[
      {shape:"hexagon",stroke:"#60a5fa",fill:"#60a5fa"},
      {shape:"hexagon",stroke:"#60a5fa",fill:"none"},
      {shape:"pentagon",stroke:"#60a5fa",fill:"#60a5fa"},
      {shape:"hexagon",stroke:"#4ade80",fill:"#4ade80"}
    ],
    correct:0,
    explanation:"3 כללים: 1) צלעות עולות. 2) צבע מתחלף: אדום,כחול,ירוק,צהוב,אדום,כחול. 3) מילוי מתחלף: ריק,מלא,ריק,מלא. הבא: משושה(6) + כחול + מלא." },

  { id:"5-14",topic:5,grades:[4],difficulty:"hard",
    question:"matrix_3rules",
    visual:{
      type:"matrix_3x3",
      grid:[
        [{shape:"circle",stroke:"#f87171",fill:"none",inner:"dot",innerColor:"#f87171"},{shape:"circle",stroke:"#60a5fa",fill:"#60a5fa"},{shape:"circle",stroke:"#4ade80",fill:"none",inner:"dot",innerColor:"#4ade80"}],
        [{shape:"square",stroke:"#60a5fa",fill:"#60a5fa"},{shape:"square",stroke:"#4ade80",fill:"none",inner:"dot",innerColor:"#4ade80"},{shape:"square",stroke:"#f87171",fill:"#f87171"}],
        [{shape:"triangle",stroke:"#4ade80",fill:"none",inner:"dot",innerColor:"#4ade80"},{shape:"triangle",stroke:"#f87171",fill:"#f87171"},null]
      ]
    },
    options:[
      {shape:"triangle",stroke:"#60a5fa",fill:"#60a5fa"},
      {shape:"triangle",stroke:"#60a5fa",fill:"none",inner:"dot",innerColor:"#60a5fa"},
      {shape:"circle",stroke:"#60a5fa",fill:"#60a5fa"},
      {shape:"triangle",stroke:"#4ade80",fill:"#4ade80"}
    ],
    correct:0,
    explanation:"בכל שורה: אותה צורה, 3 צבעים שונים, ו-3 סגנונות (נקודה, מלא, נקודה). בעמודה: צבעים מזיזים. חסר: משולש כחול מלא." },

  { id:"5-15",topic:5,grades:[4],difficulty:"hard",
    question:"complex_sequence",
    visual:{type:"shape_row",sequence:[
        {shape:"triangle",stroke:"#22d3ee",fill:"none",rotation:0},
        {shape:"triangle",stroke:"#22d3ee",fill:"none",rotation:180},
        {shape:"square",stroke:"#22d3ee",fill:"#22d3ee",rotation:0},
        {shape:"square",stroke:"#22d3ee",fill:"#22d3ee",rotation:45},
        {shape:"pentagon",stroke:"#22d3ee",fill:"none",rotation:0}
    ]},
    options:[
      {shape:"pentagon",stroke:"#22d3ee",fill:"none",rotation:180},
      {shape:"pentagon",stroke:"#22d3ee",fill:"#22d3ee",rotation:0},
      {shape:"hexagon",stroke:"#22d3ee",fill:"none",rotation:0},
      {shape:"pentagon",stroke:"#22d3ee",fill:"#22d3ee",rotation:180}
    ],
    correct:0,
    explanation:"כללים: 1) כל צורה מופיעה פעמיים. 2) במופע השני יש סיבוב. 3) מילוי מתחלף בין זוגות. הבא: מחומש מסובב." },

  // ===== EXTRA QUESTIONS: TOPIC 1 =====
  { id:"1-50",topic:1,grades:[2, 3],difficulty:"medium",
    question:"חלב : גבינה", options:["ענבים : יין","מים : ברז","לחם : חיטה","ביצה : תרנגולת"], correct:0,
    explanation:"הקשר: חומר גלם והמוצר שמכינים ממנו. מחלב→גבינה, מענבים→יין." },
  { id:"1-51",topic:1,grades:[2, 3],difficulty:"medium",
    question:"מלך : כתר", options:["שוטר : אקדח","ליצן : אף אדום","רופא : מזרק","חייל : מדים"], correct:1,
    explanation:"הקשר: דמות והסמל המזהה שלה. מלך=כתר, ליצן=אף אדום." },
  { id:"1-52",topic:1,grades:[2],difficulty:"hard",
    question:"סולם : מדרגות", options:["אופניים : מכונית","עיפרון : מחשב","ספינה : מטוס","נר : מנורה"], correct:3,
    explanation:"דבר פשוט/ישן ודבר מתקדם עם אותה מטרה. סולם ומדרגות=לטפס. נר ומנורה=תאורה." },
  { id:"1-53",topic:1,grades:[2],difficulty:"hard",
    question:"חורף : קר", options:["קיץ : חם","סתיו : גשם","אביב : פרחים","לילה : ירח"], correct:0,
    explanation:"עונה ותכונה מרכזית. חורף=קר, קיץ=חם." },
  { id:"1-54",topic:1,grades:[3, 4],difficulty:"hard",
    question:"עכביש : רשת", options:["דבורה : דבש","ציפור : קן","תולעת : אדמה","נמלה : גבעה"], correct:0,
    explanation:"חיה ומוצר שהיא מייצרת מגופה. עכביש→רשת, דבורה→דבש." },
  { id:"1-55",topic:1,grades:[3, 4],difficulty:"hard",
    question:"מפתח : מנעול", options:["שלט : טלוויזיה","כפתור : חולצה","פקק : בקבוק","חגורה : מכנסיים"], correct:0,
    explanation:"כלי שמפעיל/פותח משהו ספציפי. מפתח→מנעול, שלט→טלוויזיה." },
  { id:"1-56",topic:1,grades:[3],difficulty:"hard",
    question:"אי : ים", options:["הר : שלג","ירח : שמיים","אגם : יער","ענן : רוח"], correct:1,
    explanation:"גוף מוקף/נמצא בתוך דבר גדול. אי בים, ירח בשמיים." },
  { id:"1-57",topic:1,grades:[4],difficulty:"hard",
    question:"בצורת : רעב", options:["שיטפון : הרס","מגפה : מוות","רעידת אדמה : פחד","סערה : רוח"], correct:0,
    explanation:"אסון טבע ותוצאה ישירה. בצורת→רעב, שיטפון→הרס." },
  { id:"1-58",topic:1,grades:[4],difficulty:"hard",
    question:"מיקרוסקופ : חיידק", options:["טלסקופ : כוכב","משקפיים : ספר","זכוכית מגדלת : עיתון","מראה : פנים"], correct:0,
    explanation:"מכשיר אופטי ודבר שרואים רק דרכו. מיקרוסקופ→חיידק, טלסקופ→כוכב." },
  { id:"1-59",topic:1,grades:[4],difficulty:"hard",
    question:"סימפוניה : מנצח", options:["סרט : במאי","שיר : זמר","ספר : קורא","תמונה : מוזיאון"], correct:0,
    explanation:"יצירה והאדם שמוביל ביצועה. סימפוניה→מנצח, סרט→במאי." },

  // ===== EXTRA QUESTIONS: TOPIC 2 =====
  { id:"2-50",topic:2,grades:[2, 3],difficulty:"medium",
    question:'השמש ______ והילדים ______ לשחק בחוץ.',
    options:["זרחה / יצאו","שקעה / רצו","נעלמה / אהבו","עלתה / פחדו"], correct:0,
    explanation:'שמש זורחת → ילדים יוצאים. קשר סיבתי.' },
  { id:"2-51",topic:2,grades:[2],difficulty:"hard",
    question:'______ שלמדתי קשה למבחן, קיבלתי ציון ______.',
    options:["למרות / נמוך","בגלל / נמוך","כי / גבוה","אחרי / יפה"], correct:0,
    explanation:'"למרות" = ניגוד מפתיע. למדתי קשה אבל ציון נמוך.' },
  { id:"2-52",topic:2,grades:[2],difficulty:"hard",
    question:'הספר היה כל כך ______ שלא יכולתי ______ לקרוא.',
    options:["משעמם / להמשיך","מפחיד / להפסיק","מעניין / להפסיק","קל / להתחיל"], correct:2,
    explanation:'ספר מעניין → לא יכולתי להפסיק. ביטוי נפוץ.' },
  { id:"2-53",topic:2,grades:[3, 4],difficulty:"hard",
    question:'ככל שהחידה ______ יותר, כך ______ יותר כשפותרים אותה.',
    options:["קשה / משמח","קלה / קשה","ארוכה / עצוב","מוזרה / מפחיד"], correct:0,
    explanation:'ככל שקשה יותר, כך יותר משמח לפתור - אתגר ותגמול.' },
  { id:"2-54",topic:2,grades:[3],difficulty:"hard",
    question:'לא ______ ולא ______ - פשוט נשארתי במקום.',
    options:["התקדמתי / נסוגתי","אכלתי / שתיתי","צחקתי / בכיתי","עליתי / ירדתי"], correct:0,
    explanation:'לא התקדמתי ולא נסוגתי = נשארתי במקום. ניגודים שלא קרו.' },
  { id:"2-55",topic:2,grades:[4],difficulty:"hard",
    question:'אילו ______, הייתי ______ - אבל זה כבר מאוחר מדי.',
    options:["ידעתי מראש / משנה דעתי","שאלתי / מבין","בדקתי / מוצא","חשבתי / יודע"], correct:0,
    explanation:'"אילו" = תנאי שלא התקיים. חרטה על העבר.' },
  { id:"2-56",topic:2,grades:[4],difficulty:"hard",
    question:'לא ______ היה המצב, כי ______ גרם לשיפור.',
    options:["חסר תקווה / שינוי קטן","טוב / כישלון","ברור / הזמן","נוח / מאמץ"], correct:0,
    explanation:'לא חסר תקווה כי שינוי קטן שיפר. אופטימיות.' },

  // ===== EXTRA QUESTIONS: TOPIC 3 - FRACTIONS (grade 2) =====
  { id:"3-50",topic:3,grades:[2, 3],difficulty:"medium",
    question:"אמא חתכה פיצה ל-4 חלקים שווים. דני אכל חלק אחד. איזה חלק מהפיצה נשאר?",
    options:["חצי","שלושה רבעים","רבע","שני שלישים"], correct:1,
    explanation:"נשאר: 4/4-1/4=3/4 (שלושה רבעים)." },
  { id:"3-51",topic:3,grades:[2, 3],difficulty:"medium",
    question:"שוקולד חולק ל-8 חלקים. נועה אכלה 4. איזה חלק אכלה?",
    options:["רבע","שליש","חצי","שלושה רבעים"], correct:2,
    explanation:"4 מתוך 8 = 4/8 = 1/2 (חצי)." },
  { id:"3-52",topic:3,grades:[2, 3],difficulty:"hard",
    question:"עוגה חולקה ל-6 חלקים. רון אכל 2 ויעל אכלה 1. כמה נשאר?",
    options:["חצי","שליש","רבע","שני שלישים"], correct:0,
    explanation:"אכלו 3 מתוך 6. נשאר: 3/6=1/2 (חצי)." },
  { id:"3-53",topic:3,grades:[2],difficulty:"hard",
    question:"סרגל חולק ל-4 חלקים שווים, כל חלק 5 ס\"מ. מה אורכו?",
    options:["9 ס\"מ","15 ס\"מ","20 ס\"מ","25 ס\"מ"], correct:2,
    explanation:"4×5=20 ס\"מ." },
  { id:"3-54",topic:3,grades:[2],difficulty:"hard",
    question:"בצלחת 12 עוגיות. הילדים אכלו שליש. כמה נשארו?",
    options:["4","6","8","9"], correct:2,
    explanation:"שליש מ-12=4 אכלו. נשאר: 12-4=8." },
  { id:"3-55",topic:3,grades:[2],difficulty:"hard",
    question:"לכל ילד 3 עפרונות ו-2 מחדדים. 8 ילדים בכיתה. כמה פריטים בסה\"כ?",
    options:["24","40","32","48"], correct:1,
    explanation:"8×3=24 עפרונות. 8×2=16 מחדדים. 24+16=40." },
  { id:"3-56",topic:3,grades:[2],difficulty:"hard",
    question:"קניתי 7 שקיות עם 6 סוכריות כל אחת. נתתי 10. כמה נשאר?",
    options:["22","32","38","42"], correct:1,
    explanation:"7×6=42. 42-10=32." },
  // TOPIC 3 - grade 3 extra
  { id:"3-57",topic:3,grades:[3, 4],difficulty:"hard",
    question:"בקופסה 48 כדורים. חצי אדומים, רבע כחולים, השאר ירוקים. כמה ירוקים?",
    options:["6","12","18","24"], correct:1,
    explanation:"אדומים: 24. כחולים: 12. ירוקים: 48-24-12=12." },
  { id:"3-58",topic:3,grades:[3, 4],difficulty:"hard",
    question:"רכבת יוצאת ב-8:15. מגיעה אחרי שעה ו-45 דקות. מתי?",
    options:["9:00","9:45","10:00","10:15"], correct:2,
    explanation:"8:15+1:45=10:00." },
  { id:"3-59",topic:3,grades:[3],difficulty:"hard",
    question:"חניון 5 קומות, 30 מקומות בכל אחת. 87 תפוסים. כמה פנויים?",
    options:["57","63","67","93"], correct:1,
    explanation:"5×30=150. 150-87=63." },
  // TOPIC 3 - grade 4 extra
  { id:"3-60",topic:3,grades:[4],difficulty:"hard",
    question:"הנחה של רבע מהמחיר. חולצה ב-80₪. כמה עולות 3 חולצות אחרי הנחה?",
    options:["120","160","180","240"], correct:2,
    explanation:"הנחה: 80/4=20. מחיר: 60. שלוש: 60×3=180." },
  { id:"3-61",topic:3,grades:[4],difficulty:"hard",
    question:"5 פועלים בונים קיר ב-8 ימים. כמה ייקח ל-10 פועלים?",
    options:["2","4","8","16"], correct:1,
    explanation:"כפול פועלים=חצי זמן. 8÷2=4 ימים." },
  { id:"3-62",topic:3,grades:[4],difficulty:"hard",
    question:"בסדרה: 2, 6, 18, 54... מה הבא?",
    options:["72","108","162","216"], correct:2,
    explanation:"×3: 2,6,18,54,162." },

  // ===== EXTRA QUESTIONS: TOPIC 4 =====
  { id:"4-50",topic:4,grades:[2, 3],difficulty:"medium",
    question:"c_mult3",visual:{type:"circles_trio",circles:[{top:[2,3],bottom:6},{top:[4,2],bottom:8},{top:[3,5],bottom:"?"}]},
    options:["8","10","15","18"], correct:2,
    explanation:"כפל: 2×3=6, 4×2=8, 3×5=15." },
  { id:"4-51",topic:4,grades:[2],difficulty:"hard",
    question:"c_div2",visual:{type:"circles_trio",circles:[{top:[10,2],bottom:5},{top:[12,3],bottom:4},{top:[20,4],bottom:"?"}]},
    options:["3","5","16","24"], correct:1,
    explanation:"חילוק: 10÷2=5, 12÷3=4, 20÷4=5." },
  { id:"4-52",topic:4,grades:[2],difficulty:"hard",
    question:"seq_x3",visual:{type:"sequence",numbers:[1,3,9,27,"?"]},
    options:["36","54","81","108"], correct:2,
    explanation:"×3: 1,3,9,27,81." },
  { id:"4-53",topic:4,grades:[3, 4],difficulty:"hard",
    question:"c_mp1",visual:{type:"circles_trio",circles:[{top:[2,3],bottom:7},{top:[4,2],bottom:9},{top:[3,5],bottom:"?"}]},
    options:["8","15","16","17"], correct:2,
    explanation:"כפל+1: 2×3+1=7, 4×2+1=9, 3×5+1=16." },
  { id:"4-54",topic:4,grades:[3],difficulty:"hard",
    question:"seq_fib",visual:{type:"sequence",numbers:[1,1,2,3,5,8,"?"]},
    options:["10","11","13","16"], correct:2,
    explanation:"פיבונאצ'י: כל מספר=סכום שני הקודמים. 5+8=13." },
  { id:"4-55",topic:4,grades:[3],difficulty:"hard",
    question:"c_sq",visual:{type:"circles_trio",circles:[{top:[2,3],bottom:13},{top:[3,4],bottom:25},{top:[1,5],bottom:"?"}]},
    options:["6","10","26","30"], correct:2,
    explanation:"ריבועים: 2²+3²=4+9=13, 3²+4²=25, 1²+5²=26." },
  { id:"4-56",topic:4,grades:[4],difficulty:"hard",
    question:"c_cubed",visual:{type:"circles_trio",circles:[{top:[2,1],bottom:9},{top:[3,2],bottom:29},{top:[4,1],bottom:"?"}]},
    options:["17","33","65","81"], correct:2,
    explanation:"מעוקבים: 2³+1=9, 3³+2=29, 4³+1=65." },
  { id:"4-57",topic:4,grades:[4],difficulty:"hard",
    question:"tr2",visual:{type:"triangle_pyramid",numbers:{top:120,midLeft:40,midRight:"?",botLeft:8,botMid:5,botRight:16}},
    options:["64","80","96","100"], correct:1,
    explanation:"כפל: 8×5=40, 5×16=80. 40+80=120 ✓. ?=80." },
  { id:"4-58",topic:4,grades:[4],difficulty:"hard",
    question:"seq_prime",visual:{type:"sequence",numbers:[2,3,5,7,11,13,"?"]},
    options:["15","16","17","19"], correct:2,
    explanation:"ראשוניים: 2,3,5,7,11,13,17." },

  // --- Varied ? positions ---
  { id:"4-60",topic:4,grades:[2,3],difficulty:"medium",
    question:"c_top_missing",visual:{type:"circles_trio",circles:[{top:[6,4],bottom:10},{top:["?",3],bottom:12},{top:[5,2],bottom:7}]},
    options:["6","8","9","15"], correct:2,
    explanation:"סכום: 6+4=10, ?+3=12 → ?=9, 5+2=7." },
  { id:"4-61",topic:4,grades:[2,3],difficulty:"medium",
    question:"c_top2_missing",visual:{type:"circles_trio",circles:[{top:[3,5],bottom:15},{top:[4,"?"],bottom:24},{top:[2,7],bottom:14}]},
    options:["4","6","8","20"], correct:1,
    explanation:"כפל: 3×5=15, 4×?=24 → ?=6, 2×7=14." },
  { id:"4-62",topic:4,grades:[3,4],difficulty:"hard",
    question:"c_top_hard",visual:{type:"circles_trio",circles:[{top:[8,2],bottom:6},{top:[15,5],bottom:10},{top:["?",4],bottom:7}]},
    options:["3","11","14","28"], correct:1,
    explanation:"חיסור: 8-2=6, 15-5=10, ?-4=7 → ?=11." },
  { id:"4-63",topic:4,grades:[3,4],difficulty:"hard",
    question:"tri_mid",visual:{type:"triangle_pyramid",numbers:{top:30,midLeft:"?",midRight:12,botLeft:6,botMid:3,botRight:4}},
    options:["12","15","18","24"], correct:2,
    explanation:"כפל: 6×3=18, 3×4=12. למעלה: 18+12=30 ✓. ?=18." },
  { id:"4-64",topic:4,grades:[3,4],difficulty:"hard",
    question:"tri_bot",visual:{type:"triangle_pyramid",numbers:{top:24,midLeft:13,midRight:11,botLeft:8,botMid:"?",botRight:6}},
    options:["3","5","7","10"], correct:1,
    explanation:"הכלל: כל מספר = סכום שניים מתחתיו. midL=botL+botMid: 8+?=13 → ?=5. בדיקה: midR=botMid+botRight: 5+6=11 ✓. top=midL+midR: 13+11=24 ✓." },
  { id:"4-65",topic:4,grades:[2,3],difficulty:"medium",
    question:"c_bottom_mult_varied",visual:{type:"circles_trio",circles:[{top:[3,"?"],bottom:15},{top:[4,3],bottom:12},{top:[6,2],bottom:12}]},
    options:["3","4","5","12"], correct:2,
    explanation:"כפל: 3×?=15 → ?=5. 4×3=12 ✓, 6×2=12 ✓." },

  // ===== EXTRA QUESTIONS: TOPIC 5 =====
  { id:"5-50",topic:5,grades:[2, 3],difficulty:"medium",
    question:"three_cycle",
    visual:{type:"shape_row",sequence:[
      {shape:"circle",stroke:"#22d3ee"},{shape:"triangle",stroke:"#22d3ee"},{shape:"square",stroke:"#22d3ee"},
      {shape:"circle",stroke:"#22d3ee"},{shape:"triangle",stroke:"#22d3ee"}
    ]},
    options:[{shape:"square",stroke:"#22d3ee"},{shape:"circle",stroke:"#22d3ee"},{shape:"triangle",stroke:"#22d3ee"},{shape:"diamond",stroke:"#22d3ee"}],
    correct:0,
    explanation:"מחזור: עיגול,משולש,ריבוע חוזר. הבא: ריבוע." },
  { id:"5-51",topic:5,grades:[2],difficulty:"hard",
    question:"thick_lines",
    visual:{type:"shape_row",sequence:[
      {shape:"square",stroke:"#f87171",strokeWidth:1.5},
      {shape:"square",stroke:"#f87171",strokeWidth:2.5},
      {shape:"square",stroke:"#f87171",strokeWidth:4}
    ]},
    options:[{shape:"square",stroke:"#f87171",strokeWidth:5.5},{shape:"square",stroke:"#f87171",strokeWidth:1.5},{shape:"circle",stroke:"#f87171",strokeWidth:5.5},{shape:"square",stroke:"#60a5fa",strokeWidth:5.5}],
    correct:0,
    explanation:"הקווים מתעבים. ריבוע עם קו עבה יותר." },
  { id:"5-52",topic:5,grades:[3, 4],difficulty:"hard",
    question:"mat_fill",
    visual:{type:"matrix_3x3",grid:[
      [{shape:"circle",stroke:"#f87171",fill:"#f87171"},{shape:"circle",stroke:"#f87171",fill:"none"},{shape:"circle",stroke:"#f87171",fill:"rgba(248,113,113,0.4)"}],
      [{shape:"square",stroke:"#60a5fa",fill:"none"},{shape:"square",stroke:"#60a5fa",fill:"rgba(96,165,250,0.4)"},{shape:"square",stroke:"#60a5fa",fill:"#60a5fa"}],
      [{shape:"triangle",stroke:"#4ade80",fill:"rgba(74,222,128,0.4)"},{shape:"triangle",stroke:"#4ade80",fill:"#4ade80"},null]
    ]},
    options:[{shape:"triangle",stroke:"#4ade80",fill:"none"},{shape:"triangle",stroke:"#4ade80",fill:"#4ade80"},{shape:"triangle",stroke:"#4ade80",fill:"rgba(74,222,128,0.4)"},{shape:"square",stroke:"#4ade80",fill:"none"}],
    correct:0,
    explanation:"בכל שורה: 3 מצבי מילוי בסדר שונה. שורה 3: חצי,מלא → חסר ריק." },
  { id:"5-53",topic:5,grades:[4],difficulty:"hard",
    question:"mat_multi",
    visual:{type:"matrix_3x3",grid:[
      [{shape:"circle",stroke:"#f87171",fill:"none"},{shape:"square",stroke:"#60a5fa",fill:"#60a5fa"},{shape:"triangle",stroke:"#4ade80",fill:"none"}],
      [{shape:"square",stroke:"#4ade80",fill:"#4ade80"},{shape:"triangle",stroke:"#f87171",fill:"none"},{shape:"circle",stroke:"#60a5fa",fill:"#60a5fa"}],
      [{shape:"triangle",stroke:"#60a5fa",fill:"none"},{shape:"circle",stroke:"#4ade80",fill:"#4ade80"},null]
    ]},
    options:[{shape:"square",stroke:"#f87171",fill:"none"},{shape:"square",stroke:"#f87171",fill:"#f87171"},{shape:"circle",stroke:"#f87171",fill:"#f87171"},{shape:"diamond",stroke:"#f87171",fill:"none"}],
    correct:0,
    explanation:"בכל שורה/עמודה: כל צורה פעם, כל צבע פעם. חסר: ריבוע אדום ריק." },
  { id:"5-54",topic:5,grades:[4],difficulty:"hard",
    question:"mat_dots",
    visual:{type:"matrix_3x3",grid:[
      [{shape:"circle",stroke:"#818cf8",dot:"top",dotColor:"#fbbf24"},{shape:"circle",stroke:"#818cf8",dot:"right",dotColor:"#fbbf24"},{shape:"circle",stroke:"#818cf8",dot:"bottom",dotColor:"#fbbf24"}],
      [{shape:"square",stroke:"#818cf8",dot:"right",dotColor:"#fbbf24"},{shape:"square",stroke:"#818cf8",dot:"bottom",dotColor:"#fbbf24"},{shape:"square",stroke:"#818cf8",dot:"left",dotColor:"#fbbf24"}],
      [{shape:"triangle",stroke:"#818cf8",dot:"bottom",dotColor:"#fbbf24"},{shape:"triangle",stroke:"#818cf8",dot:"left",dotColor:"#fbbf24"},null]
    ]},
    options:[
      {shape:"triangle",stroke:"#818cf8",dot:"top",dotColor:"#fbbf24"},
      {shape:"triangle",stroke:"#818cf8",dot:"right",dotColor:"#fbbf24"},
      {shape:"triangle",stroke:"#818cf8",dot:"center",dotColor:"#fbbf24"},
      {shape:"circle",stroke:"#818cf8",dot:"top",dotColor:"#fbbf24"}
    ],
    correct:0,
    explanation:"צורה: שורה=זהה. נקודה: מסתובבת בכיוון השעון. שורה 3: למטה→שמאל→למעלה." },

  // ===== QUESTIONS FROM MATIC TEST =====
  // Topic 1 - Analogies
  { id:"1-70",topic:1,grades:[2,3],difficulty:"medium",
    question:"מקלדת : להקיש", options:["אופניים : לדווש","מנורה : להאיר","רמקול : להגביר","ספר : לכתוב"], correct:0,
    explanation:"הקשר: מכשיר והפעולה הפיזית שעושים איתו. מקלדת - מקישים עליה, אופניים - דוושים עליהם. מנורה מאירה (לא הפעולה שלנו), רמקול מגביר (פעולה של המכשיר)." },
  { id:"1-71",topic:1,grades:[2,3],difficulty:"hard",
    question:"את (כלי חפירה) : חפירה", options:["שולחן : כתיבה","מנורה : הדלקה","אטב : הצמדה","דלת : פתיחה"], correct:2,
    explanation:"הקשר: כלי קטן והפעולה הספציפית שעושים איתו. את לחפירה, אטב להצמדה. שולחן לא כלי, מנורה - הדלקה זו פעולה כללית, דלת - לא כלי." },
  { id:"1-72",topic:1,grades:[2,3,4],difficulty:"hard",
    question:"נעל : סנדלר", options:["חוט : חייט","צלחת : טבח","משרד : פקיד","פרסה : נפח"], correct:3,
    explanation:"הקשר: מוצר ובעל המלאכה שמכין אותו. סנדלר מכין נעליים, נפח מכין פרסות (לסוסים). חייט עובד עם בד (לא חוט), טבח לא מכין צלחת, פקיד לא מכין משרד." },

  // Topic 2 - Sentence completion
  { id:"2-70",topic:2,grades:[2,3],difficulty:"hard",
    question:'דני אמר: "חסכתי לטיול ______ הכסף לא הספיק ולכן בסוף ______ לטיול."',
    options:["למרות ש / לא נסעתי","כמו ש / נסעתי","אך / לא נסעתי","כי / נסעתי"], correct:2,
    explanation:'"אך" מציין ניגוד: חסכתי אך הכסף לא הספיק, ולכן לא נסעתי. "למרות ש" לא מתאים כי אחריו צריך "עדיין נסעתי".' },
  { id:"2-71",topic:2,grades:[3,4],difficulty:"hard",
    question:'לאחי יש ______ והוא ______.',
    options:["דוד / האחיין שלי","בן / האחיין שלי","נכד / סבא","אח / גיסי"], correct:1,
    explanation:'אם לאחי יש בן, אז הבן הזה הוא האחיין שלי. דוד הוא אח של הורה, נכד וסבא - הכיוון הפוך, אח וגיסי - גיס הוא בעל של אחות.' },
  { id:"2-72",topic:2,grades:[2,3],difficulty:"hard",
    question:'למדתי לספור ______ אנגלית ______ בספרדית.',
    options:["אך ורק / ורק","אך ורק / ולא","גם / ורק","גם / ולא"], correct:1,
    explanation:'"אך ורק באנגלית ולא בספרדית" - הגיוני. למד רק שפה אחת ולא את השנייה.' },

  // Topic 3 - Word problems
  { id:"3-70",topic:3,grades:[2,3],difficulty:"medium",
    question:"במטוס 25 שורות. בכל שורה 6 כסאות. יש גם 2 כסאות לטייס ולטייס המשנה. כמה כסאות יש בסך הכל?",
    options:["152","33","56","300"], correct:0,
    explanation:"25×6=150 כסאות נוסעים + 2 לטייסים = 152." },
  { id:"3-71",topic:3,grades:[2,3,4],difficulty:"hard",
    question:"במכולת 56 קרטוני חלב. המוכר חילק אותם שווה ל-8 ארגזים. אתמול מכר 3 ארגזים שלמים. כמה קרטונים מכר?",
    options:["7","21","32","16"], correct:1,
    explanation:"56÷8=7 קרטונים בכל ארגז. מכר 3 ארגזים: 3×7=21." },
  { id:"3-72",topic:3,grades:[3,4],difficulty:"hard",
    question:"יוסי בחר מספר אי-זוגי דו-ספרתי. ספרת העשרות גדולה ב-4 מספרת האחדות. סכום הספרות הוא 10. מהו?",
    options:["37","51","62","73"], correct:3,
    explanation:"אם אחדות=x, עשרות=x+4. x+(x+4)=10, 2x=6, x=3. המספר: 73. בדיקה: 7-3=4 ✓, 7+3=10 ✓, 73 אי-זוגי ✓." },

  // Topic 4 - Star shape & new patterns
  { id:"4-70",topic:4,grades:[2,3,4],difficulty:"hard",
    question:"star_squared",
    visual:{type:"star_numbers",
      outer:[49,36,"?",25,16],
      inner:[7,6,8,5,4]
    },
    options:["64","72","65","73"], correct:0,
    explanation:"הכלל: כל מספר חיצוני = ריבוע של המספר הפנימי שמולו. 7²=49, 6²=36, 5²=25, 4²=16. אז 8²=64." },
  { id:"4-71",topic:4,grades:[2,3],difficulty:"medium",
    question:"star_sum",
    visual:{type:"star_numbers",
      outer:[11,9,"?",8,7],
      inner:[5,3,6,2,1]
    },
    options:["10","12","14","18"], correct:1,
    explanation:"הכלל: חיצוני = פנימי×2. 5×2+1=11? לא. ננסה: חיצוני = פנימי+6: 5+6=11, 3+6=9, 2+6=8, 1+6=7. אז 6+6=12." },
  { id:"4-72",topic:4,grades:[3,4],difficulty:"hard",
    question:"star_mult",
    visual:{type:"star_numbers",
      outer:[30,18,"?",12,24],
      inner:[5,3,7,2,4]
    },
    options:["35","42","49","56"], correct:1,
    explanation:"הכלל: חיצוני = פנימי × 6. 5×6=30, 3×6=18, 2×6=12, 4×6=24. אז 7×6=42." },
  { id:"4-73",topic:4,grades:[2,3],difficulty:"medium",
    question:"arrows_div",
    visual:{type:"squares_arrows",rows:[{left:8,center:7,right:56},{left:9,center:"?",right:54}]},
    options:["6","5","7","3"], correct:0,
    explanation:"הכלל: ימין ÷ אמצע = שמאל. 56÷7=8, 54÷?=9 → ?=6." },
  { id:"4-74",topic:4,grades:[3,4],difficulty:"hard",
    question:"tri_matic",
    visual:{type:"triangle_pyramid",numbers:{top:"?",midLeft:7,midRight:12,botLeft:14,botMid:21,botRight:33}},
    options:["21","19","5","45"], correct:2,
    explanation:"הכלל: כל מספר למעלה = ההפרש בין שניים מתחתיו. 21-14=7, 33-21=12. top: 12-7=5." },

  // More pyramids
  { id:"4-80",topic:4,grades:[2,3],difficulty:"medium",
    question:"tri_sum_simple",visual:{type:"triangle_pyramid",numbers:{top:15,midLeft:"?",midRight:8,botLeft:4,botMid:3,botRight:5}},
    options:["5","7","9","12"], correct:1,
    explanation:"סכום: botL+botM=midL: 4+3=7. botM+botR=midR: 3+5=8 ✓. midL+midR=top: 7+8=15 ✓." },
  { id:"4-81",topic:4,grades:[3,4],difficulty:"hard",
    question:"tri_mult",visual:{type:"triangle_pyramid",numbers:{top:72,midLeft:18,midRight:"?",botLeft:3,botMid:6,botRight:4}},
    options:["12","24","36","54"], correct:1,
    explanation:"כפל: 3×6=18, 6×4=24. top=midL×midR? 18×24=432≠72. ננסה: top=midL+midR+30? top=botL×botM×botR? 3×6×4=72 ✓ כלל: למעלה=מכפלת כל התחתונים. ?=6×4=24." },
  { id:"4-82",topic:4,grades:[2,3],difficulty:"medium",
    question:"tri_diff_bot",visual:{type:"triangle_pyramid",numbers:{top:20,midLeft:12,midRight:8,botLeft:6,botMid:"?",botRight:2}},
    options:["4","6","8","10"], correct:1,
    explanation:"סכום: botL+botM=midL: 6+?=12 → ?=6. בדיקה: botM+botR=midR: 6+2=8 ✓. top=12+8=20 ✓." },
  { id:"4-83",topic:4,grades:[3,4],difficulty:"hard",
    question:"tri_botright",visual:{type:"triangle_pyramid",numbers:{top:35,midLeft:15,midRight:20,botLeft:5,botMid:10,botRight:"?"}},
    options:["5","10","15","20"], correct:1,
    explanation:"סכום: 5+10=15 ✓, 10+?=20 → ?=10. top: 15+20=35 ✓." },

  // More stars
  { id:"4-84",topic:4,grades:[2,3],difficulty:"medium",
    question:"star_double",visual:{type:"star_numbers",outer:[10,12,"?",8,14],inner:[5,6,4,4,7]},
    options:["6","8","12","16"], correct:1,
    explanation:"חיצוני = פנימי × 2. 5×2=10, 6×2=12, 4×2=8, 7×2=14. ?=4×2=8." },
  { id:"4-85",topic:4,grades:[3,4],difficulty:"hard",
    question:"star_add_inner",visual:{type:"star_numbers",outer:[12,11,"?",7,9],inner:[7,6,8,2,4]},
    options:["10","12","13","15"], correct:2,
    explanation:"חיצוני = פנימי + 5. 7+5=12, 6+5=11, 2+5=7, 4+5=9. ?=8+5=13." },
  { id:"4-86",topic:4,grades:[3,4],difficulty:"hard",
    question:"star_cubes",visual:{type:"star_numbers",outer:[27,8,"?",1,64],inner:[3,2,4,1,4]},
    options:["16","48","64","81"], correct:2,
    explanation:"חיצוני = פנימי³. 3³=27, 2³=8, 1³=1, 4³=64. ?=4³=64." },
  { id:"4-87",topic:4,grades:[2,3,4],difficulty:"hard",
    question:"star_matic",visual:{type:"star_numbers",outer:[49,36,"?",25,16],inner:[7,6,8,5,4]},
    options:["64","72","65","73"], correct:0,
    explanation:"חיצוני = פנימי². 7²=49, 6²=36, 5²=25, 4²=16. ?=8²=64." },

  // More arrows
  { id:"4-88",topic:4,grades:[2,3],difficulty:"medium",
    question:"arr_add",visual:{type:"squares_arrows",rows:[{left:15,center:3,right:5},{left:24,center:"?",right:8}]},
    options:["2","3","4","16"], correct:1,
    explanation:"שמאל = אמצע × ימין. 3×5=15, ?×8=24 → ?=3." },
  { id:"4-89",topic:4,grades:[3,4],difficulty:"hard",
    question:"arr_square",visual:{type:"squares_arrows",rows:[{left:25,center:5,right:5},{left:49,center:7,right:7},{left:"?",center:9,right:9}]},
    options:["18","36","81","99"], correct:2,
    explanation:"שמאל = אמצע × ימין (ריבוע). 5×5=25, 7×7=49, 9×9=81." },
  { id:"4-90",topic:4,grades:[2,3],difficulty:"medium",
    question:"arr_matic",visual:{type:"squares_arrows",rows:[{left:8,center:7,right:56},{left:9,center:"?",right:54}]},
    options:["6","5","7","3"], correct:0,
    explanation:"ימין ÷ אמצע = שמאל. 56÷7=8, 54÷?=9 → ?=6." },
  { id:"4-91",topic:4,grades:[3,4],difficulty:"hard",
    question:"arr_complex",visual:{type:"squares_arrows",rows:[{left:10,center:3,right:7},{left:15,center:4,right:11},{left:"?",center:5,right:13}]},
    options:["8","15","18","65"], correct:2,
    explanation:"שמאל = ימין + אמצע. 7+3=10, 11+4=15, 13+5=18." },

  // ===== COMPLEX VISUAL PATTERNS (Matic Q13/Q15 style) =====
  // Q13 style - Symbol counting patterns
  { id:"5-60",topic:5,grades:[2,3],difficulty:"hard",
    question:"symbol_count_row",
    visual:{type:"symbol_row",sequence:[
      {symbols:[{char:"♥",count:5,color:"#f87171",size:9},{char:"+",count:4,color:"#e2e8f0",size:9},{char:"◆",count:1,color:"#fbbf24",size:8}]},
      {symbols:[{char:"♥",count:5,color:"#f87171",size:9},{char:"+",count:3,color:"#e2e8f0",size:9},{char:"◆",count:2,color:"#fbbf24",size:8}]},
      {symbols:[{char:"♥",count:5,color:"#f87171",size:9},{char:"+",count:2,color:"#e2e8f0",size:9},{char:"◆",count:3,color:"#fbbf24",size:8}]},
      {symbols:[{char:"♥",count:5,color:"#f87171",size:9},{char:"+",count:1,color:"#e2e8f0",size:9},{char:"◆",count:4,color:"#fbbf24",size:8}]}
    ]},
    options:[
      {type:"symbols",symbols:[{char:"♥",count:5,color:"#f87171",size:9},{char:"+",count:2,color:"#e2e8f0",size:9},{char:"◆",count:5,color:"#fbbf24",size:8}]},
      {type:"symbols",symbols:[{char:"♥",count:5,color:"#f87171",size:9},{char:"◆",count:5,color:"#fbbf24",size:8}]},
      {type:"symbols",symbols:[{char:"♥",count:4,color:"#f87171",size:9},{char:"+",count:1,color:"#e2e8f0",size:9},{char:"◆",count:5,color:"#fbbf24",size:8}]},
      {type:"symbols",symbols:[{char:"♥",count:5,color:"#f87171",size:9},{char:"◆",count:4,color:"#fbbf24",size:8},{char:"+",count:1,color:"#e2e8f0",size:9}]}
    ],
    correct:1,
    explanation:"הכלל: ♥ תמיד 5. + יורד ב-1 כל פעם (4,3,2,1,0). ◆ עולה ב-1 (1,2,3,4,5). הבא: 5 לבבות, 0 פלוסים, 5 יהלומים." },

  { id:"5-61",topic:5,grades:[2,3,4],difficulty:"hard",
    question:"symbol_count_row2",
    visual:{type:"symbol_row",sequence:[
      {symbols:[{char:"★",count:4,color:"#fbbf24",size:10},{char:"●",count:1,color:"#60a5fa",size:10}]},
      {symbols:[{char:"★",count:3,color:"#fbbf24",size:10},{char:"●",count:2,color:"#60a5fa",size:10}]},
      {symbols:[{char:"★",count:2,color:"#fbbf24",size:10},{char:"●",count:3,color:"#60a5fa",size:10}]}
    ]},
    options:[
      {type:"symbols",symbols:[{char:"★",count:1,color:"#fbbf24",size:10},{char:"●",count:4,color:"#60a5fa",size:10}]},
      {type:"symbols",symbols:[{char:"★",count:0,color:"#fbbf24",size:10},{char:"●",count:5,color:"#60a5fa",size:10}]},
      {type:"symbols",symbols:[{char:"★",count:2,color:"#fbbf24",size:10},{char:"●",count:2,color:"#60a5fa",size:10}]},
      {type:"symbols",symbols:[{char:"★",count:1,color:"#fbbf24",size:10},{char:"●",count:3,color:"#60a5fa",size:10}]}
    ],
    correct:0,
    explanation:"★ יורד ב-1 (4,3,2,1). ● עולה ב-1 (1,2,3,4). סה\"כ תמיד 5." },

  // Q15 style - Pacman + color matrix
  { id:"5-62",topic:5,grades:[3,4],difficulty:"hard",
    question:"pacman_matrix",
    visual:{type:"matrix_3x3",grid:[
      [{type:"pacman",rotation:315,fill:"#94a3b8"},{type:"rect_fill",fill:"#1e293b"},{type:"pacman_rect",rotation:135,pacFill:"#e2e8f0",rectFill:"#1e293b"}],
      [{type:"pacman",rotation:225,fill:"#64748b"},{type:"rect_fill",fill:"#64748b"},{type:"pacman_rect",rotation:45,pacFill:"#94a3b8",rectFill:"#64748b"}],
      [{type:"pacman",rotation:135,fill:"#cbd5e1"},{type:"rect_fill",fill:"#cbd5e1"},null]
    ]},
    options:[
      {type:"pacman_rect",rotation:315,pacFill:"#e2e8f0",rectFill:"#cbd5e1"},
      {type:"pacman_rect",rotation:135,pacFill:"#cbd5e1",rectFill:"#94a3b8"},
      {type:"pacman_rect",rotation:225,pacFill:"#e2e8f0",rectFill:"#cbd5e1"},
      {type:"pacman_rect",rotation:315,pacFill:"#cbd5e1",rectFill:"#e2e8f0"}
    ],
    correct:0,
    explanation:"3 כללים: 1) עמודה 1=פקמן, עמודה 2=ריבוע, עמודה 3=שניהם. 2) צבע הולך ובהיר כלפי מטה. 3) כיוון הפקמן מסתובב. חסר: פקמן+ריבוע בגוון בהיר." },

  // Pacman rotation sequence
  { id:"5-63",topic:5,grades:[2,3],difficulty:"medium",
    question:"pacman_rotate",
    visual:{type:"shape_row",sequence:[
      {type:"pacman",rotation:0,fill:"#fbbf24"},
      {type:"pacman",rotation:90,fill:"#fbbf24"},
      {type:"pacman",rotation:180,fill:"#fbbf24"},
      {type:"pacman",rotation:270,fill:"#fbbf24"}
    ]},
    options:[
      {type:"pacman",rotation:0,fill:"#fbbf24"},
      {type:"pacman",rotation:45,fill:"#fbbf24"},
      {type:"pacman",rotation:90,fill:"#fbbf24"},
      {type:"pacman",rotation:180,fill:"#fbbf24"}
    ],
    correct:0,
    explanation:"הפקמן מסתובב 90° בכל פעם: ימין→למטה→שמאל→למעלה→ימין (חוזר)." },

  // Symbol double change pattern
  { id:"5-64",topic:5,grades:[3,4],difficulty:"hard",
    question:"symbol_double_change",
    visual:{type:"symbol_row",sequence:[
      {symbols:[{char:"▲",count:1,color:"#f87171",size:12},{char:"■",count:3,color:"#60a5fa",size:10}]},
      {symbols:[{char:"▲",count:2,color:"#f87171",size:12},{char:"■",count:2,color:"#60a5fa",size:10}]},
      {symbols:[{char:"▲",count:3,color:"#f87171",size:12},{char:"■",count:1,color:"#60a5fa",size:10}]}
    ]},
    options:[
      {type:"symbols",symbols:[{char:"▲",count:4,color:"#f87171",size:12}]},
      {type:"symbols",symbols:[{char:"▲",count:4,color:"#f87171",size:12},{char:"■",count:1,color:"#60a5fa",size:10}]},
      {type:"symbols",symbols:[{char:"▲",count:3,color:"#f87171",size:12},{char:"■",count:2,color:"#60a5fa",size:10}]},
      {type:"symbols",symbols:[{char:"■",count:4,color:"#60a5fa",size:10}]}
    ],
    correct:0,
    explanation:"▲ עולה ב-1 (1,2,3,4). ■ יורד ב-1 (3,2,1,0). הבא: 4 משולשים בלבד." },

  // Color gradient pacman matrix
  { id:"5-65",topic:5,grades:[3,4],difficulty:"hard",
    question:"pacman_color_matrix",
    visual:{type:"matrix_3x3",grid:[
      [{type:"pacman",rotation:0,fill:"#f87171"},{type:"pacman",rotation:90,fill:"#f87171"},{type:"pacman",rotation:180,fill:"#f87171"}],
      [{type:"pacman",rotation:0,fill:"#60a5fa"},{type:"pacman",rotation:90,fill:"#60a5fa"},{type:"pacman",rotation:180,fill:"#60a5fa"}],
      [{type:"pacman",rotation:0,fill:"#4ade80"},{type:"pacman",rotation:90,fill:"#4ade80"},null]
    ]},
    options:[
      {type:"pacman",rotation:180,fill:"#4ade80"},
      {type:"pacman",rotation:270,fill:"#4ade80"},
      {type:"pacman",rotation:0,fill:"#4ade80"},
      {type:"pacman",rotation:180,fill:"#fbbf24"}
    ],
    correct:0,
    explanation:"שורות: אותו צבע (אדום, כחול, ירוק). עמודות: אותו סיבוב (0°, 90°, 180°). חסר: פקמן ירוק 180°." },
];

// TEST INSTRUCTIONS
const TEST_INSTRUCTIONS = {
  1:{title:"חלק 1: מה הקשר בין המילים?",icon:"🔤",
    text:"בכל שאלה מופיע זוג מילים מודגשות.\nעליכם לגלות מה הקשר בין זוג המילים, ואז לבחור מבין האפשרויות את זוג המילים שהקשר ביניהן דומה ביותר."},
  2:{title:"חלק 2: מהן המילים החסרות?",icon:"✏️",
    text:"בכל שאלה מופיע משפט שחסרות בו מילים (במקומן קווים).\nבחרו מבין 4 האפשרויות את התשובה שמשלימה את המשפט בצורה הגיונית ביותר."},
  3:{title:"חלק 3: מה הפתרון לבעיה?",icon:"🧮",
    text:"בחלק זה בעיות מילוליות.\nקראו כל שאלה בתשומת לב ובחרו את התשובה הנכונה מבין 4 האפשרויות."},
  4:{title:"חלק 4: מה המספר החסר?",icon:"🔢",
    text:"מספרים מסודרים בתוך צורות לפי כלל מסוים.\nהכלל מתבסס על פעולות חשבון (חיבור, חיסור, כפל, חילוק) ועל מיקום המספרים.\nגלו את הכלל ומצאו את המספר החסר (?)."},
  5:{title:"חלק 5: מה הצורה הבאה?",icon:"🔷",
    text:"שני סוגי שאלות:\nא. צורות בשורה - מצאו את הכלל ובחרו את הצורה החסרה.\nב. צורות ב-3 שורות (מטריצה) - גלו את הכלל בשורות ובעמודות ובחרו את הצורה החסרה."}
};

// ============================================================
// VISUAL RENDERERS
// ============================================================
function CirclesTrio({ circles }) {
  return (
    <div style={{ display: "flex", gap: 18, justifyContent: "center", direction: "ltr", flexWrap: "wrap" }}>
      {circles.map((c, i) => {
        const col = v => v === "?" ? "#fbbf24" : "#e2e8f0";
        return (
          <svg key={i} width="110" height="110" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r="50" fill="none" stroke="#818cf8" strokeWidth="2" />
            {/* Y-divider: center to top, center to bottom-left, center to bottom-right */}
            <line x1="55" y1="55" x2="55" y2="5" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="55" y1="55" x2="12" y2="80" stroke="#818cf8" strokeWidth="1.5" />
            <line x1="55" y1="55" x2="98" y2="80" stroke="#818cf8" strokeWidth="1.5" />
            {/* top-left number */}
            <text x="35" y="40" textAnchor="middle" fill={col(c.top[0])} fontSize="16" fontWeight="bold">{c.top[0]}</text>
            {/* top-right number */}
            <text x="75" y="40" textAnchor="middle" fill={col(c.top[1])} fontSize="16" fontWeight="bold">{c.top[1]}</text>
            {/* bottom number */}
            <text x="55" y="90" textAnchor="middle" fill={col(c.bottom)} fontSize="18" fontWeight="bold">{c.bottom}</text>
          </svg>
        );
      })}
    </div>
  );
}

function SequenceBoxes({ numbers }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", direction: "ltr", flexWrap: "wrap" }}>
      {numbers.map((n, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            border: `2px solid ${n==="?"?"#fbbf24":"#818cf8"}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            backgroundColor: n==="?"?"rgba(251,191,36,0.15)":"rgba(129,140,248,0.1)",
            color: n==="?"?"#fbbf24":"#e2e8f0", fontWeight: "bold", fontSize: 17
          }}>{n}</div>
          {i < numbers.length - 1 && <span style={{ color: "#555", fontSize: 14 }}>→</span>}
        </div>
      ))}
    </div>
  );
}

function TrianglePyramid({ numbers }) {
  const { top, midLeft, midRight, botLeft, botMid, botRight } = numbers;
  const col = v => v==="?"?"#fbbf24":"#e2e8f0";
  // Proper equilateral-ish triangle with 3 rows: 1, 2, 3 cells
  // Row 0 (top): one triangle pointing down
  // Row 1 (mid): two triangles
  // Row 2 (bot): three triangles
  const W = 240, H = 210;
  const px = 120, py = 15; // peak
  const blx = 15, bly = 200; // bottom-left
  const brx = 225, bry = 200; // bottom-right
  // Row dividers (horizontal-ish lines)
  const r1y = 80; // between row0 and row1
  const r2y = 140; // between row1 and row2
  // Points on left edge at r1y and r2y
  const lerp = (ax,ay,bx,by,t) => [ax+(bx-ax)*t, ay+(by-ay)*t];
  const [l1x,l1y] = lerp(px,py,blx,bly,(r1y-py)/(bly-py));
  const [r1x] = lerp(px,py,brx,bry,(r1y-py)/(bry-py));
  const [l2x,l2y] = lerp(px,py,blx,bly,(r2y-py)/(bly-py));
  const [r2x] = lerp(px,py,brx,bry,(r2y-py)/(bry-py));
  // Vertical dividers in row1 (1 vertical line at center)
  const m1x = (l1x + r1x) / 2;
  // Vertical dividers in row2 (2 lines dividing into 3)
  const third2 = (r2x - l2x) / 3;
  const v2ax = l2x + third2;
  const v2bx = l2x + third2 * 2;
  // Bottom thirds
  const bthird = (brx - blx) / 3;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", margin: "0 auto" }}>
      {/* outer triangle */}
      <polygon points={`${px},${py} ${blx},${bly} ${brx},${bry}`} fill="none" stroke="#818cf8" strokeWidth="2.2" />
      {/* row dividers */}
      <line x1={l1x} y1={r1y} x2={r1x} y2={r1y} stroke="#818cf8" strokeWidth="1.8" />
      <line x1={l2x} y1={r2y} x2={r2x} y2={r2y} stroke="#818cf8" strokeWidth="1.8" />
      {/* row 1 vertical divider */}
      <line x1={m1x} y1={r1y} x2={px} y2={r2y} stroke="#818cf8" strokeWidth="1.8" />
      {/* row 2 vertical dividers */}
      <line x1={v2ax} y1={r2y} x2={blx + bthird} y2={bly} stroke="#818cf8" strokeWidth="1.8" />
      <line x1={v2bx} y1={r2y} x2={blx + bthird * 2} y2={bly} stroke="#818cf8" strokeWidth="1.8" />
      {/* numbers - centered in each cell */}
      <text x={px} y={(py + r1y) / 2 + 6} textAnchor="middle" fill={col(top)} fontSize="20" fontWeight="bold">{top}</text>
      <text x={(l1x + m1x) / 2} y={(r1y + r2y) / 2 + 6} textAnchor="middle" fill={col(midLeft)} fontSize="17" fontWeight="bold">{midLeft}</text>
      <text x={(m1x + r1x) / 2} y={(r1y + r2y) / 2 + 6} textAnchor="middle" fill={col(midRight)} fontSize="17" fontWeight="bold">{midRight}</text>
      <text x={(blx + blx + bthird) / 2} y={(r2y + bly) / 2 + 5} textAnchor="middle" fill={col(botLeft)} fontSize="15" fontWeight="bold">{botLeft}</text>
      <text x={px} y={(r2y + bly) / 2 + 5} textAnchor="middle" fill={col(botMid)} fontSize="15" fontWeight="bold">{botMid}</text>
      <text x={(blx + bthird * 2 + brx) / 2} y={(r2y + bly) / 2 + 5} textAnchor="middle" fill={col(botRight)} fontSize="15" fontWeight="bold">{botRight}</text>
    </svg>
  );
}

// Star shape with 5 outer tips and 5 inner values
function StarNumbers({ outer, inner }) {
  // outer = [top, topLeft, topRight, botLeft, botRight] (5 values at star tips)
  // inner = [top, left, right, botLeft, botRight] (5 values in inner pentagon)
  const W = 220, H = 220, cx = 110, cy = 110, R = 100, r = 42;
  const col = v => v === "?" ? "#fbbf24" : "#e2e8f0";

  // Star points (5 outer, 5 inner)
  const starPoints = [];
  for (let i = 0; i < 10; i++) {
    const angle = (i * Math.PI / 5) - Math.PI / 2;
    const radius = i % 2 === 0 ? R : r;
    starPoints.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`);
  }

  // Outer tip positions (even indices: 0,2,4,6,8)
  const outerPos = [0, 2, 4, 6, 8].map(i => {
    const angle = (i * Math.PI / 5) - Math.PI / 2;
    return { x: cx + (R - 8) * Math.cos(angle), y: cy + (R - 8) * Math.sin(angle) + 5 };
  });

  // Inner pentagon positions (odd indices: 1,3,5,7,9 midpoints)
  const innerR = r * 0.55;
  const innerPos = [0, 1, 2, 3, 4].map(i => {
    const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
    return { x: cx + innerR * Math.cos(angle), y: cy + innerR * Math.sin(angle) + 5 };
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block", margin: "0 auto" }}>
      {/* Star outline */}
      <polygon points={starPoints.join(" ")} fill="none" stroke="#818cf8" strokeWidth="2.2" strokeLinejoin="round" />
      {/* Inner pentagon outline */}
      <polygon points={[1,3,5,7,9].map(i => {
        const a = (i * Math.PI / 5) - Math.PI / 2;
        return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }).join(" ")} fill="none" stroke="#818cf8" strokeWidth="1.5" />
      {/* Lines from center to inner pentagon vertices */}
      {[1,3,5,7,9].map((i, idx) => {
        const a = (i * Math.PI / 5) - Math.PI / 2;
        return <line key={idx} x1={cx} y1={cy} x2={cx + r * Math.cos(a)} y2={cy + r * Math.sin(a)} stroke="#818cf8" strokeWidth="1" />;
      })}
      {/* Outer tip numbers */}
      {outer.map((v, i) => (
        <text key={`o${i}`} x={outerPos[i].x} y={outerPos[i].y} textAnchor="middle" fill={col(v)} fontSize="15" fontWeight="bold">{v}</text>
      ))}
      {/* Inner numbers */}
      {inner.map((v, i) => (
        <text key={`i${i}`} x={innerPos[i].x} y={innerPos[i].y} textAnchor="middle" fill={col(v)} fontSize="14" fontWeight="bold">{v}</text>
      ))}
    </svg>
  );
}

function SquaresArrows({ rows }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", direction: "ltr" }}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {[r.left, r.center, r.right].map((val, j) => {
            const isQ = val==="?";
            const isBig = j===1;
            return (
              <div key={j} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: isBig?58:48, height: isBig?58:48,
                  border: `2px solid ${isQ?"#fbbf24":isBig?"#f87171":"#818cf8"}`,
                  borderRadius: isBig?4:20,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  backgroundColor: isQ?"rgba(251,191,36,0.15)":"rgba(129,140,248,0.05)",
                  color: isQ?"#fbbf24":"#e2e8f0", fontWeight: "bold", fontSize: 18
                }}>{val}</div>
                {j < 2 && <span style={{ color: "#555", fontSize: 16 }}>←</span>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Topic4Visual({ visual }) {
  if (!visual) return null;
  if (visual.type==="circles_trio") return <CirclesTrio circles={visual.circles} />;
  if (visual.type==="sequence") return <SequenceBoxes numbers={visual.numbers} />;
  if (visual.type==="triangle_pyramid") return <TrianglePyramid numbers={visual.numbers} />;
  if (visual.type==="star_numbers") return <StarNumbers outer={visual.outer} inner={visual.inner} />;
  if (visual.type==="squares_arrows") return <SquaresArrows rows={visual.rows} />;
  return null;
}

// Topic 5 Visual - shape sequence or matrix
// Symbol box renderer - for patterns like Q13 with hearts/plus/diamonds
function SymbolBox({ symbols, size = 70 }) {
  // symbols = [{char:"♥", count:3, color:"#f87171"}, {char:"+", count:2, color:"#e2e8f0"}, ...]
  if (!symbols) return null;
  return (
    <div style={{ width: size, height: size, border: "1.5px solid #818cf8", borderRadius: 4, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, backgroundColor: "rgba(15,23,42,0.5)", padding: 2, boxSizing: "border-box" }}>
      {symbols.map((row, i) => (
        <div key={i} style={{ display: "flex", gap: 1, justifyContent: "center", flexWrap: "wrap" }}>
          {Array.from({ length: row.count }, (_, j) => (
            <span key={j} style={{ fontSize: row.size || 10, color: row.color || "#e2e8f0", lineHeight: 1 }}>{row.char}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

// Pacman shape - circle with a "bite" at various angles
function PacmanSVG({ rotation = 0, fill = "#94a3b8", stroke = "none", size = 40 }) {
  const c = size / 2, r = size / 2 - 2;
  const mouthAngle = 45; // degrees of mouth opening
  const startA = (rotation + mouthAngle / 2) * Math.PI / 180;
  const endA = (rotation - mouthAngle / 2 + 360) * Math.PI / 180;
  const x1 = c + r * Math.cos(startA);
  const y1 = c + r * Math.sin(startA);
  const x2 = c + r * Math.cos(endA);
  const y2 = c + r * Math.sin(endA);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <path d={`M ${c} ${c} L ${x1} ${y1} A ${r} ${r} 0 1 1 ${x2} ${y2} Z`} fill={fill} stroke={stroke} strokeWidth={stroke !== "none" ? 1.5 : 0} />
    </svg>
  );
}

// Composite cell for complex grids - handles symbols, pacman, and regular shapes
function GridCell({ cell, size = 52 }) {
  if (!cell) return <span style={{ color: "#fbbf24", fontSize: 22, fontWeight: "bold" }}>?</span>;
  if (cell.type === "symbols") return <SymbolBox symbols={cell.symbols} size={size} />;
  if (cell.type === "pacman") return <PacmanSVG rotation={cell.rotation || 0} fill={cell.fill || "#94a3b8"} stroke={cell.stroke || "none"} size={size - 8} />;
  if (cell.type === "rect_fill") {
    return (
      <div style={{ width: size - 10, height: size - 10, backgroundColor: cell.fill || "#94a3b8", borderRadius: 2 }} />
    );
  }
  if (cell.type === "pacman_rect") {
    // Pacman overlapping with rectangle
    return (
      <div style={{ position: "relative", width: size - 6, height: size - 6 }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "70%", height: "70%", backgroundColor: cell.rectFill || "#64748b", borderRadius: 2 }} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <PacmanSVG rotation={cell.rotation || 0} fill={cell.pacFill || "#94a3b8"} size={size - 10} />
        </div>
      </div>
    );
  }
  // Fallback to CompositeShape
  return <CompositeShape desc={cell} size={size - 8} />;
}

function Topic5Visual({ visual }) {
  if (!visual) return null;
  if (visual.type === "shape_row") {
    return (
      <div style={{ display: "flex", gap: 10, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
        {visual.sequence.map((desc, i) => (
          <div key={i} style={{ padding: 4, border: "1px solid #1e293b", borderRadius: 8, backgroundColor: "rgba(15,23,42,0.4)" }}>
            {desc.type === "symbols" ? <SymbolBox symbols={desc.symbols} size={60} />
              : desc.type === "pacman" ? <PacmanSVG rotation={desc.rotation} fill={desc.fill} size={46} />
              : <CompositeShape desc={desc} size={50} />}
          </div>
        ))}
        <div style={{ width: 50, height: 50, border: "2px dashed #fbbf24", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", fontSize: 22, fontWeight: "bold" }}>?</div>
      </div>
    );
  }
  if (visual.type === "matrix_3x3") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
        {visual.grid.map((row, ri) => (
          <div key={ri} style={{ display: "flex", gap: 3 }}>
            {row.map((cell, ci) => (
              <div key={ci} style={{
                width: 58, height: 58, border: `1.5px solid ${!cell?"#fbbf24":"#334155"}`,
                borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: !cell?"rgba(251,191,36,0.1)":"rgba(15,23,42,0.4)",
                borderStyle: !cell ? "dashed" : "solid", overflow: "hidden"
              }}>
                <GridCell cell={cell} size={56} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (visual.type === "symbol_row") {
    // Row of symbol boxes for Q13-style
    return (
      <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
        {visual.sequence.map((box, i) => (
          <SymbolBox key={i} symbols={box.symbols} size={65} />
        ))}
        <div style={{ width: 65, height: 65, border: "2px dashed #fbbf24", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "#fbbf24", fontSize: 20, fontWeight: "bold" }}>?</div>
      </div>
    );
  }
  return null;
}

// Topic 5 option rendering (visual!)
function Topic5Option({ opt, size = 44 }) {
  if (opt.type === "symbols") return <SymbolBox symbols={opt.symbols} size={size} />;
  if (opt.type === "pacman") return <PacmanSVG rotation={opt.rotation} fill={opt.fill} size={size - 4} />;
  if (opt.type === "pacman_rect") return <GridCell cell={opt} size={size} />;
  return <CompositeShape desc={opt} size={size} />;
}

// Timer
function Timer({ seconds, onExpire, running }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => { setLeft(seconds); }, [seconds]);
  useEffect(() => {
    if (!running || left <= 0) return;
    const t = setTimeout(() => setLeft(l => { if (l<=1){onExpire();return 0;} return l-1; }), 1000);
    return () => clearTimeout(t);
  }, [left, running, onExpire]);
  const pct = (left / seconds) * 100;
  const color = pct > 50 ? "#4ade80" : pct > 20 ? "#fbbf24" : "#f87171";
  const mins = Math.floor(left/60), secs = left%60;
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ width:60, height:6, backgroundColor:"#1e293b", borderRadius:3, overflow:"hidden" }}>
        <div style={{ width:`${pct}%`, height:"100%", backgroundColor:color, transition:"width 1s linear" }} />
      </div>
      <span style={{ color, fontSize:13, fontFamily:"monospace", minWidth:42 }}>
        {mins>0?`${mins}:${secs.toString().padStart(2,"0")}`:`${secs}s`}
      </span>
    </div>
  );
}

function Confetti({ active }) {
  if (!active) return null;
  const ps = Array.from({length:30},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*0.5,color:["#fbbf24","#4ade80","#f87171","#818cf8","#22d3ee"][i%5],size:5+Math.random()*6}));
  return (
    <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:1000 }}>
      {ps.map(p=><div key={p.id} style={{position:"absolute",left:`${p.left}%`,top:-10,width:p.size,height:p.size,backgroundColor:p.color,borderRadius:Math.random()>0.5?"50%":"2px",animation:`cf 2s ${p.delay}s ease-in forwards`}}/>)}
      <style>{`@keyframes cf{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
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
  const [loaded, setLoaded] = useState(false);
  const [testInstructionTopic, setTestInstructionTopic] = useState(null);
  const [attemptNum, setAttemptNum] = useState(1); // 1 = first try, 2 = second try
  const [wrongFirstChoice, setWrongFirstChoice] = useState(null); // track first wrong answer

  // Load
  useEffect(() => {
    (async () => {
      try { const s = await window.storage.get("gp_settings"); if (s) { setSettings(p=>({...p,...JSON.parse(s.value)})); setGradeSelected(true); } } catch {}
      try { const p = await window.storage.get("gp_progress"); if (p) setProgress(JSON.parse(p.value)); } catch {}
      try { const q = await window.storage.get("gp_questions"); if (q) setCustomQuestions(JSON.parse(q.value)); } catch {}
      setLoaded(true);
    })();
  }, []);

  const save = useCallback(async (key, val) => { try { await window.storage.set(key, JSON.stringify(val)); } catch {} }, []);
  const saveSettings = useCallback(s => { setSettings(s); save("gp_settings", s); }, [save]);
  const saveProgress = useCallback(p => { setProgress(p); save("gp_progress", p); }, [save]);
  const saveCQ = useCallback(q => { setCustomQuestions(q); save("gp_questions", q); }, [save]);

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
    // Shuffle topic questions order
    setShuffledTopicQ(prev => {
      const tqs = gradeQ.filter(q => q.topic === t);
      return [...tqs].sort(() => Math.random() - 0.5);
    });
  };
  const [shuffledTopicQ, setShuffledTopicQ] = useState([]);

  const startTest = () => {
    const qs = [];
    const perTopic = Math.ceil(settings.testQuestionCount / 5);
    for (let t=1;t<=5;t++) {
      const tqs = gradeQ.filter(q=>q.topic===t).sort(()=>Math.random()-0.5);
      qs.push(...tqs.slice(0,perTopic));
    }
    // Keep grouped by topic order (1,1,1,2,2,2,3,3,3...)
    const finalQs = qs.slice(0,settings.testQuestionCount);
    setTestQuestions(finalQs);
    setTestAnswers({}); setTestStartTime(Date.now()); setCurrentQuestionIdx(0); setQStates({});
    setSelectedAnswer(null); setShowResult(false); setShowExplanation(false);
    setAttemptNum(1); setWrongFirstChoice(null);
    setTestMode(true);
    // Show first topic instructions
    setTestInstructionTopic(finalQs.length > 0 ? finalQs[0].topic : null);
    setScreen("test-instructions");
  };

  const practiceQ = shuffledTopicQ.length > 0 ? shuffledTopicQ : topicQ;
  const currentQuestion = testMode ? testQuestions[currentQuestionIdx] : practiceQ[currentQuestionIdx];
  const totalQs = testMode ? testQuestions.length : practiceQ.length;

  // Per-question state tracker
  const [qStates, setQStates] = useState({});
  const qStatesRef = useRef({});
  qStatesRef.current = qStates;

  const getQState = (idx) => qStatesRef.current[idx] || { answer: null, showResult: false, showExplanation: false, attemptNum: 1, wrongFirst: null, submitted: false };

  // Sync local UI state from qStates when question changes
  useEffect(() => {
    const s = getQState(currentQuestionIdx);
    setSelectedAnswer(s.answer);
    setShowResult(s.showResult);
    setShowExplanation(s.showExplanation);
    setAttemptNum(s.attemptNum);
    setWrongFirstChoice(s.wrongFirst);
  }, [currentQuestionIdx]);

  // Save current UI state into qStates
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
      // First wrong attempt in practice - give second chance
      playSound("wrong");
      setWrongFirstChoice(selectedAnswer);
      setAttemptNum(2);
      setSelectedAnswer(null);
      saveQState(currentQuestionIdx, { wrongFirst: selectedAnswer, attemptNum: 2, answer: null });
      return;
    }

    // Final result
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
    // Save current selection before navigating
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

  const resetProgress = useCallback(async () => {
    const fresh = { ...DEFAULT_PROGRESS };
    setProgress(fresh);
    try { await window.storage.set("gp_progress", JSON.stringify(fresh)); } catch {}
  }, []);

  if (!loaded) return <div style={S.container}><p style={{color:"#818cf8",fontSize:18}}>...טוען</p></div>;

  // ============================================================
  // GRADE SELECTION
  // ============================================================
  if (!gradeSelected) {
    return (
      <div style={S.container}>
        <div style={{...S.card, maxWidth:480, textAlign:"center"}}>
          <div style={{fontSize:56,marginBottom:12}}>🧒</div>
          <h1 style={S.mainTitle}>GeniusPrep</h1>
          <p style={{color:"#94a3b8",fontSize:15,marginBottom:24}}>הכנה למבחן מחוננים שלב ב׳</p>
          <div style={{marginBottom:20}}>
            <label style={{color:"#e2e8f0",fontSize:14,marginBottom:8,display:"block"}}>?מה השם שלך</label>
            <input type="text" value={settings.playerName} onChange={e=>setSettings(s=>({...s,playerName:e.target.value}))}
              placeholder="...הכנס שם" style={{...S.input,textAlign:"center"}} />
          </div>
          <div style={{marginBottom:28}}>
            <label style={{color:"#e2e8f0",fontSize:14,marginBottom:12,display:"block"}}>?באיזו כיתה את/ה</label>
            <div style={{display:"flex",gap:12,justifyContent:"center"}}>
              {[2,3,4].map(g=>(
                <button key={g} onClick={()=>setSettings(s=>({...s,grade:g}))}
                  style={{width:78,height:78,borderRadius:16,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4,cursor:"pointer",transition:"all 0.2s",backgroundColor:settings.grade===g?"#818cf8":"rgba(129,140,248,0.1)",border:`2px solid ${settings.grade===g?"#818cf8":"#334155"}`,color:settings.grade===g?"white":"#94a3b8",transform:settings.grade===g?"scale(1.1)":"scale(1)"}}>
                  <span style={{fontSize:26,fontWeight:"bold"}}>{g===2?"ב׳":g===3?"ג׳":"ד׳"}</span>
                  <span style={{fontSize:11}}>כיתה</span>
                </button>
              ))}
            </div>
            <p style={{color:"#64748b",fontSize:12,marginTop:10}}>
              {settings.grade===2?"שאלות קלות ובסיסיות":settings.grade===3?"שאלות ברמה בינונית":"שאלות מאתגרות ומורכבות"}
            </p>
          </div>
          <button onClick={()=>{setGradeSelected(true);saveSettings(settings);playSound("click");}}
            style={S.primaryBtn}>!בואו נתחיל 🚀</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // HOME
  // ============================================================
  if (screen === "home") {
    return (
      <div style={S.container}>
        <div style={{width:"100%",maxWidth:580,padding:"0 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
            <div>
              <h1 style={{...S.mainTitle,fontSize:22,margin:0}}>
                {settings.playerName?`${settings.playerName} שלום`:"!שלום"} 👋
              </h1>
              <p style={{color:"#94a3b8",margin:"4px 0 0",fontSize:12}}>
                כיתה {settings.grade===2?"ב׳":settings.grade===3?"ג׳":"ד׳"} • {progress.points} נק׳
                {progress.streak>0&&` • 🔥 ${progress.streak} ימים`}
              </p>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setScreen("settings")} style={S.iconBtn}>⚙️</button>
              <button onClick={()=>setScreen("admin-login")} style={S.iconBtn}>🔐</button>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
            {[1,2,3,4,5].map(t=>{
              const st=getTopicStats(t);
              return (
                <button key={t} onClick={()=>startTopic(t)} style={S.topicCard}>
                  <div style={{display:"flex",alignItems:"center",gap:10,flex:1}}>
                    <span style={{fontSize:26}}>{TOPIC_ICONS[t]}</span>
                    <div style={{textAlign:"right",flex:1}}>
                      <div style={{color:"#e2e8f0",fontWeight:600,fontSize:13}}>{TOPIC_NAMES[t]}</div>
                      <div style={{color:"#64748b",fontSize:11,marginTop:2}}>{st.count} שאלות • {st.pct}%</div>
                    </div>
                  </div>
                  <div style={{width:70,height:5,backgroundColor:"#1e293b",borderRadius:3,overflow:"hidden"}}>
                    <div style={{width:`${st.pct}%`,height:"100%",backgroundColor:TOPIC_COLORS[t],transition:"width 0.5s"}}/>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={startTest} style={{...S.primaryBtn,flex:1}}>📝 מבחן מלא</button>
            <button onClick={()=>setScreen("progress")} style={{...S.secondaryBtn,flex:1}}>📊 התקדמות</button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // PRACTICE / TEST
  // ============================================================
  if ((screen==="practice"||screen==="test") && currentQuestion) {
    const isTopic4 = currentQuestion.topic===4;
    const isTopic5 = currentQuestion.topic===5;
    const timerSecs = settings.timerEnabled ? (settings.timerSeconds[currentQuestion.topic]||60) : 0;

    return (
      <div style={S.container}>
        <Confetti active={showConfetti} />
        <div style={{width:"100%",maxWidth:580,padding:"0 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <button onClick={goHome} style={S.backBtn}>← חזרה</button>
            <div style={{textAlign:"center",flex:1}}>
              <span style={{color:TOPIC_COLORS[currentQuestion.topic],fontSize:12,fontWeight:600}}>
                {testMode?"מבחן מלא":TOPIC_NAMES[currentQuestion.topic]}
              </span>
              <div style={{color:"#64748b",fontSize:11}}>שאלה {currentQuestionIdx+1} / {totalQs}</div>
            </div>
            {timerSecs>0&&!showResult&&<Timer seconds={timerSecs} running={!showResult} onExpire={handleTimerExpire}/>}
          </div>
          <div style={{width:"100%",height:3,backgroundColor:"#1e293b",borderRadius:2,marginBottom:4}}>
            <div style={{width:`${((currentQuestionIdx+1)/totalQs)*100}%`,height:"100%",backgroundColor:TOPIC_COLORS[currentQuestion.topic],borderRadius:2,transition:"width 0.3s"}}/>
          </div>
          {/* Question dots - clickable mini-map */}
          {totalQs <= 25 && (
            <div style={{display:"flex",gap:3,justifyContent:"center",marginBottom:14,flexWrap:"wrap"}}>
              {Array.from({length:totalQs},(_,i) => {
                const qs = getQState(i);
                const isCurrent = i === currentQuestionIdx;
                const q = testMode ? testQuestions[i] : practiceQ[i];
                const answered = qs.submitted;
                const isCorrect = answered && qs.answer === q?.correct;
                let bg = "#1e293b"; // unanswered
                if (answered && isCorrect) bg = "#4ade80";
                else if (answered && !isCorrect) bg = "#f87171";
                else if (qs.answer !== null && !qs.submitted) bg = "#818cf8"; // selected but not submitted
                return (
                  <button key={i} onClick={()=>goToQuestion(i)}
                    style={{width:isCurrent?12:8,height:isCurrent?12:8,borderRadius:"50%",backgroundColor:bg,border:isCurrent?`2px solid ${TOPIC_COLORS[currentQuestion.topic]}`:"1px solid #334155",cursor:"pointer",transition:"all 0.2s",padding:0}} />
                );
              })}
            </div>
          )}

          {/* Question area - stable height container */}
          <div style={{minHeight:420}}>
          <div style={S.questionCard}>
            {isTopic4 && currentQuestion.visual ? (
              <div>
                <p style={{color:"#94a3b8",fontSize:12,marginBottom:14,textAlign:"center"}}>מצאו את המספר החסר (?)</p>
                <Topic4Visual visual={currentQuestion.visual} />
              </div>
            ) : isTopic5 && currentQuestion.visual ? (
              <div>
                <p style={{color:"#94a3b8",fontSize:12,marginBottom:14,textAlign:"center"}}>מה הצורה הבאה?</p>
                <Topic5Visual visual={currentQuestion.visual} />
              </div>
            ) : (
              <p style={{color:"#e2e8f0",fontSize:16,lineHeight:1.8,textAlign:"center",fontWeight:500}}>
                {currentQuestion.question}
              </p>
            )}
          </div>

          {/* Second chance hint */}
          {attemptNum===2 && !showResult && !testMode && (
            <div style={{padding:"8px 14px",backgroundColor:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.25)",borderRadius:10,marginBottom:10,textAlign:"center"}}>
              <span style={{color:"#fbbf24",fontSize:13}}>🤔 לא מדויק... נסה שוב! נשארו עוד {currentQuestion.options.length - 1} אפשרויות</span>
            </div>
          )}

          {/* Options */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {currentQuestion.options.map((opt, i) => {
              const isSelected = selectedAnswer===i;
              const isCorrect = showResult && i===currentQuestion.correct;
              const isWrong = showResult && isSelected && i!==currentQuestion.correct;
              const wasFirstWrong = wrongFirstChoice===i; // greyed out from first attempt
              const isDisabled = showResult || wasFirstWrong;
              let bg = "rgba(30,41,59,0.8)";
              let border = "#334155";
              if (wasFirstWrong && !showResult) { bg="rgba(248,113,113,0.08)"; border="#4a2020"; }
              if (isSelected&&!showResult&&!wasFirstWrong) { bg="rgba(129,140,248,0.2)"; border="#818cf8"; }
              if (isCorrect) { bg="rgba(74,222,128,0.15)"; border="#4ade80"; }
              if (isWrong) { bg="rgba(248,113,113,0.15)"; border="#f87171"; }

              return (
                <button key={i} onClick={()=>{if(!isDisabled){setSelectedAnswer(i);playSound("click");}}}
                  disabled={isDisabled}
                  style={{padding:"10px 8px",borderRadius:12,border:`2px solid ${border}`,backgroundColor:bg,cursor:isDisabled?"default":"pointer",transition:"all 0.2s",display:"flex",alignItems:"center",justifyContent:"center",gap:6,minHeight:52,position:"relative",flexDirection:isTopic5?"column":"row",opacity:wasFirstWrong&&!showResult?0.4:1}}>
                  <span style={{position:"absolute",top:4,right:6,fontSize:10,color:"#4a5568"}}>{i+1}</span>
                  {isCorrect&&<span style={{color:"#4ade80"}}>✓</span>}
                  {isWrong&&<span style={{color:"#f87171"}}>✗</span>}
                  {wasFirstWrong&&!showResult&&<span style={{color:"#f87171",position:"absolute",top:4,left:6,fontSize:10}}>✗</span>}
                  {isTopic5 && typeof opt === "object" ? <Topic5Option opt={opt} size={40} />
                    : <span style={{color:wasFirstWrong&&!showResult?"#64748b":"#e2e8f0",fontSize:13,textDecoration:wasFirstWrong&&!showResult?"line-through":"none"}}>{typeof opt==="string"?opt:opt?.label||""}</span>}
                </button>
              );
            })}
          </div>

          </div>
          {/* Action buttons */}
          {!showResult ? (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={submitAnswer} disabled={selectedAnswer===null}
                style={{...S.primaryBtn,width:"100%",opacity:selectedAnswer===null?0.4:1,cursor:selectedAnswer===null?"not-allowed":"pointer"}}>
                ✓ אישור תשובה
              </button>
              <div style={{display:"flex",gap:8}}>
                {currentQuestionIdx > 0 && (
                  <button onClick={prevQuestion} style={{...S.navBtn}}>→ קודמת</button>
                )}
                <button onClick={skipQuestion} style={{...S.navBtn,flex:1,color:"#94a3b8",borderColor:"#334155"}}>
                  {currentQuestionIdx<totalQs-1?"דלג ←":"סיום ←"}
                </button>
              </div>
            </div>
          ) : !testMode ? (
            showExplanation ? (
              <div>
                <div style={S.explanationCard}>
                  <div style={{fontSize:13,fontWeight:600,color:"#fbbf24",marginBottom:6}}>💡 הסבר</div>
                  <p style={{color:"#e2e8f0",fontSize:13,lineHeight:1.8}}>{currentQuestion.explanation}</p>
                </div>
                <div style={{display:"flex",gap:8,marginTop:8}}>
                  {currentQuestionIdx > 0 && (
                    <button onClick={prevQuestion} style={{...S.navBtn}}>→</button>
                  )}
                  <button onClick={resetCurrentAnswer} style={{...S.navBtn,color:"#fbbf24",borderColor:"rgba(251,191,36,0.3)"}}>↺ נסה שוב</button>
                  <button onClick={nextQuestion} style={{...S.primaryBtn,flex:1}}>
                    {currentQuestionIdx<totalQs-1?"← שאלה הבאה":"🎉 סיום"}
                  </button>
                </div>
              </div>
            ) : null
          ) : (
            /* Test mode - after answering */
            <div style={{display:"flex",gap:8}}>
              {currentQuestionIdx > 0 && (
                <button onClick={prevQuestion} style={{...S.navBtn}}>→</button>
              )}
              <button onClick={resetCurrentAnswer} style={{...S.navBtn,color:"#fbbf24",borderColor:"rgba(251,191,36,0.3)"}}>↺ שנה</button>
              <button onClick={nextQuestion} style={{...S.primaryBtn,flex:1}}>
                {currentQuestionIdx<totalQs-1?"← שאלה הבאה":"🎉 סיום מבחן"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // TEST INSTRUCTIONS SCREEN
  if (screen === "test-instructions" && testInstructionTopic) {
    const inst = TEST_INSTRUCTIONS[testInstructionTopic];
    const topicNum = testInstructionTopic;
    const topicQsInTest = testQuestions.filter(q=>q.topic===topicNum).length;
    return (
      <div style={S.container}>
        <div style={{...S.card, maxWidth:520, textAlign:"center"}}>
          <div style={{fontSize:48,marginBottom:8}}>{inst?.icon || "📋"}</div>
          <h2 style={{color:"#e2e8f0",fontSize:20,marginBottom:6}}>{inst?.title || `חלק ${topicNum}`}</h2>
          <div style={{color:TOPIC_COLORS[topicNum],fontSize:13,marginBottom:16}}>{topicQsInTest} שאלות בחלק זה</div>
          <div style={{
            textAlign:"right",padding:"16px 20px",backgroundColor:"rgba(15,23,42,0.6)",
            borderRadius:14,border:"1px solid #1e293b",marginBottom:20
          }}>
            <p style={{color:"#94a3b8",fontSize:13,marginBottom:10,fontWeight:600}}>:הוראות</p>
            <p style={{color:"#e2e8f0",fontSize:13,lineHeight:2,whiteSpace:"pre-line"}}>{inst?.text || ""}</p>
          </div>
          <button onClick={()=>setScreen("test")} style={{...S.primaryBtn,width:"100%"}}>
            !בואו נתחיל ←
          </button>
        </div>
      </div>
    );
  }

  // TOPIC DONE
  if (screen==="topic-done") {
    const st=getTopicStats(currentTopic);
    const medal=st.pct>=90?"🥇":st.pct>=75?"🥈":st.pct>=50?"🥉":"💪";
    return (
      <div style={S.container}>
        <div style={{...S.card,textAlign:"center",maxWidth:400}}>
          <div style={{fontSize:56,marginBottom:10}}>{medal}</div>
          <h2 style={{color:"#e2e8f0",marginBottom:6}}>!סיימת</h2>
          <p style={{color:"#94a3b8",marginBottom:16}}>{TOPIC_NAMES[currentTopic]}</p>
          <div style={{color:TOPIC_COLORS[currentTopic],fontSize:34,fontWeight:"bold",marginBottom:16}}>{st.pct}%</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>startTopic(currentTopic)} style={{...S.secondaryBtn,flex:1}}>🔄 שוב</button>
            <button onClick={goHome} style={{...S.primaryBtn,flex:1}}>🏠 ראשי</button>
          </div>
        </div>
      </div>
    );
  }

  // TEST RESULTS
  if (screen==="test-results") {
    const fa={...testAnswers};
    const cc=testQuestions.filter((q,i)=>fa[i]===q.correct).length;
    const pct=Math.round(cc/testQuestions.length*100);
    const totalTime=Math.round((Date.now()-testStartTime)/1000);
    const tb={};
    testQuestions.forEach((q,i)=>{if(!tb[q.topic])tb[q.topic]={total:0,correct:0};tb[q.topic].total++;if(fa[i]===q.correct)tb[q.topic].correct++;});
    return (
      <div style={S.container}>
        <Confetti active={pct>=80} />
        <div style={{...S.card,maxWidth:480,textAlign:"center"}}>
          <div style={{fontSize:50,marginBottom:10}}>{pct>=90?"🏆":pct>=70?"⭐":"💪"}</div>
          <h2 style={{color:"#e2e8f0",marginBottom:4}}>!סיום מבחן</h2>
          <div style={{color:"#4ade80",fontSize:44,fontWeight:"bold",margin:"10px 0"}}>{pct}%</div>
          <p style={{color:"#94a3b8",marginBottom:18}}>{cc} מתוך {testQuestions.length} • {Math.floor(totalTime/60)}:{(totalTime%60).toString().padStart(2,"0")}</p>
          <div style={{textAlign:"right",marginBottom:18}}>
            {Object.entries(tb).map(([t,d])=>(
              <div key={t} style={{display:"flex",justifyContent:"space-between",padding:"5px 0",borderBottom:"1px solid #1e293b"}}>
                <span style={{color:"#94a3b8",fontSize:12}}>{TOPIC_ICONS[t]} {TOPIC_NAMES[t]}</span>
                <span style={{color:TOPIC_COLORS[t],fontWeight:"bold",fontSize:12}}>{d.correct}/{d.total}</span>
              </div>
            ))}
          </div>
          <button onClick={goHome} style={{...S.primaryBtn,width:"100%"}}>🏠 חזרה</button>
        </div>
      </div>
    );
  }

  // PROGRESS
  if (screen==="progress") {
    let total=0,correct=0;
    Object.values(progress.answers).forEach(a=>{total+=a.attempts;correct+=a.correct;});
    const pct=total>0?Math.round(correct/total*100):0;
    let weakest=null,wp=101;
    [1,2,3,4,5].forEach(t=>{const s=getTopicStats(t);if(s.total>0&&s.pct<wp){wp=s.pct;weakest=t;}});
    return (
      <div style={S.container}>
        <div style={{width:"100%",maxWidth:580,padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <button onClick={goHome} style={S.backBtn}>← חזרה</button>
            <h2 style={{color:"#e2e8f0",margin:0,fontSize:18}}>📊 התקדמות</h2>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
            {[{l:"שאלות",v:total,ic:"📝"},{l:"הצלחה",v:`${pct}%`,ic:"🎯"},{l:"נקודות",v:progress.points,ic:"⭐"}].map((s,i)=>(
              <div key={i} style={S.statCard}>
                <span style={{fontSize:22}}>{s.ic}</span>
                <div style={{color:"#e2e8f0",fontSize:18,fontWeight:"bold"}}>{s.v}</div>
                <div style={{color:"#64748b",fontSize:11}}>{s.l}</div>
              </div>
            ))}
          </div>
          <h3 style={{color:"#e2e8f0",fontSize:13,marginBottom:10}}>:לפי נושא</h3>
          {[1,2,3,4,5].map(t=>{const s=getTopicStats(t);return(
            <div key={t} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",backgroundColor:"rgba(15,23,42,0.5)",borderRadius:10,marginBottom:6}}>
              <span style={{fontSize:18}}>{TOPIC_ICONS[t]}</span>
              <div style={{flex:1}}>
                <div style={{color:"#e2e8f0",fontSize:12}}>{TOPIC_NAMES[t]}</div>
                <div style={{width:"100%",height:5,backgroundColor:"#1e293b",borderRadius:3,marginTop:3}}>
                  <div style={{width:`${s.pct}%`,height:"100%",backgroundColor:TOPIC_COLORS[t],borderRadius:3}}/>
                </div>
              </div>
              <span style={{color:TOPIC_COLORS[t],fontWeight:"bold",fontSize:13,minWidth:36,textAlign:"center"}}>{s.pct}%</span>
            </div>
          );})}
          {progress.tests.length>0&&<>
            <h3 style={{color:"#e2e8f0",fontSize:13,margin:"16px 0 8px"}}>:מבחנים</h3>
            {[...progress.tests].reverse().slice(0,8).map((t,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",backgroundColor:"rgba(15,23,42,0.5)",borderRadius:8,marginBottom:4}}>
                <span style={{color:"#94a3b8",fontSize:12}}>{new Date(t.date).toLocaleDateString("he-IL")}</span>
                <span style={{color:t.pct>=80?"#4ade80":t.pct>=60?"#fbbf24":"#f87171",fontWeight:"bold",fontSize:12}}>{t.pct}%</span>
              </div>
            ))}
          </>}
          {weakest&&wp<80&&<div style={{marginTop:14,padding:12,backgroundColor:"rgba(251,191,36,0.1)",border:"1px solid rgba(251,191,36,0.3)",borderRadius:12}}>
            <p style={{color:"#fbbf24",fontSize:13}}>💡 כדאי לתרגל עוד: {TOPIC_NAMES[weakest]} ({wp}%)</p>
          </div>}
        </div>
      </div>
    );
  }

  // SETTINGS
  if (screen==="settings") {
    return (
      <div style={S.container}>
        <div style={{width:"100%",maxWidth:480,padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
            <button onClick={goHome} style={S.backBtn}>← חזרה</button>
            <h2 style={{color:"#e2e8f0",margin:0,fontSize:18}}>⚙️ הגדרות</h2>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={S.settingRow}>
              <label style={S.settingLabel}>שם</label>
              <input type="text" value={settings.playerName} onChange={e=>saveSettings({...settings,playerName:e.target.value})} style={{...S.input,width:140}} />
            </div>
            <div style={S.settingRow}>
              <label style={S.settingLabel}>כיתה</label>
              <div style={{display:"flex",gap:4}}>
                {[2,3,4].map(g=><button key={g} onClick={()=>saveSettings({...settings,grade:g})}
                  style={{padding:"5px 12px",borderRadius:8,backgroundColor:settings.grade===g?"#818cf8":"rgba(129,140,248,0.1)",border:`1px solid ${settings.grade===g?"#818cf8":"#334155"}`,color:settings.grade===g?"white":"#94a3b8",cursor:"pointer",fontSize:12}}>
                  {g===2?"ב׳":g===3?"ג׳":"ד׳"}</button>)}
              </div>
            </div>
            <div style={S.settingRow}>
              <label style={S.settingLabel}>אנימציות</label>
              <div style={{display:"flex",gap:4}}>
                {[["full","מלאות"],["fast","מהירות"],["off","כבויות"]].map(([v,l])=><button key={v} onClick={()=>saveSettings({...settings,animations:v})}
                  style={{padding:"5px 10px",borderRadius:8,backgroundColor:settings.animations===v?"#818cf8":"rgba(129,140,248,0.1)",border:`1px solid ${settings.animations===v?"#818cf8":"#334155"}`,color:settings.animations===v?"white":"#94a3b8",cursor:"pointer",fontSize:11}}>{l}</button>)}
              </div>
            </div>
            <div style={S.settingRow}>
              <label style={S.settingLabel}>סאונד</label>
              <button onClick={()=>saveSettings({...settings,sound:!settings.sound})}
                style={{...S.toggleBtn,backgroundColor:settings.sound?"#4ade80":"#475569"}}>{settings.sound?"מופעל":"כבוי"}</button>
            </div>
            <div style={S.settingRow}>
              <label style={S.settingLabel}>טיימר</label>
              <button onClick={()=>saveSettings({...settings,timerEnabled:!settings.timerEnabled})}
                style={{...S.toggleBtn,backgroundColor:settings.timerEnabled?"#4ade80":"#475569"}}>{settings.timerEnabled?"מופעל":"כבוי"}</button>
            </div>
            {settings.timerEnabled&&<div style={{padding:10,backgroundColor:"rgba(15,23,42,0.5)",borderRadius:12}}>
              <label style={{...S.settingLabel,marginBottom:8,display:"block"}}>:זמן לשאלה (שניות)</label>
              {[1,2,3,4,5].map(t=><div key={t} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 0"}}>
                <span style={{color:"#94a3b8",fontSize:11}}>{TOPIC_ICONS[t]} חלק {t}</span>
                <input type="number" min="10" max="300" value={settings.timerSeconds[t]}
                  onChange={e=>saveSettings({...settings,timerSeconds:{...settings.timerSeconds,[t]:parseInt(e.target.value)||60}})}
                  style={{...S.input,width:65,textAlign:"center",fontSize:12,padding:"4px 6px"}} />
              </div>)}
            </div>}
            <div style={S.settingRow}>
              <label style={S.settingLabel}>מצב מהיר (הורה לחוץ)</label>
              <button onClick={()=>saveSettings({...settings,rushMode:!settings.rushMode})}
                style={{...S.toggleBtn,backgroundColor:settings.rushMode?"#f87171":"#475569"}}>{settings.rushMode?"מופעל":"כבוי"}</button>
            </div>
            <div style={S.settingRow}>
              <label style={S.settingLabel}>שאלות במבחן</label>
              <div style={{display:"flex",gap:4}}>
                {[10,15,20].map(n=><button key={n} onClick={()=>saveSettings({...settings,testQuestionCount:n})}
                  style={{padding:"5px 10px",borderRadius:8,backgroundColor:settings.testQuestionCount===n?"#818cf8":"rgba(129,140,248,0.1)",border:`1px solid ${settings.testQuestionCount===n?"#818cf8":"#334155"}`,color:settings.testQuestionCount===n?"white":"#94a3b8",cursor:"pointer",fontSize:12}}>{n}</button>)}
              </div>
            </div>
            <button onClick={()=>{if(confirm("לאפס את כל ההתקדמות?"))resetProgress();}} style={S.dangerBtn}>🗑️ איפוס התקדמות</button>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN LOGIN
  if (screen==="admin-login") {
    return (
      <div style={S.container}>
        <div style={{...S.card,maxWidth:360,textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:10}}>🔐</div>
          <h2 style={{color:"#e2e8f0",marginBottom:14}}>כניסת מנהל</h2>
          <input type="password" value={adminPwInput} onChange={e=>setAdminPwInput(e.target.value)}
            onKeyDown={e=>{if(e.key==="Enter"&&adminPwInput===settings.adminPassword){setAdminAuth(true);setScreen("admin");setAdminPwInput("");}}}
            placeholder="סיסמה" style={{...S.input,width:"100%",marginBottom:10,textAlign:"center"}} />
          <div style={{display:"flex",gap:8}}>
            <button onClick={goHome} style={{...S.secondaryBtn,flex:1}}>ביטול</button>
            <button onClick={()=>{if(adminPwInput===settings.adminPassword){setAdminAuth(true);setScreen("admin");setAdminPwInput("");}else alert("סיסמה שגויה");}}
              style={{...S.primaryBtn,flex:1}}>כניסה</button>
          </div>
        </div>
      </div>
    );
  }

  // ADMIN
  if (screen==="admin"&&adminAuth) {
    if (editingQ) {
      return (
        <div style={S.container}>
          <div style={{width:"100%",maxWidth:520,padding:"0 16px"}}>
            <h2 style={{color:"#e2e8f0",marginBottom:14,fontSize:17}}>{editingQ.id?"עריכת שאלה":"שאלה חדשה"}</h2>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div><label style={S.settingLabel}>נושא</label>
                <select value={editingQ.topic} onChange={e=>setEditingQ({...editingQ,topic:parseInt(e.target.value)})} style={S.input}>
                  {[1,2,3,4,5].map(t=><option key={t} value={t}>{TOPIC_NAMES[t]}</option>)}</select></div>
              <div><label style={S.settingLabel}>כיתות</label>
                <div style={{display:"flex",gap:8,marginTop:4}}>
                  {[2,3,4].map(g=>{
                    const grades = editingQ.grades || [editingQ.grade || 3];
                    const checked = grades.includes(g);
                    return <label key={g} style={{color:"#e2e8f0",fontSize:13,display:"flex",alignItems:"center",gap:4,cursor:"pointer"}}>
                      <input type="checkbox" checked={checked} onChange={e=>{
                        const newG = e.target.checked ? [...grades,g].sort() : grades.filter(x=>x!==g);
                        setEditingQ({...editingQ,grades:newG.length?newG:[g]});
                      }} />
                      {g===2?"ב׳":g===3?"ג׳":"ד׳"}
                    </label>;
                  })}
                </div></div>
              <div><label style={S.settingLabel}>קושי</label>
                <select value={editingQ.difficulty} onChange={e=>setEditingQ({...editingQ,difficulty:e.target.value})} style={S.input}>
                  <option value="easy">קל</option><option value="medium">בינוני</option><option value="hard">קשה</option></select></div>
              <div><label style={S.settingLabel}>שאלה</label>
                <textarea value={editingQ.question} onChange={e=>setEditingQ({...editingQ,question:e.target.value})} style={{...S.input,minHeight:50}} /></div>
              {[0,1,2,3].map(i=><div key={i}><label style={S.settingLabel}>תשובה {i+1} {editingQ.correct===i&&"✓"}</label>
                <div style={{display:"flex",gap:6}}><input type="text" value={editingQ.options[i]||""} onChange={e=>{const o=[...editingQ.options];o[i]=e.target.value;setEditingQ({...editingQ,options:o});}} style={{...S.input,flex:1}} />
                <button onClick={()=>setEditingQ({...editingQ,correct:i})} style={{padding:"5px 10px",borderRadius:8,cursor:"pointer",backgroundColor:editingQ.correct===i?"#4ade80":"#1e293b",border:`1px solid ${editingQ.correct===i?"#4ade80":"#334155"}`,color:editingQ.correct===i?"#000":"#94a3b8",fontSize:11}}>✓</button></div></div>)}
              <div><label style={S.settingLabel}>הסבר</label>
                <textarea value={editingQ.explanation} onChange={e=>setEditingQ({...editingQ,explanation:e.target.value})} style={{...S.input,minHeight:70}} /></div>
              <div style={{display:"flex",gap:8,marginTop:6}}>
                <button onClick={()=>setEditingQ(null)} style={{...S.secondaryBtn,flex:1}}>ביטול</button>
                <button onClick={()=>{const q={...editingQ};if(!q.id)q.id=`c-${Date.now()}`;const ex=customQuestions.findIndex(cq=>cq.id===q.id);let nq;if(ex>=0){nq=[...customQuestions];nq[ex]=q;}else nq=[...customQuestions,q];saveCQ(nq);setEditingQ(null);}} style={{...S.primaryBtn,flex:1}}>💾 שמור</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    const fqs = allQ.filter(q=>q.topic===adminTopic);
    return (
      <div style={S.container}>
        <div style={{width:"100%",maxWidth:580,padding:"0 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <button onClick={()=>{setAdminAuth(false);goHome();}} style={S.backBtn}>← חזרה</button>
            <h2 style={{color:"#e2e8f0",margin:0,fontSize:17}}>🔐 ניהול</h2>
          </div>
          <div style={{display:"flex",gap:3,marginBottom:12,flexWrap:"wrap"}}>
            {[1,2,3,4,5].map(t=><button key={t} onClick={()=>setAdminTopic(t)}
              style={{padding:"5px 8px",borderRadius:8,fontSize:11,cursor:"pointer",backgroundColor:adminTopic===t?TOPIC_COLORS[t]+"33":"transparent",border:`1px solid ${adminTopic===t?TOPIC_COLORS[t]:"#334155"}`,color:adminTopic===t?TOPIC_COLORS[t]:"#64748b"}}>
              {TOPIC_ICONS[t]} {t}</button>)}
          </div>
          <button onClick={()=>setEditingQ({id:"",topic:adminTopic,grades:[settings.grade],difficulty:"medium",question:"",options:["","","",""],correct:0,explanation:""})}
            style={{...S.primaryBtn,width:"100%",marginBottom:12,fontSize:13}}>➕ שאלה חדשה</button>
          {fqs.map(q=>{const isC=customQuestions.some(c=>c.id===q.id);
            return(<div key={q.id} style={{padding:"8px 10px",backgroundColor:"rgba(15,23,42,0.6)",borderRadius:10,border:`1px solid ${isC?"#818cf8":"#1e293b"}`,display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div style={{flex:1}}><div style={{color:"#e2e8f0",fontSize:12}}>{typeof q.question==="string"&&q.question.length>45?q.question.slice(0,45)+"...":q.question}</div>
                <div style={{color:"#64748b",fontSize:10}}>{(q.grades||[q.grade]).map(g=>g===2?"ב׳":g===3?"ג׳":"ד׳").join(",")} • {q.difficulty==="easy"?"🟢 קל":q.difficulty==="medium"?"🟡 בינוני":"🔴 קשה"}{isC&&" • מותאם"}</div></div>
              {isC&&<div style={{display:"flex",gap:4}}>
                <button onClick={()=>setEditingQ({...q})} style={{padding:"3px 6px",borderRadius:6,backgroundColor:"#1e293b",border:"1px solid #334155",color:"#94a3b8",cursor:"pointer",fontSize:10}}>✏️</button>
                <button onClick={()=>{if(confirm("למחוק?"))saveCQ(customQuestions.filter(c=>c.id!==q.id));}} style={{padding:"3px 6px",borderRadius:6,backgroundColor:"#1e293b",border:"1px solid #334155",color:"#f87171",cursor:"pointer",fontSize:10}}>🗑️</button>
              </div>}
            </div>);})}
        </div>
      </div>
    );
  }

  return <div style={S.container}><button onClick={goHome} style={S.primaryBtn}>🏠 חזרה</button></div>;
}

// ============================================================
// STYLES
// ============================================================
const S = {
  container:{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)",display:"flex",flexDirection:"column",alignItems:"center",padding:"20px 0",fontFamily:"'Segoe UI',Tahoma,Geneva,Verdana,sans-serif",direction:"rtl"},
  card:{backgroundColor:"rgba(15,23,42,0.85)",backdropFilter:"blur(10px)",borderRadius:20,border:"1px solid rgba(129,140,248,0.15)",padding:28,width:"100%"},
  mainTitle:{color:"white",fontSize:30,fontWeight:800,background:"linear-gradient(135deg,#818cf8,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4},
  input:{backgroundColor:"#1e293b",border:"1px solid #334155",borderRadius:10,padding:"8px 12px",color:"#e2e8f0",fontSize:13,outline:"none",width:"100%",boxSizing:"border-box",direction:"rtl"},
  primaryBtn:{padding:"12px 24px",borderRadius:12,backgroundColor:"#818cf8",color:"white",border:"none",fontSize:15,fontWeight:600,cursor:"pointer",transition:"all 0.2s"},
  secondaryBtn:{padding:"10px 18px",borderRadius:12,backgroundColor:"rgba(129,140,248,0.1)",color:"#818cf8",border:"1px solid rgba(129,140,248,0.3)",fontSize:13,fontWeight:500,cursor:"pointer"},
  dangerBtn:{padding:"10px 18px",borderRadius:12,backgroundColor:"rgba(248,113,113,0.1)",color:"#f87171",border:"1px solid rgba(248,113,113,0.3)",fontSize:13,cursor:"pointer",width:"100%"},
  backBtn:{padding:"6px 14px",borderRadius:10,backgroundColor:"rgba(129,140,248,0.1)",color:"#818cf8",border:"1px solid rgba(129,140,248,0.2)",cursor:"pointer",fontSize:12},
  iconBtn:{width:36,height:36,borderRadius:10,backgroundColor:"rgba(30,41,59,0.8)",border:"1px solid #334155",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"},
  topicCard:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 14px",backgroundColor:"rgba(15,23,42,0.6)",border:"1px solid #1e293b",borderRadius:14,cursor:"pointer",transition:"all 0.2s",width:"100%",textAlign:"right"},
  questionCard:{backgroundColor:"rgba(15,23,42,0.6)",border:"1px solid #1e293b",borderRadius:16,padding:"20px 16px",marginBottom:14,minHeight:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"},
  explanationCard:{backgroundColor:"rgba(251,191,36,0.08)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:14,padding:"14px 16px"},
  statCard:{backgroundColor:"rgba(15,23,42,0.6)",borderRadius:14,padding:"14px 10px",textAlign:"center",border:"1px solid #1e293b",display:"flex",flexDirection:"column",alignItems:"center",gap:3},
  settingRow:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 12px",backgroundColor:"rgba(15,23,42,0.4)",borderRadius:12},
  settingLabel:{color:"#e2e8f0",fontSize:12},
  toggleBtn:{padding:"5px 14px",borderRadius:20,border:"none",color:"white",fontSize:11,fontWeight:600,cursor:"pointer",transition:"all 0.2s"},
  navBtn:{padding:"8px 14px",borderRadius:10,backgroundColor:"rgba(129,140,248,0.08)",color:"#818cf8",border:"1px solid rgba(129,140,248,0.25)",fontSize:12,fontWeight:500,cursor:"pointer",transition:"all 0.15s"},
};
