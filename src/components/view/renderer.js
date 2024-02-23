import { DOMCache } from "./DOMCache";
import {
  toggleNavbar,
  checkIfMobile,
  selectNewCategoryButton,
  unselectOldCategoryButton,
  updateCategoryTodosCount,
  updateUserCategoriesCount,
  toggleUserCategoriesList,
  renderDevCategoryButton,
  renderUserCategoryButton,
  handleUserCategoryClickEvents,
  renameUserCategoryButton,
  deleteUserCategoryButton,
} from "./navbar";
import {
  renderContentSettingsButton,
  deleteContentSettingsButton,
  renameContentTitle,
  sendSortSettingsRequest,
  sendFilterSettingsRequest,
  markContentSortSetting,
  markContentFilterSetting,
  renderTodosList,
  deleteTodosList,
  renderTodoElement,
  updateTodoIndex,
  moveTodoElement,
  deleteTodoElement,
  renderTodoElementExpander,
  deleteTodoElementExpander,
  renderTodoAdditionalInfo,
  deleteTodoAdditionalInfo,
  dispatchTransitionEndEvent,
  updateTodoElementCompletedStatus,
  colorTodoCompletedStatusSpan,
  updateTodoTitle,
  renderTodoMiniDueDate,
  updateTodoMiniDueDate,
  deleteTodoMiniDueDate,
  renderTodoDescription,
  updateTodoDescription,
  deleteTodoDescription,
  renderTodoPriority,
  updateTodoPriority,
  deleteTodoPriority,
  renderTodoDueDate,
  updateTodoDueDate,
  deleteTodoDueDate,
  renderTodoCategory,
  updateTodoCategory,
  deleteTodoCategory,
  markTodoAsOverdue,
  markTodoAsDue,
  markTodoAsFiltered,
  highlightTodoElement,
} from "./content";
import {
  renderAddTodoModal,
  renderEditTodoModal,
  sendTodoModalRequest,
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
import {
  renderCategorySortMenu,
  renderCategoryFilterMenu,
} from "./contextMenus/categoryOrganizeMenus";
import "./renameCategoryInput";
import { find, render } from "./viewHelpers";

export {
  selectNewCategoryButton,
  unselectOldCategoryButton,
  updateCategoryTodosCount,
  updateUserCategoriesCount,
  renderDevCategoryButton,
  renderUserCategoryButton,
  renameUserCategoryButton,
  deleteUserCategoryButton,
  renderContentSettingsButton,
  deleteContentSettingsButton,
  renameContentTitle,
  sendSortSettingsRequest,
  sendFilterSettingsRequest,
  markContentSortSetting,
  markContentFilterSetting,
  renderTodosList,
  deleteTodosList,
  renderTodoElement,
  updateTodoIndex,
  moveTodoElement,
  deleteTodoElement,
  renderTodoElementExpander,
  deleteTodoElementExpander,
  renderTodoAdditionalInfo,
  deleteTodoAdditionalInfo,
  dispatchTransitionEndEvent,
  updateTodoElementCompletedStatus,
  colorTodoCompletedStatusSpan,
  updateTodoTitle,
  renderTodoMiniDueDate,
  updateTodoMiniDueDate,
  deleteTodoMiniDueDate,
  renderTodoDescription,
  updateTodoDescription,
  deleteTodoDescription,
  renderTodoPriority,
  updateTodoPriority,
  deleteTodoPriority,
  renderTodoDueDate,
  updateTodoDueDate,
  deleteTodoDueDate,
  renderTodoCategory,
  updateTodoCategory,
  deleteTodoCategory,
  markTodoAsOverdue,
  markTodoAsDue,
  markTodoAsFiltered,
  highlightTodoElement,
  renderAddTodoModal,
  renderEditTodoModal,
  renderCategoriesDropdownList,
  renderCategorySelectItem,
  renderDeleteTodoModal,
  renderDeleteCategoryModal,
  renderAnchorTodoElement,
  deleteAllAnchorTodoElements,
  markAnchorTodoElementAsCompleted,
  renderCategorySortMenu,
  renderCategoryFilterMenu,
};

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
  // eslint-disable-next-line
  document.addEventListener("touchstart", function () {}, false);
}
