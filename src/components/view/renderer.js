import * as Controller from "../controller";
import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import { capitalizeFirstLetter } from "../universalHelpers";
import * as Creator from "./creator";
import { DOMCache, categoriesContent } from "./DOMCache";
import {
  renderAddTodoModal,
  renderEditTodoModal,
} from "./modals/todoFormModal";
import {
  renderCategoriesDropdownList,
  renderCategorySelectItem,
  renderAddCategoryModal,
} from "./modals/categoryFormModal";
import {
  renderDeleteTodoModal,
  renderDeleteCategoryModal,
} from "./modals/deleteConfirmationModal";
import {
  renderSearchModal,
  renderAnchorTodoElement,
  deleteAllAnchorTodoElements,
  markAnchorTodoElementAsCompleted,
} from "./modals/searchModal";
import renderTodoSettings from './contextMenus/todoSettingsMenu';
import renderUserCategorySettings from './contextMenus/categorySettingsMenu';
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
  getCurrentContentID,
  getTodoElement,
  getAdditionalFeatureContainer,
  updateInputValue,
  applyFocus,
  disableInput,
  enableInput,
  replace,
} from "./viewHelpers";

export {
  renderAddTodoModal,
  renderEditTodoModal,
  renderCategoriesDropdownList,
  renderCategorySelectItem,
  renderDeleteTodoModal,
  renderDeleteCategoryModal,
  renderSearchModal,
  renderAnchorTodoElement,
  deleteAllAnchorTodoElements,
  markAnchorTodoElementAsCompleted,
};

//
//
// Nav buttons management: creating, rendering, deleting, renaming, toggling classes
//
//

function showNavbar() {
  DOMCache.menuButton.setAttribute("aria-label", "Hide menu");
  DOMCache.nav.style.visibility = "visible";

  if (hasClass(DOMCache.header, "hidden")) {
    removeClass(DOMCache.header, "hidden");
    removeClass(DOMCache.body, "header-hidden");
    removeClass(DOMCache.menuButton, "selected");
  }

  addClass(DOMCache.header, "visible");
  if (!hasClass(DOMCache.header, "mobile")) return;

  // If mobile, disable scrolling and add a grey overlay behind header that prevents user input
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

function hideNavbar() {
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

function toggleNavbar(e) {
  e.stopImmediatePropagation();
  if (hasClass(DOMCache.header, "hidden")) {
    showNavbar();
    return;
  }

  hideNavbar();
}

function checkIfMobile() {
  if (hasClass(DOMCache.header, "mobile")) {
    removeClass(DOMCache.header, "mobile");
  }

  if (DOMCache.mobileVersion.matches) {
    addClass(DOMCache.header, "mobile");
    hideNavbar();
  }
}

export function selectNewCategoryButton(categoryID) {
  // Is either a devCategory button that has an ID, or a userCategory button that has a
  // dataset.id. Looks for a devCategory first since they are only three ('All todos',
  // 'Today', 'Next 7 days');
  const newButton =
    find(DOMCache.devNavbarList, `[id="${categoryID}"]`) ||
    find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
  addClass(getParentOf(newButton), "selected");
}

export function unselectOldCategoryButton() {
  removeClass(find(DOMCache.nav, ".selected"), "selected");
}

export function updateCategoryTodosCount(categoryID, todosCount) {
  // Is either a devCategory button that has an ID, or a userCategory button that has a
  // dataset.id. Looks for a devCategory first since they are only three ('All todos',
  // 'Today', 'Next 7 days');
  const category =
    find(DOMCache.devNavbarList, `[id="${categoryID}"]`) ||
    find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
  const todosCounter = find(category, ".todos-count");
  updateTextContent(todosCounter, todosCount);
}

export function updateUserCategoriesCount(categoriesCount) {
  updateTextContent(
    find(DOMCache.userNavbar, "#categories-counter"),
    categoriesCount,
  );
}

function toggleUserCategoriesList() {
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

export function renderUserCategoryButton(categoryName, categoryID) {
  const userCategoryButton = Creator.createUserCategoryButton(
    categoryName,
    categoryID,
  );

  render(DOMCache.userNavbarList, userCategoryButton);
  categoriesContent[categoryID] = "";
}

function handleUserCategoryClickEvents(e) {
  const li = e.target.closest("li");
  const userCategoryButton = find(li, ".todo-holder");

  if (!li) return;
  if (find(userCategoryButton, ".input-container")) return;

  if (hasClass(e.target, "settings-button")) {
    e.stopImmediatePropagation();
    renderUserCategorySettings(find(getParentOf(find(
      DOMCache.userNavbarList,
      `[data-id="${userCategoryButton.dataset.id}"]`
    )), '.settings-button'), userCategoryButton.dataset.id);
    return;
  }

  // bind is used because devCategory buttons have the sendDisplayContentRequest
  // function attached directly on themselves, therefore providing a 'this' value.
  // userCategory button click events, on the other hand, are handled by their ancestor,
  // thus the userCategory buttons are manually provided as 'this'
  sendDisplayContentRequest.bind(userCategoryButton)();
}

function renderUserCategoryRenameInput(categoryID) {
  const userCategoryButton = find(
    DOMCache.userNavbarList,
    `[data-id="${categoryID}"]`,
  );
  const userCategoryButtonName = find(userCategoryButton, ".button-name");
  const userCategorySettingsButton = find(
    getParentOf(userCategoryButton),
    ".settings-button",
  );

  renderRenameInput(
    userCategoryButton,
    userCategoryButtonName,
    userCategorySettingsButton,
    Controller.renameCategory,
  );
}

export function renameUserCategoryButton(categoryID, newName) {
  updateTextContent(
    find(
      find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`),
      ".button-name",
    ),
    newName,
  );
}

export function deleteUserCategoryButton(categoryID) {
  const button = find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
  // For accessibility reasons, user category buttons are stored into a li element
  getParentOf(button).remove();

  // Delete the property with the same name as the categoryID from the categoriesContent object
  delete categoriesContent[categoryID];
}

//
//
// Content management: rendering, editing and deleting
//
//

// Renders the settings button when the current category that has it's content rendered is editable (it's a userCategory)
export function renderContentSettingsButton() {
  const contentSettingsButton = Creator.createSettingsButton("Edit category");
  contentSettingsButton.addEventListener("click", requestUserCategorySettings);
  render(DOMCache.contentSettings, contentSettingsButton);
}

function requestUserCategorySettings(e) {
  e.stopImmediatePropagation();
  renderUserCategorySettings(e.target, getCurrentContentID())
}

// Deletes the settings button when the current category that has it's content rendered is non-editable (it's a devCategory);
export function deleteContentSettingsButton() {
  const editContentTitleButton = find(
    DOMCache.contentSettings,
    ".settings-container",
  );
  editContentTitleButton.removeEventListener("click", requestUserCategorySettings);
  editContentTitleButton.remove();
}

function renderRenameContentTitleInput() {
  const contentTitle = find(DOMCache.contentHeader, ".content-title");
  const contentSettingsButton = find(
    DOMCache.contentHeader,
    ".settings-button",
  );

  renderRenameInput(
    DOMCache.content,
    contentTitle,
    contentSettingsButton,
    Controller.renameCategory,
  );
}

export function renameContentTitle(categoryName) {
  updateTextContent(DOMCache.contentTitle, categoryName);
}

// Type can be either 'sort' or 'filter',
// Current setting is the current sortingMethod or currentFilter method
// ...settingNames are the available sorting or filter methods for the current category that is being rendered
export function renderContentCustomizer(type, currentSetting, ...settingNames) {
  // By default, clicking a similar button (settings opener) prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This results in two settings lists being visible in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));

  // Get either the sort-category-button or the filter-category-button
  const location = find(DOMCache.contentSettings, `.${type}-category-button`);
  addClass(location, "focused");

  const types = {
    sort: {
      removeEventListener: function () {
        location.removeEventListener("click", sendSortSettingsRequest);
      },
      addEventListener: function () {
        location.addEventListener("click", sendSortSettingsRequest);
      },
      applySetting: function (settingType) {
        Controller.handleSortTodosRequest(settingType, getCurrentContentID());
      },
    },
    filter: {
      removeEventListener: function () {
        location.removeEventListener("click", sendFilterSettingsRequest);
      },
      addEventListener: function () {
        location.addEventListener("click", sendFilterSettingsRequest);
      },
      applySetting: function (settingType) {
        Controller.handleFilterTodosRequest(settingType, getCurrentContentID());
      },
    },
  };

  // Removes the event listener that leads to this function being run to prevent conflicts with the
  // new behavior defined within this function, which states that clicking the settingsButton
  // deletes the filter or sorting methods list instead of rendering it

  types[type].removeEventListener();
  location.addEventListener("click", deleteSettings);

  const dropdownListContainer = Creator.createCustomizeSettingsList();
  const dropdownListTitle = find(dropdownListContainer, ".dropdown-list-title");
  const dropdownList = find(dropdownListContainer, ".dropdown-list");
  dropdownList.addEventListener("click", handleSettingItemsClickEvents);

  if (type === "sort") {
    updateTextContent(dropdownListTitle, `${capitalizeFirstLetter(type)} by`);
  }

  if (type === "filter") {
    updateTextContent(dropdownListTitle, `${capitalizeFirstLetter(type)}`);
  }

  // Render the dropdownListContainer in the parent of the button that triggers the event to prevent accessibility
  // errors when nesting div elements into button elements
  render(getParentOf(location), dropdownListContainer);

  function handleSettingItemsClickEvents(e) {
    if (hasClass(e.target, "named-button")) {
      applySetting(e.target.dataset.id);
      deleteSettings(e);
    }
  }

  if (settingNames) {
    // Render a sorting or filter method button into the settingsList for each settingName
    settingNames.forEach((settingName) => {
      const settingItem = Creator.createSettingItem(
        capitalizeFirstLetter(settingName.split("-").join(" ")),
        `${type}-todos`,
        settingName,
      );

      if (find(settingItem, "button").dataset.id === currentSetting) {
        addClass(find(settingItem, "button"), "selected");
      }
      render(dropdownList, settingItem);
    });
  }

  document.addEventListener("click", deleteByClickOutside);
  function deleteByClickOutside(e) {
    if (getParentOf(e.target) !== dropdownList) deleteSettings(e);
  }

  document.addEventListener("keyup", deleteByKeyboard);
  function deleteByKeyboard(e) {
    if (e.key === "Escape") {
      deleteSettings(e);
    }
  }

  // Trap TAB focus within settingsList
  const trap = focusTrap.createFocusTrap(dropdownList, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
  });
  trap.activate();

  function deleteSettings(e) {
    e.stopImmediatePropagation();
    trap.deactivate();

    // Remove event listeners to prevent memory leaks and other unwanted behavior
    location.removeEventListener("click", deleteSettings);
    dropdownList.removeEventListener("click", handleSettingItemsClickEvents);

    document.removeEventListener("click", deleteByClickOutside);
    document.removeEventListener("keyup", deleteByKeyboard);

    // Re-attach  the event listener that leads to this function being run
    types[type].addEventListener();

    // Remove the settingsList from the DOM;
    dropdownListContainer.remove();
    removeClass(location, "focused");
  }

  function applySetting(settingType) {
    types[type].applySetting(settingType);
  }
}

function sendSortSettingsRequest(e) {
  e.stopImmediatePropagation();
  PubSub.publish("SORT_SETTINGS_REQUEST");
}

function sendFilterSettingsRequest(e) {
  e.stopImmediatePropagation();
  PubSub.publish("FILTER_SETTINGS_REQUEST");
}

// Notifies the user whether the current content is being sorted or filtered
export function markContentSortSetting(state) {
  if (state === true) {
    addClass(find(DOMCache.sortSetting, "button"), `sortingOn`);
    return;
  }

  removeClass(find(DOMCache.sortSetting, "button"), `sortingOn`);
}

export function markContentFilterSetting(state) {
  if (state === true) {
    addClass(find(DOMCache.filterSetting, "button"), `filterOn`);
    return;
  }

  removeClass(find(DOMCache.filterSetting, "button"), `filterOn`);
}

export function renderTodosList(categoryID) {
  // Set the dataset.ID of the 'content' container to match the current ID of the category that provides the todosList
  DOMCache.content.dataset.id = categoryID;

  // Access the property with the same name as the categoryID on the categoriesContent object,
  // and create a reference to the todosList that will be further used by numerous other Renderer functions
  categoriesContent[categoryID] = Creator.createElementWithClass(
    "ul",
    "todos-list",
  );
  categoriesContent[categoryID].addEventListener(
    "click",
    handleTodoElementsClickEvents,
  );
  categoriesContent[categoryID].addEventListener(
    "change",
    handleTodoElementsChangeEvents,
  );

  // Also insert the value of the property into the DOM
  DOMCache.content.insertBefore(
    categoriesContent[categoryID],
    DOMCache.contentAddButton,
  );
}

export function deleteTodosList(categoryID) {
  // Remove event listeners to prevent conflicts and avoid memory leaks
  categoriesContent[categoryID].removeEventListener(
    "click",
    handleTodoElementsClickEvents,
  );
  categoriesContent[categoryID].removeEventListener(
    "change",
    handleTodoElementsChangeEvents,
  );

  // Remove the todos list from the DOM and from the memory
  find(DOMCache.content, ".todos-list").remove();
  categoriesContent[categoryID].remove();
  categoriesContent[categoryID] = "";
}

//
//
// Todo management: rendering, deleting, editing, renaming, toggling classes
//
//

function handleTodoElementsClickEvents(e) {
  const todoItem = e.target.closest(".todo-item");

  if (!todoItem) return;
  // There is a separate 'change' event that is handling the completedStatusInput,
  // which contains a checkbox and a span
  if (e.target.type === "checkbox" || e.target.tagName === "SPAN") return;

  if (hasClass(e.target, "settings-button")) {
    e.stopImmediatePropagation();
    renderTodoSettings(find(
      find(categoriesContent[getCurrentContentID()], `[data-id="${todoItem.dataset.id}"]`),
      ".settings-button",
    ), todoItem.dataset.id);
    return;
  }

  if (hasClass(e.target, "expand-button")) {
    if (hasClass(todoItem, "expanded")) {
      deleteTodoAdditionalInfo(todoItem.dataset.id);
      return;
    }
    PubSub.publish("TODO_EXPAND_REQUEST", todoItem.dataset.id);
    return;
  }

  PubSub.publish("TODO_MODAL_REQUEST", todoItem.dataset.id);
}

function handleTodoElementsChangeEvents(e) {
  const todoItem = e.target.closest(".todo-item");

  if (e.target.type === "checkbox") {
    PubSub.publish("TODO_COMPLETED_STATUS_CHANGE_REQUEST", todoItem.dataset.id);
  }
}

export function renderTodoElement(todoID, index, todoTitle) {
  const todoItem = Creator.createTodoItem(todoID, index, todoTitle);
  // Insert the todoItem at the passed index to ensure that Todo DOM elements
  // and Todo objects are organized in the same order based on their category sorting or filtering methods
  categoriesContent[getCurrentContentID()].insertBefore(
    todoItem,
    find(categoriesContent[getCurrentContentID()], `[data-index="${index}"]`),
  );
}

// Function run by the Controller after organizing a category that is currently being rendered.
// Refreshes the index of Todo DOM elements to mirror the index property of Todo objects
export function updateTodoIndex(todoID, index) {
  find(
    categoriesContent[getCurrentContentID()],
    `[data-id="${todoID}"]`,
  ).dataset.index = index;
}

export function moveTodoElement(todoID, index) {
  // Moves a Todo DOM element at a specified index. Used by the Controller
  // whenever editing a Todo property changes its order relative to its siblings in case
  // a sorting or filter method is being used by the category
  const currentContent = categoriesContent[getCurrentContentID()];
  const todoElement = find(currentContent, `[data-id="${todoID}"]`);
  currentContent.insertBefore(
    todoElement,
    find(currentContent, `[data-index="${index}"]`),
  );
}

export function deleteTodoElement(todoID) {
  const todoElement = find(
    categoriesContent[getCurrentContentID()],
    `[data-id="${todoID}"]`,
  );
  todoElement.remove();
}

// Adds a button on the Todo DOM element that allows the user to render additional information
// about the Todo.
export function renderTodoElementExpander(todoID) {
  const todoItem = find(
    categoriesContent[getCurrentContentID()],
    `[data-id="${todoID}"]`,
  );
  const todoExpander = Creator.createExpandButton("Show todo additional info");
  render(todoItem, todoExpander);
}

// Deletes the todoElementExpander when the Todo DOM element no longer contains any additional info
// that can be rendered
export function deleteTodoElementExpander(todoID) {
  const todoItem = find(
    categoriesContent[getCurrentContentID()],
    `[data-id="${todoID}"]`,
  );
  const todoExpander = find(todoItem, ".expand-button");
  todoExpander.remove();
}

// Inserts a container at the end of the Todo DOM element that contains additional information (eg. priority, dueDate, category);
export function renderTodoAdditionalInfo(todoID) {
  const todoElement = find(DOMCache.main, `[data-id="${todoID}"]`);
  const todoElementExpander = find(todoElement, ".expand-button");
  todoElementExpander.setAttribute("aria-label", "Hide todo additional info");
  const todoAdditionalInfo = Creator.createElementWithClass(
    "div",
    "todo-additional-info",
  );

  todoElement.insertBefore(todoAdditionalInfo, todoElementExpander);
  addClass(todoElement, "expanded");
}

export function deleteTodoAdditionalInfo(todoID) {
  const todoElement = find(DOMCache.main, `[data-id="${todoID}"]`);
  const todoElementExpander = find(todoElement, ".expand-button");
  if (todoElementExpander)
    todoElementExpander.setAttribute("aria-label", "Show todo additional info");
  // Ensures that the animation works by waiting for it to finish before changing
  // other properties that do not transition their state
  todoElement.addEventListener("animationend", deleteAdditionalInfo);
  removeClass(todoElement, "expanded");

  function deleteAdditionalInfo() {
    if (!hasClass(todoElement, "expanded")) {
      find(todoElement, ".todo-additional-info").remove();
    }
    todoElement.removeEventListener("animationend", deleteAdditionalInfo);
  }
}

// Manually triggers a transitionend event when the todoAdditionalInfo container within a Todo DOM element
// is visible and needs to be deleted because it no longer contains any additional information
// (eg. when todoAdditionalInfo only contains its category, but the category is removed by the user)
export function dispatchTransitionEndEvent(todoID) {
  find(DOMCache.main, `[data-id="${todoID}"]`).dispatchEvent(
    new Event("transitionend"),
  );
}

export function updateTodoElementCompletedStatus(todoID, status) {
  if (!todoID || !status) return;

  const todoElement = find(
    categoriesContent[getCurrentContentID()],
    `[data-id="${todoID}"]`,
  );
  const todoCompletedStatusTogglerInput = find(
    todoElement,
    'input[type="checkbox"]',
  );

  if (status === "completed") {
    addClass(todoElement, "completed");
    todoCompletedStatusTogglerInput.setAttribute("checked", "");
  }

  if (status === "uncompleted") {
    removeClass(todoElement, "completed");
    todoCompletedStatusTogglerInput.removeAttribute("checked");
  }
}

// Adds a class to the completedStatusSpan that styles the Todo to reflect its current priority
export function colorTodoCompletedStatusSpan(todoID, priority) {
  const todoElement = find(
    categoriesContent[getCurrentContentID()],
    `[data-id="${todoID}"]`,
  );
  const todoCompletedStatusSpan = find(todoElement, "span");

  todoCompletedStatusSpan.className = "";
  if (!priority) return;
  addClass(todoCompletedStatusSpan, `priority-${priority}`);
}

export function updateTodoTitle(todoID, value) {
  updateTextContent(find(getTodoElement(todoID), ".todo-title"), value);
}

export function renderTodoMiniDueDate(todoID, value) {
  const todoInfo = find(getTodoElement(todoID), ".todo-info");
  const settingsContainer = find(todoInfo, ".settings-container");
  const miniDueDate = Creator.createTodoMiniDueDate(value);
  todoInfo.insertBefore(miniDueDate, settingsContainer);
}

export function updateTodoMiniDueDate(todoID, value) {
  updateTextContent(find(getTodoElement(todoID), ".todo-mini-due-date"), value);
}

export function deleteTodoMiniDueDate(todoID) {
  find(getTodoElement(todoID), ".todo-mini-due-date").remove();
}

export function renderTodoDescription(todoID, value) {
  const additionalFeatureContainer = getAdditionalFeatureContainer(todoID);
  const description = Creator.createTodoDescription(value);
  render(additionalFeatureContainer, description);
}

export function updateTodoDescription(todoID, value) {
  updateTextContent(
    find(getTodoElement(todoID), ".todo-description-paragraph"),
    value,
  );
}

export function deleteTodoDescription(todoID) {
  find(getTodoElement(todoID), ".todo-description").remove();
}

export function renderTodoPriority(todoID, value) {
  const additionalFeatureContainer = getAdditionalFeatureContainer(todoID);
  const priority = Creator.createTodoPriority(value);
  render(additionalFeatureContainer, priority);
}

export function updateTodoPriority(todoID, value) {
  updateTextContent(
    find(
      find(getTodoElement(todoID), "[class^='todo-priority']"),
      ".info-holder-value",
    ),
    value,
  );
}

export function deleteTodoPriority(todoID) {
  find(getTodoElement(todoID), "[class^='todo-priority']").remove();
}

export function renderTodoDueDate(todoID, value) {
  const additionalFeatureContainer = getAdditionalFeatureContainer(todoID);
  const dueDate = Creator.createTodoDueDate(value);
  render(additionalFeatureContainer, dueDate);
}

export function updateTodoDueDate(todoID, value) {
  updateTextContent(
    find(find(getTodoElement(todoID), ".todo-due-date"), ".info-holder-value"),
    value,
  );
}

export function deleteTodoDueDate(todoID) {
  find(getTodoElement(todoID), ".todo-due-date").remove();
}

export function renderTodoCategory(todoID, value) {
  const additionalFeatureContainer = getAdditionalFeatureContainer(todoID);
  const category = Creator.createTodoCategory(value);
  render(additionalFeatureContainer, category);
}

export function updateTodoCategory(todoID, value) {
  updateTextContent(
    find(find(getTodoElement(todoID), ".todo-category"), ".info-holder-value"),
    value,
  );
}

export function deleteTodoCategory(todoID) {
  find(getTodoElement(todoID), ".todo-category").remove();
}

export function markTodoAsOverdue(todoID) {
  addClass(
    find(categoriesContent[getCurrentContentID()], `[data-id="${todoID}"]`),
    "overdue",
  );
}

export function markTodoAsDue(todoID) {
  removeClass(
    find(categoriesContent[getCurrentContentID()], `[data-id="${todoID}"]`),
    "overdue",
  );
}

export function markTodoAsFiltered(state, todoID) {
  if (!state || todoID) return;

  const todoElement = getTodoElement(todoID);
  const todoCompletedStatusToggler = find(todoElement, "input");
  const todoSettingsButton = find(todoElement, ".settings-button");
  const todoAdditionalInfo = find(todoElement, ".todo-additional-info");
  const todoExpander = find(todoElement, ".expand-button");

  if (state === "out") {
    // Turns the Todo DOM element into an un-focusable, un-clickable element.
    // If its additionalInfo is being rendered, it deletes it
    todoElement.setAttribute("tabindex", "-1");
    todoCompletedStatusToggler.setAttribute("tabindex", "-1");
    todoSettingsButton.setAttribute("tabindex", "-1");
    if (todoAdditionalInfo) deleteTodoAdditionalInfo(todoID);
    if (todoExpander) todoExpander.setAttribute("tabindex", "-1");
    addClass(todoElement, "filteredOut");
  }

  if (state === "in") {
    // Reverts the Todo DOM element to its default values
    todoElement.setAttribute("tabindex", "0");
    todoCompletedStatusToggler.removeAttribute("tabindex");
    todoSettingsButton.removeAttribute("tabindex");
    if (todoExpander) todoExpander.removeAttribute("tabindex");
    removeClass(todoElement, "filteredOut");
  }
}

// Highlights the Todo DOM element after the user selected it from the search results list
export function highlightTodoElement(todoID) {
  const todoElement = find(
    categoriesContent[getCurrentContentID()],
    `[data-id="${todoID}"]`,
  );

  const removeHighlight = () => {
    removeClass(todoElement, "highlighted");
    if (hasClass(todoElement, "filteredOut"))
      todoElement.setAttribute("tabindex", "-1");
    todoElement.removeEventListener("blur", removeHighlight);
    window.removeEventListener("click", removeHighlight);
    window.removeEventListener("touchstart", removeHighlight);
  };

  // If the element is filtered out, make it focusable until removeHighlight is called
  if (hasClass(todoElement, "filteredOut"))
    todoElement.setAttribute("tabindex", "0");
  todoElement.addEventListener("blur", removeHighlight);
  addClass(todoElement, "highlighted");
  applyFocus(todoElement);
  window.addEventListener("click", removeHighlight);
  window.addEventListener("touchstart", removeHighlight);
}

function sendTodoModalRequest(e) {
  // If the callLocation is the addButton located at the end of a todosList, ask the Controller to handle
  // a complex modal request and provide the dataset.id of the 'content' container as an argument
  if (hasClass(e.target, "add-button")) {
    PubSub.publish("TODO_MODAL_REQUEST", getParentOf(e.target).dataset.id);
    return;
  }
  // Otherwise call the renderTodoModal with the 'all-todos' argument, which is a devCategory that holds all todos,
  // and has no special logic, thus can be considered as 'default', and using it as an argument can be considered
  // as asking for the default behavior of a function
  renderAddTodoModal("all-todos");
}

// Location is the element that will contain the renameInput,
// nameContainer is the element that holds the current name and will be replaced with the renameInput,
// callLocation is the button that lead to this function, and action is the function
// that should be run after the new name is submitted
function renderRenameInput(location, nameContainer, callLocation, action) {
  // Create a text input field using Creator
  const renameField = Creator.createInput(
    "New category name",
    "name",
    "category-edit-field",
    "text",
  );

  const renameInput = find(renameField, "input");
  renameInput.addEventListener("focus", focusOnInput);
  renameInput.addEventListener("mousedown", preventPropagation);

  document.addEventListener("mousedown", clickAction);
  document.addEventListener("keydown", keyboardActions);

  replace(renameField, nameContainer);
  updateInputValue(renameInput, nameContainer.textContent);
  applyFocus(renameInput);

  // Trap TAB focusing within the renameField
  const trap = focusTrap.createFocusTrap(renameField, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    setReturnFocus: () => callLocation,
  });
  trap.activate();

  function applyChanges() {
    discardChanges();
    action(location.dataset.id, renameInput.value.trim());
  }

  function discardChanges() {
    trap.deactivate();
    // Remove events to prevent memory leaks and other unwanted behavior
    removeEvents();
    enableInput(DOMCache.body);
    replace(nameContainer, renameField);
  }

  function removeEvents() {
    renameInput.removeEventListener("focus", focusOnInput);
    renameInput.removeEventListener("mousedown", preventPropagation);
    document.removeEventListener("mousedown", clickAction);
    document.removeEventListener("keydown", keyboardActions);
  }

  function preventPropagation(e) {
    e.stopImmediatePropagation();
  }
  // Discard changes if user tries to submit an empty field
  function clickAction() {
    if (renameInput.value.trim().length === 0) {
      discardChanges();
      return;
    }

    applyChanges();
  }

  function keyboardActions(e) {
    // Discard changes if user tries to submit an empty field
    if (e.key === "Enter") {
      if (renameInput.value.trim().length === 0) {
        discardChanges();
        return;
      }

      applyChanges();
    }

    if (e.key === "Escape") discardChanges();
  }

  function focusOnInput() {
    disableInput(DOMCache.body);
    enableInput(renameInput);
  }
}

export function init() {
  // DOM insertion
  render(
    DOMCache.body,
    DOMCache.modal,
    DOMCache.header,
    DOMCache.main,
    DOMCache.footer,
    DOMCache.headerOverlay,
  );
  render(find(DOMCache.header, "#header-top-side"), DOMCache.menuButton);
  render(DOMCache.header, DOMCache.nav);
  render(DOMCache.nav, DOMCache.devNavbar, DOMCache.userNavbar);
  render(DOMCache.devNavbar, DOMCache.devNavbarList);
  render(DOMCache.devNavbarList, DOMCache.addTodoButton, DOMCache.searchButton);
  render(
    find(DOMCache.userNavbar, "#user-nav-header"),
    DOMCache.addCategoryButton,
    DOMCache.expandCategoriesButton,
  );
  render(DOMCache.userNavbar, DOMCache.userNavbarList);
  render(DOMCache.main, DOMCache.contentHeader, DOMCache.content);
  render(
    find(DOMCache.contentHeader, "header"),
    DOMCache.contentTitle,
    DOMCache.contentSettings,
  );
  render(
    DOMCache.contentSettings,
    DOMCache.sortSetting,
    DOMCache.filterSetting,
  );
  render(DOMCache.content, DOMCache.contentAddButton);

  // Event listener attaching
  DOMCache.menuButton.addEventListener("click", toggleNavbar);
  find(DOMCache.addTodoButton, "button").addEventListener(
    "click",
    sendTodoModalRequest,
  );
  find(DOMCache.searchButton, "button").addEventListener(
    "click",
    renderSearchModal,
  );
  DOMCache.addCategoryButton.addEventListener("click", renderAddCategoryModal);
  DOMCache.expandCategoriesButton.addEventListener(
    "click",
    toggleUserCategoriesList,
  );
  DOMCache.userNavbarList.addEventListener(
    "click",
    handleUserCategoryClickEvents,
  );
  DOMCache.sortSetting.addEventListener("click", sendSortSettingsRequest);
  DOMCache.filterSetting.addEventListener("click", sendFilterSettingsRequest);
  DOMCache.contentAddButton.addEventListener("click", sendTodoModalRequest);

  DOMCache.mobileVersion.addEventListener("change", checkIfMobile);
  // Manually fires a change event to detect whether the app should initialize in mobile version
  DOMCache.mobileVersion.dispatchEvent(new Event("change"));
  // Enables the CSS :active selector on iOS devices
  document.addEventListener("touchstart", function () {}, false);
}
