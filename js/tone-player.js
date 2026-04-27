// Wraps the global Tone object loaded from CDN

let synth = null;
let activeSongTimers = [];
let songSession = 0;

function getSynth() {
  if (!synth) {
    synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.2 },
    }).toDestination();
    synth.volume.value = 0;
  }
  return synth;
}

export async function playNote(note, duration = '8n') {
  await Tone.start();
  const s = getSynth();
  s.triggerAttackRelease(note, duration);
}

const TONE_DUR_MAP  = { w: '1n', h: '2n', q: '4n', '8': '8n' };
const BEAT_DUR_MAP  = { w: 4,    h: 2,    q: 1,    '8': 0.5  };

/**
 * Plays all notes in sequence at the given tempo (BPM).
 * onNoteStart(index) is called just before each note sounds.
 * onEnd() is called after the last note has been played.
 */
export async function playSong(notes, tempo, onNoteStart, onEnd) {
  await Tone.start();
  stopSong();

  const session = ++songSession;
  const s = getSynth();
  const msPerBeat = 60000 / tempo;
  let cumulativeMs = 0;

  notes.forEach((n, i) => {
    const beats   = BEAT_DUR_MAP[n.duration] || 1;
    const toneDur = TONE_DUR_MAP[n.duration] || '4n';
    const ms      = cumulativeMs;

    activeSongTimers.push(setTimeout(() => {
      if (songSession !== session) return;
      s.triggerAttackRelease(n.note, toneDur);
      if (onNoteStart) onNoteStart(i);
    }, ms));

    cumulativeMs += beats * msPerBeat;
  });

  activeSongTimers.push(setTimeout(() => {
    if (songSession !== session) return;
    activeSongTimers = [];
    if (onEnd) onEnd();
  }, cumulativeMs));
}

/** Cancels a song started with playSong(). */
export function stopSong() {
  songSession++;
  activeSongTimers.forEach(t => clearTimeout(t));
  activeSongTimers = [];
}
