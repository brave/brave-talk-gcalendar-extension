import {
  checkForAutoCreateMeetingFlag,
  isGoogleCalendar,
  watchForChanges,
} from "./google-calendar";

if (isGoogleCalendar()) {
  console.log("looks like gcal 2! v5");
  checkForAutoCreateMeetingFlag();
  watchForChanges();
}
