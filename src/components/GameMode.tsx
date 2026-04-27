import { useState, useCallback, useRef, useEffect } from 'react';
import { Piano } from './Piano';
import { SheetMusic } from './SheetMusic';
import { PitchDetector } from './PitchDetector';
import { Celebration } from './Celebration';
import { SONGS } from '../data/songs';

interface GameModeProps {
  songId: string;
  onBack: () => void;
}

type FeedbackType = 'correct' | 'wrong' | null;

export function GameMode({ songId, onBack }: GameModeProps) {
  const song = SONGS.find(s => s.id === songId)!;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackType>(null);
  const [completed, setCompleted] = useState(false);
  const [, setMicActive] = useState(false);
  const [sparkle, setSparkle] = useState(false);
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const expectedNote = currentIndex < song.notes.length ? song.notes[currentIndex].note : null;

  const handleNotePlay = useCallback((note: string) => {
    if (completed || currentIndex >= song.notes.length) return;
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);

    const isCorrect = note === expectedNote;
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      setScore(s => s + 1);
      setSparkle(true);
      setTimeout(() => setSparkle(false), 600);
      feedbackTimeout.current = setTimeout(() => {
        setFeedback(null);
        const next = currentIndex + 1;
        if (next >= song.notes.length) {
          setCompleted(true);
        } else {
          setCurrentIndex(next);
        }
      }, 400);
    } else {
      feedbackTimeout.current = setTimeout(() => setFeedback(null), 600);
    }
  }, [currentIndex, expectedNote, completed, song.notes.length]);

  const handleRestart = () => {
    setCurrentIndex(0);
    setScore(0);
    setFeedback(null);
    setCompleted(false);
    setMicActive(false);
  };

  useEffect(() => () => { if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current); }, []);

  if (completed) {
    return <Celebration score={score} total={song.notes.length} onRestart={handleRestart} onMenu={onBack} />;
  }

  const progress = Math.round((currentIndex / song.notes.length) * 100);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <style>{`
        @keyframes sparkle { 0%{transform:scale(1)} 50%{transform:scale(1.3)} 100%{transform:scale(1)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: 50, padding: '10px 24px', fontSize: 16, color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>
          ← Back
        </button>
        <span style={{ fontSize: 28 }}>{song.emoji}</span>
        <h2 style={{ margin: 0, fontSize: 22, color: '#333', flex: 1 }}>{song.title}</h2>
        <div style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', padding: '8px 18px', borderRadius: 50, fontWeight: 'bold', fontSize: 16, color: 'white' }}>
          ⭐ {score}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#e0e0e0', borderRadius: 10, height: 12, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', height: '100%', width: `${progress}%`, transition: 'width 0.3s', borderRadius: 10 }} />
      </div>

      {/* Sheet music */}
      <div style={{ marginBottom: 16 }}>
        <SheetMusic notes={song.notes} currentNoteIndex={currentIndex} title={`Note ${currentIndex + 1} of ${song.notes.length}`} />
      </div>

      {/* Feedback */}
      <div style={{ textAlign: 'center', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        {feedback === 'correct' && (
          <div style={{ fontSize: 40, animation: 'sparkle 0.4s ease' }}>✅ {sparkle ? '🌟' : '⭐'} Great!</div>
        )}
        {feedback === 'wrong' && (
          <div style={{ fontSize: 40, animation: 'shake 0.4s ease', color: '#e53935' }}>❌ Try again!</div>
        )}
        {!feedback && expectedNote && (
          <div style={{ fontSize: 20, color: '#555' }}>
            Play: <span style={{ fontSize: 26, fontWeight: 'bold', color: '#ff6b35' }}>{expectedNote.replace('#', '♯')}</span>
          </div>
        )}
      </div>

      {/* Mic control */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
        <PitchDetector onNoteDetected={handleNotePlay} onToggle={() => setMicActive(a => !a)} />
      </div>

      {/* Piano */}
      <Piano expectedNote={expectedNote} onNotePlay={handleNotePlay} />
    </div>
  );
}
