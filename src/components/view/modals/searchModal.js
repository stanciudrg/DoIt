import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import {
  createInput,
  createElementWithID,
  createAnchorTodoItem,
} from "../creator";
import { DOMCache } from "../DOMCache";
import Modal from "./modal";

import { find, findAll, addClass, render } from "../viewHelpers";

// Creates a SearchModal object that inherits from Modal and adds new DOM elements
// and new functionality to its form element
function SearchModal() {
  const searchModal = Object.create(Modal("Search todos", "search-container"));
  searchModal.fieldset = find(searchModal.form, "fieldset");
  searchModal.searchBar = createInput(
    "Todo title",
    "title",
    "todos-searcher",
    "search",
    { placeholder: "Search todos" },
  );
  searchModal.searchInput = find(searchModal.searchBar, "input");
  searchModal.searchResultsList = createElementWithID(
    "ul",
    "search-results-list",
  );
  // Traps focus within the form
  searchModal.trap = focusTrap.createFocusTrap(searchModal.form, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    setReturnFocus: () => find(DOMCache.main, ".highlighted") || this,
  });
  // Handles the click events for the anchorTodoElements that are being rendered
  // inside the searchResultsList
  searchModal.handleAnchorTodoElementsClickEvents =
    function handleAnchorTodoElementsClickEvents(e) {
      const anchorTodoItem = e.target.closest(".anchor-todo-item");
      if (!anchorTodoItem) return;

      // If an anchor todo item is clicked, close the search modal and send a
      // request for the location of the todo to be shown to the user
      e.preventDefault();
      e.stopImmediatePropagation();
      searchModal.closeModal();
      PubSub.publish("SHOW_TODO_LOCATION_REQUEST", anchorTodoItem.dataset.id);
    };
  // Sends a search request by providing the value of the searchbar input as
  // a coordinate
  searchModal.sendSearchCoordinates = function sendSearchCoordinates() {
    PubSub.publish("SEARCH_REQUEST", this.value);
  };
  // This object's own closeModalFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
  searchModal.closeModalFn = function closeModalFn() {
    searchModal.searchInput.removeEventListener(
      "input",
      searchModal.sendSearchCoordinates,
    );
    searchModal.searchResultsList.removeEventListener(
      "click",
      searchModal.handleAnchorTodoElementsClickEvents,
    );
    searchModal.trap.deactivate();
  };
  searchModal.initSearchModal = function initSearchModal() {
    searchModal.initModal();
    searchModal.searchInput.addEventListener(
      "input",
      searchModal.sendSearchCoordinates,
    );
    render(searchModal.fieldset, searchModal.searchBar);
    searchModal.searchResultsList.addEventListener(
      "click",
      searchModal.handleAnchorTodoElementsClickEvents,
    );
    render(searchModal.form, searchModal.searchResultsList);
    searchModal.trap.activate();
    // Adds this closeModalFn to the list of additionalCloseModal functions
    // that are called by the deleteSettings method on Modal
    searchModal.addAdditionalCloseModalFn(searchModal.closeModalFn);
  };

  return searchModal;
}

// Renders a SearchModal
export function renderSearchModal() {
  const searchModal = SearchModal();
  searchModal.initSearchModal();
}

// Renders a custom AnchorTodoElement that simulates how default <a> tags behave
//
export function renderAnchorTodoElement(ID, title) {
  const resultsList = find(DOMCache.modal, "#search-results-list");
  const anchorTodoElement = createAnchorTodoItem(ID, title);

  render(resultsList, anchorTodoElement);
}

// Deletes all AnchorTodoElements that are currently being rendered
export function deleteAllAnchorTodoElements() {
  const resultsList = find(DOMCache.modal, "#search-results-list");
  findAll(resultsList, ".anchor-todo-item").forEach((result) => {
    result.remove();
  });
}

// Make the AnchorTodoElement look like it has been already completed using
// CSS classes
export function markAnchorTodoElementAsCompleted(todoID) {
  const resultsList = find(DOMCache.modal, "#search-results-list");
  const anchorTodoElement = find(resultsList, `[data-id= "${todoID}"]`);

  addClass(anchorTodoElement, "completed");
}
