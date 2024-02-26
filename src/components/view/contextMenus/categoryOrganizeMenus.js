import PubSub from "pubsub-js";
import { createSettingItem, createElementWithClass } from "../creator";
import ContextMenu from "./contextMenu";
import { DOMCache } from "../DOMCache";
import {
  render,
  hasClass,
  find,
  addClass,
  updateTextContent,
} from "../viewHelpers";
import { capitalizeFirstLetter } from "../../universalHelpers";

// Creates an object that inherits from ContextMenu and adds new DOM elements
// and new functionality to its context menu element
function CategoryOrganizeMenu(callLocation) {
  const categoryOrganizeMenu = Object.create(ContextMenu(callLocation));
  categoryOrganizeMenu.containerTitle = createElementWithClass(
    "h4",
    "settings-list-title",
  );
  categoryOrganizeMenu.initCategoryOrganizeMenu =
    function initCategoryOrganizeMenu() {
      categoryOrganizeMenu.initContextMenu();
      categoryOrganizeMenu.container.insertBefore(
        categoryOrganizeMenu.containerTitle,
        categoryOrganizeMenu.settingsList,
      );
    };

  return categoryOrganizeMenu;
}

// Creates an object that inherits from CategoryOrganizeMenu and adds new DOM elements
// and new functionality to its context menu element.
// Expects the currentSorting type as a string, and the sortingTypes as an array
// of strings
function CategorySortMenu(currentSorting, sortingTypes) {
  const categorySortMenu = CategoryOrganizeMenu(
    find(DOMCache.sortSetting, "button"),
  );
  // Handles the click events for the setting items that will
  // be rendered inside the settingsList.
  categorySortMenu.handleSettingItemsClickEvents =
    function handleSettingItemsClickEvents(e) {
      if (hasClass(e.target, "named-button")) {
        // Sends a request to sort the todos of the current category.
        // Provides the id dataset of the clicked setting item, which is
        // a string that is equal to one of the sortingMethod types
        // declared in the category.js module
        PubSub.publish("SORT_TODOS_REQUEST", e.target.dataset.id);
        categorySortMenu.deleteSettings(e);
      }
    };
  // This object's own deleteSettingsFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
  categorySortMenu.deleteSettingsFn = function deleteSettingsFn() {
    categorySortMenu.settingsList.removeEventListener(
      "click",
      categorySortMenu.handleSettingItemsClickEvents,
    );
  };

  categorySortMenu.initCategorySortMenu = function initCategorySortMenu() {
    categorySortMenu.initCategoryOrganizeMenu();
    updateTextContent(categorySortMenu.containerTitle, "Sort by");
    categorySortMenu.settingsList.addEventListener(
      "click",
      categorySortMenu.handleSettingItemsClickEvents,
    );
    // Iterates through the array of sortingTypes and creates a setting item
    // that represents each string in the array
    if (sortingTypes) {
      sortingTypes.forEach((sortingType) => {
        const settingItem = createSettingItem(
          capitalizeFirstLetter(sortingType.split("-").join(" ")),
          `sort-todos`,
          sortingType,
        );

        if (find(settingItem, "button").dataset.id === currentSorting) {
          addClass(find(settingItem, "button"), "selected");
        }
        render(categorySortMenu.settingsList, settingItem);
      });
    }
    // Adds this deleteSettingsFn to the list of additionalDeleteSettings functions
    // that are called by the deleteSettings method on ContextMenu
    categorySortMenu.addAdditionalDeleteSettingsFn(
      categorySortMenu.deleteSettingsFn,
    );
    categorySortMenu.trap.activate();
  };

  return categorySortMenu;
}

// Renders a CategorySortMenu at the specified location
export function renderCategorySortMenu(currentSorting, sortingTypes) {
  // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));
  const categorySortMenu = CategorySortMenu(currentSorting, sortingTypes);
  categorySortMenu.initCategorySortMenu();
}

// Creates an object that inherits from CategoryOrganizeMenu and adds new DOM elements
// and new functionality to its context menu element.
// Expects the currentFilter type as a string, and the filterTypes as an array
// of strings
function CategoryFilterMenu(currentFilter, filterTypes) {
  const categoryFilterMenu = CategoryOrganizeMenu(
    find(DOMCache.filterSetting, "button"),
  );
  // Handles the click events for the setting items that will
  // be rendered inside the settingsList.
  categoryFilterMenu.handleSettingItemsClickEvents =
    function handleSettingItemsClickEvents(e) {
      if (hasClass(e.target, "named-button")) {
        // Sends a request to filter the todos of the current category.
        // Provides the id dataset of the clicked setting item, which is
        // a string that is equal to one of the filterMethod types
        // declared in the category.js module
        PubSub.publish("FILTER_TODOS_REQUEST", e.target.dataset.id);
        categoryFilterMenu.deleteSettings(e);
      }
    };
  // This object's own deleteSettingsFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
  categoryFilterMenu.deleteSettingsFn = function deleteSettingsFn() {
    categoryFilterMenu.settingsList.removeEventListener(
      "click",
      categoryFilterMenu.handleSettingItemsClickEvents,
    );
  };
  categoryFilterMenu.initCategoryFilterMenu =
    function initCategoryFilterMenu() {
      categoryFilterMenu.initCategoryOrganizeMenu();
      updateTextContent(categoryFilterMenu.containerTitle, "Filter");
      categoryFilterMenu.settingsList.addEventListener(
        "click",
        categoryFilterMenu.handleSettingItemsClickEvents,
      );
      // Iterates through the array of sortingTypes and creates a setting item
      // that represents each string in the array
      if (filterTypes) {
        filterTypes.forEach((filterType) => {
          const settingItem = createSettingItem(
            capitalizeFirstLetter(filterType.split("-").join(" ")),
            `filter-todos`,
            filterType,
          );

          if (find(settingItem, "button").dataset.id === currentFilter) {
            addClass(find(settingItem, "button"), "selected");
          }
          render(categoryFilterMenu.settingsList, settingItem);
        });
      }
      // Adds this deleteSettingsFn to the list of additionalDeleteSettings functions
      // that are called by the deleteSettings method on ContextMenu
      categoryFilterMenu.addAdditionalDeleteSettingsFn(
        categoryFilterMenu.deleteSettingsFn,
      );
      categoryFilterMenu.trap.activate();
    };

  return categoryFilterMenu;
}

// Renders a CategoryFilterMenu at the specified location
export function renderCategoryFilterMenu(currentFilter, filterTypes) {
  // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));
  const categoryFilterMenu = CategoryFilterMenu(currentFilter, filterTypes);
  categoryFilterMenu.initCategoryFilterMenu();
}
