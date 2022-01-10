/* 
This file contains all the logic that interacts with the html of the google calendar site
 */

import $ from "jquery";

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
              Add a Brave Talk Meeting
            </span>
          </content>
        </div>
      </div>
    </content>
    `
    );
    const clickHandler = tabEvent.find("#jitsi_button_quick_add");
    clickHandler.on("click", (e) => {
      //TODO => c!.scheduleAutoCreateMeeting = true;
      //
      // this is clicking the "more options" button on the quick add dialog,
      // which causes the full screen event editor to appear
      $('div[role="button"][jsname="rhPddf"]').trigger("click");
    });
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
    // in full screen event edit mode, ensure our feedback buttons are present
    else if (viewFamily === "EVENT_EDIT") {
      console.log(" -> EVENT_EDIT running update!");
      //c!.update();
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
