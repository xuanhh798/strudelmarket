declare module "@strudel/core" {
  export function repl(options?: any): any;
  export const controls: any;
}

declare module "@strudel/webaudio" {
  export function getAudioContext(): AudioContext;
  export function webaudioOutput(
    time: number,
    hap: any,
    audioContext: AudioContext
  ): void;
  export function initAudioOnFirstClick(): Promise<void>;
}

declare module "@strudel/transpiler" {
  export const transpiler: any;
}

declare module "@strudel/mini" {
  export function evalScope(imports?: any, target?: any, transpiler?: any): any;
}
