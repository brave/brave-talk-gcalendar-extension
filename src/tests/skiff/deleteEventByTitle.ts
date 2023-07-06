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

  await page.reload({ waitUntil: "networkidle2", timeout: 5_000 });

  await page.waitForSelector(selectors.n_EVENT_CARDS, {
    visible: true,
    timeout: 5_000,
  });

  let eventChip;

  for (const chip of await page.$$(selectors.n_EVENT_CARDS)) {
    const text = await chip.evaluate((el) => el.textContent);
    if (text?.includes(title)) {
      eventChip = chip;
      break;
    }
  }

  if (!eventChip) {
    console.error("No event chip found.");
    return;
  }

  await eventChip.click();

  await sleep(2_000);

  const ellipsisButton = await page.waitForSelector(
    selectors.EVENT_ELLIPSIS_BUTTON,
    {
      visible: true,
      timeout: 5_000,
    }
  );

  await ellipsisButton?.click();

  let deleteButton;

  for (const button of await page.$$(selectors.n_DROPDOWN_EVENT_OPTIONS)) {
    const text = await button.evaluate((el) => el.textContent);
    if (text?.includes("Delete")) {
      deleteButton = button;
      break;
    }
  }

  if (!deleteButton) {
    console.error("No delete button found.");
    return;
  }

  await deleteButton?.click();

  /**
   * This function will undoubtedly trigger a network request.
   * We'll give it a couple seconds to complete.
   */
  await sleep(2_000);
}
