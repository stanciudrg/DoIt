import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import * as Creator from "./creator";
import { DOMCache, categoriesContent } from "./DOMCache";
import renderUserCategorySettings from "./contextMenus/categorySettingsMenu";
import {
  hasClass,
  removeClass,
  addClass,
  disableScrolling,
  find,
  enableScrolling,
  getParentOf,
  updateTextContent,
  toggleClass,
  render,
} from "./viewHelpers";

//
//
// Nav buttons management: creating, rendering, deleting, renaming, toggling classes
//
//

// Shows the header using CSS classes. Has additional functionality if mobile mode
// is detected
export function showNavbar() {
  DOMCache.menuButton.setAttribute("aria-label", "Hide menu");
  DOMCache.nav.style.visibility = "visible";

  if (hasClass(DOMCache.header, "hidden")) {
    removeClass(DOMCache.header, "hidden");
    removeClass(DOMCache.body, "header-hidden");
    removeClass(DOMCache.menuButton, "selected");
  }

  addClass(DOMCache.header, "visible");
  // If mobile, continue with other mobile related stuff
  if (!hasClass(DOMCache.header, "mobile")) return;

  // Disable scrolling and add a grey overlay behind header that prevents user input
  disableScrolling();
  DOMCache.headerOverlay.style.display = "initial";
  addClass(DOMCache.headerOverlay, "visible");

  // Remove the eventListener that triggered this function until
  // the header is closed to prevent conflicts in case the user
  // clicks the menuButton again
  DOMCache.menuButton.removeEventListener("click", toggleNavbar);
  DOMCache.header.addEventListener("click", mobileHeaderActions);
  DOMCache.headerOverlay.addEventListener("click", closeNavbar);
  // Add a new eventListener on the mobileVersion media query to close the navbar
  // in case the window exits mobile mode
  DOMCache.mobileVersion.addEventListener("change", closeNavbar);

  // Traps TAB focusing within the header
  const trap = focusTrap.createFocusTrap(DOMCache.header, {
    initialFocus: () => false,
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    returnFocusOnDeactivate: () => true,
  });
  trap.activate();

  function mobileHeaderActions(e) {
    const userCategoryButton = e.target.closest(".todo-holder");

    // If the user is currently editing a user category button, and clicks the name input,
    // do not close the header
    if (find(userCategoryButton, ".input-container")) return;
    if (userCategoryButton) closeNavbar();
    // The click behavior of menuButton is now reversed to close the navbar instead of opening it
    if (e.target === DOMCache.menuButton) closeNavbar();
    if (e.target.closest("#search")) closeNavbar();
  }

  function closeNavbar() {
    // Deactivate the focus trap
    trap.deactivate();
    // Attach the eventListener that triggers this function back on the menuButton
    DOMCache.menuButton.addEventListener("click", toggleNavbar);
    // Remove events to prevent memory leaks and other unwanted behavior
    DOMCache.header.removeEventListener("click", mobileHeaderActions);
    DOMCache.headerOverlay.removeEventListener("click", closeNavbar);
    DOMCache.mobileVersion.removeEventListener("change", closeNavbar);

    // Closing the navbar will also enable scrolling, unless
    // the navbar was closed due to the searchbar being opened, which is also supposed
    // to keep the scrolling disabled, since it is a modal.
    if (!find(DOMCache.modal, "#search-container")) enableScrolling();
    if (DOMCache.mobileVersion.matches) hideNavbar();

    // Ensures that the transition works by waiting for it to finish before changing
    // other properties that do not transition their state
    DOMCache.headerOverlay.addEventListener("transitionend", remove);
    removeClass(DOMCache.headerOverlay, "visible");

    function remove() {
      if (!hasClass(DOMCache.headerOverlay, "visible"))
        DOMCache.headerOverlay.style.display = "none";
      DOMCache.headerOverlay.removeEventListener("transitionend", remove);
    }
  }
}

// Hides the header navbar
export function hideNavbar() {
  DOMCache.menuButton.setAttribute("aria-label", "Show menu");
  if (hasClass(DOMCache.header, "hidden"))
    DOMCache.nav.style.visibility = "hidden";

  // Ensures that the transition works by waiting for it to finish before changing
  // other properties that do not transition their state
  DOMCache.header.addEventListener("transitionend", remove);

  if (hasClass(DOMCache.header, "visible"))
    removeClass(DOMCache.header, "visible");
  addClass(DOMCache.header, "hidden");
  addClass(DOMCache.body, "header-hidden");
  addClass(DOMCache.nav, "header-hidden");
  addClass(DOMCache.menuButton, "selected");

  function remove() {
    if (hasClass(DOMCache.header, "hidden"))
      DOMCache.nav.style.visibility = "hidden";
    DOMCache.header.removeEventListener("transitionend", remove);
  }
}

export function toggleNavbar(e) {
  e.stopImmediatePropagation();
  if (hasClass(DOMCache.header, "hidden")) {
    showNavbar();
    return;
  }

  hideNavbar();
}

// Toggles mobile mode
export function checkIfMobile() {
  if (hasClass(DOMCache.header, "mobile")) {
    removeClass(DOMCache.header, "mobile");
  }

  if (DOMCache.mobileVersion.matches) {
    addClass(DOMCache.header, "mobile");
    hideNavbar();
  }
}

// Adds the 'selected' class to the header button that holds the provided
// categoryID
export function selectNewCategoryButton(categoryID) {
  // Is either a devCategory button that has an ID, or a userCategory button that has a
  // dataset.id.
  const newButton =
    find(DOMCache.devNavbarList, `[id="${categoryID}"]`) ||
    find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
  addClass(getParentOf(newButton), "selected");
}

// Removes the 'selected' class from the button that currently holds it
export function unselectOldCategoryButton() {
  removeClass(find(DOMCache.nav, ".selected"), "selected");
}

// Updates the todos count of the header button that holds the provided categoryID
export function updateCategoryTodosCount(categoryID, todosCount) {
  // Is either a devCategory button that has an ID, or a userCategory button that has a
  // dataset.id.
  const category =
    find(DOMCache.devNavbarList, `[id="${categoryID}"]`) ||
    find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
  const todosCounter = find(category, ".todos-count");
  updateTextContent(todosCounter, todosCount);
}

// Updates the counter of User Categories with the new value
export function updateUserCategoriesCount(categoriesCount) {
  updateTextContent(
    find(DOMCache.userNavbar, "#categories-counter"),
    categoriesCount,
  );
}

// Shows / hides the list of user categories
export function toggleUserCategoriesList() {
  if (hasClass(DOMCache.expandCategoriesButton, "expanded")) {
    DOMCache.expandCategoriesButton.setAttribute(
      "aria-label",
      "Hide user categories",
    );
  } else {
    DOMCache.expandCategoriesButton.setAttribute(
      "aria-label",
      "Show user categories",
    );
  }

  toggleClass(DOMCache.expandCategoriesButton, "expanded");

  if (hasClass(DOMCache.userNavbarList, "hidden")) {
    DOMCache.userNavbarList.style.removeProperty("display");
    removeClass(DOMCache.userNavbarList, "hidden");
    return;
  }

  const remove = () => {
    if (hasClass(DOMCache.userNavbarList, "hidden"))
      DOMCache.userNavbarList.style.display = "none";
    DOMCache.userNavbarList.removeEventListener("animationend", remove);
  };

  // Ensures that the animation works by waiting for it to finish before changing
  // other properties that do not transition their state
  DOMCache.userNavbarList.addEventListener("animationend", remove);
  addClass(DOMCache.userNavbarList, "hidden");
}

function sendDisplayContentRequest() {
  const categoryID = this.id || this.dataset.id;
  PubSub.publish("DISPLAY_CONTENT_REQUEST", categoryID);
}

// Renders a header button that represents a devCategory
export function renderDevCategoryButton(categoryName, categoryID) {
  const devCategoryButton = Creator.createDevCategoryButton(
    categoryName,
    categoryID,
  );
  find(devCategoryButton, "button").addEventListener(
    "click",
    sendDisplayContentRequest,
  );

  render(DOMCache.devNavbarList, devCategoryButton);
  // Create an empty property with the same name as the categoryID on the categoriesContent object.
  categoriesContent[categoryID] = "";
}

// Renders a header button that represents a userCategory
export function renderUserCategoryButton(categoryName, categoryID) {
  const userCategoryButton = Creator.createUserCategoryButton(
    categoryName,
    categoryID,
  );

  render(DOMCache.userNavbarList, userCategoryButton);
  categoriesContent[categoryID] = "";
}

// Handles the click events on userCategoryButtons
export function handleUserCategoryClickEvents(e) {
  const li = e.target.closest("li");
  const userCategoryButton = find(li, ".todo-holder");

  if (!li) return;
  if (find(userCategoryButton, ".input-container")) return;

  if (hasClass(e.target, "settings-button")) {
    e.stopImmediatePropagation();
    renderUserCategorySettings(
      find(
        getParentOf(
          find(
            DOMCache.userNavbarList,
            `[data-id="${userCategoryButton.dataset.id}"]`,
          ),
        ),
        ".settings-button",
      ),
      userCategoryButton.dataset.id,
    );
    return;
  }

  // bind is used because devCategory buttons have the sendDisplayContentRequest
  // function attached directly on themselves, therefore providing a 'this' value.
  // userCategory button click events, on the other hand, are handled by their ancestor,
  // therefore they are manually provided as 'this'
  sendDisplayContentRequest.bind(userCategoryButton)();
}

// Renames the userCategoryButton that holds the provided categoryID
export function renameUserCategoryButton(categoryID, newName) {
  updateTextContent(
    find(
      find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`),
      ".button-name",
    ),
    newName,
  );
}

// Deletes the userCategoryButton that holds the provided categoryID
export function deleteUserCategoryButton(categoryID) {
  const button = find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
  // For accessibility reasons, user category buttons are stored into a li element
  getParentOf(button).remove();

  // Delete the property with the same name as the categoryID from the categoriesContent object
  delete categoriesContent[categoryID];
}
