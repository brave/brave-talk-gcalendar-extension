import { isGoogleCalendar, watchForChanges } from "./google-calendar";
import $ from "jquery";

console.log("hello from jq", $().jquery);
if (isGoogleCalendar()) {
  console.log("looks like gcal 2! v3");
  watchForChanges();
}
