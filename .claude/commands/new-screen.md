# New Screen

Scaffold a new screen component for GeniusPrep following project conventions.

## Instructions

1. Create the file at `src/screens/<ScreenName>.jsx`.
2. Use the **named export** pattern — no default exports:
   ```jsx
   export const ScreenName = ({ onBack, /* ...other props */ }) => {
     return (
       <div style={{ direction: "rtl", ...S.container }}>
         {/* content */}
       </div>
     );
   };
   ```
3. Import styles from `styles/styles.js`: `import { S } from '../styles/styles';`
4. Import SoundEngine if audio is needed: `import { SoundEngine } from '../utils/sound';`
5. **All user-facing text must be in Hebrew.**
6. **RTL layout**: wrap in `direction: "rtl"` container.
7. **Flat props**: receive all needed state as props from App.jsx — no local useState for persistent data, no Context.
8. Wire up the new screen in `App.jsx`:
   - Add a `case` for the new screen name in the screen-rendering switch/if block
   - Pass required props down
   - Add a navigation action (button or screen transition) to reach it
9. Verify the build passes: `npm run build`

## Scaffold Template

```jsx
import { S } from '../styles/styles';

export const MyNewScreen = ({ onBack }) => {
  return (
    <div style={{ direction: "rtl", minHeight: "100vh", background: S.bg, padding: 24 }}>
      <button onClick={onBack} style={S.backBtn}>← חזרה</button>
      <h1 style={S.title}>כותרת</h1>
    </div>
  );
};
```

$ARGUMENTS
