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

  const eventChip = (await page.$$(selectors.EVENT_CHIP)).filter(
    async (chip) => {
      const text = await chip.evaluate((el) => el.textContent);
      return text?.includes(title);
    }
  );

  if (eventChip.length === 0) {
    return;
  }

  await eventChip[0].click();
  await sleep(2_000);

  const options = { visible: true, timeout: 5_000 };
  const deleteButton = await page
    .waitForSelector(selectors.EVENT_DELETE_BUTTON, options)
    .catch((error) => {
      console.error("Error waiting for delete button: ", error);
    });

  await deleteButton?.click();

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
