# Game Developer Agent Memory — GeniusPrep

## Key File Paths
- `src/constants/ninjago.js` — NINJAS, DRAGONS, SPARKS_REWARDS, NINJA_RANKS, GAME_UNLOCKS
- `src/constants/games.js` — GAME_LIST, DEFAULT_GAME_PROGRESS, PASS_THRESHOLD, STAR_THRESHOLDS
- `src/App.jsx` — screen routing, addSparks(), isAdmin check, gradeQ derivation
- `src/screens/NinjaQuestGame.jsx` — Turn-based RPG quest game (added March 2026)

## NINJAS Array Shape
`{ id, nameHe, color, element, elementHe, shootColor, unlockAt, img }`
- `img` is relative path like `ninjago/kai.png` — use `/${ninja.img}` in src

## Screen Routing Pattern
Add to App.jsx: `if (screen === "my-screen") return <MyComponent ...props />;`
Screen name for this game: `"ninja-quest-game"`

## Hooks Rules — Critical
- ALL hooks (useState, useEffect, useCallback) must be called BEFORE any early return
- Early return guards (e.g. `if (!gradeQ || gradeQ.length < 10) return ...`) go AFTER all hooks
- Render helper functions defined as `const renderX = () => (...)` after early returns are fine

## DEFAULT_GAME_PROGRESS (games.js)
Must include a key for every game's progress shape. Added `quest: { currentWorld: 0, worlds: {} }` for NinjaQuestGame.

## Animation Pattern for Games
Inject `<style>` tag with keyframes inside JSX. Use an `animation` state string ('enemy-shake', 'player-shake', null), set via setTimeout to auto-clear after 500ms. Apply via `animation` inline style prop.

## Sparks Deduction
`addSparks(-10)` works fine for deducting. Check `sparks > 0` before deducting to avoid going negative.

## Pre-existing Lint Errors
The repo has pre-existing lint errors in TestResults.jsx, clock.js, sound.js, DungeonGame (missing file). These are NOT new. DungeonGame.jsx is imported in App.jsx but the file does not exist — build will fail regardless.

## useCallback Dependency Arrays
ESLint `react-hooks/exhaustive-deps` reports unused deps as warnings. Remove deps that are not read inside the callback body.

## SpaceInvadersGame (added March 2026)
- Screen name: `"space-invaders-game"` → `SpaceInvadersGame.jsx`
- 200 sparks to unlock (in GAME_UNLOCKS, between clock:150 and ninjago:500)
- gameProgress key: `"space-invaders"` — must also be in DEFAULT_GAME_PROGRESS
- Props: `{ gradeQ, sparks, isAdmin, addSparks, gameProgress, saveGameProgress, onExit, playSound }`
- Canvas: 480×640 portrait. Player stays at Y=570, enemies march in a grid from Y=80
- Ninja bench system: uses `getUnlockedNinjas()`, swapping gives +1 heart (max 3), 3s cooldown
- 4 boosts: lightning (2x speed/fire), power (+2 dmg), shield (absorb 2), spinjitzu (8-dir auto)
- Question overlay: same pattern as NinjaGame gate overlay — pause gameRef, show React div overlay
- Stars: 1=win, 2=all mandatory correct 1st try, 3=2 stars + bonus Q correct
- Lint gotcha: `const [, setScore]` pattern needed when React state is only written (set) not read in JSX

## Canvas Game Lint Patterns
- Unused loop param: `const loop = () =>` not `const loop = (now) =>`
- Remove unused destructured vars from callbacks: `(gg) => {}` → `() => {}`
- `const [, setSetter]` when you only call the setter and never read the state value in JSX
- `// eslint-disable-next-line react-hooks/exhaustive-deps` for `gp`-style derived objects in useCallback deps
