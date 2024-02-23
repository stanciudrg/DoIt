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

function CategorySortMenu(currentSorting, sortingTypes) {
  const categorySortMenu = CategoryOrganizeMenu(
    find(DOMCache.sortSetting, "button"),
  );
  categorySortMenu.handleSettingItemsClickEvents =
    function handleSettingItemsClickEvents(e) {
      if (hasClass(e.target, "named-button")) {
        PubSub.publish("SORT_TODOS_REQUEST", e.target.dataset.id);
        categorySortMenu.deleteSettings(e);
      }
    };
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
    categorySortMenu.addAdditionalDeleteSettingsFn(
      categorySortMenu.deleteSettingsFn,
    );
    categorySortMenu.trap.activate();
  };

  return categorySortMenu;
}

export function renderCategorySortMenu(currentSorting, sortingTypes) {
  // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));
  const categorySortMenu = CategorySortMenu(currentSorting, sortingTypes);
  categorySortMenu.initCategorySortMenu();
}

function CategoryFilterMenu(currentFilter, filterTypes) {
  const categoryFilterMenu = CategoryOrganizeMenu(
    find(DOMCache.filterSetting, "button"),
  );
  categoryFilterMenu.handleSettingItemsClickEvents =
    function handleSettingItemsClickEvents(e) {
      if (hasClass(e.target, "named-button")) {
        PubSub.publish("FILTER_TODOS_REQUEST", e.target.dataset.id);
        categoryFilterMenu.deleteSettings(e);
      }
    };
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
      categoryFilterMenu.addAdditionalDeleteSettingsFn(
        categoryFilterMenu.deleteSettingsFn,
      );
      categoryFilterMenu.trap.activate();
    };

  return categoryFilterMenu;
}

export function renderCategoryFilterMenu(currentFilter, filterTypes) {
  // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
  // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in
  // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
  // is attached) solves this issue.
  document.dispatchEvent(new Event("click"));
  const categoryFilterMenu = CategoryFilterMenu(currentFilter, filterTypes);
  categoryFilterMenu.initCategoryFilterMenu();
}
