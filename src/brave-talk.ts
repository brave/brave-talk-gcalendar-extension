const TALK_BASE_URL = "https://talk.brave.com";
const POPUP_WINDOW_NAME = "talk_extension_popup";
const ROOM_URL_PATTERN = /https:\/\/talk.brave.com\/[a-zA-Z0-9_-]{43}/;

/**
 * Generates new room name.  This is how Brave Talk does it.
 */
export function generateRoomWithoutSeparator() {
  const { crypto } = window;
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  return btoa(String.fromCharCode(...buf))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/**
 * @param text The string you would like to search.
 * @returns The full Brave Talk URL if found, otherwise null.
 */
export function findTalkUrlInString(text: string): string | null {
  const match = text.match(ROOM_URL_PATTERN);
  return match ? match[0] : null;
}

export function generateNewRoomUrl() {
  return `https://talk.brave.com/${generateRoomWithoutSeparator()}`;
}

export function isBraveTalkUrl(text: string): boolean {
  return text.startsWith("https://talk.brave.com/");
}

/**
 * TODO (Sampson): We may need to move this logic out of
 * the content script, and instead control window-opening
 * via the background script (e.g. chrome.tabs.create). I
 * suspect we might get blocked by some popup blockers if
 * we continue to do this from the content script.
 */
export function joinRoom(roomUrl: string) {
  if (!ROOM_URL_PATTERN.test(roomUrl)) {
    throw new Error(`Invalid room URL: ${roomUrl}`);
  }

  const sW = window.screen.width;
  const sH = window.screen.height;
  const wW = 0.8 * sW;
  const wH = 0.8 * sH;
  const wX = (sW - wW) / 2;
  const wY = (sH - wH) / 2;

  const url = roomUrl;
  const name = POPUP_WINDOW_NAME;
  const features = [
    `popup,noopener,noreferrer`,
    `width=${wW},height=${wH},left=${wX},top=${wY}`,
  ].join(",");

  openWindow(url, name, features);
}

export function openWindow(url: string, name: string, features: string): void {
  const featureList = features.toLowerCase().split(",");

  // Some features are required, for security/privacy reasons.
  for (const feature of ["noopener", "noreferrer"]) {
    if (!featureList.includes(feature)) {
      featureList.push(feature);
    }
  }

  window.open(url, name, featureList.join(","));
}

export function createRoom(roomUrl: string) {
  window.open(
    `${roomUrl}?create_only=y`,
    "talk_extension_popup",
    "popup,width=320,height=480,noopener,noreferrer"
  );
}
