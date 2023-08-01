import { auth } from "./config";
import { Page } from "puppeteer-core";

export async function authenticateUser(page: Page): Promise<void> {
  if (!auth.AUTH_URL) {
    throw new Error("AUTH_URL not found");
  }

  await page.goto(auth.AUTH_URL);

  // If we're already logged in, we can skip the rest
  if (page.url() === auth.AUTH_URL) {
    return;
  }

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
  } catch (error) {
    /**
     * If the username field wasn't found, it's likely because
     * the page remembers the user from a previous session, and
     * is inviting them to select their name from a menu.
     */
    console.log("Username field not found. Continuing.");
  }

  try {
    const passwordInput = await page.waitForSelector(
      auth.selectors.PASSWORD_INPUT,
      options
    );
    const loginButton = await page.waitForSelector(
      auth.selectors.LOGIN_BUTTON,
      options
    );

    await passwordInput?.type(auth.PASSWORD);
    await loginButton?.click();
  } catch (error) {
    /**
     * If the password and login buttons aren't found, then it
     * is likely the case that the user session was recovered,
     * and the user doesn't need to authenticate.
     */
    console.log("Password field or login button not found. Continuing.");
  }
}
