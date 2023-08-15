import {
  createRoom,
  generateNewRoomUrl,
  isBraveTalkUrl,
} from "../brave/brave-talk";

import {
  buildQuickAddButton,
  buildFullScreenAddButton,
} from "../brave/brave-talk-button";

import { isElementVisible } from "../common";

export const TALK_BUTTON_ID = "jitsi_button_quick_add";
export const TALK_BUTTON_SELECTOR = `#${TALK_BUTTON_ID}`;
export const BASE_URL = "https://calendar.google.com/";
export const EVENT_TAB_BUTTON_SELECTOR = "button#tabEvent";
export const TASK_TAB_BUTTON_SELECTOR = "button#tabTask";
export const EVENT_PANEL_SELECTOR =
  "[role='tabpanel'][aria-labelledby='tabEvent']";
export const DIALOG_SELECTOR = "[role='dialog']";
export const EVENT_DIALOG_SELECTOR = `${DIALOG_SELECTOR}:has(${EVENT_PANEL_SELECTOR})`;

// we want to automatically add the brave talk meeting to
// the event immediately when it opens in full screen mode, in two cases:
//  1. when the user has selected "Create Google Calendar meeting" from the extension
//     popup window (see popup.html)
//  2. when the user clicks "Add a brave talk meeting" from the "quick add" dialog
//  3. when user clicks on the gmail-calendar companion
// we are using local storage scheduleAutoCreateMeeting flag

// The "view family" is a flag set by gcal indicating what root view is currently displayed.
// The options we are interested in are:
//  - "EVENT" - this is the normal screen view of a calendar showing events. Within this screen
//     pop up dialogs are shown with the details of events.
//  - "EVENT_EDIT" - when you click the "edit" button on an event dialog in the EVENT screen, a
//     full screen edit mode is displayed. This switches the view family to "EVENT_EDIT".
export function getViewFamily(): string | undefined {
  return document?.body?.dataset?.viewfamily;
}

export function isGoogleCalendar(address?: string): boolean {
  if (address) {
    const url = new URL(address);
    return url.host === "calendar.google.com";
  }
  return !!getViewFamily();
}

/*
 * QUICK ADD SCREEN
 */

// The "quick add" screen is the inline event creation dialog,
// invoked usually by clicking the "create +" button. We add a button
// here, and get it to invoke the full-screen "edit" mode where the full functionaltiy is.
function addButtonToQuickAdd(quickAddDialog: Element) {
  // skip if our button is already added
  if (document.querySelector("#jitsi_button_quick_add")) {
    return;
  }
  const tabEvent = quickAddDialog.querySelector("[aria-labelledby=tabEvent]");
  if (tabEvent) {
    const tabPanel = document.createElement("content");
    tabPanel.setAttribute("role", "tabpanel");
    tabPanel.setAttribute("id", "jitsi_button_quick_add_content");

    buildQuickAddButton(tabPanel);

    // if we can insert just before "descrption", lets do so,
    // otherwise just append at the bottom of the tab
    const description = tabEvent.querySelector("[jsname=hGaP9]");

    if (description) {
      description.insertAdjacentElement("beforebegin", tabPanel);
    } else {
      tabEvent.parentElement?.appendChild(tabPanel);
    }

    const clickHandler = tabEvent.parentElement?.querySelector(
      "#jitsi_button_quick_add"
    );
    clickHandler?.addEventListener("click", () => {
      // setting the scheduleAutoCreateMeeting flag in local storage
      window?.chrome?.storage?.sync?.set({ scheduleAutoCreateMeeting: "true" });
      // this is clicking the "more options" button on the quick add dialog,
      // which causes the full screen event editor to appear
      findMoreOptionsButton()?.click();
    });
  }
}

function findMoreOptionsButton(): HTMLElement | undefined {
  const potentialSelectors = [
    // orignal version
    'div[role="button"][jsname="rhPddf"]',
    // updated as of 24 Aug 2022
    'button[jsname="rhPddf"]',
  ];

  for (const selector of potentialSelectors) {
    const button = document.querySelector<HTMLElement>(selector);
    if (button) {
      return button;
    }
  }

  console.warn("brave-talk-gcalendar-extension: More Options button not found");

  return undefined;
}

/*
 * FULL SCREEN EVENT EDIT
 */

function isFullScreenEventButtonPresent(): boolean {
  return document.getElementById("jitsi_button") !== null;
}

// the value currently entered into the "location" text box
function getLocationString(): string {
  return (
    document
      .querySelector<HTMLInputElement>(
        "#xLocIn input[jsname=YPqjbf][role=combobox]"
      )
      ?.value?.toString() ?? ""
  );
}

async function setLocationString(newValue: string): Promise<void> {
  const input = document.querySelector(
    "#xLocIn input[jsname=YPqjbf][role=combobox]"
  );
  if (input instanceof HTMLElement) {
    // inspired by
    //  https://stackoverflow.com/questions/64094461/edit-descrption-or-location-of-google-calendar-event-with-chrome-extension

    input.focus();

    // need to let the event loop run, so the gcal code responds to the focus
    await new Promise((resolve) => setTimeout(resolve, 100));

    document.execCommand("insertText", false, newValue);
    for (const type of ["keydown", "keypress", "keyup"])
      input.dispatchEvent(new KeyboardEvent(type));
  }
}

/* This creates the row with icon and a button - with no text on it and no click handler */
function getOrCreateButtonContainer(): HTMLElement | Element | null {
  // #xNtList is the notification list, we need to insert the button row before this.
  // If it's not there, the UI isn't ready to insert yet
  const neighbor = document.querySelector("#xNtList")?.parentElement;
  if (!neighbor) {
    return null;
  }

  // do we have an existing button in place?
  const existingButton = document.querySelector(
    "#jitsi_button_container content"
  );
  if (existingButton) {
    return existingButton;
  }

  const buttonRow = document.createElement("div");
  buttonRow.className = "FrSOzf";
  buildFullScreenAddButton(buttonRow);

  neighbor.parentElement?.insertBefore(buttonRow, neighbor);

  return buttonRow.querySelector("content");
}

async function onAddMeetingClick() {
  const newRoomUrl = generateNewRoomUrl();
  await setLocationString(newRoomUrl);
  updateToJoinMeetingButton(newRoomUrl);

  createRoom(newRoomUrl);
}

/**
 * Updates the initial button text and click handler when there is
 * no meeting scheduled.
 */
function updateToAddMeetingButton() {
  const anchor = document.querySelector("#jitsi_button a");
  if (anchor) {
    anchor.textContent = "Add a Brave Talk meeting";
    anchor.setAttribute("href", "#");
    anchor.addEventListener(
      "click",
      (e) => {
        e.preventDefault();
        onAddMeetingClick();
      },
      { once: true }
    );
  }
}

/**
 * Updates the url for the button.
 */
function updateToJoinMeetingButton(joinUrl: string) {
  const button = document.querySelector("#jitsi_button a");
  if (button) {
    button.textContent = "Join your Brave Talk meeting now";
    button.setAttribute("href", joinUrl);
    button.setAttribute("target", "_new");
  }
}

export function maintainButtonOnFullScreenEventEdit() {
  // we want to trigger all the logic only when we have enough elements
  // on the page, as the new interface is loading live and some elements
  // are missing when directly go the event edit page
  // we require the notifications element and location
  const xNtList = document.querySelector("#xNtList");
  const xLocIn = document.querySelector("#xLocIn");
  const xOnCal = document.querySelector("#xOnCal");
  if (
    xNtList && // notifications
    (xLocIn || // editable location
      xOnCal) &&
    !isFullScreenEventButtonPresent()
  ) {
    /// add button
    if (getOrCreateButtonContainer()) {
      const currentLocation = getLocationString();
      if (isBraveTalkUrl(currentLocation)) {
        updateToJoinMeetingButton(currentLocation);
      } else {
        updateToAddMeetingButton();
        // check for scheduleAutoCreateMeeting flag in local storage
        window?.chrome?.storage?.sync?.get(
          ["scheduleAutoCreateMeeting"],
          function (items) {
            if (items.scheduleAutoCreateMeeting == "true") {
              window?.chrome?.storage?.sync?.set({
                scheduleAutoCreateMeeting: "false",
              });
              setTimeout(() => onAddMeetingClick(), 1000);
            }
          }
        );
      }
    }
  }
}

async function handleAttributesChanged({ target }: MutationRecord) {
  // SCENARIO: Dialog for editing events was opened
  if (target instanceof HTMLElement && target.matches(EVENT_PANEL_SELECTOR)) {
    if (isElementVisible(target)) {
      const dialog = target.closest(DIALOG_SELECTOR);
      if (dialog) {
        addButtonToQuickAdd(dialog);
      }
    }
  }
}

async function handleNodesAdded(mutation: MutationRecord) {
  // SCENARIO: Dialog for editing events was added to the DOM
  if (mutation.addedNodes.length > 0) {
    for (const node of mutation.addedNodes) {
      if (node instanceof HTMLElement) {
        const dialog = node.querySelector(DIALOG_SELECTOR);
        if (dialog) {
          addButtonToQuickAdd(dialog);
          return;
        }
      }
    }
  }
}

async function handleNodesRemoved(mutation: MutationRecord) {
  /**
   * At times the Google Calendar UI may remove the Brave Talk
   * button when mounting the Event Editor component. We'll watch
   * for this, and re-add the button if the Event Editor dialog
   * is still present.
   */
  if (mutation.removedNodes.length > 0) {
    for (const node of mutation.removedNodes) {
      if (node instanceof HTMLElement) {
        if (node.querySelector(TALK_BUTTON_SELECTOR)) {
          const dialog = document.querySelector(EVENT_DIALOG_SELECTOR);
          if (dialog) {
            addButtonToQuickAdd(dialog);
            return;
          }
        }
      }
    }
  }
}

export function watchForChanges() {
  const onMutation: MutationCallback = (mutations) => {
    const viewFamily = getViewFamily();

    // in normal calendar mode, watch for the quick add popup
    if (viewFamily === "EVENT") {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          handleNodesAdded(mutation);
          handleNodesRemoved(mutation);
        } else if (mutation.type === "attributes") {
          handleAttributesChanged(mutation);
        }
      }
    }
    // in full screen event edit mode, ensure our feedback button is present
    else if (viewFamily === "EVENT_EDIT") {
      maintainButtonOnFullScreenEventEdit();
    }
  };

  const watcher = new MutationObserver(onMutation);

  watcher.observe(document.body, {
    attributes: true,
    attributeFilter: ["style"],
    childList: true,
    characterData: false,
    subtree: true,
  });
}

export function checkForAutoCreateMeetingFlag(): boolean {
  const params = new URLSearchParams(window.location.search);
  const autoCreateMeeting = params.get("autoCreateMeeting");
  const extid = params.get("extid");
  if (autoCreateMeeting && extid === chrome.runtime.id) {
    /* Actually this didn't work reliably, we think because there's no user interaction
     * on the gcal side, so it doesn't accept the programmatic editing on the event.
     * So, for now, users get the event but then have to click the brave talk button
     * for themselves.
     */
    // scheduleAutoCreateMeeting = true;
    return true;
  }

  return false;
}

function addButtonToGmailCal(quickAddDialog: HTMLElement) {
  // skip if our button is already added
  if (document.querySelector("#jitsi_button_quick_add")) {
    return;
  }
  const tabEvent = quickAddDialog.querySelector(".IFQP9d.n1rxgc.SFQtGf");
  if (tabEvent) {
    const tabPanel = document.createElement("content");
    tabPanel.setAttribute("role", "tabpanel");
    tabPanel.setAttribute("id", "jitsi_button_quick_add_content");

    buildQuickAddButton(tabPanel);

    tabEvent.appendChild(tabPanel);
    const clickHandler = tabEvent.parentElement?.querySelector(
      "#jitsi_button_quick_add"
    );

    // clickHandler?.addEventListener("click", onAddMeetingClick);
    clickHandler?.addEventListener("click", () => {
      // this is setting the scheduleAutoCreateMeeting in local storage
      window?.chrome?.storage?.sync?.set({ scheduleAutoCreateMeeting: "true" });
      // this is clicking the "Edit in calendar" button on the top-right corner,
      // which causes the full screen event editor to appear
      document.querySelector<HTMLElement>('button[jsname="ZkN63"]')?.click();
    });
  }
}

export function watchForGmailCompanion() {
  const onMutation: MutationCallback = (mutations) => {
    // in gamil calendar mode, watch for the quick add popup
    mutations.forEach((mutation) => {
      let dlg;
      mutation.addedNodes.forEach((node) => {
        const el =
          node instanceof HTMLElement && node.querySelector("[role='dialog']");
        if (el) {
          dlg = el;
          return;
        }
      });
      if (dlg) {
        addButtonToGmailCal(dlg);
      }
    });
  };

  const watcher = new MutationObserver(onMutation);

  watcher.observe(document.body, {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  });
}
