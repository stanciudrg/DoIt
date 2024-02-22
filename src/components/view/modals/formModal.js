import { createModalActions } from "../creator";
import Modal from './modal';
import {
  find,
  disableButton,
  render,
  addClass,
  updateTextContent,
} from "../viewHelpers";

export default function FormModal(legendText, className) {
  const formModal = Object.create(Modal(legendText, className));
  formModal.fieldset = find(formModal.form, "fieldset");
  formModal.modalActions = createModalActions()
  formModal.closeButton = find(formModal.modalActions, ".close-modal");
  formModal.submitButton = find(formModal.modalActions, ".submit-modal"); 
  formModal.submitModalFn = null;

  formModal.setSubmitModalFn = function setSubmitModalFn(newFn) {
    formModal.submitModalFn = newFn;
  };

  formModal.submitModalHandler = function submitModalHandler(e) {
    formModal.submitModalFn(e);
  };

  formModal.modifySubmitButton = function modifySubmitButton(newName, additionalClassName) {
    if (newName) updateTextContent(formModal.submitButton, newName);
    if (additionalClassName) addClass(formModal.submitButton, additionalClassName);
  }

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
    formModal.addAdditionalCloseModalFn(formModal.closeModalFn);
  };

  return formModal;
}
