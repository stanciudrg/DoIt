import PubSub from "pubsub-js";
import * as Creator from "./creator";
import { DOMCache, categoriesContent } from "./DOMCache";
import renderTodoSettings from "./contextMenus/todoSettingsMenu";
import renderUserCategorySettings from "./contextMenus/categorySettingsMenu";
import {
  hasClass,
  removeClass,
  addClass,
  find,
  updateTextContent,
  render,
  getCurrentContentID,
  getTodoElement,
  getAdditionalFeatureContainer,
  applyFocus,
} from "./viewHelpers";

//
//
// Content management: rendering, editing and deleting
//
//
// &
//
//
// Todo management: rendering, deleting, editing, renaming, toggling classes
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
  renderUserCategorySettings(e.target, getCurrentContentID());
}

// Deletes the settings button when the current category that has it's content rendered is non-editable (it's a devCategory);
export function deleteContentSettingsButton() {
  const editContentTitleButton = find(
    DOMCache.contentSettings,
    ".settings-container",
  );
  editContentTitleButton.removeEventListener(
    "click",
    requestUserCategorySettings,
  );
  editContentTitleButton.remove();
}

export function renameContentTitle(categoryName) {
  updateTextContent(DOMCache.contentTitle, categoryName);
}

export function sendSortSettingsRequest(e) {
  e.stopImmediatePropagation();
  PubSub.publish("SORT_SETTINGS_REQUEST");
}

export function sendFilterSettingsRequest(e) {
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

function handleTodoElementsClickEvents(e) {
  const todoItem = e.target.closest(".todo-item");

  if (!todoItem) return;
  // There is a separate 'change' event that is handling the completedStatusInput,
  // which contains a checkbox and a span
  if (e.target.type === "checkbox" || e.target.tagName === "SPAN") return;

  if (hasClass(e.target, "settings-button")) {
    e.stopImmediatePropagation();
    renderTodoSettings(
      find(
        find(
          categoriesContent[getCurrentContentID()],
          `[data-id="${todoItem.dataset.id}"]`,
        ),
        ".settings-button",
      ),
      todoItem.dataset.id,
    );
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
  if (!state || !todoID) return;

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
