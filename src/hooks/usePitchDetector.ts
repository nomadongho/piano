import { useRef, useState, useCallback } from 'react';
import { autoCorrelate, frequencyToNote } from '../data/notes';

export function usePitchDetector(onNoteDetected: (note: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastNoteRef = useRef<string | null>(null);
  const lastNoteTimeRef = useRef<number>(0);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      setIsListening(true);
      setError(null);

      const buffer = new Float32Array(analyser.fftSize);
      const detect = () => {
        analyser.getFloatTimeDomainData(buffer);
        const freq = autoCorrelate(buffer, audioCtx.sampleRate);
        if (freq > 0) {
          const note = frequencyToNote(freq);
          if (note) {
            const now = Date.now();
            if (note !== lastNoteRef.current || now - lastNoteTimeRef.current > 500) {
              lastNoteRef.current = note;
              lastNoteTimeRef.current = now;
              onNoteDetected(note);
            }
          }
        }
        animFrameRef.current = requestAnimationFrame(detect);
      };
      detect();
    } catch (e) {
      if (e instanceof DOMException) {
        if (e.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone access.');
        } else if (e.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError(`Microphone error: ${e.message}`);
        }
      } else {
        setError('Could not access microphone. Please check your browser settings.');
      }
    }
  }, [onNoteDetected]);

  const stop = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    lastNoteRef.current = null;
    setIsListening(false);
  }, []);

  return { isListening, error, start, stop };
}
