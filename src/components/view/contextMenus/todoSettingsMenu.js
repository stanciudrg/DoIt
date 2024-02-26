import PubSub from "pubsub-js";
import { createSettingItem } from "../creator";
import ContextMenu from "./contextMenu";
import { render } from "../viewHelpers";

// Creates an object that inherits from ContextMenu and adds new DOM elements
// and new functionality to its context menu element
function TodoSettingsMenu(callLocation, todoID) {
  const todoSettingsMenu = Object.create(ContextMenu(callLocation));
  todoSettingsMenu.editButton = createSettingItem("Edit");
  todoSettingsMenu.deleteButton = createSettingItem("Delete");
  // Sends a request to open a modal for editing the todo
  todoSettingsMenu.editTodo = function editTodo(e) {
    e.stopImmediatePropagation();
    todoSettingsMenu.deleteSettings(e);
    PubSub.publish("TODO_MODAL_REQUEST", todoID);
  };

  // Sends a request to open a modal for confirming the todo's
  // deletion
  todoSettingsMenu.deleteTodo = function deleteTodo(e) {
    e.stopImmediatePropagation();
    todoSettingsMenu.deleteSettings(e);
    PubSub.publish("DELETE_TODO_MODAL_REQUEST", todoID);
  };

  // This object's own deleteSettingsFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
  todoSettingsMenu.deleteSettingsFn = function deleteSettingsFn() {
    todoSettingsMenu.editButton.removeEventListener(
      "click",
      todoSettingsMenu.editTodo,
    );
    todoSettingsMenu.deleteButton.removeEventListener(
      "click",
      todoSettingsMenu.deleteTodo,
    );
  }

  todoSettingsMenu.initTodoSettingsMenu = function initTodoSettingsMenu() {
    todoSettingsMenu.initContextMenu();
    todoSettingsMenu.editButton.addEventListener(
      "click",
      todoSettingsMenu.editTodo,
    );
    render(todoSettingsMenu.settingsList, todoSettingsMenu.editButton);
    todoSettingsMenu.deleteButton.addEventListener(
      "click",
      todoSettingsMenu.deleteTodo,
    );
    render(todoSettingsMenu.settingsList, todoSettingsMenu.deleteButton);
    todoSettingsMenu.trap.activate();
    todoSettingsMenu.checkBounds();
    // Adds this deleteSettingsFn to the list of additionalDeleteSettings functions
    // that are called by the deleteSettings method on ContextMenu
    todoSettingsMenu.addAdditionalDeleteSettingsFn(todoSettingsMenu.deleteSettingsFn)
  };

  return todoSettingsMenu;
}

// Renders a TodoSettingsMenu at the specified location
export default function renderTodoSettings(callLocation, todoID) {
    // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));
  const todoSettingsMenu = TodoSettingsMenu(callLocation, todoID);
  todoSettingsMenu.initTodoSettingsMenu();
}
