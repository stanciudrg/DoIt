import Fuse from "fuse.js";
import {
  DevCategory,
  UserCategory,
  devCategoryProto,
  userCategoryProto,
} from "./category";
import { scanTodo } from "../universalHelpers";
import { Todo, todoProto } from "./todo";
import * as LocalStorage from "./localStorage";

// devCategories is where special, uneditable categories created by the developer are stored
// 'All todos' devCategory holds all todos, regarding of their properties (dueDate, overdue, completed);
// 'Today' holds only the todos that have their dueDate set to the current day
// 'Next 7 days' holds only the todos that are due in the next 7 days, even if the next 7 days are not part of the same week
const devCategories = [
  DevCategory("All todos", "all-todos"),
  DevCategory("Today", "today"),
  DevCategory("Next 7 days", "this-week"),
];
// userCategory objects are manually created, edited, and removed on user input
const userCategories = [];

export function getAllCategories() {
  return devCategories.concat(userCategories);
}

export function getDevCategories() {
  return devCategories;
}

export function getUserCategories() {
  return userCategories;
}

export function getCategory(ID) {
  return devCategories
    .concat(userCategories)
    .find((category) => category.getID() === ID);
}

export function getUserCategory(ID) {
  return userCategories.find((category) => category.getID() === ID);
}

export function getTodosOf(categoryID) {
  return getCategory(categoryID).getTodos();
}

export function hasTodo(categoryID, todoID) {
  return getTodosOf(categoryID).find((todo) => todo.get("id") === todoID);
}

export function editTodo(todo, property, newValue) {
  todo.set(property, newValue);

  if (LocalStorage.isEnabled()) {
    LocalStorage.editTodo(todo.get("id"), property, newValue);
  }
}

export function addCategory(category) {
  userCategories.push(category);

  if (LocalStorage.isEnabled()) {
    LocalStorage.addCategory(category, category.getID());
  }
}

function removeFromUserCategory(todo, categoryID) {
  getUserCategory(categoryID).removeTodo(todo);
  todo.set("categoryID", "");
  todo.set("categoryName", "");

  if (LocalStorage.isEnabled()) {
    LocalStorage.removeFromUserCategory(todo.get("id"));
  }
}

export function deleteCategory(categoryID) {
  const category = getCategory(categoryID);
  // First, go through each Todo and call the RemoveFromUserCategory function that will remove the Todo from its
  // category and reset its categoryName and categoryID properties...
  category
    .getTodos()
    .forEach((todo) => removeFromUserCategory(todo, categoryID));
  // ...and then delete the userCategory
  userCategories.splice(userCategories.indexOf(category), 1);

  if (LocalStorage.isEnabled()) LocalStorage.deleteCategory(categoryID);
}

export function changeUserCategoryName(categoryID, newName) {
  const category = getCategory(categoryID);

  if (!category.isEditable()) return;

  category.setName(newName);

  if (!LocalStorage.isEnabled()) return;

  LocalStorage.changeUserCategoryName(categoryID, newName);

  // Go through each todo of the userCategory...
  category.getTodos().forEach((todo) => {
    // ... rename its categoryName property...
    editTodo(todo, 'categoryName', newName);
  });
}

export function organize(categoryID) {
  const category = getCategory(categoryID);
  category.filter();
  category.sort();
}

export function setSortingMethod(categoryID, type) {
  const category = getCategory(categoryID);
  category.setSortingMethod(type);

  if (LocalStorage.isEnabled()) LocalStorage.setSortingMethod(categoryID, type);
}

export function setFilterMethod(categoryID, type) {
  const category = getCategory(categoryID);
  category.setFilterMethod(type);

  if (LocalStorage.isEnabled()) LocalStorage.setFilterMethod(categoryID, type);
}

export function getTodo(ID) {
  return devCategories[0].getTodos().find((todo) => todo.get("id") === ID);
}

// Check whether the Todo is completely removed by looking for it in the devCategories[0] ('All todos') category,
// which keeps track of all todos. The removeTodo function is called by the Controller for each devCategory or userCategory,
// there is no function that completely deletes the Todo from all categories, thus why this function is needed.
function isTodoWiped(id) {
  return !devCategories[0].getTodos().find((item) => item.get("id") === id);
}

export function addTodo(todo, categoryID) {
  getCategory(categoryID).addTodo(todo);

  if (LocalStorage.isEnabled()) LocalStorage.addTodo(todo, todo.get("id"));
}

export function removeTodo(todo, categoryID) {
  // If the category from which the Todo should be removed is userCategory, also run the
  // removeFromUserCategory function to set Todo's object categoryID and categoryName properties to null
  if (getUserCategory(categoryID)) {
    removeFromUserCategory(todo, categoryID);
  } else {
    getCategory(categoryID).removeTodo(todo);
  }

  if (LocalStorage.isEnabled() && isTodoWiped(todo.get("id"))) {
    LocalStorage.removeTodo(todo.get("id"));
  }
}

export function toggleCompletedStatus(todo) {
  todo.toggleCompletedStatus();

  if (LocalStorage.isEnabled()) {
    LocalStorage.toggleTodoCompletedStatus(
      todo.get("id"),
      todo.get("completedStatus"),
    );
  }
}

// Search the devCategories[0] ('All todos') devCategory for the Todos that contain the parameter within their Title,
// and return an array of results; The parameter must be a string.
export function search(parameter) {
  const options = {
    keys: ["title"],
    includeMatches: true,
    threshold: 0.2,
  };

  const fuse = new Fuse(devCategories[0].getTodos(), options);
  const result = fuse.search(parameter);
  return result;
}

// Organizer initialization function. Responsible with verifying whether localStorage is enabled and
// contains any data. If it does, it retrieves and stores it in the application memory
export function init() {
  if (!LocalStorage.isEnabled()) return;

  // If it's the first time the user visits the app, create an introductory Todo and UserCategory;
  const isFamiliar = localStorage.getItem("isFamiliar");

  if (!isFamiliar) {
    const firstCategory = UserCategory("My first category");
    localStorage.setItem(
      `userCategory-${firstCategory.getID()}`,
      JSON.stringify(firstCategory),
    );
    const firstTodo = Todo(
      "Welcome! Click the arrow button bellow to find out more about this app.",
      "Do It is a vanilla JavaScript and CSS only app that saves your progress on the current browser using localStorage. For now, it allows you to create, edit, delete, sort, filter, and search for todos. You can also create and rename Categories as you wish. Each 60 seconds, Do It verifies the due date of your todos to determine whether they became 'overdue' as time went on, and applies visual changes for you to be easier to differentiate between 'due' and 'overdue' todos. This app is a work in progress, and more features will be added in the future.",
      "1",
    );
    localStorage.setItem(
      `todo-${firstTodo.get("id")}`,
      JSON.stringify(firstTodo),
    );
  }

  localStorage.setItem("isFamiliar", "true");

  const setDevCategoryDefaults = (storageDevCategory) => {
    // Get the devCategory and re-assign the prototype that was lost when it was stringified
    const parsedUserCategory = JSON.parse(storageDevCategory);
    Object.setPrototypeOf(parsedUserCategory, devCategoryProto);
    // Find the where the current storageDevCategory is located in the devCategories in memory array...
    const index = devCategories
      .map((category) => category.id)
      .indexOf(parsedUserCategory.getID());
    // And replace the default devCategory with the storageDevCategory, that may hold different properties
    // due to past user input (eg. modified sorting or filtering methods);
    devCategories[index] = parsedUserCategory;
  };

  const populateUserCategory = (storageUserCategory) => {
    // Get the userCategory and re-assign the prototype that was lost when it was stringified
    const parsedUserCategory = JSON.parse(storageUserCategory);
    const newProto = { ...devCategoryProto, ...userCategoryProto };
    Object.setPrototypeOf(parsedUserCategory, newProto);
    userCategories.push(parsedUserCategory);
  };

  const populateTodo = (storageTodo) => {
    // Get the Todo and re-assign the prototype that was lost when it was stringified
    const parsedTodo = JSON.parse(storageTodo);
    Object.setPrototypeOf(parsedTodo, todoProto);
    // Run the Todo through the scanTodo function imported from the Controller.
    // The function will determine where the Todo should be added based on its properties (dueDate and categoryID);
    scanTodo(parsedTodo, addTodo);
  };

  devCategories.forEach((category) => {
    // If localStorage already has the devCategories stored, retrieve and use them to replace the in-memory devCategories
    if (localStorage.getItem(`devCategory-${category.getID()}`)) {
      setDevCategoryDefaults(
        localStorage.getItem(`devCategory-${category.getID()}`),
      );
      return;
    }
    // Otherwise get the in-memory devCategories and add them to localStorage
    localStorage.setItem(
      `devCategory-${category.getID()}`,
      JSON.stringify(category),
    );
  });

  // Get all userCategory objects from storage and push them into userCategories array...
  Object.keys(localStorage).forEach((key) => {
    if (/userCategory-.*/.test(key)) {
      populateUserCategory(localStorage.getItem(key));
    }
  });

  // ... then sort the userCategories array based on the creation date of the categories
  userCategories.sort((todoA, todoB) => {
    const a = todoA.getCreationDate();
    const b = todoB.getCreationDate();
    return a - b;
  });

  Object.keys(localStorage).forEach((key) => {
    if (/todo-.*/.test(key)) {
      populateTodo(localStorage.getItem(key));
    }
  });
}
