import { parseISO } from "date-fns";
import PubSub from "pubsub-js";
import { formatDate, checkDateInterval, scanTodo } from "./universalHelpers";
import * as Organizer from "./model/organizer";
import * as Renderer from "./view/renderer";
import {
  getCurrentContentID,
  isVisible,
  isAdditionalInfoVisible,
  isTodoExpanderVisible,
  isSearchBarOpen,
} from "./view/viewHelpers";
import { UserCategory } from "./model/category";
import { Todo } from "./model/todo";

// Helper functions
function getCurrentSortingMethod() {
  return Organizer.getCategory(
    getCurrentContentID(),
  ).getCurrentSortingMethod();
}

function getCurrentFilterMethod() {
  return Organizer.getCategory(
    getCurrentContentID(),
  ).getCurrentFilterMethod();
}

function triggerTodoRendering(todo) {
  // First, render the initial Todo DOM element that contains only the title
  Renderer.renderTodoElement(
    todo.get("id"),
    todo.get("index"),
    todo.get("title"),
  );

  // If the todo has other additional properties, besides the title...
  if (todo.hasAdditionalInfo()) {
    // ...render an expand button that allows the user to request the rendering of additional info
    Renderer.renderTodoElementExpander(todo.get("id"));

    // If the todo has a priority property, ask the Renderer to color the completedStatusInput to reflect the current priority
    if (todo.get("priority")) {
      Renderer.colorTodoCompletedStatusSpan(
        todo.get("id"),
        todo.get("priority"),
      );
    }

    // If the todo has a dueDate, render a miniDueDate element on it;
    if (todo.get("dueDate")) {
      Renderer.renderTodoMiniDueDate(
        todo.get("id"),
        formatDate(todo.get("dueDate")),
      );
    }
  }

  if (todo.get("filteredOut")) {
    Renderer.markTodoAsFiltered("out", todo.get("id"));
  }
}

function addTodo(todo, categoryID) {
  Organizer.addTodo(todo, categoryID);
  Renderer.updateCategoryTodosCount(
    categoryID,
    Organizer.getTodosOf(categoryID).length,
  );

  // If the category where the todo is being added is not rendered, stop...
  if (getCurrentContentID() !== categoryID) return;

  // ...otherwise, reorganize the category, render the newly created Todo,
  // and update the dataset.index property of all rendered Todo DOM elements
  Organizer.organize(categoryID);
  triggerTodoRendering(todo);
  Organizer.getTodosOf(categoryID).forEach((categoryTodo) =>
    Renderer.updateTodoIndex(categoryTodo.get("id"), categoryTodo.get("index")),
  );
}

export function handleAddTodoRequest(
  title,
  description,
  priority,
  dueDate,
  categoryID,
  categoryName,
) {
  // If todo has a date set by the user, transform it into a human readable format (eg. 'today', 'wednesday'),
  // and use it as an argument for the todo.miniDueDate property;
  const miniDueDate = dueDate ? formatDate(dueDate) : "";
  const todo = Todo(
    title,
    description,
    priority,
    dueDate,
    miniDueDate,
    categoryID,
    categoryName,
  );
  // Run the newly created todo through the scanTodo function for it to be added where needed by the addTodo function
  scanTodo(todo, addTodo);
}

PubSub.subscribe("ADD_TODO_REQUEST", (msg, properties) => {
  const { title, description, priority, dueDate, categoryID, categoryName } =
    properties;
  handleAddTodoRequest(
    title,
    description,
    priority,
    dueDate,
    categoryID,
    categoryName,
  );
});

function deleteTodo(todo, categoryID) {
  Organizer.removeTodo(todo, categoryID);
  Renderer.updateCategoryTodosCount(
    categoryID,
    Organizer.getTodosOf(categoryID).length,
  );

  if (getCurrentContentID() !== categoryID) return;

  // If the content is visible, reorganize the category, delete the rendered Todo element,
  // and update the index of all remaining rendered todos to reflect the indexes of the todos
  // held by the reorganized category
  Organizer.organize(categoryID);
  Renderer.deleteTodoElement(todo.get("id"));
  Organizer.getTodosOf(categoryID).forEach((categoryTodo) => {
    Renderer.updateTodoIndex(categoryTodo.get("id"), categoryTodo.get("index"));
  });
}

export function handleDeleteTodoRequest(todoID) {
  // Run the todo through the scanTodo function for it to be removed from
  // all locations using the deleteTodo function
  const todo = Organizer.getTodo(todoID);
  scanTodo(todo, deleteTodo);
}

PubSub.subscribe("DELETE_TODO_REQUEST", (msg, todoID) => {
  handleDeleteTodoRequest(todoID);
});

export function handleTodoExpandRequest(todoID) {
  const todo = Organizer.getTodo(todoID);

  if (!isVisible(todoID) || !todo.hasAdditionalInfo()) return;

  Renderer.renderTodoAdditionalInfo(todoID);

  if (todo.get("description"))
    Renderer.renderTodoDescription(todoID, todo.get("description"));

  if (todo.get("priority"))
    Renderer.renderTodoPriority(todoID, todo.get("priority"));

  if (todo.get("dueDate"))
    Renderer.renderTodoDueDate(todoID, todo.get("dueDate"));

  if (todo.get("categoryID"))
    Renderer.renderTodoCategory(todoID, todo.get("categoryName"));
}

PubSub.subscribe("TODO_EXPAND_REQUEST", (msg, todoID) => {
  handleTodoExpandRequest(todoID);
});

function removeTodoExpandFeature(todo) {
  Renderer.deleteTodoElementExpander(todo.get("id"));

  if (!isAdditionalInfoVisible(todo.get("id"))) return;
  // If the Todo has its additionalInfo rendered, also delete
  // it along with the expand button...
  Renderer.deleteTodoAdditionalInfo(todo.get("id"));
  // ...but make sure that the todo shrink animation that is usually
  // triggered by the user when clicking the expand button still works
  Renderer.dispatchTransitionEndEvent(todo.get("id"));
}

function toggleTodoExpandFeature(todo) {
  if (!isVisible(todo.get("id"))) return;

  if (
    todo.hasAdditionalInfo() &&
    !isTodoExpanderVisible(todo.get("id"))
  ) {
    Renderer.renderTodoElementExpander(todo.get("id"));
    return;
  }

  if (
    !todo.hasAdditionalInfo() &&
    isTodoExpanderVisible(todo.get("id"))
  ) {
    removeTodoExpandFeature(todo);
  }
}

function manipulateTodoLocation(todoID) {
  const todo = Organizer.getTodo(todoID);
  // Get the latest index;
  const oldIndex = todo.get("index");
  // Reorganize the current category that is rendered
  Organizer.organize(getCurrentContentID());
  // If the new todo index is bigger than the old todo index, move the Todo DOM element down.
  // Otherwise, move the Todo DOM element up
  if (todo.get("index") > oldIndex) {
    Renderer.moveTodoElement(todo.get("id"), todo.get("index") + 1);
  } else {
    Renderer.moveTodoElement(todo.get("id"), todo.get("index"));
  }

  if (todo.get("filteredOut")) {
    Renderer.markTodoAsFiltered("out", todoID);
  } else {
    Renderer.markTodoAsFiltered("in", todoID);
  }

  // Update the index of all rendered todos to reflect the indexes of the todos held by the reorganized category
  Organizer.getTodosOf(getCurrentContentID()).forEach(
    (categoryTodo) => {
      Renderer.updateTodoIndex(
        categoryTodo.get("id"),
        categoryTodo.get("index"),
      );
    },
  );
}

export function handleTodoCompletedStatusChangeRequest(todoID) {
  const todo = Organizer.getTodo(todoID);
  Organizer.toggleCompletedStatus(todo);

  if (!isVisible(todoID)) return;

  // If the current filter method is 'completed' or 'uncompleted',
  // update the location of the Todo based on its new completed status value
  if (
    getCurrentFilterMethod() === "completed" ||
    getCurrentFilterMethod() === "uncompleted"
  ) {
    manipulateTodoLocation(todoID);
  }

  if (!todo.get("completedStatus")) {
    Renderer.updateTodoElementCompletedStatus(todoID, "uncompleted");
    return;
  }

  Renderer.updateTodoElementCompletedStatus(todoID, "completed");
}

PubSub.subscribe("TODO_COMPLETED_STATUS_CHANGE_REQUEST", (msg, todoID) => {
  handleTodoCompletedStatusChangeRequest(todoID);
});

function scanAndMove(devCategory, todo) {
  // scanAndMove deals with moving to or removing the todos from the two devCategories that have their
  // logic based on dueDate: 'today' and 'next 7 days'.
  const parsedDueDate = parseISO(todo.get("dueDate"));
  // if the devCategory already has the Todo, and the Todo's new dueDate is no longer compatible with the devCategory,
  // or the Todo no longer has a dueDate, remove it from the devCategory
  if (
    (!todo.get("dueDate") || !checkDateInterval(devCategory, parsedDueDate)) &&
    Organizer.hasTodo(devCategory, todo.get("id"))
  ) {
    deleteTodo(todo, devCategory);
    return;
  }

  // If the devCategory does not already have the Todo, and the Todo's new dueDate is compatible with the devCategory,
  // add the Todo to the devCategory.
  if (
    !Organizer.hasTodo(devCategory, todo.get("id")) &&
    checkDateInterval(devCategory, parsedDueDate)
  ) {
    addTodo(todo, devCategory);
  }
}

function scanForVisualChanges(
  todo,
  newValue,
  oldValue,
  renderFn,
  updateFn,
  deleteFn,
) {
  // If there was no value before, render the new value
  if (newValue && !oldValue) {
    renderFn(todo.get("id"), newValue);
  }

  // If there was a value before, update it to reflect the new value
  if (newValue && oldValue) {
    updateFn(todo.get("id"), newValue);
  }

  // If there was a value before, and the new value is empty, remove the old value;
  if (!newValue && oldValue) {
    deleteFn(todo.get("id"));
  }
}

function editTodoTitle(todo, newTitle) {
  Organizer.editTodo(todo, "title", newTitle);

  if (!isVisible(todo.get("id"))) return;

  Renderer.updateTodoTitle(todo.get("id"), newTitle);
  // If the the current rendered category is being sorted by the name of its todos,
  // move the Todo DOM element to its new location based on its new name, if applicable

  if (getCurrentSortingMethod() === "name") {
    manipulateTodoLocation(todo.get("id"));
  }
}

function editTodoDescription(todo, newDescription, oldDescription) {
  Organizer.editTodo(todo, "description", newDescription);

  if (isAdditionalInfoVisible(todo.get("id"))) {
    scanForVisualChanges(
      todo,
      newDescription,
      oldDescription,
      Renderer.renderTodoDescription,
      Renderer.updateTodoDescription,
      Renderer.deleteTodoDescription,
    );
  }
}

function editTodoPriority(todo, newPriority, oldPriority) {
  Organizer.editTodo(todo, "priority", newPriority);

  if (!isVisible(todo.get("id"))) return;

  Renderer.colorTodoCompletedStatusSpan(todo.get("id"), newPriority);

  if (isAdditionalInfoVisible(todo.get("id"))) {
    scanForVisualChanges(
      todo,
      newPriority,
      oldPriority,
      Renderer.renderTodoPriority,
      Renderer.updateTodoPriority,
      Renderer.deleteTodoPriority,
    );
  }

  // If the the current rendered category is being sorted or filtered by the priority of its todos,
  // move the Todo DOM element to its new location based on its new priority, if applicable
  if (
    getCurrentSortingMethod() === "priority" ||
    /priority.*/.test(getCurrentFilterMethod())
  ) {
    manipulateTodoLocation(todo.get("id"));
  }
}

function editTodoDueDate(todo, newDueDate, oldDueDate) {
  Organizer.editTodo(todo, "dueDate", newDueDate);
  // If the todo was marked as overdue, and then its dueDate was changed by the user, mark it as due,
  // since the dueDate input does not allow for the date to be set in the past
  const oldOverdueStatus = todo.get("overdueStatus");

  if (oldOverdueStatus) Organizer.editTodo(todo, "overdueStatus", false);

  Organizer.editTodo(todo, "miniDueDate", formatDate(newDueDate));
  // Scan and add or remove the todo from 'today' and 'this-week' devCategories based on their new dueDate property
  scanAndMove("today", todo);
  scanAndMove("this-week", todo);

  if (!isVisible(todo.get("id"))) return;

  if (oldOverdueStatus) Renderer.markTodoAsDue(todo.get("id"));

  scanForVisualChanges(
    todo,
    todo.get("miniDueDate"),
    formatDate(oldDueDate),
    Renderer.renderTodoMiniDueDate,
    Renderer.updateTodoMiniDueDate,
    Renderer.deleteTodoMiniDueDate,
  );

  if (isAdditionalInfoVisible(todo.get("id"))) {
    scanForVisualChanges(
      todo,
      newDueDate,
      oldDueDate,
      Renderer.renderTodoDueDate,
      Renderer.updateTodoDueDate,
      Renderer.deleteTodoDueDate,
    );
  }

  // If the the current rendered category is being sorted or filtered by the dueDate of its todos,
  // move the Todo DOM element to its new location based on its new dueDate, if applicable
  if (getCurrentSortingMethod() === "due-date")
    manipulateTodoLocation(todo.get("id"));
}

function editTodoCategory(todo, newCategoryID, oldCategoryID) {
  // If the newCategoryID can not be found, stop
  if (newCategoryID && !Organizer.getUserCategory(newCategoryID)) return;

  const oldCategoryName = todo.get("categoryName");
  // If there is a newCategoryID, find the Category that has the ID and get its name
  const newCategoryName = newCategoryID
    ? Organizer.getUserCategory(newCategoryID).getName()
    : "";

  const add = () => {
    todo.set("categoryID", newCategoryID);
    todo.set("categoryName", newCategoryName);
    addTodo(todo, newCategoryID);
  };

  const remove = () => {
    todo.set("categoryID", "");
    todo.set("categoryName", "");
    deleteTodo(todo, oldCategoryID);
  };

  const change = () => {
    remove();
    add();
  };

  // If there is a new category selected by the user, and the Todo does not already have a category,
  // add it to the newCategory. Otherwise, if the todo already has a category, change it to the new one
  if (newCategoryID && !oldCategoryID) add();

  if (newCategoryID && oldCategoryID) change();

  // If there is no newCategory selected, remove the already existing category
  if (!newCategoryID && oldCategoryID) remove();

  if (isAdditionalInfoVisible(todo.get("id"))) {
    scanForVisualChanges(
      todo,
      newCategoryName,
      oldCategoryName,
      Renderer.renderTodoCategory,
      Renderer.updateTodoCategory,
      Renderer.deleteTodoCategory,
    );
  }
}

export function handleEditTodoRequest(
  todoID,
  newTitle,
  newDescription,
  newPriority,
  newDueDate,
  newCategoryID,
) {
  const todo = Organizer.getTodo(todoID);

  if (todo.get("title") !== newTitle)
    editTodoTitle(todo, newTitle, todo.get("title"));
  if (todo.get("description") !== newDescription)
    editTodoDescription(todo, newDescription, todo.get("description"));
  if (todo.get("priority") !== newPriority)
    editTodoPriority(todo, newPriority, todo.get("priority"));
  if (todo.get("dueDate") !== newDueDate)
    editTodoDueDate(todo, newDueDate, todo.get("dueDate"));
  if (todo.get("categoryID") !== newCategoryID)
    editTodoCategory(todo, newCategoryID, todo.get("categoryID"));

  toggleTodoExpandFeature(todo);
}

PubSub.subscribe("EDIT_TODO_REQUEST", (msg, properties) => {
  const {
    todoID,
    newTitle,
    newDescription,
    newPriority,
    newDueDate,
    newCategoryID,
  } = properties;
  handleEditTodoRequest(
    todoID,
    newTitle,
    newDescription,
    newPriority,
    newDueDate,
    newCategoryID,
  );
});

function displayNewContent(categoryID) {
  // First, reapply the current sortingMethod and filterMethod functions on the 'todos' array of
  // the requested Category
  Organizer.organize(categoryID);
  // Apply a 'selected' class to the header button that was clicked
  Renderer.selectNewCategoryButton(categoryID);
  // Rename the title of the 'content' container with the name of the requested Category
  Renderer.renameContentTitle(Organizer.getCategory(categoryID).getName());

  // If the requested Category is a UserCategory, also render a settings button to allow it to be renamed and deleted (since it is editable)
  if (Organizer.getUserCategory(categoryID)) {
    Renderer.renderContentSettingsButton();
  }

  // Create a new list container for the todos
  Renderer.renderTodosList(categoryID);

  // Check if the currentSorting and currentFilter methods of the requested Category have been changed from their default values.
  // If they were, add a visual clue to let the user know that the todos list is sorted and/or filtered.
  if (getCurrentSortingMethod() !== "creation-date") {
    Renderer.markContentSortSetting(true);
  } else {
    Renderer.markContentSortSetting(false);
  }

  if (getCurrentFilterMethod() !== "no-filter") {
    Renderer.markContentFilterSetting(true);
  } else {
    Renderer.markContentFilterSetting(false);
  }

  // For each todo of the new Category that is being requested to be rendered...
  Organizer.getTodosOf(categoryID).forEach((todo) => {
    // Render the  todo element
    triggerTodoRendering(todo);

    // Check if the todo has been already marked as being completed in a different Category,
    // and update it accordingly
    if (todo.get("completedStatus")) {
      Renderer.updateTodoElementCompletedStatus(todo.get("id"), "completed");
    }

    // Check if the todo has been marked as overdue by the checkDueDates function,
    // and update it accordingly
    if (todo.get("overdueStatus")) Renderer.markTodoAsOverdue(todo.get("id"));
  });
}

function deleteContent(categoryID) {
  // If the requested category to be deleted does not have the same ID as the dataset.id of the current content, stop
  if (categoryID !== getCurrentContentID()) return;
  // Remove the 'selected' class from the header button that represents the content to be deleted
  Renderer.unselectOldCategoryButton();

  // If category is UserCategory, also delete the settings button from the 'content' container
  if (Organizer.getUserCategory(categoryID)) {
    Renderer.deleteContentSettingsButton();
  }

  // Delete the todos list that contains all todo elements
  Renderer.deleteTodosList(categoryID);
}

export function handleDisplayContentRequest(categoryID) {
  // If the current content that is being rendered has the same dataset.id as the categoryID, stop
  // (this happens when users clicks, for example, the 'All todos' devCategory button while its content is already being rendered)
  if (getCurrentContentID() === categoryID) return;

  // If there is any content being rendered, remove it from the DOM...
  if (getCurrentContentID()) {
    deleteContent(getCurrentContentID());
  }

  // ... and display the new content
  displayNewContent(categoryID);
}

PubSub.subscribe("DISPLAY_CONTENT_REQUEST", (msg, categoryID) => {
  handleDisplayContentRequest(categoryID);
});

export function handleCreateCategoryRequest(name) {
  const category = UserCategory(name);
  Organizer.addCategory(category);
  Renderer.renderUserCategoryButton(category.getName(), category.getID());
  Renderer.updateUserCategoriesCount(Organizer.getUserCategories().length);
}

PubSub.subscribe("CREATE_CATEGORY_REQUEST", (msg, name) => {
  handleCreateCategoryRequest(name);
});

export function renameCategory(categoryID, newName) {
  const category = Organizer.getUserCategory(categoryID);
  Organizer.changeUserCategoryName(categoryID, newName);
  Renderer.renameUserCategoryButton(categoryID, newName);

  // If the category to be renamed has its content rendered, also rename the content title
  if (getCurrentContentID() === categoryID) {
    Renderer.renameContentTitle(newName);
  }

  // If the todos of the category are rendered, and their additional info that contains their category information is visible,
  // change their category information to reflect the new category name
  category.getTodos().forEach((todo) => {
    if (isAdditionalInfoVisible(todo.get("id"))) {
      Renderer.updateTodoCategory(todo.get("id"), todo.get("categoryName"));
    }
  });
}

PubSub.subscribe("RENAME_CATEGORY_REQUEST", (msg, args) => {
  const { categoryID, newName } = args;
  renameCategory(categoryID, newName);
})

export function handleDeleteCategoryRequest(categoryID) {
  const category = Organizer.getUserCategory(categoryID);
  const todos = category.getTodos();

  // If the category to be deleted has its content rendered, make sure to switch to the main
  // 'All todos' devCategory, to prevent the 'content' container from being empty
  if (getCurrentContentID() === categoryID) {
    handleDisplayContentRequest("all-todos");
  }

  Organizer.deleteCategory(categoryID);
  Renderer.deleteUserCategoryButton(categoryID);
  Renderer.updateUserCategoriesCount(Organizer.getUserCategories().length);

  todos.forEach((todo) => {
    // If the todos of the category are rendered, and their additional info that contains their category information is visible,
    // remove their information about the category
    if (isAdditionalInfoVisible(todo.get("id"))) {
      Renderer.deleteTodoCategory(todo.get("id"));
      toggleTodoExpandFeature(todo);
    }
  });
}

PubSub.subscribe("DELETE_CATEGORY_REQUEST", (msg, categoryID) => {
  handleDeleteCategoryRequest(categoryID);
});

export function handleDeleteContainingTodosRequest(categoryID) {
  // Go through all the todos of the userCategory and run them through the scanAndDeleteTodo function
  // to remove them from all categories from which they are part of, wiping them from memory
  Organizer.getUserCategory(categoryID)
    .getTodos()
    .forEach((todo) => {
      handleDeleteTodoRequest(todo.get("id"));
    });
}

PubSub.subscribe("DELETE_CONTAINING_TODOS_REQUEST", (msg, categoryID) => {
  handleDeleteContainingTodosRequest(categoryID);
});

// Asks the renderer to create a settings dropdown list containing the specified sorting methods
export function handleSortSettingsRequest() {
  const currentCategory = Organizer.getCategory(getCurrentContentID());

  // If the current content category is 'Today', do not render the dueDate sorting method, since all
  // todos have the same date (the current date);
  if (currentCategory.getID() === "today") {
    Renderer.renderCategorySortMenu(
      currentCategory.getCurrentSortingMethod(),
      ["creation-date",
      "name",
      "priority",]
    );
    return;
  }

  Renderer.renderCategorySortMenu(
    currentCategory.getCurrentSortingMethod(),
    ["creation-date",
    "name",
    "priority",
    "due-date",]
  );
}

PubSub.subscribe("SORT_SETTINGS_REQUEST", handleSortSettingsRequest);

// Asks the renderer to create a settings dropdown list containing the specified filter methods
export function handleFilterSettingsRequest() {
  Renderer.renderCategoryFilterMenu(
    Organizer.getCategory(
      getCurrentContentID(),
    ).getCurrentFilterMethod(),
    ["no-filter",
    "priority-one",
    "priority-two",
    "priority-three",
    "completed",
    "uncompleted",]
  );
}

PubSub.subscribe("FILTER_SETTINGS_REQUEST", handleFilterSettingsRequest);

export function handleSortTodosRequest(type) {
  // Set the new sorting method
  Organizer.setSortingMethod(getCurrentContentID(), type);

  // Refresh the current content by running deleteContent and then displayNewContent (which reorganizes the category
  // each time it runs)
  deleteContent(getCurrentContentID());
  displayNewContent(getCurrentContentID());
}

PubSub.subscribe("SORT_TODOS_REQUEST", (msg, type) => {
    handleSortTodosRequest(type);
})

export function handleFilterTodosRequest(type) {
  // Set the new filter method
  Organizer.setFilterMethod(getCurrentContentID(), type);

  // Refresh the current content (which reorganizes the category)
  deleteContent(getCurrentContentID());
  displayNewContent(getCurrentContentID());
}

PubSub.subscribe("FILTER_TODOS_REQUEST", (msg, type) => {
  handleFilterTodosRequest(type);
})

// The handleTodoModalRequest is called by the Renderer in the following circumstances:
// 1. When the user wants to add a todo, either by clicking the header's 'Add todo' button or the add button located
// at the end of a todo list
// 2. When the user wants to edit an existing todo.
// The functions tries to find either a todo or a category with the callLocation argument,
// then does the following:
// 1. If it finds a todo, it means that the callLocation was a todoID, and the user clicked an existing todo
// to edit it
// 2. If it finds a category, it means that the callLocation was the 'Add button' located at the end
// of a todo list, which is being contained in a 'content' container that has its dataset.id set to its categoryID
// 2a. If the category is UserCategory, specify that in the renderTodoModal function and provide its ID and name as additional arguments
// 2b. If it is not, it means that the callLocation is either 'All todos', 'Today', or 'Next 7 days, in which case call the renderTodoModal
// by passing on the callLocation argument;
export const handleTodoModalRequest = (callLocation) => {
  const todo = Organizer.getTodo(callLocation);
  const category = Organizer.getCategory(callLocation);

  if (todo) {
    Renderer.renderEditTodoModal([
      todo.get("title"),
      todo.get("description"),
      todo.get("priority"),
      todo.get("dueDate"),
      todo.get("categoryID"),
      todo.get("categoryName"),
      todo.get("id"),
    ]);
    return;
  }

  if (Organizer.getUserCategory(callLocation)) {
    Renderer.renderAddTodoModal("user-category", [
      category.getID(),
      category.getName(),
    ]);
    return;
  }

  Renderer.renderAddTodoModal(callLocation);
};

PubSub.subscribe("TODO_MODAL_REQUEST", (msg, callLocation) => {
  handleTodoModalRequest(callLocation);
});

// Asks the Renderer to create the categories dropdown list and then fills it with all existing UserCategories.
// Is being called when the user clicks the custom input for selecting the todo's category
export const handleCategoriesDropdownRequest = () => {
  Renderer.renderCategoriesDropdownList();
  Organizer.getUserCategories().forEach((category) => {
    Renderer.renderCategorySelectItem(category.getID(), category.getName());
  });
};

PubSub.subscribe(
  "CATEGORIES_DROPDOWN_REQUEST",
  handleCategoriesDropdownRequest,
);

export function handleSearchRequest(coordinates) {
  if (!isSearchBarOpen()) return;
  // Get the results array
  const results = Organizer.search(coordinates);
  // Refresh the rendered results
  Renderer.deleteAllAnchorTodoElements();
  results.forEach((todo) => {
    Renderer.renderAnchorTodoElement(
      todo.item.get("id"),
      todo.item.get("title"),
    );

    if (todo.item.get("completedStatus")) {
      Renderer.markAnchorTodoElementAsCompleted(todo.item.get("id"));
    }
  });
}

PubSub.subscribe("SEARCH_REQUEST", (msg, coordinates) => {
  handleSearchRequest(coordinates);
});

export function handleShowTodoLocationRequest(todoID) {
  // If the Todo can not be found in the current rendered category,
  // change the content to 'All todos' devCategory, then highlight the Todo element
  if (!isVisible(todoID)) handleDisplayContentRequest("all-todos");
  Renderer.highlightTodoElement(todoID);
  // If the Todo element has additionalInfo, and it is not yet visible,
  // and the todo is not filtered out (user input is disabled), also expand its additionalInfo
  const todo = Organizer.getTodo(todoID);

  if (
    todo.hasAdditionalInfo() &&
    !todo.get("filteredOut") &&
    !isAdditionalInfoVisible(todoID)
  ) {
    handleTodoExpandRequest(todoID);
  }
}

PubSub.subscribe("SHOW_TODO_LOCATION_REQUEST", (msg, todoID) => {
  handleShowTodoLocationRequest(todoID);
});

// Asks the Renderer to render a deleteTodo or deleteCategory modal
// and passes the todo or category info
export function handleDeleteTodoModalRequest(ID) {
  if (!ID) return;
  const todo = Organizer.getTodo(ID);
  Renderer.renderDeleteTodoModal(ID, todo.get("title"));
}

PubSub.subscribe("DELETE_TODO_MODAL_REQUEST", (msg, ID) => {
  handleDeleteTodoModalRequest(ID);
});

export function handleDeleteCategoryModalRequest(ID) {
  if (!ID) return;
  const category = Organizer.getUserCategory(ID);
  const hasTodos = category.getTodos().length > 0;
  Renderer.renderDeleteCategoryModal(ID, category.getName(), hasTodos);
}

PubSub.subscribe("DELETE_CATEGORY_MODAL_REQUEST", (msg, ID) => {
  handleDeleteCategoryModalRequest(ID);
});

function checkDueDates() {
  // Go through each todo...
  Organizer.getTodosOf("all-todos").forEach((todo) => {
    // If it does not have a dueDate, stop

    if (!todo.get("dueDate")) return;
    // If it does, run scanAndMove to check whether the todo should be
    // added or removed from 'Today' and 'Next 7 days' devCategories

    scanAndMove("today", todo);
    scanAndMove("this-week", todo);
    // Check if the miniDueDate property should be formatted differently, in case time has passed (eg. from 'yesterday' to '2 days ago'),
    // and reflect the changes on the Todo DOM element, if visible
    const oldMiniDueDate = todo.get("miniDueDate");
    const newMiniDueDate = formatDate(todo.get("dueDate")) || oldMiniDueDate;

    if (oldMiniDueDate !== newMiniDueDate) {
      Organizer.editTodo(todo, "miniDueDate", newMiniDueDate);

      if (!isVisible(todo.get("id"))) return;

      Renderer.updateTodoMiniDueDate(todo.get("id"), todo.get("miniDueDate"));
    }

    // Check if the todo is overdue using checkDateInterval function.
    // If it is, mark the todo as overdue.
    // If it has already been marked as overdue, stop
    if (
      todo.get("overdueStatus") === false &&
      checkDateInterval("overdue", parseISO(todo.get("dueDate")))
    ) {
      Organizer.editTodo(todo, "overdueStatus", true);

      if (!isVisible(todo.get("id"))) return;

      Renderer.markTodoAsOverdue(todo.get("id"));
    }
  });
}

export function init() {
  // Initialize the Organizer to check whether localStorage is available and has any data, then retrieve it
  Organizer.init();
  // Render the default part of the application
  Renderer.init();
  // Render the dynamic part of the application by creating/updating/removing DOM elements
  // based on the data retrieved from Organizer (if any)
  Organizer.getDevCategories().forEach((category) => {
    Renderer.renderDevCategoryButton(category.getName(), category.getID());
  });

  Organizer.getUserCategories().forEach((category) => {
    Renderer.renderUserCategoryButton(category.getName(), category.getID());
  });

  Renderer.updateUserCategoriesCount(Organizer.getUserCategories().length);
  Organizer.getAllCategories().forEach((category) => {
    Renderer.updateCategoryTodosCount(
      category.getID(),
      category.getTodos().length,
    );
  });

  // Always start the app by displaying the 'All todos' main devCategory
  displayNewContent("all-todos");
  // Check whether any todo is overdue
  checkDueDates();
  // In the background, continue checking if any todo is overdue each minute
  setInterval(checkDueDates, 60000);
}
