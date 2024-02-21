import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import {
  createDeleteTodosCheckbox,
  createElementWithClass,
} from "../creator";
import FormModal from "./formModal";
import {
  find,
  render,
  addClass,
  removeClass,
  enableButton,
} from "../viewHelpers";

function DeleteConfirmationModal(name) {
  const deleteConfirmationModal = Object.create(FormModal("Delete confirmation", "delete-modal"));
  deleteConfirmationModal.deleteParagraph = createElementWithClass(
    "p",
    "delete-modal-paragraph",
  );
  deleteConfirmationModal.trap = focusTrap.createFocusTrap(
    deleteConfirmationModal.form,
    {
      allowOutsideClick: () => true,
      escapeDeactivates: () => false,
      returnFocusOnDeactivate: () => true,
    },
  );

  deleteConfirmationModal.transformString = function transformString(string) {
    // Turn the string into an array...
    const array = Array.from(string);
    // ... and if it has more than 50 characters, delete all characters after index 49,
    // and push three dots at the end of the array '...' to let the user know that the name
    // is longer than the paragraph can hold without overflowing
    if (array.length > 49) {
      array.splice(49);
      for (let i = 0; i < 3; i += 1) {
        array.push(".");
      }
    }
    return array.join("");
  };

  deleteConfirmationModal.closeModalFn = function closeModalFn() {
    deleteConfirmationModal.trap.deactivate();
  }

  deleteConfirmationModal.initDeleteConfirmationModal =
    function initDeleteConfirmationModal() {
      deleteConfirmationModal.initFormModal();
      render(
        deleteConfirmationModal.fieldset,
        deleteConfirmationModal.deleteParagraph,
      );
      deleteConfirmationModal.deleteParagraph.innerHTML = `Are you sure you want to permanently delete <strong>${deleteConfirmationModal.transformString(name)}</strong> ? `;
      deleteConfirmationModal.submitButton.textContent = 'Delete';
      enableButton(deleteConfirmationModal.submitButton);
      removeClass(deleteConfirmationModal.submitButton, "submit-modal");
      addClass(deleteConfirmationModal.submitButton, "confirm-delete-button");
      deleteConfirmationModal.trap.activate();
      deleteConfirmationModal.addAdditionalCloseModalFn(deleteConfirmationModal.closeModalFn);
    };

  return deleteConfirmationModal;
}

export function renderDeleteTodoModal(todoID, todoName) {
  const deleteConfirmationModal = DeleteConfirmationModal(todoName);
  deleteConfirmationModal.initDeleteConfirmationModal();

  const submitModalFn = (e) => {
    e.preventDefault();
    deleteConfirmationModal.closeModal();
    PubSub.publish("DELETE_TODO_REQUEST", todoID);
  }

  deleteConfirmationModal.setSubmitModalFn(submitModalFn);
}

export function renderDeleteCategoryModal(categoryID, categoryName, hasTodos) {
  const deleteConfirmationModal = DeleteConfirmationModal(categoryName);
  deleteConfirmationModal.initDeleteConfirmationModal();
  const deleteTodosInputContainer = createDeleteTodosCheckbox();
  render(deleteConfirmationModal.fieldset, deleteTodosInputContainer);

  const submitModalFn = (e) => {
    e.preventDefault();
    deleteConfirmationModal.closeModal();
    if (hasTodos && find(deleteTodosInputContainer, "#delete-todos").checked) {
      PubSub.publish("DELETE_CONTAINING_TODOS_REQUEST", categoryID);
    }

    PubSub.publish("DELETE_CATEGORY_REQUEST", categoryID);
  }

  deleteConfirmationModal.setSubmitModalFn(submitModalFn);
}