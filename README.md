# Brave Talk for Calendars

This is the code for the [_Brave Talk for Calendars_](http://chrome.google.com/webstore/detail/nimfmkdcckklbkhjjkmbjfcpaiifgamg) browser extension,
originally based on https://github.com/jitsi/jidesha.

Learn more about Brave Talk at https://brave.com/talk/.

# For Developers

### Building the Extension

```bash
npm install
npm run build
```

After building, the extension files are located in the `/dist` directory.

## Manual Testing

1. Navigate to brave://extensions.
2. Enable Developer Mode.
3. Click on _Load unpacked_ and choose the `/dist` directory.
4. Visit a supported calendar like [Google Calendar](https://calendar.google.com/) or [Proton Calendar](https://calendar.proton.me/).
5. When creating a new event, look for the option to add a Brave Talk meeting.

### Manual Testing Checklist

- Validate the calendar recognition.
- Ensure the Brave Talk button's position and status are correct.
- Check if the scheduled Brave Talk meeting's URL is present in the event details.
- Confirm the URL's persistence in event details post-refresh.
- Evaluate the Brave Talk button's functions:
  - It should schedule a meeting when none exists.
  - If a meeting exists, it should provide access to the meeting URL.
- Monitor the Brave Talk button's status changes:
  - It should show "Join the meeting" upon adding a meeting.
  - It should revert to "create a meeting" once a meeting is removed.

## Automated Testing

Tests run on [Node's built-in test runner](https://nodejs.org/api/test.html) and are split into two suites:

- **Unit tests** (`src/tests/brave/`) run in plain Node, need no browser or credentials, and are safe to run anytime:

  ```bash
  npm test
  ```

- **End-to-end tests** (`src/tests/google/`, `src/tests/proton/`) drive a real Brave browser with the built extension loaded, against live calendars. Create a `.env` file at the project's root first, populating it with the credentials of the calendar you're testing:

  ```bash
  # Google Details
  GOOGLE_AUTH_URL="https://accounts.google.com"
  GOOGLE_USERNAME="…"
  GOOGLE_PASSWORD="…"
  GOOGLE_RECOVERY_PHONE_NUMBER="…"
  GOOGLE_STAY_SIGNED_IN="false"

  # Proton Details
  PROTON_AUTH_URL="https://calendar.proton.me"
  PROTON_USERNAME="…"
  PROTON_PASSWORD="…"
  PROTON_STAY_SIGNED_IN="false"
  ```

  > Note: You may use the `.env.example` template provided. Rename it to `.env` and modify as needed.

  Then build the extension and run the suite:

  ```bash
  npm install
  npm run build
  npm run test:e2e # Both calendars
  # Or specify a calendar:
  npm run test:e2e:proton
  npm run test:e2e:google
  ```
