import * as focusTrap from "focus-trap";
import { createElementWithClass } from "../creator";
import {
  removeClass,
  addClass,
  getParentOf,
  render,
  isOutOfBounds,

} from "../viewHelpers";

export default function ContextMenu(callLocation) {
  const contextMenu = {};
  contextMenu.settingsList = createElementWithClass("ul", "settings-list");
  contextMenu.trap = focusTrap.createFocusTrap(contextMenu.settingsList, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
  });
  contextMenu.checkBounds = function checkBounds() {
    if (isOutOfBounds("bottom", contextMenu.settingsList, 100)) {
      addClass(contextMenu.settingsList, "top-positioned");
    }
  };
  contextMenu.deleteByClickOutside = function deleteByClickOutside(e) {
    if (getParentOf(e.target) !== contextMenu.settingsList)
      contextMenu.deleteSettings(e);
  };
  contextMenu.deleteByKeyboard = function deleteByKeyboard(e) {
    if (e.key === "Escape") {
      contextMenu.deleteSettings(e);
    }
  };
  contextMenu.deleteSettings = function deleteSettings(e) {
    e.stopImmediatePropagation();
    contextMenu.trap.deactivate();
    document.removeEventListener("click", contextMenu.deleteByClickOutside);
    document.removeEventListener("keyup", contextMenu.deleteByKeyboard);
    contextMenu.settingsList.remove();
    removeClass(callLocation, "focused");
    callLocation.removeEventListener('click', contextMenu.deleteSettings);
  };
  contextMenu.initContextMenu = function initContextMenu() {
    addClass(callLocation, "focused");
    render(getParentOf(callLocation), contextMenu.settingsList);
    callLocation.addEventListener('click', contextMenu.deleteSettings);
    document.addEventListener("click", contextMenu.deleteByClickOutside);
    document.addEventListener("keyup", contextMenu.deleteByKeyboard);
  };

  return contextMenu;
}