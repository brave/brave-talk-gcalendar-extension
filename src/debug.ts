/**
 * Set DEBUG_MODE to `true` to enable
 * console logging.
 */
export let DEBUG_MODE = false;

export function enableDebugging(enable: boolean) {
  DEBUG_MODE = enable;
}

export const debug = (...args: any[]) => {
  if (DEBUG_MODE) {
    console.log("Skiff:", ...args);
  }
};
