// Seeded pseudo-random number generator (mulberry32)
function seededRandom(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(arr, rand) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build 6 adventure rooms for a given level config.
 * @param {object} config - { level, themeStart, difficulty: string[] }
 * @param {array} gradeQuestions - all questions filtered by grade
 * @param {array} themes - ADVENTURE_ROOM_THEMES
 * @returns {array} 6 room objects: { theme, question }
 */
export function buildAdventureRooms(config, gradeQuestions, themes) {
  const seed = config.level * 7919 + 42;
  const rand = seededRandom(seed);

  const usedIds = new Set();
  const rooms = [];

  for (let r = 0; r < 6; r++) {
    // Round-robin topics 1-5, room 6 is random
    const topic = r < 5 ? r + 1 : Math.floor(rand() * 5) + 1;
    const diff = config.difficulty[r];

    // Filter candidates by topic
    const topicQs = gradeQuestions.filter(q => q.topic === topic && !usedIds.has(q.id));

    // Try exact difficulty, then fallback to adjacent, then any
    let candidates = topicQs.filter(q => q.difficulty === diff);
    if (candidates.length === 0) {
      const adjacent = diff === "easy" ? "medium" : diff === "hard" ? "medium" : "easy";
      candidates = topicQs.filter(q => q.difficulty === adjacent);
    }
    if (candidates.length === 0) {
      candidates = topicQs;
    }
    if (candidates.length === 0) {
      // Absolute fallback: any unused question from any topic
      candidates = gradeQuestions.filter(q => !usedIds.has(q.id));
    }

    const shuffled = shuffle(candidates, rand);
    const question = shuffled[0] || null;
    if (question) usedIds.add(question.id);

    const themeIdx = (config.themeStart + r) % themes.length;

    rooms.push({
      theme: themes[themeIdx],
      question,
    });
  }

  return rooms;
}
