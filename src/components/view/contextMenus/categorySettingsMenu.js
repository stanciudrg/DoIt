import PubSub from "pubsub-js";
import { createSettingItem } from "../creator";
import ContextMenu from "./contextMenu";
import { render } from "../viewHelpers";

function CategorySettingsMenu(callLocation, categoryID) {
  const categorySettingsMenu = Object.create(ContextMenu(callLocation));
  categorySettingsMenu.renameButton = createSettingItem("Rename");
  categorySettingsMenu.deleteButton = createSettingItem("Delete");
  categorySettingsMenu.renameCategory = function renameCategory(e) {
    e.stopImmediatePropagation();
    categorySettingsMenu.deleteSettings(e);
    // PubSub
  };
  categorySettingsMenu.deleteCategory = function deleteCategory(e) {
    e.stopImmediatePropagation();
    categorySettingsMenu.deleteSettings(e);
    PubSub.publish("DELETE_CATEGORY_MODAL_REQUEST", categoryID);
  };
  categorySettingsMenu.initCategorySettingsMenu = function initCategorySettingsMenu() {
    categorySettingsMenu.initContextMenu();
    categorySettingsMenu.renameButton.addEventListener(
      "click",
      categorySettingsMenu.renameCategory,
    );
    render(categorySettingsMenu.settingsList, categorySettingsMenu.renameButton);
    categorySettingsMenu.deleteButton.addEventListener(
      "click",
      categorySettingsMenu.deleteCategory,
    );
    render(categorySettingsMenu.settingsList, categorySettingsMenu.deleteButton);
    categorySettingsMenu.trap.activate();
    categorySettingsMenu.checkBounds();
  };

  return categorySettingsMenu;
}

export default function renderUserCategorySettings(callLocation, categoryID) {
    // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));
  const categorySettingsMenu = CategorySettingsMenu(callLocation, categoryID);
  categorySettingsMenu.initCategorySettingsMenu();
}
