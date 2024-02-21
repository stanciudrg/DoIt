import { createFormModal, createElementWithClass } from "../creator";
import { DOMCache } from "../DOMCache";
import {
  find,
  disableButton,
  render,
  addClass,
  hasClass,
  disableScrolling,
  enableScrolling,
  removeClass,
} from "../viewHelpers";

export default function FormModal(legendText, className) {
  const todoModal = {};
  todoModal.form = createFormModal(legendText, className);
  todoModal.fieldset = find(todoModal.form, "fieldset");
  todoModal.closeButton = find(todoModal.form, ".close-modal");
  todoModal.submitButton = find(todoModal.form, ".submit-modal");
  todoModal.formOverlay = createElementWithClass("div", "form-overlay");
  todoModal.submitModalFn = null;
  todoModal.additionalCloseModalFn = null;

  todoModal.defaultCloseModalFn = function defaultCloseModalFn() {
    todoModal.closeButton.removeEventListener(
      "click",
      todoModal.closeModalHandler,
    );
    todoModal.submitButton.removeEventListener(
      "click",
      todoModal.submitModalHandler,
    );
    DOMCache.modal.removeEventListener("keyup", todoModal.closeByKeyboard);
    DOMCache.modal.removeEventListener(
      "mousedown",
      todoModal.closeByClickOutside,
    );

    // If the app is not in mobile mode with its header open, enable back scrolling
    if (
      !(
        hasClass(DOMCache.header, "mobile") &&
        hasClass(DOMCache.header, "visible")
      )
    ) {
      enableScrolling();
    }

    removeClass(DOMCache.modal, "show");
    removeClass(DOMCache.body, "overlay-over");
    // Remove the form from the DOM
    todoModal.form.remove();
  };

  todoModal.closeModal = function closeModal() {
    todoModal.defaultCloseModalFn();
    if (todoModal.additionalCloseModalFn) todoModal.additionalCloseModalFn();
  };

  todoModal.closeByKeyboard = function closeByKeyboard(e) {
    if (e.key === "Escape") {
      // If a formOverlay is visible, it means that the input that set it to visible
      // is currently managing the 'Escape' key, therefore stop.
      // This prevents the issue where hitting the 'Escape' key to close, for example, the date picker,
      // also closes the modal, which is not desirable for accessibility reasons
      if (hasClass(todoModal.formOverlay, "visible")) return;
      todoModal.closeModal();
    }
  };

  todoModal.closeByClickOutside = function closeByClickOutside(e) {
    if (e.target === DOMCache.modal) {
      todoModal.closeModal();
    }
  };

  todoModal.addAdditionalCloseModalFn = function addAdditionalCloseModalFn(
    newFn,
  ) {
    todoModal.additionalCloseModalFn = newFn;
  };

  todoModal.setSubmitModalFn = function setSubmitModalFn(newFn) {
    todoModal.submitModalFn = newFn;
  };

  todoModal.submitModalHandler = function submitModalHandler(e) {
    todoModal.submitModalFn(e);
  };

  todoModal.initFormModal = function initFormModal() {
    todoModal.closeButton.addEventListener("click", todoModal.closeModal);
    todoModal.submitButton.addEventListener(
      "click",
      todoModal.submitModalHandler,
    );
    DOMCache.modal.addEventListener("keyup", todoModal.closeByKeyboard);
    DOMCache.modal.addEventListener("mousedown", todoModal.closeByClickOutside);
    disableButton(todoModal.submitButton);
    render(todoModal.form, todoModal.formOverlay);
    render(DOMCache.modal, todoModal.form);
    addClass(DOMCache.modal, "show");
    // Do not disable scrolling if the app is in mobile version and has its header open, since
    // the scrolling is already disabled in that case by another function
    if (
      !(
        hasClass(DOMCache.header, "mobile") &&
        hasClass(DOMCache.header, "visible")
      )
    ) {
      disableScrolling();
    }
  };

  return todoModal;
}
