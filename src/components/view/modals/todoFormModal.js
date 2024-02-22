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
} from "../viewHelpers";

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

  todoFormModal.setTrap = function setTrap(trapObject) {
    todoFormModal.trap = trapObject;
  };
  // Modify the default 'Enter' key behavior of Todo title and Todo description text areas
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
    // Simulates an input by setting the dataset of the category input button to the value of the categoryID
    // and by setting the textContent of the category input button to the value of the categoryName
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

  todoFormModal.checkInput = function checkInput() {
    // Transforms textareas into autogrowing textareas by keeping their height
    // the same value as their scrollHeight. Also prevents the textAreasContainer
    // from changing its scroll position each time an input event is fired
    // on the textareas
    const oldScrollPosition = todoFormModal.textAreasContainer.scrollTop;
    this.style.height = "auto";
    this.style.height = `${this.scrollHeight}px`;
    todoFormModal.textAreasContainer.scrollTo(0, oldScrollPosition);

    if (this === todoFormModal.titleInput) {
      // Only enable the submitButton if the titleInput has at least one character
      if (this.value.match(/([a-zA-Z0-9)]){1,}/g)) {
        enableButton(todoFormModal.submitButton);
        return;
      }

      disableButton(todoFormModal.submitButton);
    }
  };

  // By default, the descriptionInput is not always scrolled into view when it is not fully visible and it is being
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

  // Automatically replace the dueDate value provided by flatpickr with a custom, formatted version
  todoFormModal.replaceInput = function replaceInput() {
    if (!todoFormModal.dueDateInput.value) return;
    todoFormModal.dueDateInput.value = `${formatDate(todoFormModal.dueDateInput.value)} / ${todoFormModal.dueDateInput.value}`;
  };

  todoFormModal.clearDateInput = function clearDateInput() {
    todoFormModal.datePicker.clear();
  };

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

  todoFormModal.requestCategoriesDropdown =
    function requestCategoriesDropdown() {
      PubSub.publish("CATEGORIES_DROPDOWN_REQUEST");
    };

  // Clears the current category input value when clicking the clearCategory button
  todoFormModal.clearCategory = function clearCategory() {
    todoFormModal.categorySelectButton.dataset.id = "";
    updateTextContent(todoFormModal.categorySelectButton, "Category");
    addClass(todoFormModal.categorySelectButton, "empty");
  };

  todoFormModal.closeModalFn = function closeModalFn() {
    todoFormModal.trap.deactivate();
    // Remove event listeners to prevent memory leaks and other unwanted behavior
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

export function renderEditTodoModal(properties) {
  const todoFormModal = TodoFormModal();
  todoFormModal.initTodoFormModal();
  todoFormModal.modifySubmitButton("Edit");
  const [title, description, priority, dueDate, categoryID, categoryName] =
    properties;
  todoFormModal.titleInput.value = title;
  todoFormModal.titleInput.dispatchEvent(new Event("input"));

  if (description) {
    todoFormModal.descriptionInput.value = description;
    todoFormModal.descriptionInput.dispatchEvent(new Event("input"));
  }

  if (priority) {
    find(
      todoFormModal.prioritiesFieldset,
      `input[value='${priority}']`,
    ).setAttribute("checked", "true");
  }

  if (categoryID) todoFormModal.selectCategory(categoryID, categoryName);
  if (dueDate) todoFormModal.selectDate(dueDate);

  // Trap TAB focus within the form
  const trap = focusTrap.createFocusTrap(todoFormModal.form, {
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
  });
  trap.activate();
  todoFormModal.setTrap(trap);

  const submitModal = (e) => {
    // Prevents the default form submission behavior
    e.preventDefault();
    // Gets the formData
    const formData = new FormData(todoFormModal.form);
    // Formats the dueDate
    const newDueDate = formData.get("dueDate")
      ? formData.get("dueDate").split("/")[1].trim()
      : formData.get("dueDate");
    // Manually gets the categoryID and categoryName since they are custom inputs that are not recognized by FormData
    const newCategoryID = todoFormModal.categorySelectButton.dataset.id;
    todoFormModal.closeModal();
    PubSub.publish("EDIT_TODO_REQUEST", {
      todoID: properties[6],
      newTitle: formData.get("title").trim(),
      newDescription: formData.get("description").trim(),
      newPriority: formData.get("priority"),
      newDueDate,
      newCategoryID,
    });
  };

  todoFormModal.setSubmitModalFn(submitModal);
}

// The todo modal will have different values already set when opened based
// on its callLocation and the locationAttributes that are passed along with it
export function renderAddTodoModal(callLocation, locationAttributes) {
  const todoFormModal = TodoFormModal();
  todoFormModal.initTodoFormModal();

  if (callLocation === "today") {
    todoFormModal.datePicker.set("maxDate", format(new Date(), "yyyy-MM-dd"));
    todoFormModal.selectDate(format(new Date(), "yyyy-MM-dd"), true);
  }

  if (callLocation === "this-week") {
    todoFormModal.datePicker.set(
      "maxDate",
      format(addDays(new Date(), 7), "yyyy-MM-dd"),
    );
    todoFormModal.selectDate(format(new Date(), "yyyy-MM-dd"), true);
  }

  if (callLocation === "user-category") {
    const [categoryID, categoryName] = locationAttributes;
    todoFormModal.selectCategory(categoryID, categoryName);
  }

  // Trap TAB focus within the form
  const trap = focusTrap.createFocusTrap(todoFormModal.form, {
    initialFocus: () => DOMCache.modal,
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    returnFocusOnDeactivate: () => true,
    preventScroll: () => true,
  });
  trap.activate();
  todoFormModal.setTrap(trap);

  const submitModal = (e) => {
    // Prevents the default form submission behavior
    e.preventDefault();
    // Gets the formData
    const formData = new FormData(todoFormModal.form);
    // Formats the dueDate
    const dueDate = formData.get("dueDate")
      ? formData.get("dueDate").split("/")[1].trim()
      : formData.get("dueDate");
    // Manually gets the categoryID and categoryName since they are custom inputs that are not recognized by FormData
    const categoryID = todoFormModal.categorySelectButton.dataset.id;
    const categoryName = !categoryID
      ? ""
      : todoFormModal.categorySelectButton.textContent;

    todoFormModal.closeModal();

    PubSub.publish("ADD_TODO_REQUEST", {
      title: formData.get("title").trim(),
      description: formData.get("description").trim(),
      priority: formData.get("priority"),
      dueDate,
      categoryID,
      categoryName,
    });
  };

  todoFormModal.setSubmitModalFn(submitModal);
}
