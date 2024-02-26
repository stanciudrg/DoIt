import * as focusTrap from "focus-trap";
import { format, addDays } from "date-fns";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import PubSub from "pubsub-js";
import {
  createElementWithClass,
  createTextArea,
  createPrioritiesFieldset,
  createInput,
  createClearButton,
  createCategoryInput,
} from "../creator";
import { formatDate } from "../../universalHelpers";
import { DOMCache, categoriesContent } from "../DOMCache";
import FormModal from "./formModal";
import {
  find,
  disableButton,
  enableButton,
  render,
  findAll,
  addClass,
  removeClass,
  hasClass,
  updateTextContent,
  checkBounds,
  getCurrentContentID,
  getParentOf,
} from "../viewHelpers";

// Creates a TodoFormModal object that inherits from FormModal and adds new DOM elements
// and new functionality to its form element
function TodoFormModal() {
  const todoFormModal = Object.create(FormModal("Todo details", "todo-form"));
  todoFormModal.textAreasContainer = createElementWithClass(
    "div",
    "text-areas-container",
  );
  todoFormModal.titleInputContainer = createTextArea(
    "title",
    "title",
    "todo-title",
    {
      minlength: "1",
      maxlength: "500",
      placeholder: "Todo title",
      rows: "1",
    },
  );
  todoFormModal.titleInput = find(
    todoFormModal.titleInputContainer,
    "textarea",
  );
  todoFormModal.descriptionInputContainer = createTextArea(
    "description",
    "description",
    "todo-description",
    { maxlength: "500", placeholder: "Description", rows: "1", cols: "1" },
  );
  todoFormModal.descriptionInput = find(
    todoFormModal.descriptionInputContainer,
    "textarea",
  );
  todoFormModal.prioritiesFieldset = createPrioritiesFieldset();
  todoFormModal.priorityCheckboxes = findAll(
    todoFormModal.prioritiesFieldset,
    "input",
  );
  todoFormModal.dueDateInputContainer = createInput(
    "dueDate",
    "due-date",
    "todo-due-date",
    "text",
    { placeholder: "Due date" },
  );
  todoFormModal.dueDateInput = find(
    todoFormModal.dueDateInputContainer,
    "input",
  );
  // Custom datePicker imported from the flatpickr JavaScript library. Check flatpickr
  // Javascript library documentation for more information regarding the settings used
  // for this app
  // eslint-disable-next-line new-cap
  todoFormModal.datePicker = new flatpickr(todoFormModal.dueDateInput, {
    minDate: format(new Date(), "yyyy-MM-dd"),
    maxDate: "",
    defaultDate: "",
    disableMobile: true,
    static: true,
    onOpen() {
      todoFormModal.showCalendar();
    },
  });
  todoFormModal.clearDueDateButton = createClearButton(
    "Clear selected due date",
    "clear-date",
  );
  todoFormModal.categoryInputContainer = createCategoryInput();
  todoFormModal.categorySelectButton = find(
    todoFormModal.categoryInputContainer,
    "button",
  );
  todoFormModal.clearCategoryButton = createClearButton(
    "Clear selected category",
    "clear-category",
  );
  todoFormModal.trap = null;
  // Sets the todoFormModal.trap property to a trapObject (focusTrap JS library)
  todoFormModal.setTrap = function setTrap(trapObject) {
    todoFormModal.trap = trapObject;
  };
  // Modifies the default 'Enter' key behavior for Todo title and Todo description text areas
  todoFormModal.changeEnterKeyBehavior = function changeEnterKeyBehavior(e) {
    if (e.key === "Enter" && e.shiftKey) return;

    if (e.key === "Enter") {
      e.preventDefault();
      if (todoFormModal.submitButton.disabled) return;
      todoFormModal.submitButton.dispatchEvent(new Event("click"));
    }
  };

  todoFormModal.selectCategory = function selectCategory(
    categoryID,
    categoryName,
  ) {
    // Sets the dataset of the category input button to the value of the categoryID
    // and the textContent of the category input button to the value of the categoryName
    todoFormModal.categorySelectButton.dataset.id = categoryID;
    updateTextContent(todoFormModal.categorySelectButton, categoryName);
    todoFormModal.categorySelectButton.setAttribute(
      "aria-label",
      `Todo category: ${categoryName}. Click this button to change the category of this todo`,
    );
    removeClass(todoFormModal.categorySelectButton, "empty");
  };

  // Manually sets the date of the dueDateInput following a custom format
  todoFormModal.selectDate = function selectDate(dueDate) {
    todoFormModal.dueDateInput.value = `${formatDate(dueDate)} / ${dueDate}`;
  };

  // Transforms textareas into autogrowing textareas by keeping their height
  // the same value as their scrollHeight. Also prevents the textAreasContainer
  // from changing its scroll position each time an input event is fired
  // on the textareas. Also enables and disables the submitButton based on the
  // input length of the titleInput
  todoFormModal.checkInput = function checkInput() {
    const oldScrollPosition = todoFormModal.textAreasContainer.scrollTop;
    this.style.height = "auto";
    this.style.height = `${this.scrollHeight}px`;
    todoFormModal.textAreasContainer.scrollTo(0, oldScrollPosition);

    if (this === todoFormModal.titleInput) {
      if (this.value.match(/([a-zA-Z0-9)]){1,}/g)) {
        enableButton(todoFormModal.submitButton);
        return;
      }

      disableButton(todoFormModal.submitButton);
    }
  };
  // By default, the descriptionInput is not always scrolled into view when it is not fully visible and is being
  // clicked on mobile devices. This function solves the bug in the majority of cases
  todoFormModal.scrollIntoView = function scrollIntoView() {
    if (DOMCache.mobileVersion.matches) {
      this.blur();
      if (this === todoFormModal.descriptionInput)
        todoFormModal.textAreasContainer.scrollTo(
          0,
          todoFormModal.textAreasContainer.scrollHeight,
        );
      this.focus({ preventScroll: true });
    }
  };

  // Prevents selecting more than one of the three priority checkboxes
  todoFormModal.preventMultipleCheckboxes =
    function preventMultipleCheckboxes() {
      if (this.checked) {
        todoFormModal.priorityCheckboxes.forEach((checkbox) => {
          const checkboxElement = checkbox;
          checkboxElement.checked = false;
        });

        this.checked = true;
      }
    };

  // Replaces the dueDate value set by flatpickr with a custom, formatted version
  todoFormModal.replaceInput = function replaceInput() {
    if (!todoFormModal.dueDateInput.value) return;
    todoFormModal.dueDateInput.value = `${formatDate(todoFormModal.dueDateInput.value)} / ${todoFormModal.dueDateInput.value}`;
  };

  // Clears dueDate's input value
  todoFormModal.clearDateInput = function clearDateInput() {
    todoFormModal.datePicker.clear();
  };

  // Function called by flatpickr whenever the calendar is requested by the user.
  // Adds custom logic to the flatpickr calendar
  todoFormModal.showCalendar = function showCalendar() {
    const calendar = find(todoFormModal.form, ".flatpickr-calendar");
    // Run the calendar through the checkBounds function to determine whether its position needs to be changed
    // after being rendered (in case its leaking out of the viewport)
    checkBounds(calendar, 325);
    addClass(todoFormModal.dueDateInput, "focused");

    function hideByKbd(e) {
      if (e.key === "Escape" || e.key === "Tab") {
        // eslint-disable-next-line no-use-before-define
        hideDueDateOverlay(e);
      }
    }

    function hideDueDateOverlay(e) {
      // If calendar is still open, stop
      if (hasClass(e.target, "active")) return;

      // Otherwise remove the formOverlay and eventListeners to prevent memory leaks and other unwanted behavior
      removeClass(todoFormModal.dueDateInput, "focused");
      todoFormModal.dueDateInput.removeEventListener(
        "change",
        hideDueDateOverlay,
      );

      removeClass(todoFormModal.formOverlay, "visible");
      todoFormModal.formOverlay.removeEventListener(
        "click",
        hideDueDateOverlay,
      );

      document.removeEventListener("keyup", hideByKbd);
    }

    document.addEventListener("keyup", hideByKbd);
    todoFormModal.dueDateInput.addEventListener("change", hideDueDateOverlay);
    // Make the formOverlay visible to prevent the main modal from also being closed when the user
    // tries to close the calendar either by pressing 'Escape' or by clicking outside the calendar
    addClass(todoFormModal.formOverlay, "visible");
    todoFormModal.formOverlay.addEventListener("click", hideDueDateOverlay);
  };

  // Send a request for the dropdown list that contains all user categories
  // to be rendered
  todoFormModal.requestCategoriesDropdown =
    function requestCategoriesDropdown() {
      PubSub.publish("CATEGORIES_DROPDOWN_REQUEST");
    };

  // Clears the current category input value
  todoFormModal.clearCategory = function clearCategory() {
    todoFormModal.categorySelectButton.dataset.id = "";
    updateTextContent(todoFormModal.categorySelectButton, "Category");
    addClass(todoFormModal.categorySelectButton, "empty");
  };
  // This object's own closeModalFn that specifically manipulates the DOM
  // elements and event listeners associated with it.
  todoFormModal.closeModalFn = function closeModalFn() {
    todoFormModal.trap.deactivate();
    todoFormModal.titleInput.removeEventListener(
      "input",
      todoFormModal.checkInput,
    );
    todoFormModal.titleInput.removeEventListener(
      "keydown",
      todoFormModal.changeEnterKeyBehavior,
    );
    todoFormModal.descriptionInput.removeEventListener(
      "input",
      todoFormModal.checkInput,
    );
    todoFormModal.descriptionInput.removeEventListener(
      "keydown",
      todoFormModal.changeEnterKeyBehavior,
    );
    todoFormModal.descriptionInput.removeEventListener(
      "click",
      todoFormModal.scrollIntoView,
    );
    todoFormModal.priorityCheckboxes.forEach((checkbox) => {
      checkbox.removeEventListener(
        "change",
        todoFormModal.preventMultipleCheckboxes,
      );
    });
    todoFormModal.dueDateInput.removeEventListener(
      "change",
      todoFormModal.replaceInput,
    );
    todoFormModal.clearDueDateButton.removeEventListener(
      "click",
      todoFormModal.clearDateInput,
    );
    todoFormModal.datePicker.destroy();
    todoFormModal.categorySelectButton.removeEventListener(
      "click",
      todoFormModal.requestCategoriesDropdown,
    );
    todoFormModal.clearCategoryButton.removeEventListener(
      "click",
      todoFormModal.clearCategory,
    );
  };

  todoFormModal.initTodoFormModal = function initTodoFormModal() {
    todoFormModal.initFormModal();
    // Adds this closeModalFn to the list of additionalCloseModal functions
    // that are called by the deleteSettings method on Modal
    todoFormModal.addAdditionalCloseModalFn(todoFormModal.closeModalFn);

    render(todoFormModal.fieldset, todoFormModal.textAreasContainer);
    todoFormModal.titleInput.addEventListener(
      "input",
      todoFormModal.checkInput,
    );
    todoFormModal.titleInput.addEventListener(
      "keydown",
      todoFormModal.changeEnterKeyBehavior,
    );
    render(todoFormModal.textAreasContainer, todoFormModal.titleInputContainer);
    todoFormModal.descriptionInput.addEventListener(
      "input",
      todoFormModal.checkInput,
    );
    todoFormModal.descriptionInput.addEventListener(
      "keydown",
      todoFormModal.changeEnterKeyBehavior,
    );
    todoFormModal.descriptionInput.addEventListener(
      "click",
      todoFormModal.scrollIntoView,
    );
    render(
      todoFormModal.textAreasContainer,
      todoFormModal.descriptionInputContainer,
    );
    render(todoFormModal.fieldset, todoFormModal.prioritiesFieldset);
    todoFormModal.priorityCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener(
        "change",
        todoFormModal.preventMultipleCheckboxes,
      );
    });
    render(todoFormModal.fieldset, todoFormModal.dueDateInputContainer);
    todoFormModal.dueDateInput.addEventListener(
      "change",
      todoFormModal.replaceInput,
    );
    todoFormModal.clearDueDateButton.addEventListener(
      "click",
      todoFormModal.clearDateInput,
    );
    render(
      todoFormModal.dueDateInputContainer,
      todoFormModal.clearDueDateButton,
    );
    render(todoFormModal.fieldset, todoFormModal.categoryInputContainer);
    todoFormModal.categorySelectButton.addEventListener(
      "click",
      todoFormModal.requestCategoriesDropdown,
    );
    addClass(todoFormModal.categorySelectButton, "empty");
    todoFormModal.clearCategoryButton.addEventListener(
      "click",
      todoFormModal.clearCategory,
    );
    render(
      todoFormModal.categoryInputContainer,
      todoFormModal.clearCategoryButton,
    );
  };

  return todoFormModal;
}

// Creates an EditTodoModal object that inherits from TodoFormModal and adds
// new functionality to its form elements.
// Expects an object that contains the Todo's current properties to be provided.
function EditTodoModal(properties) {
  const editTodoModal = Object.create(TodoFormModal());
  // This object's own submitModalFn that gets the FormData and
  // sends a request for the todo object to be edited by providing
  // the new input values
  editTodoModal.submitModalFn = function submitModalFn(e) {
    // Prevents the default form submission behavior
    e.preventDefault();
    // Gets the formData
    const formData = new FormData(editTodoModal.form);
    // Formats the dueDate
    const newDueDate = formData.get("dueDate")
      ? formData.get("dueDate").split("/")[1].trim()
      : formData.get("dueDate");
    // Manually gets the categoryID and categoryName since they are custom inputs that are not recognized by FormData
    const newCategoryID = editTodoModal.categorySelectButton.dataset.id;
    editTodoModal.closeModal();
    PubSub.publish("EDIT_TODO_REQUEST", {
      todoID: properties[6],
      newTitle: formData.get("title").trim(),
      newDescription: formData.get("description").trim(),
      newPriority: formData.get("priority"),
      newDueDate,
      newCategoryID,
    });
  };

  editTodoModal.initEditTodoModal = function initEditTodoModal() {
    editTodoModal.initTodoFormModal();
    // Changes the name of the submit button to 'Edit' from the default
    // 'Submit'
    editTodoModal.modifySubmitButton("Edit");

    // Uses the properties object provided to update the input values
    // to reflect the current properties of the todo
    const [title, description, priority, dueDate, categoryID, categoryName] =
      properties;
    editTodoModal.titleInput.value = title;
    editTodoModal.titleInput.dispatchEvent(new Event("input"));

    if (description) {
      editTodoModal.descriptionInput.value = description;
      editTodoModal.descriptionInput.dispatchEvent(new Event("input"));
    }

    if (priority) {
      find(
        editTodoModal.prioritiesFieldset,
        `input[value='${priority}']`,
      ).setAttribute("checked", "true");
    }

    if (categoryID) editTodoModal.selectCategory(categoryID, categoryName);
    if (dueDate) editTodoModal.selectDate(dueDate);

    // Creates and sets a focusTrap that manually returns the focus back
    // to the location that triggered this function
    editTodoModal.setTrap(
      focusTrap.createFocusTrap(editTodoModal.form, {
        initialFocus: () => DOMCache.modal,
        allowOutsideClick: () => true,
        escapeDeactivates: () => false,
        returnFocusOnDeactivate: () => true,
        preventScroll: () => true,
        setReturnFocus() {
          return find(
            find(
              categoriesContent[getCurrentContentID()],
              `[data-id="${properties[6]}"]`,
            ),
            ".settings-button",
          );
        },
      }),
    );

    editTodoModal.trap.activate();
    // Sets the submitModalFn that is called by the submitModalHandler method
    // defined on FormModal
    editTodoModal.setSubmitModalFn(editTodoModal.submitModalFn);
  };

  return editTodoModal;
}

// Renders an EditTodoModal that has its input values filled in with the
// specified properties
export function renderEditTodoModal(properties) {
  const editTodoModal = EditTodoModal(properties);
  editTodoModal.initEditTodoModal();
}

// Creates an AddTodoModal object that inherits from TodoFormModal and adds
// new functionality to its form elements.
// callLocation = a string representing the category from which the
// AddTodoModal was fired, if any
// locationAttributes = an object containing any additional information about
// the callLocation, if needed
function AddTodoModal(callLocation, locationAttributes) {
  const addTodoModal = Object.create(TodoFormModal());
  // This object's own submitModalFn that gets the FormData and
  // sends a request for the todo object to be added to its respective
  // categories by providing the input values
  addTodoModal.submitModalFn = function submitModalFn(e) {
    // Prevents the default form submission behavior
    e.preventDefault();
    // Gets the formData
    const formData = new FormData(addTodoModal.form);
    // Formats the dueDate
    const dueDate = formData.get("dueDate")
      ? formData.get("dueDate").split("/")[1].trim()
      : formData.get("dueDate");
    // Manually gets the categoryID and categoryName since they are custom inputs that are not recognized by FormData
    const categoryID = addTodoModal.categorySelectButton.dataset.id;
    const categoryName = !categoryID
      ? ""
      : addTodoModal.categorySelectButton.textContent;

    addTodoModal.closeModal();

    PubSub.publish("ADD_TODO_REQUEST", {
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      priority: formData.get("priority"),
      dueDate,
      categoryID,
      categoryName,
    });
  };

  addTodoModal.initAddTodoModal = function initAddTodoModal() {
    addTodoModal.initTodoFormModal();
    // Conditional statements that set different values for the dueDate
    // and category inputs depending on the location from which the
    // AddTodoModal was called
    if (callLocation === "today") {
      addTodoModal.datePicker.set("maxDate", format(new Date(), "yyyy-MM-dd"));
      addTodoModal.selectDate(format(new Date(), "yyyy-MM-dd"), true);
    }

    if (callLocation === "this-week") {
      addTodoModal.datePicker.set(
        "maxDate",
        format(addDays(new Date(), 7), "yyyy-MM-dd"),
      );
      addTodoModal.selectDate(format(new Date(), "yyyy-MM-dd"), true);
    }

    if (callLocation === "user-category") {
      const [categoryID, categoryName] = locationAttributes;
      addTodoModal.selectCategory(categoryID, categoryName);
    }

    // Trap TAB focus within the form
    addTodoModal.setTrap(
      focusTrap.createFocusTrap(addTodoModal.form, {
        initialFocus: () => DOMCache.modal,
        allowOutsideClick: () => true,
        escapeDeactivates: () => false,
        returnFocusOnDeactivate: () => true,
        preventScroll: () => true,
      }),
    );

    addTodoModal.trap.activate();
    // Sets the submitModalFn that is called by the submitModalHandler method
    // defined on FormModal
    addTodoModal.setSubmitModalFn(addTodoModal.submitModalFn);
  };

  return addTodoModal;
}

// Renders an AddTodoModal and specifies the location from which
// the function was called and provides any additional information if needed
export function renderAddTodoModal(callLocation, locationAttributes) {
  const addTodoModal = AddTodoModal(callLocation, locationAttributes);
  addTodoModal.initAddTodoModal();
}

// Handler attached to all elements inside the webpage that share the purpose
// of opening a Todo form modal.
// If the callLocation is the addButton located at the end of a todosList, it
// sends a Todo modal request to be handled by a different module, since additional
// logic needs to be handled in that scenario.
// Otherwise, it just asks for a default addTodoModal to be rendered
export function sendTodoModalRequest(e) {
  if (hasClass(e.target, "add-button")) {
    PubSub.publish("TODO_MODAL_REQUEST", getParentOf(e.target).dataset.id);
    return;
  }
  // Otherwise call the renderTodoModal with the 'all-todos' argument, which is a devCategory that holds all todos and has no special logic
  renderAddTodoModal("all-todos");
}
