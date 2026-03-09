# Add Question

Scaffold a new question for the GeniusPrep questions array in `src/constants/questions.js`.

## Instructions

1. Read `src/constants/questions.js` to find the last question ID for the target topic so you can pick the next sequential number.
2. Determine the question format based on the topic:
   - **Topics 1-3** (text-based): `{ id, topic, grades, q, options, answer }`
   - **Topic 4** (visual — missing number): `{ id, topic, grades, q, options, answer, visual: { type, ... } }`
     Visual types: `circles`, `sequence`, `pyramid`, `star`, `arrows`
   - **Topic 5** (visual — next shape): `{ id, topic, grades, q, options, answer, visual: { type, ... } }`
     Visual types: `row`, `matrix`, `symbols`, `pacman`
3. Add the new question to the `QUESTIONS` array, keeping questions grouped by topic and sorted by ID number.
4. Verify:
   - `grades` is an array like `[2]`, `[3, 4]`, or `[2, 3, 4]`
   - `answer` exactly matches one of the `options` strings
   - ID format is `"{topic}-{number}"` (e.g., `"3-42"`)
   - All question text and answer options are in Hebrew

## Usage

Run `/add-question` then provide:
- Topic number (1–5)
- Grade(s) this question is for
- The question text (Hebrew)
- The answer options (Hebrew)
- The correct answer
- (For topics 4–5) the visual type and its data

$ARGUMENTS
