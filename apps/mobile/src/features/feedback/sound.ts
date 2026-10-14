import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

import type { SoundName } from './feedback';

const sources: Record<SoundName, number> = {
  correct: require('../../../assets/sounds/correct.wav') as number,
  wrong: require('../../../assets/sounds/wrong.wav') as number,
  hint: require('../../../assets/sounds/hint.wav') as number,
  tap: require('../../../assets/sounds/tap.wav') as number,
};

const players = new Map<SoundName, AudioPlayer>();
let configured = false;

function player(name: SoundName): AudioPlayer {
  let p = players.get(name);
  if (!p) {
    p = createAudioPlayer(sources[name]);
    p.volume = 0.6;
    players.set(name, p);
  }
  return p;
}

/** Short UI sounds that mix with the user's music and respect the silent switch. */
export function playSound(name: SoundName): void {
  try {
    if (!configured) {
      configured = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
        () => undefined,
      );
    }
    const p = player(name);
    p.seekTo(0)
      .then(() => {
        p.play();
      })
      .catch(() => undefined);
  } catch {
    // Sound is cosmetic; never let it break gameplay.
  }
}
