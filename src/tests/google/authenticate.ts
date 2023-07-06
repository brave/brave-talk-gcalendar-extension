import { sleep } from "../../common";
import { auth } from "./config";
import { Page, PuppeteerLifeCycleEvent } from "puppeteer-core";

export async function authenticateUser(page: Page): Promise<void> {
  if (!auth.AUTH_URL) {
    throw new Error("AUTH_URL not found");
  }

  if (!auth.USERNAME || !auth.PASSWORD) {
    throw new Error("USERNAME or PASSWORD not found");
  }

  await page.goto(auth.AUTH_URL, { waitUntil: "networkidle0", timeout: 5_000 });

  const options = { visible: true, timeout: 5_000 };

  const nameInput = await page
    .waitForSelector(auth.selectors.USERNAME_INPUT, options)
    .catch(() => {});

  if (nameInput) {
    await nameInput?.type(auth.USERNAME, { delay: 100 });
    await page
      .waitForSelector(auth.selectors.NEXT_BUTTON, options)
      .then((elementHandle) => elementHandle?.click());
  } else {
    /**
     * If there is an account list, and our username is found among the
     * entries, we will click that entry and proceed.
     */
    const accountEntry = await page
      .waitForSelector(auth.selectors.ACCOUNT_LIST_ENTRY, options)
      .then(async (elementHandle) => await elementHandle?.click())
      .catch(() => {});
  }

  const passInput = await page.waitForSelector(
    auth.selectors.PASSWORD_INPUT,
    options
  );

  await passInput?.type(auth.PASSWORD, { delay: 100 });

  await sleep(2_000);

  const passNextButton = await page.waitForSelector(
    auth.selectors.PASSWORD_NEXT_BUTTON,
    options
  );
  await passNextButton?.click();
}
