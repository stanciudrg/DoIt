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

// Creates a Modal object that holds and manipulates a form element
export default function Modal(legendText, className) {
  const modal = {};
  modal.form = createFormModal(legendText, className);
  modal.formOverlay = find(modal.form, '.form-overlay');
  // Holds additional functions to be called by the closeModal function
  modal.additionalCloseModalFns = [];
  // Closes the modal if user presses the 'Escape' key
  modal.closeByKeyboard = function closeByKeyboard(e) {
    if (e.key === "Escape") {
      // If a formOverlay is visible, it means that the input that set it to visible
      // is currently managing the 'Escape' key, therefore stop.
      // This prevents the issue where hitting the 'Escape' key to close the date picker
      // also closes the modal
      if (hasClass(modal.formOverlay, "visible")) return;
      modal.closeModal();
    }
  };
  // Closes the modal if user clicks outside the form
  modal.closeByClickOutside = function closeByClickOutside(e) {
    if (e.target === DOMCache.modal) {
      modal.closeModal();
    }
  };
  // The default function to be called by the closeModal function
  modal.defaultCloseModalFn = function defaultCloseModalFn() {
    DOMCache.modal.removeEventListener("keyup", modal.closeByKeyboard);
    DOMCache.modal.removeEventListener(
      "mousedown",
      modal.closeByClickOutside,
    );

    // If the app is not in mobile mode with its header open, bring the scrolling
    // functionality back on close
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
  // Pushes additional functions to be called by the closeModal function
  modal.addAdditionalCloseModalFn = function addAdditionalCloseModalFn(
    newFn,
  ) {
    modal.additionalCloseModalFns.push(newFn);
  };
  // Closes the modal
  modal.closeModal = function closeModal() {
    modal.additionalCloseModalFns.forEach((fn) => fn());
    modal.defaultCloseModalFn();
  };

  modal.initModal = function initModal() {
    DOMCache.modal.addEventListener("keyup", modal.closeByKeyboard);
    DOMCache.modal.addEventListener("mousedown", modal.closeByClickOutside);
    render(DOMCache.modal, modal.form);
    addClass(DOMCache.modal, "show");
    // Do not disable scrolling if the app is in mobile version and has its header open
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