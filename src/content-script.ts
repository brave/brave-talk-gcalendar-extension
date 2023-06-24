import {
  checkForAutoCreateMeetingFlag,
  isGoogleCalendar,
  watchForChanges,
  watchForGmailCompanion,
} from "./google-calendar";

import { isProtonCalendar, listenForEventDialog } from "./proton-calendar";

checkForAutoCreateMeetingFlag();
watchForGmailCompanion();

if (isGoogleCalendar()) {
  console.log(
    `Brave Talk Google Calendar extension ${
      chrome.runtime.getManifest().version
    } running`
  );
  checkForAutoCreateMeetingFlag();
  watchForChanges();
} else if (isProtonCalendar()) {
  console.log(
    `Brave Talk Proton Calendar extension ${
      chrome.runtime.getManifest().version
    } running`
  );
  listenForEventDialog();
}
