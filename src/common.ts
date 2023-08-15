import { ElementHandle, Page } from "puppeteer-core";

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isElementVisible(element: HTMLElement): boolean {
  if (element instanceof HTMLElement) {
    const { display, opacity, visibility } = window.getComputedStyle(element);
    if (display !== "none" && visibility !== "hidden" && opacity !== "0") {
      return true;
    }
  }

  return false;
}

export async function waitForSelectorAndPause<T extends HTMLElement>(
  page: Page,
  selector: string,
  pauseTime = 1_000
): Promise<ElementHandle<T>> {
  const element = await page.waitForSelector(selector);
  await sleep(pauseTime);
  return element as ElementHandle<T>;
}

export function setupWaitForSelectorAndPause(page: Page) {
  return async function waitForSelectorAndPause<T extends HTMLElement>(
    selector: string,
    timeout: number = 3_000,
    pauseTime = 2_000
  ): Promise<ElementHandle<T>> {
    const element = await page.waitForSelector(selector, { timeout });
    await sleep(pauseTime);
    return element as ElementHandle<T>;
  };
}

export async function clickElement(
  selector: string,
  delay: number = 0
): Promise<void> {
  if (!isValidSelector(selector)) {
    throw new Error(`Invalid selector: ${selector}`);
  }

  const element = await waitForSelector(selector);

  if (!element) {
    throw new Error(`${selector} not found`);
  }

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * TODO (Sampson): We may need to simulate various
   * click-related events here.
   */
  (element as HTMLElement).click();

  console.log(`Clicked ${selector}`);
}

export function waitForSelector(
  selector: string,
  maxtime: number = 3_000,
  container: Element = document.body
): Promise<Element> {
  return new Promise((resolve, reject) => {
    if (container instanceof Element === false) {
      reject("Invalid container");
      return;
    }

    let node;

    /**
     * If the desired element is already present, we can
     * resolve the promise immediately.
     */
    if ((node = container.querySelector(selector))) {
      resolve(node);
      return;
    }

    const observer = new MutationObserver((mutations, observer) => {
      /**
       * We only need to scan the container itself, not necessarily
       * the addedNodes themselves.
       */
      if ((node = container.querySelector(selector))) {
        observer.disconnect();
        resolve(node);
      }
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
    });

    /**
     * If we haven't found the element after our `maxtime`,
     * then we'll disconnect our observer and reject the promise.
     */
    setTimeout(() => {
      observer.disconnect();
      reject("Timeout waiting for selector");
    }, maxtime);
  });
}

export function isValidSelector(selector: string): boolean {
  try {
    document.querySelector(selector);
    return true;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return false;
    }
    throw error;
  }
}

export const focusEventMapping = {
  blur: ["blur", "focusout"],
  focus: ["focus", "focusin"],
};

export function simulateFocusEvents(
  element: HTMLElement,
  type: keyof typeof focusEventMapping
): void {
  /**
   * We're gratuitously simulating FocusEvents to make
   * sure the Calendar's state gets updated. We're not
   * always going to know which events the Calendar is
   * listening to, to trigger internal state changes, so
   * we'll simulate quite a few of them.
   */
  const events = focusEventMapping[type] || [];

  for (const eventType of events) {
    element.dispatchEvent(new FocusEvent(eventType, { bubbles: true }));
  }
}

export function setFieldValue(
  element: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void {
  const focused = document.activeElement;

  simulateFocusEvents(element, "focus");

  /**
   * As is the case with FocusEvents above and below, we
   * are simulating several keyboard and input events to
   * ensure Skiff Calendar's internal state is updated.
   */
  element.value = value;
  for (const type of ["keydown", "keypress", "input", "keyup"]) {
    element.dispatchEvent(new Event(type, { bubbles: true }));
  }

  simulateFocusEvents(element, "blur");

  /**
   * Restore focus to original element, if needed.
   */
  if (focused instanceof HTMLElement) {
    simulateFocusEvents(focused, "focus");
  }
}

/**
 *
 * @param tag Tag name of the element to create.
 * @param text Plain text to set as the textContent
 * of the element.
 */
export function createElement(
  tag: keyof HTMLElementTagNameMap,
  text: string
): HTMLElement;

/**
 *
 * @param tag Tag name of the element to create.
 * @param text Plain text to set as the textContent
 * of the element.
 * @param attributes Object of attributes to set on
 * the element.
 */
export function createElement(
  tag: keyof HTMLElementTagNameMap,
  text: string,
  attributes: Record<string, string>
): HTMLElement;

/**
 *
 * @param tag Tag name of the element to create.
 * @param attributes Object of attributes to set on
 * the element.
 * @param children Array of HTMLElement or tuples
 * of the form [tag, attributes, children] to
 * append to the element.
 */
export function createElement(
  tag: keyof HTMLElementTagNameMap,
  attributes: Record<string, string>,
  children?: any[]
): HTMLElement;

export function createElement(
  tag: keyof HTMLElementTagNameMap,
  arg2: string | Record<string, string> = {},
  arg3: Record<string, string> | any[] = []
): HTMLElement {
  let attributes, children;

  const element = document.createElement(tag);

  if (typeof arg2 === "string") {
    element.textContent = arg2;
    attributes = arg3 as Record<string, string>;
    children = [] as any[];
  } else {
    attributes = arg2 as Record<string, string>;
    children = arg3;
  }

  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value as string);
    }
  }

  if (children) {
    for (const child of Object.values(children as any[])) {
      if (child instanceof HTMLElement) {
        element.append(child);
        continue;
      }
      const [cTag, cAttrs, cChildren] = child;
      element.append(createElement(cTag, cAttrs, cChildren));
    }
  }

  return element;
}
