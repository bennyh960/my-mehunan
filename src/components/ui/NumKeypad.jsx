export function NumKeypad({ value, onChange, onSubmit, maxDigits = 4 }) {
  const handleKey = (key) => {
    if (key === "⌫") {
      onChange(value.slice(0, -1));
    } else if (key === "✓") {
      if (value.length > 0) onSubmit();
    } else {
      if (value.length < maxDigits) {
        onChange(value + key);
      }
    }
  };

  const keys = ["7", "8", "9", "4", "5", "6", "1", "2", "3", "⌫", "0", "✓"];

  return (
    <div className="numkeypad-grid">
      {keys.map((key) => (
        <button
          key={key}
          className={`numkeypad-btn${key === "✓" ? " submit" : ""}${key === "⌫" ? " delete" : ""}`}
          onClick={() => handleKey(key)}
        >
          {key}
        </button>
      ))}
    </div>
  );
}
