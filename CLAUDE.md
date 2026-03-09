# GeniusPrep (my-mehunan)

Hebrew-language gifted-student test prep app (Matic stage B) for grades 2-4. Built with React 19 + Vite.

## Commands

- `npm run dev` - Start dev server
- `npm run build` - Production build
- `npm run lint` - ESLint
- `npm run deploy` - Deploy to GitHub Pages (runs build first via predeploy)

## Project Structure

```
src/
├── main.jsx                          Entry point
├── App.jsx                           State management + screen routing
├── constants/
│   ├── settings.js                   DEFAULT_SETTINGS, DEFAULT_PROGRESS
│   ├── topics.js                     TOPIC_NAMES/ICONS/COLORS, TEST_INSTRUCTIONS
│   ├── questions.js                  QUESTIONS array (~100 questions, 5 topics)
│   ├── games.js                      GAME_LIST, ARITHMETIC_LEVELS, NINJA_CONFIGS,
│   │                                 NINJA_WORLDS, ADVENTURE_CONFIGS, PASS_THRESHOLD
│   └── ninjago.js                    NINJAS, DRAGONS, NINJA_RANKS, SPARKS_REWARDS,
│                                     GAME_UNLOCKS + helper fns (getUnlockedNinjas, etc.)
├── utils/
│   ├── sound.js                      SoundEngine (Web Audio API beeps)
│   └── svg.js                        polygon() SVG helper
├── styles/
│   └── styles.js                     S styles object (inline style constants)
├── components/
│   ├── shapes/                       SVG shape primitives
│   │   ├── Shape.jsx                 Shape + CompositeShape
│   │   ├── PacmanSVG.jsx
│   │   ├── SymbolBox.jsx
│   │   └── GridCell.jsx
│   ├── visuals/                      Question visual renderers
│   │   ├── CirclesTrio.jsx           Topic 4: divided circles
│   │   ├── SequenceBoxes.jsx         Topic 4: number sequences
│   │   ├── TrianglePyramid.jsx       Topic 4: triangle number pyramid
│   │   ├── StarNumbers.jsx           Topic 4: star with inner/outer numbers
│   │   ├── SquaresArrows.jsx         Topic 4: squares with arrows
│   │   ├── Topic4Visual.jsx          Router for all Topic 4 visuals
│   │   ├── Topic5Visual.jsx          Topic 5: shape sequences & matrices
│   │   └── Topic5Option.jsx          Topic 5: answer option rendering
│   └── ui/
│       ├── Timer.jsx                 Countdown timer with progress bar
│       ├── Confetti.jsx              Celebration animation
│       └── SparksPopup.jsx           Animated sparks-earned notification
└── screens/
    ├── GradeSelection.jsx            Initial grade + name picker
    ├── Home.jsx                      Topic list + test/progress buttons
    ├── PracticeGames.jsx             Games hub / selection screen
    ├── Practice.jsx                  Question display + answer flow
    ├── TestInstructions.jsx          Per-topic instructions before test section
    ├── TopicDone.jsx                 Topic completion summary
    ├── TestResults.jsx               Full test results breakdown
    ├── Progress.jsx                  Stats dashboard
    ├── Settings.jsx                  App settings
    ├── AdminLogin.jsx                Admin password gate
    ├── Admin.jsx                     Question management CRUD
    ├── ArithmeticGame.jsx            Fast arithmetic mini-game
    ├── ClockGame.jsx                 Clock-reading mini-game
    ├── AdventureGame.jsx             Room-based adventure/puzzle game
    ├── NinjaGame.jsx                 Ninjago platformer (canvas-based, 20 levels)
    └── DungeonGame.jsx               Dungeon maze game
```

## Architecture

- **No router** - App.jsx manages `screen` state and renders the appropriate screen component
- **Flat props** - All state lives in App.jsx, passed down as props (no Context/Redux)
- **Named exports** everywhere, no barrel files
- **Inline styles** via the `S` object in `styles/styles.js`
- **Storage** via `window.storage.get/set` (provided by host environment)
- **RTL layout** - Hebrew UI, `direction: "rtl"` on container

## Topics

1. Word analogies (text-based)
2. Missing words / sentence completion (text-based)
3. Word problems / math (text-based)
4. Missing number (visual: circles, sequences, pyramids, stars, arrows)
5. Next shape (visual: shape rows, 3x3 matrices, symbol patterns, pacman)

## Games & Rewards System

Five mini-games on the PracticeGames screen, unlocked with **Spinjitzu Sparks (ניצוצות)**:

| ID | Hebrew Name | Sparks to unlock | Screen |
|---|---|---|---|
| `arithmetic` | חשבון מהיר | 0 (free) | ArithmeticGame.jsx |
| `adventure` | הרפתקת החשיבה | 50 | AdventureGame.jsx |
| `clock` | לימוד השעון | 150 | ClockGame.jsx |
| `dungeon` | מבוך הנינג'ה | 250 | DungeonGame.jsx |
| `ninjago` | נינג'גו | 500 | NinjaGame.jsx |

### Sparks Currency
- Earning rates defined in `SPARKS_REWARDS` (`ninjago.js`)
- Stored in `localStorage` key `gp_sparks` (direct localStorage, not `window.storage`)
- `addSparks(amount)` lives in App.jsx and persists to localStorage
- **Admin user `benny123` bypasses ALL game locks AND all level locks within games**

### Ninjago Progression
- **Ninjas**: Kai(0) → Jay(100) → Cole(250) → Zane(450) → Nya(700) → Lloyd(1000 sparks)
- **Ranks**: 6 tiers from "נינג'ה מתחיל" (0) to "נינג'ה אגדי" (1000+) — see `NINJA_RANKS`
- **Dragons**: 5 dragons unlocked at sparks thresholds in `DRAGONS`
- **Ninjago game**: 20 levels across 4 worlds, canvas-based platformer. Dragon enemies appear from level 11+. Level configs in `NINJA_CONFIGS` (by grade).
- Screen routing: both `"ninja-game"` and `"ninjago-game"` route to NinjaGame component
- Game progress stored under key `"ninja"` in gameProgress (backwards compat)

### Game Progress Storage
- `DEFAULT_GAME_PROGRESS` in `games.js` defines the shape: `{ arithmetic, adventure, clock, ninja, ninjago, dungeon }`
- `PASS_THRESHOLD = 7` (out of 10), `STAR_THRESHOLDS = { 1: 7, 2: 9, 3: 10 }`

## Conventions

- Questions use `grades: [2, 3, 4]` array for multi-grade support
- Question IDs: `"{topic}-{number}"` (e.g., "1-1", "5-65")
- Custom questions prefixed with `"c-"` + timestamp
- Practice mode gives 2 attempts per question; test mode gives 1
