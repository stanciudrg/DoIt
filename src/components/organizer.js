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

export function getAllCategories() { return devCategories.concat(userCategories) };
export function getDevCategories() { return devCategories };
export function getUserCategories() { return userCategories };
export function getCategory(ID) { return devCategories.concat(userCategories).find(category => category.getID() == ID) };
export function getUserCategory(ID) { return userCategories.find(category => category.getID() == ID) };
export function getTodosOf(categoryID) { return getCategory(categoryID).getTodos() };
export function hasTodo(categoryID, todoID) { return getTodosOf(categoryID).find(todo => todo.get('id') == todoID) }

export function addCategory(category) {

    userCategories.push(category);
    if (isLocalStorageEnabled()) { localStorage.setItem(`userCategory-${category.getID()}`, JSON.stringify(category)) };

}

export function deleteCategory(categoryID) {

    const category = getCategory(categoryID);
    // First, go through each Todo and call the RemoveFromUserCategory function that 
    // will remove the Todo from its category and reset its categoryName and categoryID properties...
    category.getTodos().forEach(todo => removeFromUserCategory(todo, categoryID));
    // ...and then delete the userCategory
    userCategories.splice(userCategories.indexOf(category), 1)

    if (isLocalStorageEnabled()) { localStorage.removeItem(`userCategory-${categoryID}`) };

}

function removeFromUserCategory(todo, categoryID) {

    getUserCategory(categoryID).removeTodo(todo);
    todo.set('categoryID', '');
    todo.set('categoryName', '');

    if (isLocalStorageEnabled()) {

        const storageTodo = JSON.parse(localStorage.getItem(`todo-${todo.get('id')}`));
        storageTodo.categoryID = '';
        storageTodo.categoryName = '';
        localStorage.setItem((`todo-${todo.get('id')}`), JSON.stringify(storageTodo));

    };

}

export function changeUserCategoryName(categoryID, newName) {

    const category = getCategory(categoryID);
    if (!category.isEditable()) return;
    category.setName(newName);

    // Go through each todo of the userCategory...
    category.getTodos().forEach(todo => {

        // ... rename its categoryName property...
        todo.set('categoryName', newName);

        if (isLocalStorageEnabled()) {

            // ...then get the Todo from the localStorage, change its categoryName, and push it back
            const storageTodo = JSON.parse(localStorage.getItem(`todo-${todo.get('id')}`));
            storageTodo.categoryName = newName;
            localStorage.setItem(`todo-${todo.get('id')}`, JSON.stringify(storageTodo));

        }

    })

    if (isLocalStorageEnabled()) {

        const storageCategory = JSON.parse(localStorage.getItem(`userCategory-${categoryID}`));
        storageCategory.name = newName;
        localStorage.setItem(`userCategory-${categoryID}`, JSON.stringify(storageCategory));

    }

}