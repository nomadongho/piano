import { useState } from 'react';
import { PIANO_KEYS } from '../data/notes';
import { useTone } from '../hooks/useTone';

interface PianoProps {
  expectedNote?: string | null;
  onNotePlay?: (note: string) => void;
  highlightedNotes?: string[];
}

export function Piano({ expectedNote, onNotePlay, highlightedNotes = [] }: PianoProps) {
  const { playNote } = useTone();
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
  const allKeys = PIANO_KEYS;

  const handlePress = async (note: string) => {
    setPressedKeys(prev => new Set(prev).add(note));
    await playNote(note);
    onNotePlay?.(note);
    setTimeout(() => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }, 300);
  };

  const getWhiteKeyColor = (note: string) => {
    if (pressedKeys.has(note)) return '#ffd700';
    if (note === expectedNote) return '#90ee90';
    if (highlightedNotes.includes(note)) return '#add8e6';
    return 'white';
  };

  const getBlackKeyColor = (note: string) => {
    if (pressedKeys.has(note)) return '#ffd700';
    if (note === expectedNote) return '#228b22';
    if (highlightedNotes.includes(note)) return '#00008b';
    return '#222';
  };

  const whiteKeyWidth = 48;
  const whiteKeyHeight = 160;
  const blackKeyWidth = 30;
  const blackKeyHeight = 100;
  const totalWidth = whiteKeys.length * whiteKeyWidth;

  // Black key positions relative to white keys
  const blackKeyOffsets: Record<string, number> = {
    'C#4': 0, 'D#4': 1, 'F#4': 3, 'G#4': 4, 'A#4': 5,
    'C#5': 7, 'D#5': 8, 'F#5': 10, 'G#5': 11, 'A#5': 12,
  };

  return (
    <div style={{ overflowX: 'auto', padding: '10px 0' }}>
      <div style={{ position: 'relative', width: totalWidth, height: whiteKeyHeight + 20, margin: '0 auto' }}>
        {/* White keys */}
        {whiteKeys.map((key, i) => (
          <div
            key={key.note}
            onMouseDown={() => handlePress(key.note)}
            onTouchStart={(e) => { e.preventDefault(); handlePress(key.note); }}
            style={{
              position: 'absolute',
              left: i * whiteKeyWidth,
              top: 0,
              width: whiteKeyWidth - 2,
              height: whiteKeyHeight,
              background: getWhiteKeyColor(key.note),
              border: '2px solid #aaa',
              borderRadius: '0 0 8px 8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 8,
              fontSize: 11,
              fontWeight: 'bold',
              color: '#555',
              userSelect: 'none',
              boxShadow: pressedKeys.has(key.note) ? 'inset 0 -2px 4px rgba(0,0,0,0.2)' : '2px 4px 6px rgba(0,0,0,0.15)',
              transition: 'background 0.1s',
              zIndex: 1,
            }}
          >
            {key.note === expectedNote && <span style={{ fontSize: 18 }}>👆</span>}
            {key.note !== expectedNote && <span>{key.note.replace(/\d/, '')}</span>}
          </div>
        ))}
        {/* Black keys */}
        {allKeys.filter(k => k.isBlack).map((key) => {
          const whiteIdx = blackKeyOffsets[key.note];
          if (whiteIdx === undefined) return null;
          const left = whiteIdx * whiteKeyWidth + whiteKeyWidth - blackKeyWidth / 2 - 2;
          return (
            <div
              key={key.note}
              onMouseDown={(e) => { e.stopPropagation(); handlePress(key.note); }}
              onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handlePress(key.note); }}
              style={{
                position: 'absolute',
                left,
                top: 0,
                width: blackKeyWidth,
                height: blackKeyHeight,
                background: getBlackKeyColor(key.note),
                borderRadius: '0 0 6px 6px',
                cursor: 'pointer',
                zIndex: 2,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                paddingBottom: 6,
                boxShadow: pressedKeys.has(key.note) ? 'inset 0 -2px 4px rgba(0,0,0,0.4)' : '2px 6px 8px rgba(0,0,0,0.4)',
                transition: 'background 0.1s',
                userSelect: 'none',
              }}
            >
              {key.note === expectedNote && <span style={{ fontSize: 12 }}>👆</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
