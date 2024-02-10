import { DevCategory, UserCategory, devCategoryProto, userCategoryProto } from './category.js';
import { Todo, todoProto } from './todo.js';
import { scanTodo } from './controller.js';

// devCategories is where special, uneditable categories created by the developer are stored
// 'All todos' devCategory holds all todos, regarding of their properties (dueDate, overdue, completed);
// 'Today' holds only the todos that have their dueDate set to the current day
// 'Next 7 days' holds only the todos that are due in the next 7 days, even if the next 7 days are not part of the same week
const devCategories = [DevCategory('All todos', 'all-todos'), DevCategory('Today', 'today'), DevCategory('Next 7 days', 'this-week')];
// userCategory objects are manually created, edited, and removed on user input
const userCategories = [];

// Check whether localStorage is enabled by trying to access its methods
const isLocalStorageEnabled = () => {

    try {

        const key = `__storage__test`;
        window.localStorage.setItem(key, null);
        window.localStorage.removeItem(key);
        return true;

    } catch (e) {

        return false;

    }

};