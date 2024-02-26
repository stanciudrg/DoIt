import PubSub from "pubsub-js";
import { createSettingItem } from "../creator";
import ContextMenu from "./contextMenu";
import { render } from "../viewHelpers";

// Creates an object that inherits from ContextMenu and adds new DOM elements
// and new functionality to its context menu element
function CategorySettingsMenu(callLocation, categoryID) {
  const categorySettingsMenu = Object.create(ContextMenu(callLocation));
  categorySettingsMenu.renameButton = createSettingItem("Rename");
  categorySettingsMenu.deleteButton = createSettingItem("Delete");
  // Sends a request to render a RenameInput for renaming the category
  categorySettingsMenu.renameCategory = function renameCategory(e) {
    e.stopImmediatePropagation();
    categorySettingsMenu.deleteSettings(e);
    PubSub.publish("RENDER_RENAME_INPUT_REQUEST", { callLocation, categoryID });
  };

  // Sends a request to open a modal for confirming the category's
  // deletion
  categorySettingsMenu.deleteCategory = function deleteCategory(e) {
    e.stopImmediatePropagation();
    categorySettingsMenu.deleteSettings(e);
    PubSub.publish("DELETE_CATEGORY_MODAL_REQUEST", categoryID);
  };

  // This object's own deleteSettingsFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
  categorySettingsMenu.deleteSettingsFn = function deleteSettingsFn() {
    categorySettingsMenu.renameButton.removeEventListener(
      "click",
      categorySettingsMenu.renameCategory,
    );
    categorySettingsMenu.deleteButton.removeEventListener(
      "click",
      categorySettingsMenu.deleteCategory,
    );
  };

  categorySettingsMenu.initCategorySettingsMenu =
    function initCategorySettingsMenu() {
      categorySettingsMenu.initContextMenu();
      categorySettingsMenu.renameButton.addEventListener(
        "click",
        categorySettingsMenu.renameCategory,
      );
      render(
        categorySettingsMenu.settingsList,
        categorySettingsMenu.renameButton,
      );
      categorySettingsMenu.deleteButton.addEventListener(
        "click",
        categorySettingsMenu.deleteCategory,
      );
      render(
        categorySettingsMenu.settingsList,
        categorySettingsMenu.deleteButton,
      );
      categorySettingsMenu.trap.activate();
      categorySettingsMenu.checkBounds();
      // Adds this deleteSettingsFn to the list of additionalDeleteSettings functions
      // that are called by the deleteSettings method on ContextMenu
      categorySettingsMenu.addAdditionalDeleteSettingsFn(
        categorySettingsMenu.deleteSettingsFn,
      );
    };

  return categorySettingsMenu;
}

// Renders a CategorySettingsMenu at the specified location
export default function renderUserCategorySettings(callLocation, categoryID) {
  // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));
  const categorySettingsMenu = CategorySettingsMenu(callLocation, categoryID);
  categorySettingsMenu.initCategorySettingsMenu();
}
