// ZzFX(MIT)에는 타입 정의가 없어서 쓰는 부분만 선언한다.
declare module 'zzfx' {
  export function zzfx(...params: (number | undefined)[]): AudioBufferSourceNode;
  export const ZZFX: { volume: number; sampleRate: number; audioContext: AudioContext };
}
