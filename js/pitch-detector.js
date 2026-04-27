import { autoCorrelate, frequencyToNote } from './notes.js';

let audioCtx = null;
let analyser = null;
let stream = null;
let animFrame = null;
let lastNote = null;
let lastNoteTime = 0;
let _isListening = false;

export async function startListening(onNoteDetected) {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    _isListening = true;

    const buffer = new Float32Array(analyser.fftSize);
    const detect = () => {
      analyser.getFloatTimeDomainData(buffer);
      const freq = autoCorrelate(buffer, audioCtx.sampleRate);
      if (freq > 0) {
        const note = frequencyToNote(freq);
        if (note) {
          const now = Date.now();
          if (note !== lastNote || now - lastNoteTime > 500) {
            lastNote = note;
            lastNoteTime = now;
            onNoteDetected(note);
          }
        }
      }
      animFrame = requestAnimationFrame(detect);
    };
    detect();
    return { success: true };
  } catch (e) {
    _isListening = false;
    let error = 'Could not access microphone. Please check your browser settings.';
    if (e instanceof DOMException) {
      if (e.name === 'NotAllowedError') {
        error = 'Microphone access denied. Please allow microphone access.';
      } else if (e.name === 'NotFoundError') {
        error = 'No microphone found. Please connect a microphone.';
      } else {
        error = `Microphone error: ${e.message}`;
      }
    }
    return { success: false, error };
  }
}

export function stopListening() {
  if (animFrame) cancelAnimationFrame(animFrame);
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (audioCtx) audioCtx.close();
  audioCtx = null;
  analyser = null;
  stream = null;
  lastNote = null;
  _isListening = false;
}

export function isListening() {
  return _isListening;
}
