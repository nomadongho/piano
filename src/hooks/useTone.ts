import { useRef, useCallback } from 'react';
import * as Tone from 'tone';

export function useTone() {
  const synthRef = useRef<Tone.PolySynth | null>(null);

  const getSynth = useCallback(() => {
    if (!synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 1.2 },
      }).toDestination();
      synthRef.current.volume.value = -6;
    }
    return synthRef.current;
  }, []);

  const playNote = useCallback(async (note: string, duration = '8n') => {
    await Tone.start();
    const synth = getSynth();
    synth.triggerAttackRelease(note, duration);
  }, [getSynth]);

  const stopAll = useCallback(() => {
    synthRef.current?.releaseAll();
  }, []);

  return { playNote, stopAll };
}
