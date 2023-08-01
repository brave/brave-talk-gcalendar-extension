import path from "node:path";
import puppeteer, { Page, Browser } from "puppeteer-core";
import { access } from "node:fs/promises";

/**
 * TODO: Make sure we can locate Brave on other systems
 */
export async function getBravePath(): Promise<string | undefined> {
  if (process.env.bravePath) {
    try {
      await access(process.env.bravePath);
      return process.env.bravePath;
    } catch {
      console.warn(`Brave not found at ${process.env.bravePath}`);
    }
  }

  const paths = [
    "C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
    "C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
  ];

  for (const path of paths) {
    try {
      await access(path);
      return path;
    } catch {
      continue;
    }
  }
}

type SuiteState = {
  page: Page | null;
  browser: Browser | null;
  createdEventTitle: string | null;
};

type AuthFunc = (page: Page) => Promise<void>;

export async function setupAuthenticatedBrowserSession(
  authFunction: AuthFunc,
  state: SuiteState
): Promise<void> {
  const bravePath = await getBravePath();
  const pathToExtension = path.join(process.cwd(), "dist");

  if (!bravePath) {
    throw new Error("Brave not found");
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: bravePath,
    userDataDir: path.join(process.cwd(), "tmp"),
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  const pages = await browser.pages();
  const ourPage = await browser.newPage();

  for (const otherPage of pages) {
    if (otherPage !== ourPage) {
      await otherPage.close();
    }
  }

  await ourPage.bringToFront();
  await authFunction(ourPage);
  await ourPage.waitForNetworkIdle({ timeout: 5_000 }).catch(() => {
    console.warn("No network idle after authentication.");
  });

  state.browser = browser;
  state.page = ourPage;
}

export async function tearDownBrowserInstance(
  browser: Browser,
  staySignedIn: boolean = false
): Promise<void> {
  if (browser) {
    for (const page of await browser.pages()) {
      if (!staySignedIn) {
        // Don't persist the user's session
        await page.deleteCookie(...(await page.cookies()));
      }
      await page.close();
    }
  }
}
