import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import { createDeleteTodosCheckbox, createElementWithClass } from "../creator";
import FormModal from "./formModal";
import { find, render, enableButton } from "../viewHelpers";

// Creates a DeleteConfirmationModal object that inherits from FormModal and adds new DOM elements
// and new functionality to its form element
function DeleteConfirmationModal(name) {
  const deleteConfirmationModal = Object.create(
    FormModal("Delete confirmation", "delete-modal"),
  );
  deleteConfirmationModal.deleteParagraph = createElementWithClass(
    "p",
    "delete-modal-paragraph",
  );
  // Traps focus within the form
  deleteConfirmationModal.trap = focusTrap.createFocusTrap(
    deleteConfirmationModal.form,
    {
      allowOutsideClick: () => true,
      escapeDeactivates: () => false,
      returnFocusOnDeactivate: () => true,
    },
  );
  // Transforms the provided string
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
  // This object's own closeModalFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
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
      // Changes the name of the submit button to 'Edit' from the default
      // 'Delete' and adds a new className to its classList
      deleteConfirmationModal.modifySubmitButton(
        "Delete",
        "confirm-delete-button",
      );
      enableButton(deleteConfirmationModal.submitButton);
      deleteConfirmationModal.trap.activate();
      // Adds this closeModalFn to the list of additionalCloseModal functions
      // that are called by the deleteSettings method on Modal
      deleteConfirmationModal.addAdditionalCloseModalFn(
        deleteConfirmationModal.closeModalFn,
      );
    };

  return deleteConfirmationModal;
}

// Creates an DeleteTodoModal object that inherits from DeleteConfirmationModal and adds
// new functionality to its form elements.
function DeleteTodoModal(todoID, todoName) {
  const deleteTodoModal = Object.create(DeleteConfirmationModal(todoName));
  // This object's own submitModalFn that requests for the todo to be deleted
  deleteTodoModal.submitModalFn = function submitModalFn(e) {
    e.preventDefault();
    deleteTodoModal.closeModal();
    PubSub.publish("DELETE_TODO_REQUEST", todoID);
  };

  deleteTodoModal.initDeleteTodoModal = function initDeleteTodoModal() {
    deleteTodoModal.initDeleteConfirmationModal();
    // Sets the submitModalFn that is called by the submitModalHandler method
    // defined on FormModal
    deleteTodoModal.setSubmitModalFn(deleteTodoModal.submitModalFn);
  };

  return deleteTodoModal;
}

// Renders a DeleteTodoModal for the specified todo
export function renderDeleteTodoModal(todoID, todoName) {
  const deleteTodoModal = DeleteTodoModal(todoID, todoName);
  deleteTodoModal.initDeleteTodoModal();
}

// Creates an DeleteCategoryModal object that inherits from DeleteConfirmationModal and adds new DOM elements and
// new functionality to its form elements.
// hasTodos = whether the category has any todos
function DeleteCategoryModal(categoryID, categoryName, hasTodos) {
  const deleteCategoryModal = Object.create(
    DeleteConfirmationModal(categoryName),
  );
  // This object's own submitModalFn that requests for the category to be deleted
  // and for its its containing todos to also be deleted, if applicable
  deleteCategoryModal.submitModalFn = function submitModalFn(e) {
    e.preventDefault();
    deleteCategoryModal.closeModal();

    const deleteTodosCheckbox = find(
      deleteCategoryModal.fieldset,
      "#delete-todos",
    );
    if (deleteTodosCheckbox && deleteTodosCheckbox.checked) {
      PubSub.publish("DELETE_CONTAINING_TODOS_REQUEST", categoryID);
    }

    PubSub.publish("DELETE_CATEGORY_REQUEST", categoryID);
  };

  deleteCategoryModal.initDeleteCategoryModal =
    function initDeleteCategoryModal() {
      deleteCategoryModal.initDeleteConfirmationModal();
      // If the category has any todos, render a custom checkbox that
      // allows the user to specify whether they want for the containing todos
      // to be deleted along with the category
      if (hasTodos) {
        const deleteTodosInputContainer = createDeleteTodosCheckbox();
        render(deleteCategoryModal.fieldset, deleteTodosInputContainer);
      }

      deleteCategoryModal.setSubmitModalFn(deleteCategoryModal.submitModalFn);
    };
  return deleteCategoryModal;
}

// Renders a DeleteTodoModal for the specified category
export function renderDeleteCategoryModal(categoryID, categoryName, hasTodos) {
  const deleteCategoryModal = DeleteCategoryModal(
    categoryID,
    categoryName,
    hasTodos,
  );
  deleteCategoryModal.initDeleteCategoryModal();
}
