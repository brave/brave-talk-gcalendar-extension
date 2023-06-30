import { debug, enableDebugging } from "./debug";

// TODO (Sampson): Move this to an extension option
enableDebugging(true);

import {
  isGoogleCalendar,
  watchForChanges as googleWatchForChanges,
  checkForAutoCreateMeetingFlag as googleCheckAutoCreate,
  watchForGmailCompanion,
} from "./google-calendar";

import { isProtonCalendar, listenForEventDialog } from "./proton-calendar";

import {
  isSkiff,
  watchForChanges as skiffWatchForChanges,
  handleAutoCreateMeetingFlag as skiffCheckAutoCreate,
} from "./skiff-calendar";

// TODO (Sampson): Move this to a dedicated component
watchForGmailCompanion();

const { version } = chrome.runtime.getManifest();
const message = `Brave Talk %platform% extension ${version} running`;

/**
 * TODO (Sampson): We may be able to simplify things quite
 * a bit by using the `matching` attribute of the manifest
 * to inject site-specific modules. This would spare us
 * the need to check hostnames, etc.
 */
if (isGoogleCalendar()) {
  debug(message.replace("%platform%", "Google Calendar"));
  googleCheckAutoCreate();
  googleWatchForChanges();
} else if (isProtonCalendar()) {
  debug(message.replace("%platform%", "Proton Calendar"));
  listenForEventDialog();
} else if (isSkiff()) {
  debug(message.replace("%platform%", "Skiff Calendar"));
  skiffCheckAutoCreate();
  skiffWatchForChanges();
}
