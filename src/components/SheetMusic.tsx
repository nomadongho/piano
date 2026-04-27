import { useEffect, useRef } from 'react';
import { Renderer, Stave, StaveNote, Formatter, Voice, Accidental } from 'vexflow';
import type { SongNote } from '../data/songs';

interface SheetMusicProps {
  notes: SongNote[];
  currentNoteIndex: number;
  title?: string;
}

// Map note like "C#4" -> { keys: ["c#/4"], accidental: "#" }
function noteToVexFlow(n: string): { keys: string[]; accidental?: string } {
  const match = n.match(/^([A-G])(#|b)?(\d)$/);
  if (!match) return { keys: [`c/4`] };
  const [, letter, acc, octave] = match;
  const key = acc ? `${letter.toLowerCase()}${acc}/${octave}` : `${letter.toLowerCase()}/${octave}`;
  return { keys: [key], accidental: acc };
}

export function SheetMusic({ notes, currentNoteIndex, title }: SheetMusicProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = '';

    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(700, 160);
    const context = renderer.getContext();
    context.setFont('Arial', 12);

    // Show up to 8 notes at a time centered around current
    const start = Math.max(0, currentNoteIndex - 2);
    const end = Math.min(notes.length, start + 8);
    const visibleNotes = notes.slice(start, end);
    const localCurrent = currentNoteIndex - start;

    const stave = new Stave(10, 20, 660);
    stave.addClef('treble').addTimeSignature('4/4');
    stave.setContext(context).draw();

    if (visibleNotes.length === 0) return;

    const staveNotes = visibleNotes.map((n, i) => {
      const { keys, accidental } = noteToVexFlow(n.note);
      const sn = new StaveNote({
        keys,
        duration: n.duration,
        autoStem: true,
      });
      if (accidental) {
        sn.addModifier(new Accidental(accidental), 0);
      }
      // Color current note
      if (i === localCurrent) {
        sn.setStyle({ fillStyle: '#ff6b35', strokeStyle: '#ff6b35' });
      } else if (i < localCurrent) {
        sn.setStyle({ fillStyle: '#aaa', strokeStyle: '#aaa' });
      }
      return sn;
    });

    try {
      const voice = new Voice({ numBeats: visibleNotes.reduce((acc, n) => {
        if (n.duration === 'w') return acc + 4;
        if (n.duration === 'h') return acc + 2;
        if (n.duration === 'q') return acc + 1;
        if (n.duration === '8') return acc + 0.5;
        return acc + 1;
      }, 0), beatValue: 4 });
      voice.setStrict(false);
      voice.addTickables(staveNotes);
      new Formatter().joinVoices([voice]).format([voice], 620);
      voice.draw(context, stave);
    } catch {
      // If voice fails, try drawing notes individually
    }
  }, [notes, currentNoteIndex]);

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
      {title && <h3 style={{ margin: '0 0 8px 10px', color: '#333', fontSize: 16 }}>{title}</h3>}
      <div ref={containerRef} />
    </div>
  );
}
