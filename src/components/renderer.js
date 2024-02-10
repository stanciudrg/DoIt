import * as Creator from './creator.js';

// Keeps a reference of initial, static DOM elements that are rendered on init()
// Allows for quicker DOM traversal and editing, reduces the number of DOM lookups
const DOMCache = {

    body: document.querySelector('body'),
    modal: Creator.createModal(),
    header: Creator.createHeader('Do It'),
    // Used to disable user input and add a grey background behind header
    // in mobile mode
    headerOverlay: Creator.createElementWithClass('div', 'header-overlay'),
    menuButton: Creator.createMenuButton(),
    nav: document.createElement('nav'),
    devNavbar: Creator.createElementWithID('div', 'dev-nav'),
    devNavbarList: Creator.createElementWithID('ul', 'dev-nav-list'),
    addTodoButton: Creator.createAddTodoButton(),
    searchButton: Creator.createSearchButton(),
    userNavbar: Creator.createUserNavbar(),
    addCategoryButton: Creator.createAddButton('Add category'),
    expandCategoriesButton: Creator.createExpandButton('Hide user categories'),
    userNavbarList: Creator.createElementWithID('ul', 'user-nav-list'),
    main: document.createElement('main'),
    contentHeader: Creator.createContentHeader(),
    contentTitle: Creator.createElementWithClass('h2', 'content-title'),
    contentSettings: Creator.createElementWithClass('div', 'content-settings'),
    sortSetting: Creator.createContentSortSetting(),
    filterSetting: Creator.createContentFilterSetting(),
    content: Creator.createElementWithClass('div', 'content'),
    contentAddButton: Creator.createAddButton('Add todo'),
    footer: document.createElement('footer'),
    // Media query used for turning the app into mobile mode
    mobileVersion: window.matchMedia("(max-width: 750px), (max-height: 400px)"),

}

// Object used to store a reference to the existing developer and user categories ID's and the current DOM content being rendered.
// Each time a category is created, a new property bearing its ID is added to categoriesContent object.
// Each time a category is deleted, its corresponding property is deleted from the categoriesContent object properties.
// Each time the user requests for the content of a category to be rendered, a todosList DOM element is created and assigned
// to its corresponding property on the categoriesContent object, then it is inserted into the DOM.
// If there was a previous category content being rendered, the todosList DOM is removed from the DOM tree,
// released from memory, re-created on the new property, and re-attached on the DOM.
// This system prevents memory leaks from detached DOM elements by keeping DOM element reference to a minimum and
// by removing the old DOM element from the DOM tree and freeing it from memory each time a new content rendering request is made
const categoriesContent = {};

// The checkBounds function determines whether the element position needs to be changed 
// as a result of it leaking out of the viewport, and changes its position using CSS classes;

function disableScrolling() {
    const html = document.querySelector('html');
    // Add right padding to the HTML element of the DOM that is equal to the width of the scrollbar,
    // to prevent the usual layout shift when the scrollbar appears and disappears
    html.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
    addClass(html, 'overlay-over');
}

function enableScrolling() {
    const html = document.querySelector('html');
    // Remove the right padding added by disableScrolling function
    html.style.removeProperty('padding')
    removeClass(html, 'overlay-over');
}

function checkBounds(element, breakpoint) {
    if (hasClass(element, 'top-positioned')) removeClass(element, 'top-positioned');
    if (hasClass(element, 'center-positioned')) removeClass(element, 'center-positioned');

    if (isOutOfBounds('bottom', element, breakpoint)) addClass(element, 'top-positioned');

    if (hasClass(element, 'top-positioned') && isOutOfBounds('top', element)) {
        removeClass(element, 'top-positioned');
        addClass(element, 'center-positioned');
    }
}

function isOutOfBounds(position, element, breakpoint) {
    // Get the element's position relative to the viewport
    const elementBound = element.getBoundingClientRect();
    // Get the top/y value of the element
    const elementY = elementBound.y;
    // Get the actual height of the HTML document
    const clientHeight = document.querySelector('html').clientHeight;

    const methods = {
        'top': function () { return elementY < 0 },
        'bottom': function () { return clientHeight - elementY < breakpoint },
    }
    return methods[position]();
}

function getParentOf(element) { return element.parentElement };
function hasClass(element, className) { return element.classList.contains(className) };
function addClass(element, className) { element.classList.add(className) };
function removeClass(element, className) { element.classList.remove(className) };
function toggleClass(element, className) { element.classList.toggle(className) };
function updateInputValue(target, inputValue) { target.value = inputValue };
function applyFocus(element) { element.focus() };

function updateTextContent(target, text) {
    if (text == 0) return target.textContent = '';
    target.textContent = text;
}

function replace(newElement, element) {
    const parent = element.parentElement;
    parent.replaceChild(newElement, element);
}

function enableInput(element) {
    element.style.pointerEvents = 'auto';
    element.style.touchEvents = 'auto';
}

function disableInput(element) {
    element.style.pointerEvents = 'none';
    element.style.touchEvents = 'none';
}

function enableButton(button) {
    button.disabled = false;
    button.removeAttribute('tabindex');
}

function disableButton(button) {
    button.disabled = true;
    button.setAttribute('tabindex', '-1');
}