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

function durationToBeats(dur) {
  if (dur === 'w') return 4;
  if (dur === 'h') return 2;
  if (dur === 'q') return 1;
  if (dur === '8') return 0.5;
  return 1;
}

const NOTES_PER_ROW = 8;
const STAVE_WIDTH = 640;
const STAVE_X = 10;
const ROW_HEIGHT = 130;
const STAVE_Y_BASE = 20;
const VISIBLE_ROWS = 2;

/**
 * Initialises a scrolling sheet music display that renders the entire song.
 * Returns { update(currentIndex) } for live note highlighting + smooth scroll.
 * @param {HTMLElement} container
 * @param {Array} notes – array of { note, duration }
 * @returns {{ update(currentIndex: number): void }}
 */
export function initScrollingSheet(container, notes) {
  container.innerHTML = '';

  const VF = getVF();
  if (!VF || !VF.Renderer) return { update: () => {} };

  const { Renderer, Stave, StaveNote, Formatter, Voice, Accidental } = VF;

  const numRows = Math.ceil(notes.length / NOTES_PER_ROW);
  const totalHeight = STAVE_Y_BASE + numRows * ROW_HEIGHT + 30;
  const visibleHeight = STAVE_Y_BASE + VISIBLE_ROWS * ROW_HEIGHT + 20;

  const scrollOuter = document.createElement('div');
  scrollOuter.className = 'sheet-scroll-outer';
  scrollOuter.style.height = `${visibleHeight}px`;

  const scrollInner = document.createElement('div');
  scrollOuter.appendChild(scrollInner);
  container.appendChild(scrollOuter);

  const renderer = new Renderer(scrollInner, Renderer.Backends.SVG);
  renderer.resize(STAVE_WIDTH + 60, totalHeight);
  const context = renderer.getContext();
  context.setFont('Arial', 12, '');

  const allNoteObjects = [];

  for (let row = 0; row < numRows; row++) {
    const start = row * NOTES_PER_ROW;
    const end = Math.min(notes.length, start + NOTES_PER_ROW);
    const rowNotes = notes.slice(start, end);
    const staveY = STAVE_Y_BASE + row * ROW_HEIGHT;

    const stave = new Stave(STAVE_X, staveY, STAVE_WIDTH);
    if (row === 0) stave.addClef('treble').addTimeSignature('4/4');
    else stave.addClef('treble');
    stave.setContext(context).draw();

    const staveNotes = rowNotes.map((n) => {
      const { keys, accidental } = noteToVexFlow(n.note);
      const sn = new StaveNote({ keys, duration: n.duration, autoStem: true });
      if (accidental) sn.addModifier(new Accidental(accidental), 0);
      return sn;
    });

    staveNotes.forEach((sn, i) => { allNoteObjects[start + i] = sn; });

    try {
      const totalBeats = rowNotes.reduce((acc, n) => acc + durationToBeats(n.duration), 0);
      const voice = new Voice({ numBeats: totalBeats, beatValue: 4 });
      voice.setStrict(false);
      voice.addTickables(staveNotes);
      new Formatter().joinVoices([voice]).format([voice], STAVE_WIDTH - 80);
      voice.draw(context, stave);
    } catch (e) {
      console.error('VexFlow rendering error:', e);
    }
  }

  function applyColor(sn, color) {
    if (!sn || !sn.attrs || !sn.attrs.el) return;
    sn.attrs.el.querySelectorAll('path, rect').forEach(p => {
      p.setAttribute('fill', color);
      p.setAttribute('stroke', color);
    });
  }

  // Apply initial colours (first note highlighted, rest default)
  allNoteObjects.forEach((sn, i) => applyColor(sn, i === 0 ? '#ff6b35' : '#222222'));

  function update(currentIndex) {
    allNoteObjects.forEach((sn, i) => {
      if (i === currentIndex) applyColor(sn, '#ff6b35');
      else if (i < currentIndex) applyColor(sn, '#c8c8c8');
      else applyColor(sn, '#222222');
    });

    // Smooth-scroll so the current row stays in the top half of the viewport
    const currentRow = Math.floor(currentIndex / NOTES_PER_ROW);
    const targetScrollTop = Math.max(0, STAVE_Y_BASE + currentRow * ROW_HEIGHT - 10);
    scrollOuter.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }

  return { update };
}

/**
 * Renders the last N played notes as a live sheet for Free Play mode.
 * @param {HTMLElement} container
 * @param {Array} playedNotes – array of { note, duration }
 */
export function renderFreePlaySheet(container, playedNotes) {
  container.innerHTML = '';

  const VF = getVF();
  if (!VF || !VF.Renderer) return;

  const { Renderer, Stave, StaveNote, Formatter, Voice, Accidental } = VF;

  const maxVisible = 8;
  const visible = playedNotes.slice(-maxVisible);

  const renderer = new Renderer(container, Renderer.Backends.SVG);
  renderer.resize(700, 160);
  const context = renderer.getContext();
  context.setFont('Arial', 12, '');

  const stave = new Stave(10, 20, 660);
  stave.addClef('treble').addTimeSignature('4/4');
  stave.setContext(context).draw();

  if (visible.length === 0) return;

  const staveNotes = visible.map((n, i) => {
    const { keys, accidental } = noteToVexFlow(n.note);
    const sn = new StaveNote({ keys, duration: n.duration || 'q', autoStem: true });
    if (accidental) sn.addModifier(new Accidental(accidental), 0);
    if (i === visible.length - 1) {
      sn.setStyle({ fillStyle: '#ff6b35', strokeStyle: '#ff6b35' });
    }
    return sn;
  });

  try {
    const totalBeats = visible.reduce((acc, n) => acc + durationToBeats(n.duration || 'q'), 0);
    const voice = new Voice({ numBeats: Math.max(totalBeats, 1), beatValue: 4 });
    voice.setStrict(false);
    voice.addTickables(staveNotes);
    new Formatter().joinVoices([voice]).format([voice], 620);
    voice.draw(context, stave);
  } catch (e) {
    console.error('VexFlow rendering error:', e);
  }
}
