import { createFormModal } from "../creator";
import { DOMCache } from "../DOMCache";
import {
  find,
  render,
  addClass,
  hasClass,
  disableScrolling,
  enableScrolling,
  removeClass,
} from "../viewHelpers";

export default function Modal(legendText, className) {
  const modal = {};
  modal.form = createFormModal(legendText, className);
  modal.formOverlay = find(modal.form, '.form-overlay');
  modal.additionalCloseModalFn = null;
  modal.closeByKeyboard = function closeByKeyboard(e) {
    if (e.key === "Escape") {
      // If a formOverlay is visible, it means that the input that set it to visible
      // is currently managing the 'Escape' key, therefore stop.
      // This prevents the issue where hitting the 'Escape' key to close, for example, the date picker,
      // also closes the modal, which is not desirable for accessibility reasons
      if (hasClass(modal.formOverlay, "visible")) return;
      modal.closeModal();
    }
  };

  modal.closeByClickOutside = function closeByClickOutside(e) {
    if (e.target === DOMCache.modal) {
      modal.closeModal();
    }
  };

  modal.defaultCloseModalFn = function defaultCloseModalFn() {
    DOMCache.modal.removeEventListener("keyup", modal.closeByKeyboard);
    DOMCache.modal.removeEventListener(
      "mousedown",
      modal.closeByClickOutside,
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
    modal.form.remove();
  };

  modal.addAdditionalCloseModalFn = function addAdditionalCloseModalFn(
    newFn,
  ) {
    modal.additionalCloseModalFn = newFn;
  };

  modal.closeModal = function closeModal() {
    modal.defaultCloseModalFn();
    if (modal.additionalCloseModalFn) modal.additionalCloseModalFn();
  };

  modal.initModal = function initModal() {
    DOMCache.modal.addEventListener("keyup", modal.closeByKeyboard);
    DOMCache.modal.addEventListener("mousedown", modal.closeByClickOutside);
    render(DOMCache.modal, modal.form);
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

  return modal;
}