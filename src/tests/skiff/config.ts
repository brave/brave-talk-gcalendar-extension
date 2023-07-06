export const auth = {
  AUTH_URL: process.env.SKIFF_AUTH_URL,
  USERNAME: process.env.SKIFF_USERNAME,
  PASSWORD: process.env.SKIFF_PASSWORD,
  STAY_SIGNED_IN: process.env.SKIFF_STAY_SIGNED_IN === "true",
  selectors: {
    USERNAME_INPUT: "input[data-test='login-email-input']",
    PASSWORD_INPUT: "input[data-test='login-password-input']",
    LOGIN_BUTTON: "[role='button'][data-test='login-submit']",
  },
};

export const selectors = {
  EVENT_ELLIPSIS_BUTTON: "[role='button']:has(path[d^='M6 12a2'])",
  CONFERENCING_REMOVE_BUTTON:
    "[role='button'][data-test='conferencing-remove-button']",
  n_DROPDOWN_EVENT_OPTIONS: ".event-options-dropdown [data-state='closed']",
  n_EVENT_CARDS: "div.event-card",
  n_ROLE_BUTTONS: "[role='button']",
};
