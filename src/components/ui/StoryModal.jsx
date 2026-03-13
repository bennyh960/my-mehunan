import { useState, useEffect } from 'react';

export function StoryModal({ event, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
        padding: 20,
        direction: 'rtl',
      }}
      onClick={handleClose}
    >
      <div
        style={{
          background: event.bg || 'linear-gradient(160deg, #1e1b4b 0%, #0f172a 100%)',
          border: `2px solid ${event.borderColor || '#6366f1'}`,
          borderRadius: 20,
          padding: '32px 28px',
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          boxShadow: `0 0 40px ${event.borderColor || '#6366f1'}44, 0 20px 60px rgba(0,0,0,0.8)`,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.95)',
          transition: 'transform 0.3s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: 64, marginBottom: 8, lineHeight: 1 }}>{event.icon}</div>

        <div style={{ fontSize: 12, color: event.borderColor || '#818cf8', fontWeight: 600, marginBottom: 12, letterSpacing: '0.05em', opacity: 0.9 }}>
          {event.character}
        </div>

        <h2 style={{ color: '#f8fafc', fontSize: 20, fontWeight: 800, margin: '0 0 18px', lineHeight: 1.3 }}>
          {event.title}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {event.lines.map((line, i) => (
            <p key={i} style={{ color: '#cbd5e1', fontSize: 14, margin: 0, lineHeight: 1.7 }}>
              {line}
            </p>
          ))}
        </div>

        <button
          onClick={handleClose}
          style={{
            background: `linear-gradient(135deg, ${event.borderColor || '#6366f1'}, ${event.borderColor || '#6366f1'}bb)`,
            border: 'none',
            borderRadius: 12,
            padding: '13px 28px',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
            boxShadow: `0 4px 20px ${event.borderColor || '#6366f1'}44`,
          }}
        >
          ← המשך
        </button>
      </div>
    </div>
  );
}
