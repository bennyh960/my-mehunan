export const DEFAULT_SETTINGS = {
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
  gameTimerEnabled: true,
  gameTimerSeconds: 0,
  adminPassword: "1234",
};

export const DEFAULT_PROGRESS = { answers: {}, tests: [], streak: 0, lastDate: null, points: 0 };
