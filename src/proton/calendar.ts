import * as BraveTalk from "../brave/brave-talk";
import { createElement } from "../common";

const SELECTORS = {
  modals: `
    body > .eventpopover:has(> form),
    body > .modal-two:has([data-testid='create-event-modal:save'])
  `,
  eventLocationInput: "#event-location-input",
  eventDescriptionBox: "div:has(> label[for='event-description-input'])",
};

export const TALK_BUTTON_ID = "jitsi_button_quick_add";
export const TALK_ICON_URL = chrome.runtime.getURL("brave_talk_icon.svg");

enum ButtonStates {
  CREATE,
  JOIN,
}

export function handleButtonClick(event: Event): void {
  event.preventDefault();

  const button = event.target as HTMLButtonElement;
  const dialog = button.closest(SELECTORS.modals) as HTMLElement;

  if (dialog) {
    const location = getLocationInput(dialog)?.value ?? "";
    const roomUrl = BraveTalk.findTalkUrlInString(location);

    if (roomUrl) {
      BraveTalk.joinRoom(roomUrl);
    } else {
      const roomUrl = BraveTalk.generateNewRoomUrl();
      BraveTalk.createRoom(roomUrl);
      setLocation(dialog, roomUrl);
      updateBoxState(dialog, ButtonStates.JOIN);
    }
  }
}

export function isProtonCalendar(address?: string): boolean {
  const url = new URL(address ?? location.href);
  const isProton = url.host === "calendar.proton.me";
  console.log("proton:isProtonCalendar", url.host, isProton);
  return isProton;
}

export function buildBoxAndButton(): [HTMLDivElement, HTMLButtonElement] {
  const containerAttrs = {
    class: "flex flex-nowrap flex-align-items-start mb-4 form--icon-labels",
  };

  const labelAttrs = {
    for: TALK_BUTTON_ID,
    class: "label pb-2",
  };

  const iconAttrs = {
    class: "icon-16p",
    src: TALK_ICON_URL,
    alt: chrome.i18n.getMessage("iconAltText"),
  };

  const buttonLabel = chrome.i18n.getMessage("labelAddMeeting");
  const button = createElement("button", buttonLabel, {
    id: TALK_BUTTON_ID,
    "aria-busy": "false",
    class: "button button-solid-norm",
  }) as HTMLButtonElement;

  // prettier-ignore
  const container = createElement("div", containerAttrs, [
    ["label", labelAttrs, [
      ["img", iconAttrs],
      ["span", buttonLabel, { class: "sr-only" }],
    ]],
    ["div", { class: "flex-item-fluid" }, [
      button
    ]],
  ]) as HTMLDivElement;

  return [container, button];
}

export function updateBoxState(
  buttonBox: HTMLElement,
  state: ButtonStates
): void {
  const button = buttonBox.querySelector(`#${TALK_BUTTON_ID}`);
  const spanLabel = buttonBox.querySelector("span");

  if (!button || !spanLabel) {
    throw new Error("Unable to find button or span label");
  }

  const addMeeting = chrome.i18n.getMessage("labelAddMeeting");
  const joinMeeting = chrome.i18n.getMessage("labelJoinMeeting");

  switch (state) {
    case ButtonStates.CREATE:
      button.textContent = addMeeting;
      spanLabel.textContent = addMeeting;
      break;
    case ButtonStates.JOIN:
      button.textContent = joinMeeting;
      spanLabel.textContent = joinMeeting;
      break;
    default:
      throw new Error(`Unknown state: ${state}`);
  }
}

export function hasButton(element: HTMLElement): boolean {
  return element.querySelector(`#${TALK_BUTTON_ID}`) !== null;
}

export function getLocationInput(container: HTMLElement): HTMLInputElement {
  return container.querySelector(SELECTORS.eventLocationInput)!;
}

export function setLocation(container: HTMLElement, value: string): void {
  const input = getLocationInput(container);
  if (input) {
    input.value = value;
    /**
     * We're simulating standard keyboard events here to
     * ensure Proton Calendar's state gets updated. If we
     * don't do this, the new value will not persist.
     */
    for (const type of ["keydown", "keypress", "input", "keyup"]) {
      input.dispatchEvent(new Event(type, { bubbles: true }));
    }
  }
}

export function init(dialog: HTMLElement): void {
  if (hasButton(dialog)) {
    return;
  }

  const txtLoc = getLocationInput(dialog)?.value ?? "";
  const meeting = BraveTalk.findTalkUrlInString(txtLoc);
  const elDesc = dialog.querySelector(SELECTORS.eventDescriptionBox);
  const state = meeting ? ButtonStates.JOIN : ButtonStates.CREATE;
  const [buttonBox, button] = buildBoxAndButton();

  updateBoxState(buttonBox, state);
  button.addEventListener("click", handleButtonClick);

  if (elDesc instanceof HTMLElement) {
    elDesc.insertAdjacentElement("beforebegin", buttonBox);
    return;
  }

  throw new Error("Unable to find event description field.");
}

export function listenForEventDialog(): void {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node instanceof HTMLElement && node.matches(SELECTORS.modals)) {
          init(node);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true });
}
