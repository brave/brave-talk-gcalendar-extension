/**
 * Generates the brave-talk button for all three calendar views
 */

function tryCloneMeetEntry() {
  /**
   * To ensure the button is styled appropriately, we will
   * clone the existing Google Meet button, and modify its
   * contents and attributes to our needs.
   *
   * A slightly more verbose selector is used to avoid any
   * reliance on generated-values (e.g. jsname='abc123')
   * which may change more frequently than the structure.
   *
   * TODO (Sampson): Make this work with GMail Companion.
   */
  const selector =
    "[data-expandable] ~ div:has(img[src*='logo_meet']):has(button)";
  const meetEntry = document.querySelector(selector);

  if (meetEntry instanceof HTMLElement) {
    const talkEntry = meetEntry.cloneNode(true) as HTMLElement;

    // Update image and button label
    const image = talkEntry.querySelector("img");
    const button = talkEntry.querySelector("button");
    const label = button?.querySelector("span");

    // We require both the image and button to be present
    if (image instanceof HTMLElement && button instanceof HTMLElement) {
      // This ID is used to bind the click handler
      button.id = "jitsi_button_quick_add";
      image.src = chrome.runtime.getURL("brave_talk_icon.svg");

      // TODO (Sampson): Localize this string
      const labelText = "Add a Brave Talk meeting";
      if (label instanceof HTMLElement) {
        label.textContent = labelText;
      } else {
        button.textContent = labelText;
      }

      // Remove all js* attributes
      const elements = talkEntry.querySelectorAll("*");

      for (const item of [talkEntry, ...Array.from(elements)]) {
        for (const attribute of Array.from(item.attributes)) {
          if (attribute.name.startsWith("js")) {
            item.removeAttribute(attribute.name);
          }
        }
      }

      return talkEntry;
    }
  }

  return false;
}

export function buildQuickAddButton(tabPanel: HTMLElement) {
  /**
   * We'll initially try to clone the Google Meet
   * button to match its structure and styling.
   */
  const talkEntry = tryCloneMeetEntry();

  if (talkEntry instanceof HTMLElement) {
    console.log("Successfully cloned Meet button");
    tabPanel.append(talkEntry);
    return;
  }

  /**
   * We'll fall-back to what the button looked
   * like most recently (as of 2023-06-21). We
   * have no assurance that any of these class
   * names will remain stable.
   */

  console.log("Clone failure. Falling back to last-known button.");

  // prettier-ignore
  const element = makeElement("div", { class: "m2hqkd" },
    makeElement("div", { class: "fy8IH xI9Bs FrRgdd" },
      makeElement("div", { class: "FkXdCf HyA7Fb" },
        makeElement("i", { class: "google-material-icons meh4fc hggPq GyffFb", "aria-hidden": "true" },
          makeElement("div", {},
            makeElement("img", { class: "Gxo8Ie", src: chrome.runtime.getURL("brave_talk_icon.svg"), "aria-hidden": "true" })))),
      makeElement("div", { class: "tsUyod XsN7kf", "data-dragsource-ignore": "true" },
        makeElement("div", { class: "lulit" },
          makeElement("div", { class: "d27AIf z5I5rf s2r4Od", "data-in-bubble": "true" },
            makeElement("div", { class: "oJeWuf" },
              makeElement("div", { class: "emaTS yLISWd" },
                makeElement("div", { class: "Kh5Sib FAE19b", "data-use-button-for-single-solution": "true" },
                  makeElement("button", {
                    class: "VfPpkd-LgbsSe VfPpkd-LgbsSe-OWXEXe-k8QpJ nCP5yc AjY5Oe DuMIQc LQeN7 JTAoxf Z1uZib",
                    id: "jitsi_button_quick_add",
                    "data-idom-class": "nCP5yc AjY5Oe DuMIQc LQeN7 JTAoxf Z1uZib",
                    "data-solution": "W1szXV0."
                  },
                    makeElement("div", { class: "VfPpkd-Jh9lGc" }),
                    makeElement("div", { class: "VfPpkd-J1Ukfc-LhBDec" }),
                    makeElement("span", { class: "VfPpkd-vQzf8d" },
                      "Add a Brave Talk meeting"
                    )))),
              makeElement("div", { class: "jekkF x5Urbb" })))))));

  tabPanel.appendChild(element);
}

function makeElement(
  tag: keyof HTMLElementTagNameMap,
  attrs: Record<string, string>,
  ...children: any[]
): HTMLElement {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    element.setAttribute(key, value);
  }
  for (const child of children) {
    if (typeof child === "string") {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

/**
 * TODO (Sampson): Revisit to see if we can
 * combine this and buildQuickAddButton into
 * a single function.
 *
 * At the very least, we need to update the
 * class names used here, as well as localize
 * the strings.
 */
export function buildFullScreenAddButton(buttonRow: HTMLElement) {
  // adding brave-talk logo
  const logoDiv1 = document.createElement("div");
  logoDiv1.setAttribute("class", "tzcF6");
  buttonRow.append(logoDiv1);
  const logodDiv2 = document.createElement("div");
  logodDiv2.setAttribute("class", "DPvwYc jitsi_edit_page_icon");
  logoDiv1.append(logodDiv2);
  // adding brave-talk button
  const btnDiv1 = document.createElement("div");
  btnDiv1.setAttribute("class", "j3nyw");
  buttonRow.append(btnDiv1);
  const btnDiv2 = document.createElement("div");
  btnDiv2.setAttribute("class", "BY5aAd");
  btnDiv1.append(btnDiv2);
  const btnDiv3 = document.createElement("div");
  btnDiv3.setAttribute("class", "uArJ5e UQuaGc Y5sE8d");
  btnDiv3.setAttribute("role", "button");
  btnDiv3.setAttribute("id", "jitsi_button_container");
  btnDiv2.append(btnDiv3);
  const btnContent4 = document.createElement("content");
  btnContent4.setAttribute("class", "CwaK9");
  btnDiv3.append(btnContent4);
  const btnDiv5 = document.createElement("div");
  btnDiv5.setAttribute(
    "class",
    "goog-inline-block jfk-button jfk-button-action jfk-button-clear-outline"
  );
  btnDiv5.setAttribute("id", "jitsi_button");
  btnContent4.append(btnDiv5);
  const btnAnch6 = document.createElement("a");
  btnAnch6.setAttribute("href", "#");
  btnAnch6.setAttribute("style", "color: white");
  btnDiv5.append(btnAnch6);
}
