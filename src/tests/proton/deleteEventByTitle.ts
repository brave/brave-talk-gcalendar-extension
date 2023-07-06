import { selectors } from "./config";
import { sleep } from "../../common";
import { Page } from "puppeteer-core";

export async function deleteEventByTitle(
  page: Page,
  title: string
): Promise<void> {
  if (!page) {
    console.warn("No page provided. Returning.");
    return;
  }

  await page.reload({ waitUntil: "networkidle0", timeout: 5_000 }).catch(() => {
    // console.warn("Error reloading page.");
  });

  const options = { timeout: 2_000, visible: true };
  const createdEventSelector = selectors.EVENT_BUTTON_SELECTOR_BY_TITLE(title);
  const createdEvent = await page
    .waitForSelector(createdEventSelector, options)
    .catch((error) => {
      console.error("Error waiting for event chip: ", error);
    });

  /**
   * We sleep briefly before each click to make
   * sure the click handlers have been attached.
   */

  await sleep(1_000);
  await createdEvent?.click();

  const deleteButton = await page
    .waitForSelector(selectors.EVENT_POPOVER_DELETE_BUTTON, options)
    .catch((error) => {
      console.error("Error waiting for delete button: ", error);
    });

  await sleep(1_000);
  await deleteButton?.click();

  const confirmDeleteButton = await page
    .waitForSelector(selectors.DELETE_EVENT_CONFIRM_BUTTON, options)
    .catch((error) => {
      console.error("Error waiting for confirm delete button: ", error);
    });

  await sleep(1_000);
  await confirmDeleteButton?.click();

  /**
   * This function will undoubtedly trigger a network request.
   * We'll wait for that request to complete before continuing.
   */
  await page
    .waitForNetworkIdle({ idleTime: 1_000, timeout: 5_000 })
    .catch(() => {
      // console.warn("Error waiting for network idle.");
    });
}
