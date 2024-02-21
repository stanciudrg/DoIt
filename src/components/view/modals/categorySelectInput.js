import * as focusTrap from "focus-trap";
import * as Creator from "../creator";
import { DOMCache } from "../DOMCache";
import {
  hasClass,
  removeClass,
  addClass,
  find,
  getParentOf,
  updateTextContent,
  render,
  checkBounds,
  disableButton,
  enableButton,
} from "../viewHelpers";

// Creates a custom dropdown list containing all user categories
export function renderCategoriesDropdownList() {
    const formOverlay = find(DOMCache.modal, ".form-overlay");
    formOverlay.addEventListener("click", hideDropdownList);
    addClass(formOverlay, "visible");
  
    const categorySelectButton = find(
      DOMCache.modal,
      ".categories-dropdown-button",
    );
    // Disable the category select button while the dropdown is visible to prevent
    // creating multiple dropdowns
    disableButton(categorySelectButton);
    addClass(categorySelectButton, "focused");
  
    const categoryInput = getParentOf(categorySelectButton);
  
    const categoriesDropdown = Creator.createCategoriesDropdown();
    categoriesDropdown.addEventListener("keyup", hideByKbd);
    render(categoryInput, categoriesDropdown);
  
    const categoriesDropdownList = find(
      categoriesDropdown,
      ".categories-dropdown-list",
    );
    categoriesDropdownList.addEventListener(
      "click",
      handleCategoryListItemsClickEvents,
    );
  
    document.addEventListener("keyup", hideByKbd);
  
    // Traps TAB focusing within categoriesDropdown
    const trap = focusTrap.createFocusTrap(categoriesDropdown, {
      allowOutsideClick: () => true,
      escapeDeactivates: () => false,
      initialFocus: () => false,
      setReturnFocus: () => categorySelectButton,
    });
    trap.activate();
  
    function handleCategoryListItemsClickEvents(e) {
      const categoryListItem = e.target.closest(".category-select-item");
      if (!categoryListItem) return;
  
      // Simulates an input by setting the dataset of the category input button to the value of the categoryID
      // and by setting the textContent of the category input button to the value of the categoryName.
      // It also marks the currently selected category by adding a blue dot next to it
      categorySelectButton.dataset.id = categoryListItem.dataset.id;
      updateTextContent(categorySelectButton, categoryListItem.textContent);
      categorySelectButton.setAttribute(
        "aria-label",
        `Todo category: ${this.textContent}. Click this button to change the category of this todo`,
      );
      removeClass(categorySelectButton, "empty");
      if (find(categoriesDropdownList, ".selected")) {
        removeClass(find(categoriesDropdownList, ".selected"), "selected");
      }
      addClass(categoryListItem, "selected");
      hideDropdownList();
    }
  
    function hideDropdownList() {
      trap.deactivate();
  
      document.removeEventListener("keyup", hideByKbd);
  
      formOverlay.removeEventListener("click", hideDropdownList);
      removeClass(formOverlay, "visible");
  
      enableButton(categorySelectButton);
      removeClass(categorySelectButton, "focused");
  
      categoriesDropdownList.removeEventListener(
        "click",
        handleCategoryListItemsClickEvents,
      );
  
      categoriesDropdown.removeEventListener("keyup", hideByKbd);
      removeClass(categoriesDropdown, "visible");
      categoriesDropdown.remove();
    }
  
    function hideByKbd(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        hideDropdownList();
      }
    }
  }
  
  // Renders a user category button within the categoriesDropdownList on each call
  export function renderCategorySelectItem(categoryID, categoryName) {
    const categorySelectButton = find(
      DOMCache.modal,
      ".categories-dropdown-button",
    );
    const categoryInput = getParentOf(categorySelectButton);
    const categoriesDropdownContainer = find(
      categoryInput,
      ".categories-dropdown",
    );
    const categoriesDropdownList = find(
      categoriesDropdownContainer,
      ".categories-dropdown-list",
    );
  
    const categoriesDropdownTitle = find(
      categoryInput,
      ".categories-dropdown-title",
    );
    categoriesDropdownTitle.removeAttribute("tabindex");
    updateTextContent(categoriesDropdownTitle, "Pick a category");
  
    const categorySelectItem = Creator.createCategorySelectItem(
      categoryID,
      categoryName,
    );
    render(categoriesDropdownList, categorySelectItem);
  
    const selectItemButton = find(categorySelectItem, "button");
    if (categorySelectButton.dataset.id === selectItemButton.dataset.id) {
      addClass(selectItemButton, "selected");
    }
    if (hasClass(selectItemButton, "selected"))
      selectItemButton.setAttribute(
        "aria-label",
        `Category: ${selectItemButton.textContent} (currently selected)`,
      );
  
    // Check if the categoriesDropdownContainer has not leaked outside the viewport each time
    // a new user category button is rendered within it;
    checkBounds(categoriesDropdownContainer, 265);
  }