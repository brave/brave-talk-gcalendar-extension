require("dotenv").config();
import { Browser, ElementHandle, Page } from "puppeteer-core";
import * as Skiff from "../../skiff/calendar";
import {
  setupAuthenticatedBrowserSession,
  tearDownBrowserInstance,
} from "../test.common";
import { authenticateUser } from "./authenticate";
import { deleteEventByTitle } from "./deleteEventByTitle";
import { auth, selectors } from "./config";
import { TALK_BASE_URL } from "../../brave/brave-talk";
import { sleep } from "../../common";

const state = {
  page: null as unknown as Page,
  browser: null as unknown as Browser,
  braveMeetingUrl: null as unknown as string,
  createdEventTitle: null as unknown as string,
};

async function openNewEventMenu() {
  const button = await state.page.waitForSelector(
    Skiff.NEW_EVENT_BUTTON_SELECTOR,
    {
      visible: true,
      timeout: 5_000,
    }
  );

  await button?.click();
  await sleep(1_000);
}

async function getBraveTalkButton(): Promise<ElementHandle<Element> | null> {
  await sleep(1_000);
  return state.page
    .waitForSelector(Skiff.BRAVE_TALK_BUTTON_SELECTOR, {
      visible: true,
      timeout: 5_000,
    })
    .catch(() => null);
}

async function getConferenceValue(): Promise<string | null> {
  await sleep(1_000);
  return state.page
    .waitForSelector(Skiff.CONFERENCING_INPUT_SELECTOR, {
      visible: true,
      timeout: 5_000,
    })
    .then((el) => el?.evaluate((el) => (el as HTMLInputElement).value))
    .then((value) => value || null)
    .catch(() => null);
}

async function setPageTheme(theme: "light" | "dark" | "system") {
  return state.page.evaluate((theme) => {
    localStorage.setItem("THEME_MODE", theme);
  }, theme);
}

async function cancelEventCreation() {
  console.info("Attempting to cancel event creation.");

  let didCancel = false;

  /**
   * Find and click the 'Cancel' button. We don't want to save these
   * changes since the data is expected by latest tests.
   */
  for (const button of await state.page.$$(selectors.n_ROLE_BUTTONS)) {
    const buttonText = await button?.evaluate((el) => el.textContent);
    if (buttonText === "Cancel") {
      await button.click();
      didCancel = true;
      break;
    }
  }

  if (!didCancel) {
    console.error("Failed to cancel event creation.");
  }
}

async function getEventCard() {
  let meetingCard;

  await state.page.waitForSelector(selectors.n_EVENT_CARDS);

  await sleep(1_000);

  for (const card of await state.page.$$(selectors.n_EVENT_CARDS)) {
    const cardText = await card?.evaluate((el) => el.textContent);
    console.log(cardText);
    if (cardText?.includes(state.createdEventTitle)) {
      meetingCard = card;
      break;
    }
  }

  if (!meetingCard) {
    throw new Error("Event card not found");
  }

  return meetingCard;
}

describe("Skiff Calendar", () => {
  beforeAll(async () => {
    state.createdEventTitle = Date.now().toString();
    await setupAuthenticatedBrowserSession(authenticateUser, state);
  });

  afterAll(async () => {
    state.page.on("dialog", async (dialog) => {
      /**
       * It's likely the case that we will have some 'unsaved changes'
       * to our event. We'll ignore any warnings that this data could
       * be lost upon reload.
       */
      if (dialog.type() === "beforeunload") {
        console.log("Ignoring 'unsaved changes' dialog.");
        await dialog.accept();
      }
    });

    await state.page.goto(Skiff.BASE_URL, {
      waitUntil: "networkidle2",
      timeout: 5_000,
    });
    await deleteEventByTitle(state.page, state.createdEventTitle);
    await tearDownBrowserInstance(state.browser, auth.STAY_SIGNED_IN);
  });

  beforeEach(async () => {
    await state.page.goto(Skiff.BASE_URL, {
      waitUntil: "networkidle2",
      timeout: 5_000,
    });
  });

  it("Identifies Skiff Calendar via URL", async () => {
    const location = state.page.url();
    expect(Skiff.isSkiff(location)).toBe(true);
  });

  it("Displays the Brave Talk button on New Event", async () => {
    await openNewEventMenu();

    expect(await getBraveTalkButton()).toBeTruthy();

    await cancelEventCreation();
  });

  it("Renders Brave Talk button properly in Light mode", async () => {
    await setPageTheme("light");
    // We'll catch here, since the page may be in a usable state
    await state.page.reload({ waitUntil: "networkidle2" }).catch(() => {});
    await openNewEventMenu();

    const button = await getBraveTalkButton();
    const expectedColor = "rgb(0, 0, 0)";
    const actualColor = await button?.evaluate(
      (el) => getComputedStyle(el).color
    );

    if (actualColor !== expectedColor) {
      console.log("Expected color: ", expectedColor);
      await state.page.screenshot({ path: "skiffLightMode.png" });
    }

    expect(actualColor).toBe(expectedColor);

    await cancelEventCreation();
  });

  it("Renders Brave Talk button properly in Dark mode", async () => {
    await setPageTheme("dark");
    // We'll catch here, since the page may be in a usable state
    await state.page.reload({ waitUntil: "networkidle2" }).catch(() => {});
    await openNewEventMenu();

    const button = await getBraveTalkButton();
    const expectedColor = "rgb(255, 255, 255)";
    const actualColor = await button?.evaluate(
      (el) => getComputedStyle(el).color
    );

    if (actualColor !== expectedColor) {
      console.log("Expected color: ", expectedColor);
      await state.page.screenshot({ path: "skiffDarkMode.png" });
    }

    expect(actualColor).toBe(expectedColor);

    await cancelEventCreation();
  });

  it("Clicking Brave Talk button schedules meeting (Note: Saves event)", async () => {
    await openNewEventMenu();

    const braveTalkButton = await getBraveTalkButton();

    if (braveTalkButton === null) {
      throw new Error("Brave Talk button not found");
    }

    // Click Brave Talk button, and watch for the popup window
    const [braveTalkPopup] = await Promise.all([
      state.browser.waitForTarget((t) => t.url().startsWith(TALK_BASE_URL)),
      (braveTalkButton as ElementHandle).click(),
    ]);

    expect(braveTalkPopup).toBeTruthy();

    // Check that the conference URL is populated
    await sleep(2_000);

    await getConferenceValue().then((value) => {
      expect(value).toBeTruthy();
      state.braveMeetingUrl = value as string;
    });

    expect(state.braveMeetingUrl.startsWith(TALK_BASE_URL)).toBe(true);

    // Assign a title to this event and save it
    await state.page
      .waitForSelector(Skiff.EVENT_TITLE_INPUT_SELECTOR, {
        visible: true,
        timeout: 5_000,
      })
      .then((el) => el?.type(state.createdEventTitle, { delay: 100 }))
      .then(async () => {
        // Find and click the 'Save' button
        for (const button of await state.page.$$(selectors.n_ROLE_BUTTONS)) {
          const buttonText = await button?.evaluate((el) => el.textContent);
          if (buttonText === "Save") {
            await button.click();
            // Wait for the event to be saved
            await sleep(2_000);
            break;
          }
        }
      });
  });

  it("Hides the Brave Talk button when a Brave Talk meeting URL is present", async () => {
    // Find and click on the event card
    await getEventCard().then(async (card) => card?.click());

    await sleep(2_000);

    expect(await getConferenceValue()).toBe(state.braveMeetingUrl);
    expect(await getBraveTalkButton()).toBe(null);
  });

  it("Clicking the 'remove conference' button reveals Brave Talk button", async () => {
    // Find and click on the event card
    await getEventCard().then(async (card) => card?.click());

    // Click to remove the scheduled meeting
    const options = { visible: true, timeout: 5_000 };

    await state.page
      .waitForSelector(selectors.CONFERENCING_REMOVE_BUTTON, options)
      .then((btn) => btn?.click())
      .then(() =>
        state.page.waitForSelector(
          Skiff.CONFIRM_REMOVE_BUTTON_SELECTOR,
          options
        )
      )
      .then((confirm) => confirm?.click());

    // Evaluate the button's visibility after the meeting is removed
    expect(await getBraveTalkButton()).not.toBe(null);
  });
});
