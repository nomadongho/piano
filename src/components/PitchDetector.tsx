import { usePitchDetector } from '../hooks/usePitchDetector';

interface PitchDetectorProps {
  onNoteDetected: (note: string) => void;
  onToggle: () => void;
}

export function PitchDetector({ onNoteDetected, onToggle }: PitchDetectorProps) {
  const { isListening, error, start, stop } = usePitchDetector(onNoteDetected);

  const handleToggle = async () => {
    if (isListening) {
      stop();
    } else {
      await start();
    }
    onToggle();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: isListening ? '#e8f5e9' : '#f5f5f5', borderRadius: 50, border: `2px solid ${isListening ? '#4caf50' : '#ddd'}` }}>
      <button
        onClick={handleToggle}
        style={{
          background: isListening ? 'linear-gradient(135deg, #ef5350, #e53935)' : 'linear-gradient(135deg, #43e97b, #38f9d7)',
          border: 'none',
          borderRadius: 50,
          padding: '10px 20px',
          fontSize: 15,
          fontWeight: 'bold',
          color: 'white',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}
      >
        {isListening ? '🛑 Stop Mic' : '🎤 Use Mic'}
      </button>
      {isListening && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4caf50', animation: 'pulse 1s infinite' }} />
          <span style={{ color: '#2e7d32', fontWeight: 'bold', fontSize: 14 }}>Listening...</span>
        </div>
      )}
      {error && <span style={{ color: '#e53935', fontSize: 13 }}>⚠️ {error}</span>}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }`}</style>
    </div>
  );
}
