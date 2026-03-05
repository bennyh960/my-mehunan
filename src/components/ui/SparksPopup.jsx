import { useState, useEffect } from 'react';

export function SparksPopup({ amount, trigger }) {
  const [show, setShow] = useState(false);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (trigger && amount > 0) {
      setKey(k => k + 1);
      setShow(true);
      const t = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(t);
    }
  }, [trigger, amount]);

  if (!show || !amount) return null;

  return (
    <div
      key={key}
      style={{
        position: 'fixed',
        top: '30%',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        animation: 'sparksFloat 2s ease-out forwards',
      }}
    >
      <div style={{
        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
        color: '#1e293b',
        padding: '10px 24px',
        borderRadius: 20,
        fontWeight: 800,
        fontSize: 22,
        boxShadow: '0 0 30px rgba(251, 191, 36, 0.5)',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}>
        ✨ +{amount} ניצוצות
      </div>
      <style>{`
        @keyframes sparksFloat {
          0% { opacity: 0; transform: translateX(-50%) translateY(20px) scale(0.8); }
          15% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1.1); }
          30% { transform: translateX(-50%) translateY(-5px) scale(1); }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) translateY(-60px) scale(0.9); }
        }
      `}</style>
    </div>
  );
}
