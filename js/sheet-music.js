// Uses the global Vex object loaded from CDN (VexFlow UMD build)

function getVF() {
  // VexFlow 4.x: Vex.Flow.*   VexFlow 5.x: Vex.*
  return (window.Vex && window.Vex.Flow) ? window.Vex.Flow : window.Vex;
}

function noteToVexFlow(n) {
  const match = n.match(/^([A-G])(#|b)?(\d)$/);
  if (!match) return { keys: ['c/4'] };
  const [, letter, acc, octave] = match;
  const key = acc
    ? `${letter.toLowerCase()}${acc}/${octave}`
    : `${letter.toLowerCase()}/${octave}`;
  return { keys: [key], accidental: acc || null };
}

/**
 * Renders sheet music into container using VexFlow.
 * @param {HTMLElement} container
 * @param {Array} notes  – array of { note, duration }
 * @param {number} currentNoteIndex
 */
export function renderSheetMusic(container, notes, currentNoteIndex) {
  container.innerHTML = '';

  const VF = getVF();
  if (!VF || !VF.Renderer) return;

  const { Renderer, Stave, StaveNote, Formatter, Voice, Accidental } = VF;

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(700, 160);
  const context = renderer.getContext();
  context.setFont('Arial', 12, '');

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
    const sn = new StaveNote({ keys, duration: n.duration, autoStem: true });
    if (accidental) {
      sn.addModifier(new Accidental(accidental), 0);
    }
    if (i === localCurrent) {
      sn.setStyle({ fillStyle: '#ff6b35', strokeStyle: '#ff6b35' });
    } else if (i < localCurrent) {
      sn.setStyle({ fillStyle: '#aaa', strokeStyle: '#aaa' });
    }
    return sn;
  });

  try {
    const totalBeats = visibleNotes.reduce((acc, n) => {
      if (n.duration === 'w') return acc + 4;
      if (n.duration === 'h') return acc + 2;
      if (n.duration === 'q') return acc + 1;
      if (n.duration === '8') return acc + 0.5;
      return acc + 1;
    }, 0);

    const voice = new Voice({ numBeats: totalBeats, beatValue: 4 });
    voice.setStrict(false);
    voice.addTickables(staveNotes);
    new Formatter().joinVoices([voice]).format([voice], 620);
    voice.draw(context, stave);
  } catch (e) {
    console.error('VexFlow rendering error:', e);
  }
}
