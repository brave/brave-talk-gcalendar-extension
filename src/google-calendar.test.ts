import * as gcal from "./google-calendar";
import $ from "jquery";

const waitForMutationObserversToFire = (): Promise<void> => {
  return new Promise((resolve) => process.nextTick(resolve));
};

it("should correctly detect whether gcal has loaded", () => {
  document.body.outerHTML =
    "<html><body>This is not google calendar</body></html>";
  expect(gcal.isGoogleCalendar()).toBeFalsy();

  document.body.outerHTML = `<body data-viewfamily="EVENT">This looks like google calendar</body>`;
  expect(gcal.isGoogleCalendar()).toBeTruthy();
});

it("should report the view family", () => {
  document.body.outerHTML =
    "<html><body>This is not google calendar</body></html>";
  expect(gcal.getViewFamily()).toBeUndefined();

  document.body.outerHTML = `<body data-viewfamily="EVENT">This looks like google calendar</body>`;
  expect(gcal.getViewFamily()).toEqual("EVENT");

  document.body.outerHTML = `<body data-viewfamily="EVENT_EDIT">This looks like google calendar</body>`;
  expect(gcal.getViewFamily()).toEqual("EVENT_EDIT");
});

it("should add button to quick add dialog", async () => {
  document.body.outerHTML = `<body data-viewfamily="EVENT">This looks like google calendar</body>`;
  expect(document.getElementById("jitsi_button_quick_add")).toBeNull();

  gcal.watchForChanges();

  expect(document.getElementById("jitsi_button_quick_add")).toBeNull();

  // in real life, gcal ads a node with a dialog deep down inside
  $(document.body).append(
    `
    <div>
      <div role="dialog">
        <span>This is the quick add dialog</span>
        <div id="tabEvent">
          This tab shows event details
        </div>
      </div>

    </div>
    `
  );

  // give the mutation observer a chance to run
  await waitForMutationObserversToFire();

  // we now expect the button to have been added to the quick add dialog
  expect(document.getElementById("jitsi_button_quick_add")).not.toBeNull();
});

it("should add 'Add Brave Talk' button to full screen event edit if location is not currently brave talk", () => {});
