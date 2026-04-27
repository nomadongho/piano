import { Piano } from './Piano';

interface FreePlayProps {
  onBack: () => void;
}

export function FreePlay({ onBack }: FreePlayProps) {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: 50, padding: '10px 24px', fontSize: 16, color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back
        </button>
        <h2 style={{ margin: 0, fontSize: 28, color: '#333' }}>🎵 Free Play</h2>
      </div>
      <p style={{ color: '#666', fontSize: 16, marginBottom: 20 }}>Play whatever you like! No rules here 🎶</p>
      <Piano />
    </div>
  );
}
