/* tslint:disable */
/* eslint-disable */

/**
 * An RGBA source image retained in WebAssembly memory for repeated conversions.
 */
export class AsciiImage {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Copies browser-decoded RGBA pixels into WebAssembly memory.
     */
    constructor(width: number, height: number, rgba: Uint8Array);
    /**
     * Converts the retained image with the simple settings exposed by the web app.
     */
    render(columns: number, ramp: string): string;
    /**
     * Converts with the tone and colour controls exposed by the web editor.
     */
    render_adjusted(columns: number, ramp: string, brightness: number, contrast: number, gamma: number, saturation: number, red_gain: number, green_gain: number, blue_gain: number, matte_red: number, matte_green: number, matte_blue: number): string;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_asciiimage_free: (a: number, b: number) => void;
    readonly asciiimage_new: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly asciiimage_render: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly asciiimage_render_adjusted: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number, j: number, k: number, l: number, m: number, n: number, o: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
