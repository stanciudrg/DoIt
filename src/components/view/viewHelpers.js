import { DOMCache, categoriesContent } from './DOMCache';

export function render(target, ...elements) {
  if (elements) {
    elements.forEach((element) => {
      if (!target.contains(element)) target.appendChild(element);
    });
  }
}

export function find(element, identifier) {
  if (element && identifier) return element.querySelector(identifier);
  return false;
}

export function findAll(element, identifier) {
  return element.querySelectorAll(identifier);
}

export function getParentOf(element) {
  return element.parentElement;
}

export function hasClass(element, className) {
  return element.classList.contains(className);
}

export function addClass(element, className) {
  element.classList.add(className);
}

export function removeClass(element, className) {
  element.classList.remove(className);
}

export function toggleClass(element, className) {
  element.classList.toggle(className);
}

export function updateInputValue(target, inputValue) {
  const element = target;
  element.value = inputValue;
}

export function applyFocus(element) {
  element.focus();
}

export function updateTextContent(target, text) {
  const element = target;
  if (text === 0) {
    element.textContent = "";
    return;
  }

  element.textContent = text;
}

export function replace(newElement, element) {
  const parent = element.parentElement;
  parent.replaceChild(newElement, element);
}

export function enableInput(target) {
  const element = target;
  element.style.pointerEvents = "auto";
  element.style.touchEvents = "auto";
}

export function disableInput(target) {
  const element = target;
  element.style.pointerEvents = "none";
  element.style.touchEvents = "none";
}

export function enableButton(target) {
  const button = target;
  button.disabled = false;
  button.removeAttribute("tabindex");
}

export function disableButton(target) {
  const button = target;
  button.disabled = true;
  button.setAttribute("tabindex", "-1");
}

export function getCurrentContentID() {
  return DOMCache.content.dataset.id;
}

export function getTodoElement(todoID) {
  return find(
    categoriesContent[getCurrentContentID()],
    `[data-id="${todoID}"]`,
  );
}

export function getAdditionalFeatureContainer(todoID) {
  return find(getTodoElement(todoID), ".todo-additional-info");
}

export function disableScrolling() {
  const html = document.querySelector("html");
  // Add right padding to the HTML element of the DOM that is equal to the width of the scrollbar,
  // to prevent the usual layout shift when the scrollbar appears and disappears
  html.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
  addClass(html, "overlay-over");
}

export function enableScrolling() {
  const html = document.querySelector("html");
  // Remove the right padding added by disableScrolling function
  html.style.removeProperty("padding");
  removeClass(html, "overlay-over");
}

export function isOutOfBounds(position, element, breakpoint) {
  // Get the element's position relative to the viewport
  const elementBound = element.getBoundingClientRect();
  // Get the top/y value of the element
  const elementY = elementBound.y;
  // Get the actual height of the HTML document
  const clientH = document.querySelector("html").clientHeight;

  if (position === "top") return elementY < 0;
  if (position === "bottom") return clientH - elementY < breakpoint;
  return false;
}

// The checkBounds function determines whether the element position needs to be changed
// as a result of it leaking out of the viewport, and changes its position using CSS classes;
export function checkBounds(element, breakpoint) {
  if (hasClass(element, "top-positioned"))
    removeClass(element, "top-positioned");
  if (hasClass(element, "center-positioned"))
    removeClass(element, "center-positioned");

  if (isOutOfBounds("bottom", element, breakpoint))
    addClass(element, "top-positioned");

  if (hasClass(element, "top-positioned") && isOutOfBounds("top", element)) {
    removeClass(element, "top-positioned");
    addClass(element, "center-positioned");
  }
}

export function isSearchBarOpen() {
  return find(DOMCache.modal, ".search-container");
}

export function isVisible(ID) {
  return find(DOMCache.content, `[data-id="${ID}"]`);
}

export function isAdditionalInfoVisible(todoID) {
  return find(
    find(DOMCache.main, `[data-id="${todoID}"]`),
    ".todo-additional-info",
  );
}

export function isTodoExpanderVisible(todoID) {
  return find(
    find(categoriesContent[getCurrentContentID()], `[data-id= "${todoID}"]`),
    ".expand-button",
  );
}
