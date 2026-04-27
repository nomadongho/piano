// Wraps the global Tone object loaded from CDN

let synth = null;

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
