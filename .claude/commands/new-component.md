# New Component

Scaffold a new reusable component for GeniusPrep following project conventions.

## Instructions

1. Determine the correct directory based on the component's role:
   - `src/components/shapes/` — SVG primitives (raw shape renderers)
   - `src/components/visuals/` — Question visual renderers (Topic 4 & 5 visuals)
   - `src/components/ui/` — Reusable UI widgets (timers, popups, animations)

2. Create `src/components/<dir>/<ComponentName>.jsx` using a **named export**:
   ```jsx
   export const ComponentName = ({ prop1, prop2 }) => {
     // ...
   };
   ```

3. Style rules:
   - Use the `S` object from `styles/styles.js` for shared styles
   - For component-specific styles, define them as inline objects inside the component
   - No CSS files, no CSS modules, no styled-components
   - Follow existing spacing patterns (multiples of 4px or 8px)

4. For SVG components:
   - Use the `polygon()` helper from `utils/svg.js` where applicable
   - Keep SVG sizes configurable via props (width/height or size prop)

5. For visual question renderers (Topic 4/5):
   - Accept a `visual` prop object matching the question's visual data shape
   - Register the new type in the relevant router: `Topic4Visual.jsx` or `Topic5Visual.jsx`

6. Hebrew & RTL:
   - All user-facing text must be in Hebrew
   - Test that the component renders correctly in an RTL container

7. Export from the component file only — no barrel files.

## Scaffold Template

```jsx
import { S } from '../../styles/styles';

export const MyComponent = ({ value, size = 100 }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* component content */}
    </div>
  );
};
```

$ARGUMENTS
