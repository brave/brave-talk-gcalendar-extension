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
  children: any[]
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
      element.setAttribute(key, value);
    }
  }

  if (children) {
    for (const child of Object.values(children)) {
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
