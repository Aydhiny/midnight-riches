import type { ISoundManager, SoundKey } from "@/types";

export class NoopSoundManager implements ISoundManager {
  play(_sound: SoundKey): void {}
  stop(_sound: SoundKey): void {}
  setVolume(_volume: number): void {}
  mute(): void {}
  unmute(): void {}
}

export function createSoundManager(): ISoundManager {
  return new NoopSoundManager();
}
