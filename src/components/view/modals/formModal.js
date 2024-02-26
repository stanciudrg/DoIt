import { createModalActions } from "../creator";
import Modal from './modal';
import {
  find,
  disableButton,
  render,
  addClass,
  updateTextContent,
} from "../viewHelpers";

// Creates a FormModal object that inherits from Modal and adds new DOM elements
// and new functionality to its form element
export default function FormModal(legendText, className) {
  const formModal = Object.create(Modal(legendText, className));
  formModal.fieldset = find(formModal.form, "fieldset");
  formModal.modalActions = createModalActions()
  formModal.closeButton = find(formModal.modalActions, ".close-modal");
  formModal.submitButton = find(formModal.modalActions, ".submit-modal");
  // Holds the submitModal function to be called by the submitModalHandler
  // function
  formModal.submitModalFn = null;
  // Sets the value of submitModalFn;
  formModal.setSubmitModalFn = function setSubmitModalFn(newFn) {
    formModal.submitModalFn = newFn;
  };
  // Calls submitModalFn's current function
  formModal.submitModalHandler = function submitModalHandler(e) {
    if (formModal.submitModalFn) formModal.submitModalFn(e);
  };
  // Manipulates the text content and classList of formModal.submitButton
  formModal.modifySubmitButton = function modifySubmitButton(newName, additionalClassName) {
    if (newName) updateTextContent(formModal.submitButton, newName);
    if (additionalClassName) addClass(formModal.submitButton, additionalClassName);
  }
  // This object's own closeModalFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
  formModal.closeModalFn = function closeModalFn() {
    formModal.closeButton.removeEventListener(
      "click",
      formModal.closeModalHandler,
    );
    formModal.submitButton.removeEventListener(
      "click",
      formModal.submitModalHandler,
    );
  }

  formModal.initFormModal = function initFormModal() {
    formModal.initModal();
    formModal.closeButton.addEventListener("click", formModal.closeModal);
    formModal.submitButton.addEventListener(
      "click",
      formModal.submitModalHandler,
    );
    render(formModal.form, formModal.modalActions);
    disableButton(formModal.submitButton);
      // Adds this closeModalFn to the list of additionalCloseModal functions
      // that are called by the deleteSettings method on Modal
    formModal.addAdditionalCloseModalFn(formModal.closeModalFn);
  };

  return formModal;
}
