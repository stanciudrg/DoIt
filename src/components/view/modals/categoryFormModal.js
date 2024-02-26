import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import { DOMCache } from "../DOMCache";
import {
  createInput,
  createCategoriesDropdown,
  createCategorySelectItem,
} from "../creator";
import FormModal from "./formModal";
import {
  find,
  disableButton,
  enableButton,
  render,
  hasClass,
  removeClass,
  addClass,
  getParentOf,
  updateTextContent,
  checkBounds,
} from "../viewHelpers";

// Creates a CategoryFormModal object that inherits from FormModal and adds new DOM elements
// and new functionality to its form element
function CategoryFormModal() {
  const categoryFormModal = Object.create(
    FormModal("Category details", "category-form"),
  );
  categoryFormModal.nameInputContainer = createInput(
    "name",
    "name",
    "category-name",
    "text",
    {
      minlength: "2",
      placeholder: "Category name",
    },
  );
  categoryFormModal.nameInput = find(
    categoryFormModal.nameInputContainer,
    "#category-name",
  );
  // Traps focus within the form
  categoryFormModal.trap = focusTrap.createFocusTrap(categoryFormModal.form, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    returnFocusOnDeactivate: () => true,
    setReturnFocus: () => this,
  });
  // Enables and disables the submitButton based on the input length of the titleInput
  categoryFormModal.checkInput = function checkInput() {
    if (this.value.match(/([a-zA-Z0-9)]){1,}/g)) {
      enableButton(categoryFormModal.submitButton);
      return;
    }

    disableButton(categoryFormModal.submitButton);
  };
  // This object's own closeModalFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
  categoryFormModal.closeModalFn = function closeModalFn() {
    categoryFormModal.trap.deactivate();
    categoryFormModal.nameInput.removeEventListener(
      "input",
      categoryFormModal.checkInput,
    );
  };
  // This object's own submitModalFn that gets the FormData and
  // sends a request for the category object to be created by providing
  // the input value
  categoryFormModal.submitModalFn = function submitModalFn(e) {
    e.preventDefault();
    categoryFormModal.closeModal();
    const formData = new FormData(categoryFormModal.form);
    PubSub.publish("CREATE_CATEGORY_REQUEST", formData.get("name").trim());
  };
  categoryFormModal.initCategoryFormModal = function initCategoryFormModal() {
    categoryFormModal.initFormModal();
    categoryFormModal.nameInput.addEventListener(
      "input",
      categoryFormModal.checkInput,
    );
    render(categoryFormModal.fieldset, categoryFormModal.nameInputContainer);
    categoryFormModal.trap.activate();
    // Adds this closeModalFn to the list of additionalCloseModal functions
    // that are called by the deleteSettings method on Modal
    categoryFormModal.addAdditionalCloseModalFn(categoryFormModal.closeModalFn);
    // Sets the submitModalFn that is called by the submitModalHandler method
    // defined on FormModal
    categoryFormModal.setSubmitModalFn(categoryFormModal.submitModalFn);
  };

  return categoryFormModal;
}

// Renders an AddCategoryModal
export function renderAddCategoryModal() {
  const categoryFormModal = CategoryFormModal();
  categoryFormModal.initCategoryFormModal();
}

// Creates a custom dropdown list containing all user categories
export function renderCategoriesDropdownList() {
  const formOverlay = find(DOMCache.modal, ".form-overlay");
  addClass(formOverlay, "visible");
  formOverlay.addEventListener("click", hideDropdownList);

  const categorySelectButton = find(
    DOMCache.modal,
    ".categories-dropdown-button",
  );
  // Disable the category select button while the dropdown is visible to prevent
  // creating multiple dropdowns
  disableButton(categorySelectButton);
  addClass(categorySelectButton, "focused");

  const categoryInputContainer = getParentOf(categorySelectButton);
  const categoriesDropdown = createCategoriesDropdown();
  categoriesDropdown.addEventListener("keyup", hideByKbd);
  render(categoryInputContainer, categoriesDropdown);

  const categoriesDropdownList = find(
    categoriesDropdown,
    ".categories-dropdown-list",
  );
  categoriesDropdownList.addEventListener(
    "click",
    handleCategoryListItemsClickEvents,
  );

  // Traps TAB focusing within categoriesDropdown
  const trap = focusTrap.createFocusTrap(categoriesDropdown, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    initialFocus: () => false,
    setReturnFocus: () => categorySelectButton,
  });
  trap.activate();

  document.addEventListener("keyup", hideByKbd);
  function hideByKbd(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      hideDropdownList();
    }
  }

  function handleCategoryListItemsClickEvents(e) {
    const categoryListItem = e.target.closest(".category-select-item");
    if (!categoryListItem) return;

    // Simulates input type="select" behavior
    categorySelectButton.dataset.id = categoryListItem.dataset.id;
    updateTextContent(categorySelectButton, categoryListItem.textContent);
    categorySelectButton.setAttribute(
      "aria-label",
      `Todo category: ${this.textContent}. Click this button to change the category of this todo`,
    );
    removeClass(categorySelectButton, "empty");

    // Remove the marker from the previously selected category
    if (find(categoriesDropdownList, ".selected")) {
      removeClass(find(categoriesDropdownList, ".selected"), "selected");
    }

    addClass(categoryListItem, "selected");
    hideDropdownList();
  }

  function hideDropdownList() {
    trap.deactivate();
    removeClass(formOverlay, "visible");
    enableButton(categorySelectButton);
    removeClass(categorySelectButton, "focused");
    removeClass(categoriesDropdown, "visible");
    document.removeEventListener("keyup", hideByKbd);
    categoriesDropdown.removeEventListener("keyup", hideByKbd);
    categoriesDropdownList.removeEventListener(
      "click",
      handleCategoryListItemsClickEvents,
    );
    formOverlay.removeEventListener("click", hideDropdownList);
    categoriesDropdown.remove();
  }
}

// Renders a user category button within the categoriesDropdownList
export function renderCategorySelectItem(categoryID, categoryName) {
  const categorySelectButton = find(
    DOMCache.modal,
    ".categories-dropdown-button",
  );
  const categoryInputContainer = getParentOf(categorySelectButton);
  const categoriesDropdownContainer = find(
    categoryInputContainer,
    ".categories-dropdown",
  );
  const categoriesDropdownList = find(
    categoriesDropdownContainer,
    ".categories-dropdown-list",
  );
  const categoriesDropdownTitle = find(
    categoryInputContainer,
    ".categories-dropdown-title",
  );
  categoriesDropdownTitle.removeAttribute("tabindex");
  updateTextContent(categoriesDropdownTitle, "Pick a category");
  const categorySelectItem = createCategorySelectItem(categoryID, categoryName);
  render(categoriesDropdownList, categorySelectItem);
  const selectItemButton = find(categorySelectItem, "button");

  if (categorySelectButton.dataset.id === selectItemButton.dataset.id) {
    addClass(selectItemButton, "selected");
  }

  if (hasClass(selectItemButton, "selected")) {
    selectItemButton.setAttribute(
      "aria-label",
      `Category: ${selectItemButton.textContent} (currently selected)`,
    );
  }

  // Check if the categoriesDropdownContainer has not leaked outside the viewport each time
  // a new user category button is rendered within it;
  checkBounds(categoriesDropdownContainer, 265);
}
