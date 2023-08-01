import { TALK_BUTTON_ID } from "../../proton/calendar";

export const auth = {
  AUTH_URL: process.env.PROTON_AUTH_URL,
  USERNAME: process.env.PROTON_USERNAME,
  PASSWORD: process.env.PROTON_PASSWORD,
  STAY_SIGNED_IN: process.env.PROTON_STAY_SIGNED_IN === "true",
  selectors: {
    USERNAME_INPUT: 'input[id="username"]',
    PASSWORD_INPUT: 'input[id="password"]',
    STAY_SIGNED_IN: "input[id='staySignedIn'][type='checkbox']",
    SUBMIT_BUTTON: 'button[type="submit"]',
  },
};

export const selectors = {
  TALK_BUTTON: `#${TALK_BUTTON_ID}`,
  EVENT_BUTTON_SELECTOR_BY_TITLE: (title: string) =>
    `div[role='button'][title='${title}']`,
  NEW_EVENT_BUTTON: "[data-testid='calendar-view:new-event-button']",
  EVENT_TITLE_INPUT: "input[id='event-title-input']",
  EVENT_MODAL_CLOSE_BUTTON: "button[data-testid='modal:close']",
  DELETE_EVENT_CONFIRM_BUTTON:
    "div.prompt-footer button[type='submit'].button-solid-danger",
  EVENT_POPOVER_EDIT_BUTTON: "[data-testid='event-popover:edit']",
  EVENT_POPOVER_DELETE_BUTTON: "[data-testid='event-popover:delete']",
  EVENT_LOCATION_INPUT: "input[id='event-location-input']",
  EVENT_POPUP_SAVE_BUTTON: "[data-testid='create-event-popover:save']",
  EVENT_MODAL_SAVE_BUTTON: "[data-testid='create-event-modal:save']",
};
