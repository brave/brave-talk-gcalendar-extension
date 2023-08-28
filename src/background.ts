/**
 * Using chrome.tabs, check to see if the extensions calendars.html page is opened.
 * If it is opened, we'll refresh it. Otherwise, we'll open it in a new tab.
 */
async function openCalendarPage() {
  console.log(await chrome.tabs.query({}));
  chrome.tabs.query(
    { url: "chrome-extension://*/calendars.html" },
    function (tabs) {
      if (tabs.length > 0) {
        chrome.tabs.reload((tabs as any[])[0].id);
      } else {
        chrome.tabs.create({ url: "calendars.html" });
      }
    }
  );
}

openCalendarPage();

export const ContentScripts = [
  {
    id: "google-calendar",
    label: "Google",
    image: chrome.runtime.getURL("images/google-calendar.png"),
    matches: ["https://calendar.google.com/*"],
    js: ["content_script.js"],
    css: ["all.css", "skiff.css"],
    persistAcrossSessions: true,
  },
  {
    id: "proton-calendar",
    label: "Proton",
    image: chrome.runtime.getURL("images/proton-calendar.png"),
    matches: ["https://calendar.proton.me/*"],
    js: ["content_script.js"],
    persistAcrossSessions: true,
  },
  {
    id: "skiff-calendar",
    label: "Skiff",
    image: chrome.runtime.getURL("images/skiff-calendar.png"),
    matches: ["https://app.skiff.com/*"],
    js: ["content_script.js"],
    css: ["all.css", "skiff.css"],
    persistAcrossSessions: true,
  },
];

/**
 * Our collection of content scripts contains properties which
 * are not supported by the `chrome.scripting` API. To prevent
 * exceptions from being thrown, anytime we are registering a
 * content script, we need to remove any unsupported properties.
 * This function will do just that.
 */
function removeNonContentScriptProps(scripts: typeof ContentScripts) {
  return scripts.map((script) => {
    const { id, matches, js, css, persistAcrossSessions } = script;
    return { id, matches, js, css, persistAcrossSessions };
  });
}

/**
 * It appears as though registered content scripts (even
 * those with `persistAcrossSessions: true`) are not being
 * persisted across sessions.
 *
 * After an extension reload (which happens frequently
 * during development) a call to the API method
 * `chrome.scripting.getRegisteredContentScripts()` will
 * ultimately yield an empty array. Attempting to
 * unregister a content script for which host permissions
 * have been granted will throw something similar to the
 * following:
 *
 *    Uncaught (in promise) Error: Nonexistent script ID
 *    'skiff-calendar'
 *
 * It's important to note that this only happens after
 * reloading the extension during development.
 *
 * Because of this oddity, the following function will
 * check to see which hosts are accessible, and make sure
 * that their associated content scripts are registered.
 */
chrome.runtime.onStartup.addListener(registerScriptsForAccessibleHosts);
chrome.runtime.onInstalled.addListener(registerScriptsForAccessibleHosts);

async function registerScriptsForAccessibleHosts() {
  const permissions = await chrome.permissions.getAll();

  // Make sure we have the `scripting` permission
  if (!permissions.permissions?.includes("scripting")) {
    console.error("Missing scripting permission");
    return;
  }

  const registered = await chrome.scripting.getRegisteredContentScripts();

  if (permissions.origins) {
    for (const origin of permissions.origins) {
      // Identify content scripts for this origin
      const scripts = ContentScripts.filter((script) =>
        script.matches.some((hostPattern) => hostPattern === origin)
      );

      // Check if any are not currently registered
      const isRegistered = registered.some((script) =>
        script.matches?.some((hostPattern) => hostPattern === origin)
      );

      // Proceed to register any unregistered scripts
      if (scripts.length > 0 && !isRegistered) {
        await chrome.scripting.registerContentScripts(
          removeNonContentScriptProps(scripts)
        );
        console.log(`Registered scripts for origin: ${origin}`, scripts);
      }
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  /**
   * Note: If `sendResponse` is called asynchronously,
   * we will need to `return true` from this callback
   * to indicate that we wish to send a response later.
   */
  if (message.type === "getScripts") {
    console.log("getScripts", ContentScripts);
    sendResponse(ContentScripts);
  }
});

/**
 * Users may modify permissions during installation, upgrade,
 * the context menu, and/or the browser action button.
 * Permissions can also be toggled-on/off from within the
 * extension settings via brave://extensions/. The following
 * should serve as a sufficient catch-all, enabling us to
 * register and unregister content scripts as needed.
 */

chrome.permissions.onAdded.addListener(async (permissions) => {
  if (permissions.origins) {
    const scripts = getScriptsForOrigins(permissions.origins);

    if (scripts.length > 0) {
      const origins = permissions.origins.join(", ");
      await chrome.scripting.registerContentScripts(
        removeNonContentScriptProps(scripts)
      );
      console.log(`Added scripts for origins: ${origins}`, scripts);
    }
  }
});

chrome.permissions.onRemoved.addListener(async (permissions) => {
  if (permissions.origins) {
    const scripts = getScriptsForOrigins(permissions.origins);

    if (scripts.length > 0) {
      const ids = scripts.map(({ id }) => id);
      const origins = permissions.origins.join(", ");
      const filter: chrome.scripting.ContentScriptFilter = {
        ids: ids,
      };

      await chrome.scripting.unregisterContentScripts(filter);
      console.log(`Removed scripts for origins: ${origins}`, scripts);
    }
  }
});

/**
 * When a host permission is granted or removed, we need to
 * refresh any tabs that are currently opened to that host.
 * This will ensure that the content scripts are
 * loaded/unloaded as needed.
 */
async function requestHostTabRefresh(origins: string[]) {
  /**
   * TODO (Sampson): When selecting a calendar from the
   * calendar-selection page, we should list associated tabs
   * which may need to be refreshed for the changes to take
   * immediate effect.
   */
  throw new Error("Not implemented");
}

/**
 * A general method for retrieving content scripts based on
 * a list of calendar origins. This is used by both the
 * onAdded and onRemoved listeners.
 */
function getScriptsForOrigins(origins: string[]) {
  const scripts = ContentScripts.filter((script) =>
    script.matches.some((hostPattern) => origins.includes(hostPattern))
  );

  return scripts;
}

/**
 * Fired when the extension is first installed, when the
 * extension is updated to a new version, and when Brave is
 * updated to a new version.
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("onInstalled", details);

  switch (details.reason) {
    case chrome.runtime.OnInstalledReason.INSTALL:
      /**
       * When the extension is first installed, we need
       * to open the calendar-selection page. If the page
       * is already opened, we'll refresh it.
       */
      console.log("Extension installed");
      openCalendarPage();
      break;
    case chrome.runtime.OnInstalledReason.UPDATE:
      /**
       * When the extension is updated, we need to check
       * if new calendar support was introduced. Only if
       * new calendars were added do we need to open the
       * calendar-selection page.
       */
      console.log("Extension updated");
      break;
    case chrome.runtime.OnInstalledReason.CHROME_UPDATE:
      /**
       * We are not immediately interested in this event
       * but will keep it here for future reference.
       */
      console.log("Browser updated");
      break;
    default:
      console.log("Unknown reason");
  }
});

/**
 * Fired when an update is available, but isn't installed
 * immediately because Brave is currently running. We don't
 * use this at the moment, but may decide to show an in-app
 * indicator in the future.
 */
chrome.runtime.onUpdateAvailable.addListener((details) => {
  console.log(`Version ${details.version} is available!`);
});
