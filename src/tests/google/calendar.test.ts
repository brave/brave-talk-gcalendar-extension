require("dotenv").config();
import { Browser, Page, PuppeteerLifeCycleEvent } from "puppeteer-core";
import {
  setupAuthenticatedBrowserSession,
  tearDownBrowserInstance,
} from "../test.common";
import * as Google from "../../google/calendar";
import { sleep } from "../../common";
import { TALK_BASE_URL } from "../../brave/brave-talk";
import { auth, selectors } from "./config";
import { authenticateUser } from "./authenticate";
import { deleteEventByTitle } from "./deleteEventByTitle";

describe("Google Calendar", () => {
  const state = {
    page: null as unknown as Page,
    browser: null as unknown as Browser,
    braveMeetingUrl: null as unknown as string,
    createdEventTitle: null as unknown as string,
  };

  beforeAll(async () => {
    console.log("google:beforeAll");

    state.createdEventTitle = Date.now().toString();
    await setupAuthenticatedBrowserSession(authenticateUser, state).catch(
      (error) => {
        console.log(error);
        console.error("An authentication session could not be established");
        // Don't attempt to do any further testing
        process.exit(1);
      }
    );
  });

  afterAll(async () => {
    console.log("google:afterAll");

    await deleteEventByTitle(state.page, state.createdEventTitle);
    await tearDownBrowserInstance(state.browser, auth.STAY_SIGNED_IN);
  });

  it("Identifies Google Calendar via URL", async () => {
    console.log("google:isGoogleCalendar");

    await state.page.goto(Google.BASE_URL, { waitUntil: "networkidle0" });
    expect(Google.isGoogleCalendar(state.page.url())).toBe(true);
  });

  it("Displays the Brave Talk button on New Event", async () => {
    console.log("google:buttonDisplayed");

    const options = { visible: true, timeout: 5_000 };

    const createButton = await state.page.waitForSelector(
      selectors.CREATE_BUTTON,
      options
    );
    await sleep(2_000);
    await createButton?.click();

    const eventButton = await state.page.waitForSelector(
      selectors.CREATE_EVENT_ITEM,
      options
    );
    await sleep(2_000);
    await eventButton?.click();

    const braveTalkButton = await state.page.waitForSelector(
      Google.TALK_BUTTON_SELECTOR,
      options
    );
    expect(braveTalkButton).toBeTruthy();
  });

  it("Clicking Brave Talk button opens popup window", async () => {
    console.log("google:buttonClickOpensPopup");

    const button = await state.page.waitForSelector(
      Google.TALK_BUTTON_SELECTOR
    );

    /**
     * Listen for the creation of a new Target that
     * matches our Brave Talk meeting base URL.
     */
    const [target] = await Promise.all([
      state.browser.waitForTarget((t) => t.url().startsWith(TALK_BASE_URL)),
      button?.click(),
    ]);

    expect(target).toBeTruthy();
  });

  it("Stores Brave Talk meeting URL in the event location", async () => {
    console.log("google:storesBraveTalkUrl");

    const options = { visible: true, timeout: 5_000 };
    const locationInput = await state.page.waitForSelector(
      selectors.EVENT_LOCATION_INPUT,
      options
    );
    const locationValue = await locationInput?.evaluate(
      (el) => (el as HTMLInputElement).value
    );

    state.braveMeetingUrl = locationValue as string;

    expect(state.braveMeetingUrl.startsWith(TALK_BASE_URL)).toBe(true);
  });

  it("Brave Talk meeting URL persists after Save event", async () => {
    console.log("google:braveTalkUrlPersists");

    const options = { visible: true, timeout: 5_000 };
    const titleInput = await state.page.waitForSelector(
      selectors.EVENT_TITLE_INPUT,
      options
    );

    await titleInput?.type(state.createdEventTitle, { delay: 100 });

    const saveButton = await state.page.waitForSelector(
      selectors.CREATE_EVENT_SAVE_BUTTON,
      options
    );
    await saveButton?.click();

    await sleep(2_000);

    const eventChip = (await state.page.$$(selectors.EVENT_CHIP)).filter(
      async (el) => {
        const text = await el.evaluate((el) => el.textContent);
        return text?.includes(state.createdEventTitle);
      }
    );

    if (eventChip.length > 1) {
      console.warn("Found multiple event chips with the same title:");
      for (const chip of eventChip) {
        const text = await chip.evaluate((el) => el.textContent);
        console.log(text);
      }
    }

    expect(eventChip.length).toBe(1);

    eventChip[0].click();
    await sleep(2_000);

    const location = await state.page.waitForSelector(
      selectors.EVENT_PREVIEW_LOCATION,
      options
    );
    const locationAnchor = await location?.waitForSelector("a", options);
    const anchorText = await locationAnchor?.evaluate((el) => el.textContent);

    expect(anchorText).toBe(state.braveMeetingUrl);
  });
});
