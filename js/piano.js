import { PIANO_KEYS } from './notes.js';
import { playNote } from './tone-player.js';

const WHITE_KEY_WIDTH = 48;
const WHITE_KEY_HEIGHT = 160;
const BLACK_KEY_WIDTH = 30;
const BLACK_KEY_HEIGHT = 100;

// Index of the white key to the left of each black key
const BLACK_KEY_OFFSETS = {
  'C#4': 0, 'D#4': 1, 'F#4': 3, 'G#4': 4, 'A#4': 5,
  'C#5': 7, 'D#5': 8, 'F#5': 10, 'G#5': 11, 'A#5': 12,
};

const whiteKeys = PIANO_KEYS.filter(k => !k.isBlack);
const blackKeys = PIANO_KEYS.filter(k => k.isBlack);
const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH;

/**
 * Creates a piano keyboard inside the given container.
 * Returns an object with update(expectedNote) and destroy() methods.
 */
export function createPiano(container, options = {}) {
  let pressedKeys = new Set();
  let expectedNote = options.expectedNote || null;
  let highlightedNotes = options.highlightedNotes || [];
  const onNotePlay = options.onNotePlay || null;

  const wrap = document.createElement('div');
  wrap.className = 'piano-wrap';

  const keysContainer = document.createElement('div');
  keysContainer.className = 'piano-keys';
  keysContainer.style.width = `${totalWidth}px`;
  keysContainer.style.height = `${WHITE_KEY_HEIGHT + 20}px`;

  // White keys
  whiteKeys.forEach((key, i) => {
    const el = document.createElement('div');
    el.className = 'piano-key-white';
    el.dataset.note = key.note;
    el.style.left = `${i * WHITE_KEY_WIDTH}px`;
    el.style.width = `${WHITE_KEY_WIDTH - 2}px`;
    el.style.height = `${WHITE_KEY_HEIGHT}px`;

    const label = document.createElement('span');
    el.appendChild(label);

    el.addEventListener('mousedown', () => handlePress(key.note));
    el.addEventListener('touchstart', (e) => { e.preventDefault(); handlePress(key.note); }, { passive: false });

    keysContainer.appendChild(el);
  });

  // Black keys
  blackKeys.forEach(key => {
    const whiteIdx = BLACK_KEY_OFFSETS[key.note];
    if (whiteIdx === undefined) return;
    const left = whiteIdx * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2 - 2;

    const el = document.createElement('div');
    el.className = 'piano-key-black';
    el.dataset.note = key.note;
    el.style.left = `${left}px`;
    el.style.width = `${BLACK_KEY_WIDTH}px`;
    el.style.height = `${BLACK_KEY_HEIGHT}px`;

    const label = document.createElement('span');
    label.style.fontSize = '12px';
    el.appendChild(label);

    el.addEventListener('mousedown', (e) => { e.stopPropagation(); handlePress(key.note); });
    el.addEventListener('touchstart', (e) => { e.preventDefault(); e.stopPropagation(); handlePress(key.note); }, { passive: false });

    keysContainer.appendChild(el);
  });

  wrap.appendChild(keysContainer);
  container.appendChild(wrap);

  // Initial render
  refreshAllKeys();

  async function handlePress(note) {
    pressedKeys.add(note);
    refreshKey(note);
    await playNote(note);
    if (onNotePlay) onNotePlay(note);
    setTimeout(() => {
      pressedKeys.delete(note);
      refreshKey(note);
    }, 300);
  }

  function refreshKey(note) {
    const el = keysContainer.querySelector(`[data-note="${CSS.escape(note)}"]`);
    if (!el) return;
    const isBlack = el.classList.contains('piano-key-black');

    el.classList.remove('pressed', 'expected', 'highlighted');
    if (pressedKeys.has(note)) {
      el.classList.add('pressed');
    } else if (note === expectedNote) {
      el.classList.add('expected');
    } else if (highlightedNotes.includes(note)) {
      el.classList.add('highlighted');
    }

    const label = el.querySelector('span');
    if (label) {
      if (!isBlack) {
        label.textContent = note === expectedNote ? '👆' : note.replace(/\d/, '');
      } else {
        label.textContent = note === expectedNote ? '👆' : '';
      }
    }
  }

  function refreshAllKeys() {
    keysContainer.querySelectorAll('[data-note]').forEach(el => {
      refreshKey(el.dataset.note);
    });
  }

  return {
    update(newExpectedNote, newHighlighted = []) {
      expectedNote = newExpectedNote;
      highlightedNotes = newHighlighted;
      refreshAllKeys();
    },
    destroy() {
      container.removeChild(wrap);
    },
  };
}
