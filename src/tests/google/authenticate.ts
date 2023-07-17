import { sleep } from "../../common";
import { auth } from "./config";
import { Page, PuppeteerLifeCycleEvent } from "puppeteer-core";

enum PageType {
  LOGIN,
  ACCOUNT_CHOOSER,
  CALENDAR,
  WORKSPACE,
}

export async function getPageType(page: Page): Promise<PageType | undefined> {
  console.log("google:getPageType", page.url());

  // We are already logged in
  if (page.url().startsWith(`https://calendar.google.com/`)) {
    return PageType.CALENDAR;
  }

  // We're being presented with the Workspace info page
  if (page.url().startsWith(`https://workspace.google.com/`)) {
    return PageType.WORKSPACE;
  }

  // We're being presented with a login page
  if (page.url().startsWith(`https://accounts.google.com/`)) {
    if (await page.$(auth.selectors.USERNAME_INPUT)) {
      return PageType.LOGIN;
    } else if (await page.$(auth.selectors.ACCOUNT_LIST_ENTRY)) {
      return PageType.ACCOUNT_CHOOSER;
    }
  }
}

async function authenticateUserLogin(page: Page): Promise<void> {
  console.log("google:authenticateUserLogin");

  if (!auth.USERNAME || !auth.PASSWORD) {
    throw new Error("USERNAME or PASSWORD not found");
  }

  const options = { visible: true, timeout: 5_000 };

  await page
    .waitForSelector(auth.selectors.USERNAME_INPUT, options)
    .then((input) => input?.type(auth.USERNAME!, { delay: 100 }));

  await page
    .waitForSelector(auth.selectors.NEXT_BUTTON, options)
    .then((elementHandle) => elementHandle?.click());

  await page
    .waitForSelector(auth.selectors.PASSWORD_INPUT, options)
    .then((input) => input?.type(auth.PASSWORD!, { delay: 100 }));

  await page
    .waitForSelector(auth.selectors.PASSWORD_NEXT_BUTTON, options)
    .then((button) => button?.click());
}

async function authenticateUserWorkspace(page: Page): Promise<void> {
  console.log("google:authenticateUserWorkspace");

  const options = { timeout: 5_000 };

  const href = await page
    .waitForSelector(auth.selectors.WORKSPACE_SIGN_IN_BUTTON, options)
    .then((el) => el?.evaluate((el) => el?.getAttribute("href")));

  if (!href) {
    throw new Error("Workspace sign in button not found");
  }

  await page.goto(href!, { waitUntil: "networkidle0" });

  switch (await getPageType(page)) {
    case PageType.LOGIN:
      await authenticateUserLogin(page);
      break;
    case PageType.ACCOUNT_CHOOSER:
      await authenticateUserAccountChooser(page);
      break;
    default:
      throw new Error("Unknown page type");
  }
}

async function authenticateUserAccountChooser(page: Page): Promise<void> {
  console.log("google:authenticateUserAccountChooser");

  if (!auth.PASSWORD) {
    throw new Error("PASSWORD not found");
  }

  const options = { visible: true, timeout: 5_000 };

  await page
    .waitForSelector(auth.selectors.ACCOUNT_LIST_ENTRY, options)
    .then((entry) => entry?.click());

  await page
    .waitForSelector(auth.selectors.PASSWORD_INPUT, options)
    .then((input) => input?.type(auth.PASSWORD!, { delay: 100 }));

  await page
    .waitForSelector(auth.selectors.PASSWORD_NEXT_BUTTON, options)
    .then((button) => button?.click());
}

export async function authenticateUser(page: Page): Promise<void> {
  console.log("google:authenticateUser");

  if (!auth.AUTH_URL) {
    throw new Error("AUTH_URL not found");
  }

  await page.goto(auth.AUTH_URL, {
    waitUntil: "networkidle0",
    timeout: 5_000,
  });

  switch (await getPageType(page)) {
    case PageType.LOGIN:
      await authenticateUserLogin(page);
      break;
    case PageType.ACCOUNT_CHOOSER:
      await authenticateUserAccountChooser(page);
      break;
    case PageType.WORKSPACE:
      await authenticateUserWorkspace(page);
      break;
    case PageType.CALENDAR:
      // We are already logged in
      break;
    default:
      throw new Error("Unknown page type");
  }
}
