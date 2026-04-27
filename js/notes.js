export const NOTE_FREQUENCIES = {
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
  'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
  'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
  'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
  'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

export function frequencyToNote(freq) {
  let minDiff = Infinity;
  let closestNote = null;
  for (const [note, f] of Object.entries(NOTE_FREQUENCIES)) {
    const diff = Math.abs(1200 * Math.log2(freq / f));
    if (diff < minDiff) { minDiff = diff; closestNote = note; }
  }
  return minDiff < 50 ? closestNote : null;
}

export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;
  const rms = Math.sqrt(buffer.reduce((s, v) => s + v * v, 0) / SIZE);
  if (rms < 0.01) return -1;

  let r1 = 0, r2 = SIZE - 1;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < 0.2) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < 0.2) { r2 = SIZE - i; break; }
  }
  const buf2 = buffer.slice(r1, r2);
  const c = new Array(buf2.length).fill(0);
  for (let i = 0; i < buf2.length; i++) {
    for (let j = 0; j < buf2.length - i; j++) {
      c[i] += buf2[j] * buf2[j + i];
    }
  }
  let d = 0;
  while (c[d] > c[d + 1]) d++;
  let maxval = -1, maxpos = -1;
  for (let i = d; i < buf2.length; i++) {
    if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
  }
  let T0 = maxpos;
  if (T0 < 1 || T0 >= buf2.length - 1) return -1;
  const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  if (a) T0 = T0 - b / (2 * a);
  return sampleRate / T0;
}

export const PIANO_KEYS = [
  { note: 'C4', isBlack: false },
  { note: 'C#4', isBlack: true },
  { note: 'D4', isBlack: false },
  { note: 'D#4', isBlack: true },
  { note: 'E4', isBlack: false },
  { note: 'F4', isBlack: false },
  { note: 'F#4', isBlack: true },
  { note: 'G4', isBlack: false },
  { note: 'G#4', isBlack: true },
  { note: 'A4', isBlack: false },
  { note: 'A#4', isBlack: true },
  { note: 'B4', isBlack: false },
  { note: 'C5', isBlack: false },
  { note: 'C#5', isBlack: true },
  { note: 'D5', isBlack: false },
  { note: 'D#5', isBlack: true },
  { note: 'E5', isBlack: false },
  { note: 'F5', isBlack: false },
  { note: 'F#5', isBlack: true },
  { note: 'G5', isBlack: false },
  { note: 'G#5', isBlack: true },
  { note: 'A5', isBlack: false },
  { note: 'A#5', isBlack: true },
  { note: 'B5', isBlack: false },
];
