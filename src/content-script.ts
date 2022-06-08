import {
  checkForAutoCreateMeetingFlag,
  isGoogleCalendar,
  watchForChanges,
  watchForGmailCompanion,
} from "./google-calendar";

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
}
