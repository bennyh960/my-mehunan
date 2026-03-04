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
│   └── questions.js                  QUESTIONS array (~100 questions, 5 topics)
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
│       └── Confetti.jsx              Celebration animation
└── screens/
    ├── GradeSelection.jsx            Initial grade + name picker
    ├── Home.jsx                      Topic list + test/progress buttons
    ├── Practice.jsx                  Question display + answer flow
    ├── TestInstructions.jsx          Per-topic instructions before test section
    ├── TopicDone.jsx                 Topic completion summary
    ├── TestResults.jsx               Full test results breakdown
    ├── Progress.jsx                  Stats dashboard
    ├── Settings.jsx                  App settings
    ├── AdminLogin.jsx                Admin password gate
    └── Admin.jsx                     Question management CRUD
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

## Conventions

- Questions use `grades: [2, 3, 4]` array for multi-grade support
- Question IDs: `"{topic}-{number}"` (e.g., "1-1", "5-65")
- Custom questions prefixed with `"c-"` + timestamp
- Practice mode gives 2 attempts per question; test mode gives 1
