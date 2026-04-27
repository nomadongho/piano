import { useEffect, useState } from 'react';

interface CelebrationProps {
  score: number;
  total: number;
  onRestart: () => void;
  onMenu: () => void;
}

export function Celebration({ score, total, onRestart, onMenu }: CelebrationProps) {
  const [emojis, setEmojis] = useState<Array<{ id: number; x: number; emoji: string; delay: number }>>([]);

  useEffect(() => {
    const celebEmojis = ['⭐', '🎉', '🌟', '✨', '🎊', '🎈', '🏆', '💫'];
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      emoji: celebEmojis[Math.floor(Math.random() * celebEmojis.length)],
      delay: Math.random() * 2,
    }));
    setEmojis(items);
  }, []);

  const pct = Math.round((score / total) * 100);
  const grade = pct >= 90 ? '🏆 Amazing!' : pct >= 70 ? '⭐ Great job!' : pct >= 50 ? '😊 Good try!' : '💪 Keep practicing!';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 100, overflow: 'hidden' }}>
      {emojis.map(e => (
        <div key={e.id} style={{ position: 'absolute', left: `${e.x}%`, top: '-50px', fontSize: 30, animation: `fall 3s ${e.delay}s infinite linear` }}>
          {e.emoji}
        </div>
      ))}
      <style>{`
        @keyframes fall { from { transform: translateY(0) rotate(0deg); } to { transform: translateY(110vh) rotate(360deg); } }
        @keyframes bounce { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
      `}</style>
      <div style={{ background: 'white', borderRadius: 32, padding: '40px 60px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', animation: 'bounce 1s ease infinite', zIndex: 1 }}>
        <div style={{ fontSize: 80 }}>🎉</div>
        <h1 style={{ fontSize: 36, color: '#333', margin: '10px 0' }}>Song Complete!</h1>
        <div style={{ fontSize: 28, color: '#666', margin: '10px 0' }}>{grade}</div>
        <div style={{ fontSize: 22, color: '#888', margin: '10px 0' }}>
          Score: {score} / {total} notes correct
        </div>
        <div style={{ marginTop: 30, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onRestart} style={{ padding: '14px 32px', fontSize: 18, background: 'linear-gradient(135deg, #11998e, #38ef7d)', color: 'white', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            🔄 Play Again
          </button>
          <button onClick={onMenu} style={{ padding: '14px 32px', fontSize: 18, background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
            🏠 Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
