import { auth } from "./config";
import { Page } from "puppeteer-core";

export async function authenticateUser(page: Page): Promise<void> {
  if (!auth.AUTH_URL) {
    throw new Error("AUTH_URL not found");
  }

  await page.goto(auth.AUTH_URL);

  if (!auth.USERNAME || !auth.PASSWORD) {
    throw new Error("USERNAME or PASSWORD not found");
  }

  const options = { visible: true, timeout: 5_000 };

  try {
    const usernameInput = await page.waitForSelector(
      auth.selectors.USERNAME_INPUT,
      options
    );
    await usernameInput?.type(auth.USERNAME);
  } catch (err) {
    /**
     * If we aren't presented with a username input, we
     * assume that the user has already authenticated.
     */
    return;
  }

  const passwordInput = await page.waitForSelector(
    auth.selectors.PASSWORD_INPUT,
    options
  );
  await passwordInput?.type(auth.PASSWORD);

  const stickyAuthCheckbox = await page.waitForSelector(
    auth.selectors.STAY_SIGNED_IN,
    options
  );
  if (auth.STAY_SIGNED_IN) await stickyAuthCheckbox?.click();

  const submitButton = await page.waitForSelector(
    auth.selectors.SUBMIT_BUTTON,
    options
  );
  await submitButton?.click();
}
