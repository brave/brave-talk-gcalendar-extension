export const TALK_BASE_URL = "https://talk.brave.com";
export const POPUP_WINDOW_NAME = "talk_extension_popup";
export const ROOM_URL_PATTERN = /https:\/\/talk.brave.com\/[a-zA-Z0-9_-]{43}/;

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
  return `${TALK_BASE_URL}/${generateRoomWithoutSeparator()}`;
}

export function isBraveTalkUrl(text: string): boolean {
  return ROOM_URL_PATTERN.test(text);
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

function isValidNavigableTargetName(name: string): boolean {
  /**
   * A valid navigable target name is any string with at least one character
   * that does not start with a U+005F LOW LINE character. (Names starting with
   * an underscore are reserved for special keywords.)
   *
   * A valid navigable target name or keyword is any string that is either a
   * valid navigable target name or that is an ASCII case-insensitive match for
   * one of: _blank, _self, _parent, or _top.
   *
   * https://html.spec.whatwg.org/multipage/document-sequences.html#navigable-target-names
   */

  const nameLC = name.toLowerCase().trim();

  if (["_blank", "_self", "_parent", "_top"].includes(nameLC)) {
    return true;
  }

  return /^[a-z0-9][a-z0-9_-]*$/.test(nameLC);
}

export function openWindow(
  url: string,
  target: string = "_blank",
  features: string = ""
): void {
  const destination = new URL(url);

  if (!isValidNavigableTargetName(target)) {
    throw new Error(`Invalid window name: ${target}`);
  }

  const featureList = features.toLowerCase().split(",");

  // Some features are required, for security/privacy reasons.
  for (const feature of ["noopener", "noreferrer"]) {
    if (!featureList.includes(feature)) {
      featureList.push(feature);
    }
  }

  window.open(destination, target, featureList.join(","));
}

export function createRoom(roomUrl: string) {
  if (!ROOM_URL_PATTERN.test(roomUrl)) {
    throw new Error(`Invalid room URL: ${roomUrl}`);
  }
  const createUrl = `${roomUrl}?create_only=y`;
  const features = `popup,noopener,noreferrer,width=320,height=480`;
  openWindow(createUrl, POPUP_WINDOW_NAME, features);
}
