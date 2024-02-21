// Check whether localStorage is enabled by trying to access its methods
export function isEnabled() {
    try {
      const key = `__storage__test`;
      window.localStorage.setItem(key, null);
      window.localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  };

export function addCategory(category, categoryID) {
    localStorage.setItem(
        `userCategory-${categoryID}`,
        JSON.stringify(category),
      );
}

export function removeFromUserCategory(todoID) {
    const storageTodo = JSON.parse(
        localStorage.getItem(`todo-${todoID}`),
      );
      storageTodo.categoryID = "";
      storageTodo.categoryName = "";
      localStorage.setItem(`todo-${todoID}`, JSON.stringify(storageTodo));
}

export function deleteCategory(categoryID) {
    localStorage.removeItem(`userCategory-${categoryID}`);
}

export function changeUserCategoryName(categoryID, newName) {
    const storageCategory = JSON.parse(
        localStorage.getItem(`userCategory-${categoryID}`),
      );
      storageCategory.name = newName;
      localStorage.setItem(
        `userCategory-${categoryID}`,
        JSON.stringify(storageCategory),
      );
}

export function setSortingMethod(categoryID, type) {
    const set = (categoryType) => {
        const storageCategory = JSON.parse(
          localStorage.getItem(`${categoryType}-${categoryID}`),
        );
        storageCategory.sortingMethod = type;
        localStorage.setItem(
          `${categoryType}-${categoryID}`,
          JSON.stringify(storageCategory),
        );
      };
    
      if (JSON.parse(localStorage.getItem(`devCategory-${categoryID}`))) {
        set("devCategory");
        return;
      }
    
      set("userCategory");
}

export function setFilterMethod(categoryID, type) {
    const set = (categoryType) => {
        const storageCategory = JSON.parse(
          localStorage.getItem(`${categoryType}-${categoryID}`),
        );
        storageCategory.filterMethod = type;
        localStorage.setItem(
          `${categoryType}-${categoryID}`,
          JSON.stringify(storageCategory),
        );
      };
    
      if (JSON.parse(localStorage.getItem(`devCategory-${categoryID}`))) {
        set("devCategory");
        return;
      }
    
      set("userCategory");
}

export function addTodo(todo, todoID) {
    localStorage.setItem(`todo-${todoID}`, JSON.stringify(todo));
}

export function editTodo(todoID, property, newValue) {
    const storageTodo = JSON.parse(
        localStorage.getItem(`todo-${todoID}`),
      );
      storageTodo[property] = newValue;
      localStorage.setItem(`todo-${todoID}`, JSON.stringify(storageTodo));
}

export function removeTodo(todoID) {
    localStorage.removeItem(`todo-${todoID}`);
}

export function toggleTodoCompletedStatus(todoID, completedStatus) {
    const storageTodo = JSON.parse(
        localStorage.getItem(`todo-${todoID}`),
      );
      storageTodo.completedStatus = completedStatus;
      localStorage.setItem(`todo-${todoID}`, JSON.stringify(storageTodo));
}

