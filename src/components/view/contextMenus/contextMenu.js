import * as focusTrap from "focus-trap";
import { createElementWithClass } from "../creator";
import {
  removeClass,
  addClass,
  getParentOf,
  render,
  isOutOfBounds,
} from "../viewHelpers";

// Creates a ContextMenu object that holds and manipulates an empty context menu
// element
export default function ContextMenu(callLocation) {
  const contextMenu = {};
  contextMenu.container = createElementWithClass(
    "div",
    "settings-list-container",
  );
  contextMenu.settingsList = createElementWithClass("ul", "settings-list");
  // Trap TAB focusing within the contextMenu.settingsList
  contextMenu.trap = focusTrap.createFocusTrap(contextMenu.settingsList, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
  });
  // Holds additional functions to be called by the deleteSettings function
  contextMenu.additionalDeleteSettingsFns = [];
  // The default function to be called by the deleteSettings function
  contextMenu.defaultDeleteSettingsFn = function defaultDeleteSettingsFn(e) {
    e.stopImmediatePropagation();
    contextMenu.trap.deactivate();
    document.removeEventListener("click", contextMenu.deleteByClickOutside);
    document.removeEventListener("keyup", contextMenu.deleteByKeyboard);
    contextMenu.container.remove();
    removeClass(callLocation, "focused");
    callLocation.removeEventListener("click", contextMenu.deleteSettings);
  };
  // Pushes additional functions to be called by the deleteSettings function
  contextMenu.addAdditionalDeleteSettingsFn =
    function addAdditionalDeleteSettingsFn(newFn) {
      contextMenu.additionalDeleteSettingsFns.push(newFn);
    };
  // Changes the context menu's position if it's out of bounds
  contextMenu.checkBounds = function checkBounds() {
    if (isOutOfBounds("bottom", contextMenu.settingsList, 100)) {
      addClass(contextMenu.container, "top-positioned");
    }
  };

  // Deletes the context menu if user clicks outside it
  contextMenu.deleteByClickOutside = function deleteByClickOutside(e) {
    if (getParentOf(e.target) !== contextMenu.settingsList) {
      contextMenu.deleteSettings(e);
    }
  };

  // Deletes the context menu if user presses the Escape key
  contextMenu.deleteByKeyboard = function deleteByKeyboard(e) {
    if (e.key === "Escape") {
      contextMenu.deleteSettings(e);
    }
  };

  // Deletes the context menu
  contextMenu.deleteSettings = function deleteSettings(e) {
    contextMenu.additionalDeleteSettingsFns.forEach((fn) => fn());
    contextMenu.defaultDeleteSettingsFn(e);
  };

  contextMenu.initContextMenu = function initContextMenu() {
    addClass(callLocation, "focused");
    render(contextMenu.container, contextMenu.settingsList);
    render(getParentOf(callLocation), contextMenu.container);
    callLocation.addEventListener("click", contextMenu.deleteSettings);
    document.addEventListener("click", contextMenu.deleteByClickOutside);
    document.addEventListener("keyup", contextMenu.deleteByKeyboard);
  };

  return contextMenu;
}
