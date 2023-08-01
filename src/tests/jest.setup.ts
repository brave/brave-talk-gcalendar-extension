global.setImmediate =
  global.setImmediate ||
  function (fn: () => any) {
    return setTimeout(fn, 0);
  };

global.clearImmediate =
  global.clearImmediate ||
  function (id: number) {
    return clearTimeout(id);
  };

global.window = global.window || {};
global.window.crypto = global.window.crypto || {};
global.window.crypto.getRandomValues =
  global.window.crypto.getRandomValues ||
  function (array: Uint8Array) {
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  };

global.window.screen = global.window.screen || {
  width: 1920,
  height: 1080,
};

global.chrome = global.chrome || {};
global.chrome.runtime = global.chrome.runtime || {};
global.chrome.runtime.getURL =
  global.chrome.runtime.getURL ||
  function (path: string) {
    return path;
  };
