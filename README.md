# Brave Talk for Google Calendar

This is the code for the Brave Talk for Google Calendar chrome extension,
originally based on https://github.com/jitsi/jidesha.

[Find out more about Brave Talk.](https://brave.com/talk/)

# For Users

Install this extension from [the chrome extension webstore](https://chrome.google.com/webstore/detail/brave-talk-for-google-cal/nimfmkdcckklbkhjjkmbjfcpaiifgamg).

# For Developers Only

Build this extension:

    npm install
    npm run build

Extension files will be found in the `/dist` directory.

## Manual Testing

Go to `brave://extensions`, enable _Developer Mode_, click on _Load unpacked_, navigate to the `/dist` directory (created by running `npm run build`) and click _Select_.

Now go to a supported calendar (e.g. [Google Calendar](https://calendar.google.com/), [Proton Calendar](https://calendar.proton.me/), [Skiff Calendar](https://app.skiff.com/calendar/)) and begin the process of creating a new event. During the event-creation process, you should see an option to add a Brave Talk meeting.

## Automated Testing

Testing is done against live calendars. For this reason a `.env` file needs to be created in the root of the project directory, and given credentials for the calendar you wish to test. For example, if you would like to test Proton Calendar, your `.env` will need to look something like the following:

```
GOOGLE_AUTH_URL="https://accounts.google.com"
GOOGLE_USERNAME="…"
GOOGLE_PASSWORD="…"
GOOGLE_RECOVERY_PHONE_NUMBER="…"
GOOGLE_STAY_SIGNED_IN="false"

PROTON_AUTH_URL="https://calendar.proton.me"
PROTON_USERNAME="…"
PROTON_PASSWORD="…"
PROTON_STAY_SIGNED_IN="false"

SKIFF_AUTH_URL="https://app.skiff.com/calendar/"
SKIFF_USERNAME="…"
SKIFF_PASSWORD="…"
SKIFF_STAY_SIGNED_IN="false"
```

> Note: _A template is provided via `.env.example`. Rename this to `.env` and make any necessary changes._

Tests are Puppeteer driven. After running `npm install` and `npm run build` (and creating your `.env` file), you can run `npm run test` to run tests for all calendars. You may also run tests for a single calendar by passing its name along (e.g. `npm run test skiff`, `npm run test proton`).
