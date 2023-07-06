export const auth = {
  AUTH_URL: process.env.GOOGLE_AUTH_URL,
  USERNAME: process.env.GOOGLE_USERNAME,
  PASSWORD: process.env.GOOGLE_PASSWORD,
  STAY_SIGNED_IN: process.env.GOOGLE_STAY_SIGNED_IN === "true",
  selectors: {
    USERNAME_INPUT: "#identifierId",
    NEXT_BUTTON: "#identifierNext",
    PASSWORD_INPUT: '#password input[type="password"]',
    PASSWORD_NEXT_BUTTON: "#passwordNext",
    ACCOUNT_LIST_ENTRY: `div[data-email="${process.env.GOOGLE_USERNAME}"]`,
  },
};

export const selectors = {
  CREATE_BUTTON: "[role='button'][aria-label='Create']",
  CREATE_EVENT_ITEM: "[role='menuitem'][aria-label='Event']",
  CREATE_EVENT_SAVE_BUTTON: "button[aria-label='Save']",
  EVENT_TITLE_INPUT: "[type='text'][aria-label='Title']",
  EVENT_LOCATION_INPUT: "[type='text'][aria-label='Location']",
  EVENT_DELETE_BUTTON: "button[aria-label='Delete event']",
  EVENT_PREVIEW_LOCATION: "#xDetDlgLoc",
  EVENT_CHIP: "[role='button'][data-eventchip]",
};
