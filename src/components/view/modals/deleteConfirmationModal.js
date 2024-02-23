import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import { createDeleteTodosCheckbox, createElementWithClass } from "../creator";
import FormModal from "./formModal";
import { find, render, enableButton } from "../viewHelpers";

function DeleteConfirmationModal(name) {
  const deleteConfirmationModal = Object.create(
    FormModal("Delete confirmation", "delete-modal"),
  );
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
  };

  deleteConfirmationModal.initDeleteConfirmationModal =
    function initDeleteConfirmationModal() {
      deleteConfirmationModal.initFormModal();
      render(
        deleteConfirmationModal.fieldset,
        deleteConfirmationModal.deleteParagraph,
      );
      deleteConfirmationModal.deleteParagraph.innerHTML = `Are you sure you want to permanently delete <strong>${deleteConfirmationModal.transformString(name)}</strong> ? `;
      deleteConfirmationModal.modifySubmitButton(
        "Delete",
        "confirm-delete-button",
      );
      enableButton(deleteConfirmationModal.submitButton);
      deleteConfirmationModal.trap.activate();
      deleteConfirmationModal.addAdditionalCloseModalFn(
        deleteConfirmationModal.closeModalFn,
      );
    };

  return deleteConfirmationModal;
}

function DeleteTodoModal(todoID, todoName) {
  const deleteTodoModal = Object.create(DeleteConfirmationModal(todoName));
  deleteTodoModal.submitModalFn = function submitModalFn(e) {
    e.preventDefault();
    deleteTodoModal.closeModal();
    PubSub.publish("DELETE_TODO_REQUEST", todoID);
  };

  deleteTodoModal.initDeleteTodoModal = function initDeleteTodoModal() {
    deleteTodoModal.initDeleteConfirmationModal();
    deleteTodoModal.setSubmitModalFn(deleteTodoModal.submitModalFn);
  };

  return deleteTodoModal;
}

export function renderDeleteTodoModal(todoID, todoName) {
  const deleteTodoModal = DeleteTodoModal(todoID, todoName);
  deleteTodoModal.initDeleteTodoModal();
}

function DeleteCategoryModal(categoryID, categoryName, hasTodos) {
  const deleteCategoryModal = Object.create(
    DeleteConfirmationModal(categoryName),
  );
  deleteCategoryModal.submitModalFn = function submitModalFn(e) {
    e.preventDefault();
    deleteCategoryModal.closeModal();

    const deleteTodosCheckbox = find(deleteCategoryModal.fieldset, "#delete-todos");
    if (deleteTodosCheckbox && deleteTodosCheckbox.checked) {
      PubSub.publish("DELETE_CONTAINING_TODOS_REQUEST", categoryID);
    }

    PubSub.publish("DELETE_CATEGORY_REQUEST", categoryID);
  };

  deleteCategoryModal.initDeleteCategoryModal =
    function initDeleteCategoryModal() {
      deleteCategoryModal.initDeleteConfirmationModal();
      if (hasTodos) {
        const deleteTodosInputContainer = createDeleteTodosCheckbox();
        render(deleteCategoryModal.fieldset, deleteTodosInputContainer);
      }

      deleteCategoryModal.setSubmitModalFn(deleteCategoryModal.submitModalFn);
    };
  return deleteCategoryModal;
}

export function renderDeleteCategoryModal(categoryID, categoryName, hasTodos) {
  const deleteCategoryModal = DeleteCategoryModal(
    categoryID,
    categoryName,
    hasTodos,
  );
  deleteCategoryModal.initDeleteCategoryModal();
}
