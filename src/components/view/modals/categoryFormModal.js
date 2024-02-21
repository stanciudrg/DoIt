import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import { createInput } from "../creator";
import FormModal from "./formModal";
import { find, disableButton, enableButton, render } from "../viewHelpers";

function CategoryFormModal() {
  const categoryFormModal = Object.create(FormModal("Category details", "category-form"));
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
  categoryFormModal.trap = focusTrap.createFocusTrap(categoryFormModal.form, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    returnFocusOnDeactivate: () => true,
    setReturnFocus: () => this,
  });
  categoryFormModal.checkInput = function checkInput() {
    // Only enable the submitButton if the titleInput has at least one character
    if (this.value.match(/([a-zA-Z0-9)]){1,}/g)) {
      enableButton(categoryFormModal.submitButton);
      return;
    }

    disableButton(categoryFormModal.submitButton);
  };
  categoryFormModal.closeModalFn = function closeModalFn() {
    categoryFormModal.trap.deactivate();
    categoryFormModal.nameInput.removeEventListener(
      "input",
      categoryFormModal.checkInput,
    );
  };
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
    categoryFormModal.addAdditionalCloseModalFn(categoryFormModal.closeModalFn);
    categoryFormModal.setSubmitModalFn(categoryFormModal.submitModalFn);
  };

  return categoryFormModal;
}

export default function renderAddCategoryModal() {
  const categoryFormModal = CategoryFormModal();
  categoryFormModal.initCategoryFormModal();
}
