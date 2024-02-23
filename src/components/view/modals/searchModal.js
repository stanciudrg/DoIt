import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import { createInput, createElementWithID, createAnchorTodoItem } from "../creator";
import { DOMCache } from "../DOMCache";
import Modal from "./modal";

import {
  find,
  findAll,
  addClass,
  render,
} from "../viewHelpers";

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
  searchModal.trap = focusTrap.createFocusTrap(searchModal.form, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    setReturnFocus: () => find(DOMCache.main, ".highlighted") || this,
  });
  searchModal.handleAnchorTodoElementsClickEvents =
    function handleAnchorTodoElementsClickEvents(e) {
      const anchorTodoItem = e.target.closest(".anchor-todo-item");
      if (!anchorTodoItem) return;

      // If an anchor todo item is clicked, close the search modal and ask the Controller
      // to handle the logic for showing to the user the todo that they are looking for
      e.preventDefault();
      e.stopImmediatePropagation();
      searchModal.closeModal();
      PubSub.publish("SHOW_TODO_LOCATION_REQUEST", anchorTodoItem.dataset.id);
    };
  searchModal.sendSearchCoordinates = function sendSearchCoordinates() {
    PubSub.publish("SEARCH_REQUEST", this.value);
  };
  searchModal.closeModalFn = function closeModalFn() {
    searchModal.searchInput.removeEventListener("input", searchModal.sendSearchCoordinates);
    searchModal.searchResultsList.removeEventListener(
      "click",
      searchModal.handleAnchorTodoElementsClickEvents,
    );
    searchModal.trap.deactivate();
  };
  searchModal.initSearchModal = function initSearchModal() {
    searchModal.initModal();
    searchModal.searchInput.addEventListener('input', searchModal.sendSearchCoordinates);
    render(searchModal.fieldset, searchModal.searchBar);
    searchModal.searchResultsList.addEventListener('click', searchModal.handleAnchorTodoElementsClickEvents);
    render(searchModal.form, searchModal.searchResultsList);
    searchModal.trap.activate();
    searchModal.addAdditionalCloseModalFn(searchModal.closeModalFn);
  }
  return searchModal;
}

export function renderSearchModal() {
  const searchModal = SearchModal();
  searchModal.initSearchModal();
}

export function renderAnchorTodoElement(ID, title) {
  const resultsList = find(DOMCache.modal, "#search-results-list");
  const anchorTodoElement = createAnchorTodoItem(ID, title);

  render(resultsList, anchorTodoElement);
}

export function deleteAllAnchorTodoElements() {
  const resultsList = find(DOMCache.modal, "#search-results-list");
  findAll(resultsList, ".anchor-todo-item").forEach((result) => {
    result.remove();
  });
}

// If the results list contains a Todo that is already completed, also design
// the anchorTodoElement to appears as being already completed
export function markAnchorTodoElementAsCompleted(todoID) {
  const resultsList = find(DOMCache.modal, "#search-results-list");
  const anchorTodoElement = find(resultsList, `[data-id= "${todoID}"]`);

  addClass(anchorTodoElement, "completed");
}
