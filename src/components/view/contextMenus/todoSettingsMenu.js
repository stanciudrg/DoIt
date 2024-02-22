import PubSub from "pubsub-js";
import { createSettingItem } from "../creator";
import ContextMenu from "./contextMenu";
import { render } from "../viewHelpers";

function TodoSettingsMenu(callLocation, todoID) {
  const todoSettingsMenu = Object.create(ContextMenu(callLocation));
  todoSettingsMenu.editButton = createSettingItem("Edit");
  todoSettingsMenu.deleteButton = createSettingItem("Delete");
  todoSettingsMenu.editTodo = function editTodo(e) {
    e.stopImmediatePropagation();
    todoSettingsMenu.deleteSettings(e);
    PubSub.publish("TODO_MODAL_REQUEST", todoID);
  };
  todoSettingsMenu.deleteTodo = function deleteTodo(e) {
    e.stopImmediatePropagation();
    todoSettingsMenu.deleteSettings(e);
    PubSub.publish("DELETE_TODO_MODAL_REQUEST", todoID);
  };
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
  };

  return todoSettingsMenu;
}

export default function renderTodoSettings(callLocation, todoID) {
    // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));
  const todoSettingsMenu = TodoSettingsMenu(callLocation, todoID);
  todoSettingsMenu.initTodoSettingsMenu();
}
