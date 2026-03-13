// ─── Story/Narrative System: מסע הנינג'ה ───
// Events shown as cinematic modals at key milestones to motivate students
// trigger types: intro, topic_done_N (1-5), test_done, game_intro_N (0-5 = index in GAME_LIST)

export const STORY_EVENTS = {
  intro: {
    icon: "🐍",
    character: 'מאסטר וו — בקול חרד',
    title: '!מסע הנינג׳ה מתחיל',
    lines: [
      'הסרפנטין תקפו את הדוג׳ו ולקחו אותי לכלאם!',
      'רק תלמיד שישלוט בחמשת יסודות הידע ויעבור שישה אתגרי קרב יוכל לשחרר אותי.',
      'מסע הנינג׳ה מתחיל עכשיו — למד, תרגל, נצח! 🥷',
    ],
    bg: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)',
    borderColor: '#6366f1',
  },
  topic_done_1: {
    icon: '📜',
    character: 'נינג׳ה',
    title: '!יסוד המילים הושג',
    lines: [
      'כל הכבוד! פיצחת את הקשרים הנסתרים בין המילים.',
      'גליל יסוד המילים בידיך! 1/5 גלילים. 📜',
      '...מאסטר וו חש את ניצוצות הספינג׳יטסו שלך',
    ],
    bg: 'linear-gradient(160deg, #1e3a5f 0%, #0f172a 100%)',
    borderColor: '#38bdf8',
  },
  topic_done_2: {
    icon: '💡',
    character: "ג'יי",
    title: '!יסוד הידע הושג',
    lines: [
      '!ברק! הבנת כיצד מילים ומשפטים מתחברים',
      'גליל יסוד הידע בידיך! 2/5 גלילים.',
      '...הסרפנטין מודאגים',
    ],
    bg: 'linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%)',
    borderColor: '#818cf8',
  },
  topic_done_3: {
    icon: '🧩',
    character: 'קאי',
    title: '!יסוד החשיבה הושג',
    lines: [
      '!פנומנלי! פתרת כל בעיה מילולית באש',
      'גליל יסוד החשיבה בידיך! 3/5 גלילים.',
      '...שלושה גלילים — אנחנו מתקדמים',
    ],
    bg: 'linear-gradient(160deg, #450a0a 0%, #0f172a 100%)',
    borderColor: '#f87171',
  },
  topic_done_4: {
    icon: '🔢',
    character: 'זיין',
    title: '!יסוד המספרים הושג',
    lines: [
      '!חישוב מושלם! ראית מספרים שאחרים מפספסים',
      'גליל יסוד המספרים בידיך! 4/5 גלילים.',
      '...עוד גליל אחד לפני הקרבות',
    ],
    bg: 'linear-gradient(160deg, #0c2340 0%, #0f172a 100%)',
    borderColor: '#93c5fd',
  },
  topic_done_5: {
    icon: '⭐',
    character: 'לויד',
    title: '!כל הגלילים בידינו',
    lines: [
      '!מדהים! שלטת בכל חמשת יסודות החוכמה',
      'כעת עליך להוכיח את עצמך בשישה אתגרי קרב.',
      '!שחרר את מאסטר וו 🏆',
    ],
    bg: 'linear-gradient(160deg, #14532d 0%, #0f172a 100%)',
    borderColor: '#4ade80',
  },
  test_done: {
    icon: '👴',
    character: 'מאסטר וו',
    title: '!עברת את שער הידע',
    lines: [
      '.ראיתי אותך מרחוק ומחייך בגאווה',
      '"הלמידה היא לא מה שקראת, אלא מה שהבנת" — מאסטר וו.',
      '.המשך לתרגל — כל שאלה מחזקת אותך',
    ],
    bg: 'linear-gradient(160deg, #292524 0%, #0f172a 100%)',
    borderColor: '#fbbf24',
  },
  game_intro_0: {
    icon: '🧮',
    character: 'קול',
    title: '!אתגר א׳ — מגדל החשבון',
    lines: [
      '.הסרפנטין שולטים בחשבון מהיר — הם חוסמים את הדרך',
      '.הוכח שאתה מהיר ומדויק יותר מהם',
      '!התחל את האימון 🔥',
    ],
    bg: 'linear-gradient(160deg, #1c1917 0%, #0f172a 100%)',
    borderColor: '#818cf8',
  },
  game_intro_1: {
    icon: '⏰',
    character: 'מאסטר וו',
    title: '!אתגר ב׳ — גן הזמן',
    lines: [
      '"הזמן הוא הנשק החזק ביותר" — מאסטר וו.',
      '.הסרפנטין מבלבלים שעונים כדי לעצור אותנו',
      '!שלוט בזמן ועבור הלאה ⏰',
    ],
    bg: 'linear-gradient(160deg, #164e63 0%, #0f172a 100%)',
    borderColor: '#22d3ee',
  },
  game_intro_2: {
    icon: '🏰',
    character: 'ניה',
    title: '!אתגר ג׳ — ארמון החידות',
    lines: [
      '.החידות בארמון מסתתרות מאחורי דלתות נעולות',
      '.פתרו חדר אחר חדר — כל תשובה נכונה פותחת דרך',
      '!מאסטר וו קרוב 🏰',
    ],
    bg: 'linear-gradient(160deg, #451a03 0%, #0f172a 100%)',
    borderColor: '#f59e0b',
  },
  game_intro_3: {
    icon: '⚔️',
    character: 'קאי',
    title: '!אתגר ד׳ — זירת הקלפים',
    lines: [
      '.הסרפנטין סוחרים בסודות ואוספים כוח',
      '"אסטרטגיה עדיפה על כוח גולמי" — מאסטר וו.',
      '!גבר בקרב הקלפים ⚔️',
    ],
    bg: 'linear-gradient(160deg, #431407 0%, #0f172a 100%)',
    borderColor: '#f97316',
  },
  game_intro_4: {
    icon: '🥷',
    character: 'לויד',
    title: '!אתגר ה׳ — שדות הנינג׳גו',
    lines: [
      '.הקרב הקשה ביותר — שדות הנינג׳גו מלאים אויבים',
      '.קפוץ, ירה, ואל תפסיק — המאסטר כמעט בהישג יד',
      '!אתה יכול לעשות את זה 🥷',
    ],
    bg: 'linear-gradient(160deg, #14532d 0%, #0f172a 100%)',
    borderColor: '#22c55e',
  },
  game_intro_5: {
    icon: '🛸',
    character: 'נינג׳ות כולם',
    title: '!הקרב הסופי — פלישת הסרפנטין',
    lines: [
      '!🚨 אסידיקוס מוביל את הפלישה הגדולה',
      '.זו המלחמה הסופית — ירו בדיוק, ענו בחכמה',
      '!שחררו את מאסטר וו לנצח 🏆',
    ],
    bg: 'linear-gradient(160deg, #1e003b 0%, #0f172a 100%)',
    borderColor: '#a855f7',
  },
};
