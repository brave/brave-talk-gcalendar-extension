/* 
This file contains all the logic that interacts with the html of the google calendar site
 */

import $ from "jquery";
import { createRoom, generateNewRoomUrl, isBraveTalkUrl } from "./brave-talk";

// we want to automatically add the brave talk meeting to
// the event immediately when it opens in full screen mode, in two cases:
//  1. when the user has selected "Create Google Calendar meeting" from the extension
//     popup window (see popup.html)
//  2. when the user clicks "Add a brave talk meeting" from the "quick add" dialog
let scheduleAutoCreateMeeting = false;

// The "view family" is a flag set by gcal indicating what root view is currently displayed.
// The options we are interested in are:
//  - "EVENT" - this is the normal screen view of a calendar showing events. Within this screen
//     pop up dialogs are shown with the details of events.
//  - "EVENT_EDIT" - when you click the "edit" button on an event dialog in the EVENT screen, a
//     full screen edit mode is displayed. This switches the view family to "EVENT_EDIT".
export function getViewFamily(): string | undefined {
  return document?.body?.dataset?.viewfamily;
}

export function isGoogleCalendar(): boolean {
  return !!getViewFamily();
}

/*
 * QUICK ADD SCREEN
 */

// The "quick add" screen is the inline event creation dialog,
// invoked usually by clicking the "create +" button. We add a button
// here, and get it to invoke the full-screen "edit" mode where the full functionaltiy is.
function addButtonToQuickAdd(quickAddDialog: JQuery<HTMLElement>) {
  // skip if our button is already added
  if ($("#jitsi_button_quick_add").length) {
    return;
  }
  const tabEvent = quickAddDialog.find("#tabEvent");
  if (tabEvent.length) {
    tabEvent.parent().append(
      `
    <content class="" role="tabpanel" id="jitsi_button_quick_add_content">
      <div class="fy8IH poWrGb">
        <div class="FkXdCf HyA7Fb">
          <div class="DPvwYc QusFJf jitsi_quick_add_icon"/>
        </div>
      </div>
      <div class="mH89We">
        <div role="button"
             class="uArJ5e UQuaGc Y5sE8d"
             id="jitsi_button_quick_add">
          <content class="CwaK9">
            <span class="RveJvd jitsi_quick_add_text_size">
              Add a Brave Talk meeting
            </span>
          </content>
        </div>
      </div>
    </content>
    `
    );
    const clickHandler = tabEvent.parent().find("#jitsi_button_quick_add");
    clickHandler.on("click", () => {
      // this is clicking the "more options" button on the quick add dialog,
      // which causes the full screen event editor to appear
      scheduleAutoCreateMeeting = true;
      $('div[role="button"][jsname="rhPddf"]').trigger("click");
    });
  }
}

/*
 * FULL SCREEN EVENT EDIT
 */

function isFullScreenEventButtonPresent(): boolean {
  return document.getElementById("jitsi_button") !== null;
}

// the value currently entered into the "location" text box
function getLocationString(): string {
  return (
    $("#xLocIn input[jsname=YPqjbf][role=combobox]").val()?.toString() ?? ""
  );
}

async function setLocationString(newValue: string): Promise<void> {
  const input = document.querySelector(
    "#xLocIn input[jsname=YPqjbf][role=combobox]"
  );

  if (input instanceof HTMLElement) {
    // inspired by
    //  https://stackoverflow.com/questions/64094461/edit-descrption-or-location-of-google-calendar-event-with-chrome-extension

    input.focus();

    await new Promise((resolve) => setTimeout(resolve, 200));

    document.execCommand("insertHTML", false, newValue);
    for (const type of ["keydown", "keypress", "keyup"])
      input.dispatchEvent(new KeyboardEvent(type));
  }
}

/* This creates the row with icon and a button - with no text on it and no click handler */
function getOrCreateButtonContainer(): JQuery<HTMLElement> | null {
  // #xNtList is the notification list, we need to insert the button row before this.
  // If it's not there, the UI isn't ready to insert yet
  const neighbor = $("#xNtList").parent();
  if (!neighbor.length) {
    return null;
  }

  // do we have an existing button in place?
  const existingButton = $("#jitsi_button_container content");
  if (existingButton.length) {
    return existingButton;
  }

  const buttonRow = $(
    `
    <div class="FrSOzf">
      <div class="tzcF6">
        <div class="DPvwYc jitsi_edit_page_icon"></div>
      </div>
      <div class="j3nyw">
        <div class="BY5aAd">
          <div role="button"
               class="uArJ5e UQuaGc Y5sE8d"
               id="jitsi_button_container">
            <content class="CwaK9">
              <div id="jitsi_button" 
                  class="goog-inline-block jfk-button jfk-button-action jfk-button-clear-outline">
                <a href="#" style="color: white"></a>
              </div>
            </content>
          </div>
        </div>
      </div>
    </div>
    `
  );
  buttonRow.insertBefore(neighbor);

  return buttonRow.find("content");
}

async function onAddMeetingClick() {
  const newRoomUrl = generateNewRoomUrl();
  await setLocationString(newRoomUrl);
  createRoom(newRoomUrl);
  updateToJoinMeetingButton(newRoomUrl);
}
/**
 * Updates the initial button text and click handler when there is
 * no meeting scheduled.
 */
function updateToAddMeetingButton() {
  $("#jitsi_button a")
    .text("Add a Brave Talk meeting")
    .attr("href", "#")
    .on("click", (e) => {
      e.preventDefault();
      onAddMeetingClick();
    });
}

/**
 * Updates the url for the button.
 */
function updateToJoinMeetingButton(joinUrl: string) {
  $("#jitsi_button a")
    .text("Join your Brave Talk meeting now")
    .off("click")
    .attr("href", joinUrl)
    .attr("target", "_new");
}

export function maintainButtonOnFullScreenEventEdit() {
  // we want to trigger all the logic only when we have enough elements
  // on the page, as the new interface is loading live and some elements
  // are missing when directly go the event edit page
  // we require the notifications element and location
  if (
    $("#xNtList").length != 0 && // notifications
    ($("#xLocIn").length != 0 || // editable location
      $("#xOnCal").length != 0) &&
    !isFullScreenEventButtonPresent()
  ) {
    /// add button
    if (getOrCreateButtonContainer()) {
      const currentLocation = getLocationString();
      if (isBraveTalkUrl(currentLocation)) {
        updateToJoinMeetingButton(currentLocation);
      } else {
        updateToAddMeetingButton();

        if (scheduleAutoCreateMeeting) {
          scheduleAutoCreateMeeting = false;
          setTimeout(() => onAddMeetingClick(), 1000);
        }
      }
    }
  }
}

export function watchForChanges() {
  const onMutation: MutationCallback = (mutations) => {
    const viewFamily = getViewFamily();

    // in normal calendar mode, watch for the quick add popup
    if (viewFamily === "EVENT") {
      mutations.forEach((mutation) => {
        const dlg = $(mutation.addedNodes).find('[role="dialog"]');
        if (dlg.length) {
          addButtonToQuickAdd(dlg);
        }
      });
    }
    // in full screen event edit mode, ensure our feedback button is present
    else if (viewFamily === "EVENT_EDIT") {
      maintainButtonOnFullScreenEventEdit();
    }
  };

  const watcher = new MutationObserver(onMutation);

  watcher.observe(document.body, {
    attributes: false,
    childList: true,
    characterData: false,
    subtree: true,
  });
}

export function checkForAutoCreateMeetingFlag(): boolean {
  const params = new URLSearchParams(window.location.search);
  const autoCreateMeeting = params.get("autoCreateMeeting");
  const extid = params.get("extid");
  if (autoCreateMeeting && extid === chrome.runtime.id) {
    scheduleAutoCreateMeeting = true;
    return true;
  }

  return false;
}
