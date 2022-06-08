/**
 * Generates the brave-talk button for all three calendar views
 */

/** 
 * --Prior Logic-- 
 * tabPanel.innerHTML = `
    <div class="fy8IH poWrGb">
        <div class="FkXdCf HyA7Fb">
          <div class="DPvwYc QusFJf jitsi_quick_add_icon"/>
        </div>
      <div class="kCyAyd">
        <div class="mH89We l4V7wb">
          <div role="button"
              class="uArJ5e UQuaGc Y5sE8d"
              id="jitsi_button_quick_add">
            <content class="CwaK9 cDfbwb">
              <span class="Fxmcue jitsi_quick_add_text_size">
                Add a Brave Talk meeting
              </span>
            </content>
          </div>
        </div>
      </div>
    </div>
    `
*/
export function buildQuickAddButton(tabPanel: HTMLElement) {
  const mainDiv1 = document.createElement("div");
  mainDiv1.setAttribute("class", "fy8IH poWrGb");
  tabPanel.append(mainDiv1);

  // adding brave-talk logo
  const logoDiv2 = document.createElement("div");
  logoDiv2.setAttribute("class", "FkXdCf HyA7Fb");
  mainDiv1.append(logoDiv2);
  const logodDiv3 = document.createElement("div");
  logodDiv3.setAttribute("class", "DPvwYc QusFJf jitsi_quick_add_icon");
  logoDiv2.append(logodDiv3);
  // adding brave-talk button
  const btnDiv1 = document.createElement("div");
  btnDiv1.setAttribute("class", "kCyAyd");
  mainDiv1.append(btnDiv1);
  const btnDiv2 = document.createElement("div");
  btnDiv2.setAttribute("class", "mH89We l4V7wb");
  btnDiv1.append(btnDiv2);
  const btnDiv3 = document.createElement("div");
  btnDiv3.setAttribute("class", "uArJ5e UQuaGc Y5sE8d");
  btnDiv3.setAttribute("role", "button");
  btnDiv3.setAttribute("id", "jitsi_button_quick_add");
  btnDiv2.append(btnDiv3);
  const btnContent4 = document.createElement("content");
  btnContent4.setAttribute("class", "CwaK9 cDfbwb");
  btnDiv3.append(btnContent4);
  const btnSpan5 = document.createElement("span");
  btnSpan5.setAttribute("class", "Fxmcue jitsi_quick_add_text_size");
  btnSpan5.innerText = "Add a Brave Talk meeting";
  btnContent4.append(btnSpan5);
}

/** 
 * --Prior Logic-- 
 * buttonRow.innerHTML = `
      <div class="tzcF6">
        <div class="DPvwYc jitsi_edit_page_icon"></div>
      </div>
      <div class="j3nyw">
        <div class="BY5aAd">
          <div role="button"
               class="uArJ5e UQuaGc Y5sE8d"
               id="jitsi_button_container">
            <content class="CwaK9">
              <div id="jitsi_button" 
                  class="goog-inline-block jfk-button jfk-button-action jfk-button-clear-outline">
                <a href="#" style="color: white"></a>
              </div>
            </content>
          </div>
        </div>
      </div>
  `;
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
