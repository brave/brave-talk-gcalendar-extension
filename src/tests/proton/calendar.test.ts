require("dotenv").config();
import { Browser, Page, ElementHandle } from "puppeteer-core";
import {
  setupAuthenticatedBrowserSession,
  tearDownBrowserInstance,
} from "../test.common";
import * as Proton from "../../proton/calendar";
import { sleep } from "../../common";
import { TALK_BASE_URL } from "../../brave/brave-talk";
import { auth, selectors } from "./config";
import { authenticateUser } from "./authenticate";
import { deleteEventByTitle } from "./deleteEventByTitle";

describe("Proton Calendar", () => {
  const state = {
    page: null as unknown as Page,
    browser: null as unknown as Browser,
    braveMeetingUrl: null as unknown as string,
    createdEventTitle: null as unknown as string,
  };

  beforeAll(async () => {
    state.createdEventTitle = Date.now().toString();
    await setupAuthenticatedBrowserSession(authenticateUser, state);
  });

  afterAll(async () => {
    await deleteEventByTitle(state.page, state.createdEventTitle);
    await tearDownBrowserInstance(state.browser, auth.STAY_SIGNED_IN);
  });

  it("Properly identifies Proton Calendar", async () => {
    try {
      await state.page.waitForNetworkIdle();
      expect(Proton.isProtonCalendar(state.page.url())).toBe(true);
    } catch (error) {
      console.error(error);
    }
  });

  it("Display Brave Talk button on New Meeting", async () => {
    try {
      const options = { visible: true, timeout: 5_000 };
      const newEvent = await state.page.waitForSelector(
        selectors.NEW_EVENT_BUTTON,
        options
      );
      await newEvent?.click();
      const braveTalk = await state.page.waitForSelector(
        selectors.TALK_BUTTON,
        options
      );
      expect(braveTalk).toBeTruthy();
    } catch (error) {
      console.error(error);
    }
  });

  it("Clicking Brave Talk button opens popup window", async () => {
    try {
      const button = await state.page.waitForSelector(selectors.TALK_BUTTON);
      const [target] = await Promise.all([
        state.browser.waitForTarget((t) => t.url().startsWith(TALK_BASE_URL)),
        button?.click(),
      ]);
      expect(target).toBeTruthy();
    } catch (error) {
      console.error(error);
    }
  });

  it("Brave Talk meeting URL stored in event Location", async () => {
    try {
      const options = { timeout: 5_000, visible: true };
      const locationInput = await state.page.waitForSelector(
        selectors.EVENT_LOCATION_INPUT,
        options
      );
      const locationValue = await locationInput?.evaluate(
        (el) => (el as HTMLInputElement).value
      );

      /**
       * We'll store this value so that we can evaluate
       * it again later in our persistence test.
       */
      state.braveMeetingUrl = locationValue as string;
      expect(locationValue?.startsWith(TALK_BASE_URL)).toBe(true);
    } catch (error) {
      console.error(error);
    }
  });

  it("Brave Talk meeting URL persists after Save event", async () => {
    try {
      /**
       * We'll set a distinct title on this event so that we
       * can easily identify it later.
       */
      const options = { timeout: 5_000, visible: true };
      const titleInput = await state.page.waitForSelector(
        selectors.EVENT_TITLE_INPUT,
        options
      );
      await titleInput?.type(state.createdEventTitle);

      /**
       * There are a couple different Save buttons which may
       * appear in the UI. We'll watch for both of them.
       */
      const popupSave = await state.page
        .waitForSelector(selectors.EVENT_POPUP_SAVE_BUTTON, options)
        .catch(() => null);
      const modalSave = await state.page
        .waitForSelector(selectors.EVENT_MODAL_SAVE_BUTTON, options)
        .catch(() => null);

      /**
       * Now we'll save/create the new event. Once we click the
       * 'Save' button, our UI could take a moment to fully sync
       * with the state. As such, we'll wait a few seconds before
       * continuing.
       */
      await ((popupSave || modalSave) as ElementHandle).click();
      await sleep(3_000);

      /**
       * Now we need to locate our newly created event. We'll
       * use the title we set earlier to find it.
       */
      const eventSelector = selectors.EVENT_BUTTON_SELECTOR_BY_TITLE(
        state.createdEventTitle
      );
      const newEventButton = await state.page.waitForSelector(
        eventSelector,
        options
      );
      await newEventButton?.click();

      /**
       * We'll locate and click the 'Edit' button in this preview.
       * It could take a moment for the event-edit dialog to show,
       * so we'll wait a few seconds after clicking to continue.
       */
      const editButton = await state.page.waitForSelector(
        selectors.EVENT_POPOVER_EDIT_BUTTON,
        options
      );
      await editButton?.click();
      await sleep(1_000);

      /**
       * After a moment, our full edit view should be loaded.
       * We can scan it from our location input element, and
       * check the value against our previous meeting URL.
       */
      const locationInput = await state.page.waitForSelector(
        selectors.EVENT_LOCATION_INPUT,
        options
      );
      const locationValue = await locationInput?.evaluate(
        (el) => (el as HTMLInputElement).value
      );

      expect(locationValue).toBe(state.braveMeetingUrl);
    } catch (error) {
      console.error(error);
    }
  });
});
