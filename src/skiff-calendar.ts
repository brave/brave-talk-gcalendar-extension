import {
  createRoom,
  findTalkUrlInString,
  generateNewRoomUrl,
  joinRoom,
} from "./brave-talk";

const AC_KEY = "skiff:autoCreate";
const BRAVE_TALK_BUTTON_ID = "brave-talk-button";
const BRAVE_TALK_ICON_URL = chrome.runtime.getURL("brave_talk_icon.svg");
const NEW_EVENT_BUTTON_SELECTOR = "[data-test='new-event-button']";
const CONFIRM_REMOVE_SELECTOR = "[data-test='confirm-Remove']";
const CALL_JOIN_ADD_SELECTOR = "[data-test='conferencing-join-or-add-button']";
const CONFERENCING_INPUT_SELECTOR = "[data-test='conferencing-input-field']";
const LOCATION_FIELD_SELECTOR = "[data-test='location-input-field']";
const DESCRIPTION_FIELD_SELECTOR = "[data-test='description-input-field']";
const CANCEL_BUTTON_SELECTOR = "[data-test='dialog-cancel']";
const CONFIRM_REMOVE_BUTTON_SELECTOR = "[data-test='confirm-Remove']";

import { debug } from "./debug";
import { clickElement, createElement, simulateFocusEvents } from "./common";

export function isSkiff(): boolean {
  let { hostname, pathname } = window.location;
  debug("isSkiff", hostname, pathname);
  return hostname === "app.skiff.com" && pathname.startsWith("/calendar");
}

export async function handleAutoCreateMeetingFlag(): Promise<void> {
  if (await getAutoCreateMeetingFlag()) {
    try {
      await clickElement(NEW_EVENT_BUTTON_SELECTOR, 1_000);
      await clickElement(`#${BRAVE_TALK_BUTTON_ID}`);
    } catch (error) {
      debug("handleAutoCreateMeetingFlag:error", error);
    } finally {
      await clearAutoCreateMeetingFlag();
    }
  }
}

export async function getAutoCreateMeetingFlag(): Promise<boolean> {
  const results = await chrome.storage.local.get({ [AC_KEY]: false });
  debug("getAutoCreateMeetingFlag", results[AC_KEY]);
  return results[AC_KEY];
}

export async function clearAutoCreateMeetingFlag(): Promise<void> {
  debug("clearAutoCreateMeetingFlag");
  await chrome.storage.local.set({ [AC_KEY]: false });
}

export function watchForChanges(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (isEventEditorComponent(node)) {
          prepareEditorView(node);
        } else if (isConfirmRemoveConferenceDialog(node)) {
          prepareConfirmRemoveConferenceDialog(node);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: false,
    characterData: false,
  });
}

export function isEventEditorComponent(node: Node): boolean {
  if (node instanceof HTMLElement) {
    const expectedSelectors = [
      LOCATION_FIELD_SELECTOR,
      DESCRIPTION_FIELD_SELECTOR,
      CALL_JOIN_ADD_SELECTOR,
    ];

    return expectedSelectors.every((selector) => {
      return node.querySelector(selector) !== null;
    });
  }
  return false;
}

export async function prepareEditorView(view: Node): Promise<void> {
  debug("prepareEditorView", view);
  if (view instanceof HTMLElement) {
    const button = createButton();
    const braveMeeting = getBraveMeeting();

    /**
     * If we already have an associated Brave Talk
     * meeting, we'll hide the button. Hiding the button
     * is necessary to reduce redundancy in the UI. Skiff
     * provides its own button, which updates its label
     * to say "Join Brave Meeting" when a talk.brave.com
     * conference URL is present.
     */
    if (braveMeeting instanceof URL) {
      /**
       * I'm passing the button reference to this function
       * in this instance because it has not yet been added
       * to the DOM.
       */
      toggleButton("hide", button);
    }

    /**
     * We'll first attempt to add our button after the native
     * "Add Conferencing" button provided by Skiff. If we do
     * not locate that button, we'll add our button to the
     * bottom of the container itself.
     */
    const nativeAddButton = view.querySelector(CALL_JOIN_ADD_SELECTOR);

    if (nativeAddButton instanceof HTMLElement) {
      const parent = nativeAddButton.closest("hr ~ div");
      if (parent instanceof HTMLElement) {
        parent.after(button);
        return;
      }
    }

    debug("Could not find native add button");
    view.appendChild(button);
  }
}

export function isConfirmRemoveConferenceDialog(node: Node): boolean {
  if (node instanceof HTMLElement && node.classList.contains("scrim")) {
    const cancelButton = node.querySelector(CANCEL_BUTTON_SELECTOR);
    const removeButton = node.querySelector(CONFIRM_REMOVE_BUTTON_SELECTOR);
    return cancelButton && removeButton ? true : false;
  }
  return false;
}

export function prepareConfirmRemoveConferenceDialog(view: Node): void {
  if (view instanceof HTMLElement) {
    const removeButton = view.querySelector(CONFIRM_REMOVE_SELECTOR);
    if (removeButton instanceof HTMLElement && getBraveMeeting()) {
      removeButton.addEventListener("click", function handleClick(): void {
        debug("confirmRemoveConferenceDialog", "clicked remove button");
        removeButton.removeEventListener("click", handleClick);
        toggleButton("show");
      });
    }
  }
}

export function getBraveMeeting(): URL | null {
  const location = document.querySelector(CONFERENCING_INPUT_SELECTOR);

  debug("getBraveMeeting", location);

  if (location instanceof HTMLInputElement) {
    const result = findTalkUrlInString(location.value);
    debug("hasBraveMeeting", result);
    return result ? new URL(result) : null;
  }

  return null;
}

// TODO (Sampson): Move this to common.ts
export function setFieldValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  const focused = document.activeElement;

  simulateFocusEvents(element, "focus");

  /**
   * As is the case with FocusEvents above and below, we
   * are simulating several keyboard and input events to
   * ensure Skiff Calendar's internal state is updated.
   */
  element.value = value;
  for (const type of ["keydown", "keypress", "input", "keyup"]) {
    element.dispatchEvent(new Event(type, { bubbles: true }));
  }

  simulateFocusEvents(element, "blur");

  /**
   * Restore focus to original element, if needed.
   */
  if (focused instanceof HTMLElement) {
    simulateFocusEvents(focused, "focus");
  }
}

export function handleButtonClick(event: MouseEvent): void {
  event.preventDefault();

  const button = event.target;

  if (button instanceof HTMLButtonElement) {
    const roomUrl = getBraveMeeting();

    if (roomUrl instanceof URL) {
      debug("Joining Brave Talk meeting");
      joinRoom(roomUrl.href);
    } else {
      debug("Adding Brave Talk meeting");

      const location = document.querySelector(CONFERENCING_INPUT_SELECTOR);

      if (location instanceof HTMLInputElement) {
        const talkUrl = generateNewRoomUrl();

        createRoom(talkUrl);
        setFieldValue(location, talkUrl);

        /**
         * Skiff has a smart conferencing button, meaning it
         * will automatically update to say "Join Brave Meeting"
         * when the conference URL points to a talk.brave.com
         * endpoint. As such, we can simply remove our button.
         */
        toggleButton("hide", button);
      }
    }
  }
}

export function buttonExists(): boolean {
  const result = document.querySelector(
    `button#${BRAVE_TALK_BUTTON_ID}:visible`
  );
  debug("buttonExists", result);
  return result !== null;
}

export function toggleButton(
  visibility: "show" | "hide",
  button?: HTMLButtonElement
): void {
  const target = button || document.querySelector(`#${BRAVE_TALK_BUTTON_ID}`);
  debug("toggleButton", target);
  if (target instanceof HTMLButtonElement) {
    debug("toggleButton", visibility);
    target.hidden = visibility === "hide" ? true : false;
  }
}

export function createButton(): HTMLButtonElement {
  const button = createElement("button", {
    class: "brave-talk-button",
    id: BRAVE_TALK_BUTTON_ID,
  });

  const icon = createElement("img", {
    src: BRAVE_TALK_ICON_URL,
  });

  const label = document.createTextNode(
    chrome.i18n.getMessage("labelAddMeeting")
  );

  button.appendChild(icon);
  button.appendChild(label);

  button.addEventListener("click", handleButtonClick);

  debug("createButton", button);

  return button as HTMLButtonElement;
}
