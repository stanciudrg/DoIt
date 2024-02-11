import * as Organizer from './organizer.js';
import * as Renderer from './renderer.js';
import { UserCategory } from './category.js';
import { Todo } from './todo.js';
import { isEqual, isFuture, intlFormatDistance, format, differenceInDays, parseISO, isThisWeek, isThisMonth } from 'date-fns';

//
//
// Category management: creating, renaming, deleting
// 
//

export function createCategory(name) {

    const category = UserCategory(name);
    Organizer.addCategory(category);
    Renderer.renderUserCategoryButton(category.getName(), category.getID());
    Renderer.updateUserCategoriesCount(Organizer.getUserCategories().length);

}

export function renameCategory(categoryID, newName) {

    const category = Organizer.getUserCategory(categoryID);
    Organizer.changeUserCategoryName(categoryID, newName);
    Renderer.renameUserCategoryButton(categoryID, newName);
    // If the category to be renamed has its content rendered, also rename the content title
    Renderer.getCurrentContentID() == categoryID && Renderer.renameContentTitle(newName);
    // If the todos of the category are rendered, and their additional info that contains their category information is visible,
    // change their category information to reflect the new category name
    category.getTodos().forEach(todo => Renderer.isAdditionalInfoVisible(todo.get('id')) && Renderer.updateTodoFeature(todo.get('id'), 'categoryID', todo.get('categoryName')));

}

export function deleteCategory(categoryID) {

    const category = Organizer.getUserCategory(categoryID);
    const todos = category.getTodos()

    // If the category to be deleted has its content rendered, make sure to switch to the main
    // 'All todos' devCategory, to prevent the 'content' container from being empty
    Renderer.getCurrentContentID() == categoryID && handleDisplayContentRequest('all-todos');
    Organizer.deleteCategory(categoryID);
    Renderer.deleteUserCategoryButton(categoryID);
    Renderer.updateUserCategoriesCount(Organizer.getUserCategories().length);

    todos.forEach((todo) => {

        // If the todos of the category are rendered, and their additional info that contains their category information is visible,
        // remove their information about the category
        Renderer.isAdditionalInfoVisible(todo.get('id')) && Renderer.deleteTodoFeature(todo.get('id'), 'categoryID');
        // * toggleTodoExpandFeature(todo);

    })

}

//
//
// Content management: displaying new content, deleting old content
//
//


export function handleDisplayContentRequest(categoryID) {

    // If the current content that is being rendered has the same dataset.id as the categoryID, stop
    // (this happens when users clicks, for example, the 'All todos' devCategory button while its content is already being rendered)
    if (Renderer.getCurrentContentID() == categoryID) return;
    // If there is any content being rendered, remove it from the DOM...
    Renderer.getCurrentContentID() && deleteContent(Renderer.getCurrentContentID());
    // ... and display the new content
    displayNewContent(categoryID);

}

function displayNewContent(categoryID) {

    // First, reapply the current sortingMethod and filterMethod functions on the 'todos' array of 
    // the requested Category
    Organizer.organize(categoryID);

    // Apply a 'selected' class to the header button that was clicked
    Renderer.selectNewCategoryButton(categoryID);
    // Rename the title of the 'content' container with the name of the requested Category
    Renderer.renameContentTitle(Organizer.getCategory(categoryID).getName());
    // If the requested Category is a UserCategory, also render a settings button to allow it to be renamed and deleted (since it is editable)
    Organizer.getUserCategory(categoryID) && Renderer.renderContentSettingsButton();
    // Create a new list container for the todos
    Renderer.renderTodosList(categoryID);
    // Check if the currentSorting and currentFilter methods of the requested Category have been changed from their default values.
    // If they were, add a visual clue to let the user know that the todos list is sorted and/or filtered.
    getCurrentSortingMethod() !== 'creation-date' ? Renderer.markContentCustomizeSetting('sort', true) : Renderer.markContentCustomizeSetting('sort', false);
    getCurrentFilterMethod() !== 'no-filter' ? Renderer.markContentCustomizeSetting('filter', true) : Renderer.markContentCustomizeSetting('filter', false);

    // For each todo of the new Category that is being requested to be rendered...
    Organizer.getTodosOf(categoryID).forEach(todo => {
        // Render the  todo element
        triggerTodoRendering(todo);
        // Check if the todo has been already marked as being completed in a different Category,
        // and update it accordingly
        todo.get('completedStatus') ?
            Renderer.updateTodoElementCompletedStatus(todo.get('id'), 'completed') :
            Renderer.updateTodoElementCompletedStatus(todo.get('id'), 'uncompleted');

        // Check if the todo has been marked as overdue by the checkDueDates function,
        // and update it accordingly
        if (todo.get('overdueStatus')) Renderer.markTodoAsOverdue(todo.get('id'));

    });

}

function deleteContent(categoryID) {

    // If the requested category to be deleted does not have the same ID as the dataset.id of the current content, stop
    if (categoryID !== Renderer.getCurrentContentID()) return;
    // Remove the 'selected' class from the header button that represents the content to be deleted
    Renderer.unselectOldCategoryButton();
    // If category is UserCategory, also delete the settings button from the 'content' container
    Organizer.getUserCategory(categoryID) && Renderer.deleteContentSettingsButton();
    // Delete the todos list that contains all todo elements
    Renderer.deleteTodosList(categoryID);

}

// Scans the todo and calls the passed function with specific arguments based on conditional statements
export function scanTodo(todo, fn) {

    const parsedDueDate = parseISO(todo.get('dueDate'));

    // If todo has a dueDate and that dueDate is the current date, run the function with the 'today' argument
    if (todo.get('dueDate') && checkDateInterval('today', parsedDueDate)) fn(todo, 'today');
    // If todo has a dueDate and that dueDate is in the following 7 days, run the function with the 'this-week' argument
    if (todo.get('dueDate') && checkDateInterval('this-week', parsedDueDate)) fn(todo, 'this-week');
    // If todo has a categoryID, run the function by providing the ID of the category;
    if (todo.get('categoryID')) fn(todo, todo.get('categoryID'));

    // Always run the function by providing the 'all-todos' argument, since the 'All todos' devCategory
    // has no special logic and contains all todos regardless of their properties
    fn(todo, 'all-todos');

}

export function scanAndAddTodo(title, description, priority, dueDate, categoryID, categoryName) {

    // If todo has a date set by the user, take it, transform it into a human readable format (eg. 'today', 'wednesday'),
    // and use it as an argument for the todo.miniDueDate property;
    const miniDueDate = dueDate ? formatDate(dueDate) : '';
    const todo = Todo(title, description, priority, dueDate, miniDueDate, categoryID, categoryName);
    // Run the newly created todo through the scanTodo function for it to be added where needed by the addTodo function
    scanTodo(todo, addTodo);

}

function addTodo(todo, categoryID) {

    Organizer.addTodo(todo, categoryID);
    Renderer.updateCategoryTodosCount(categoryID, Organizer.getTodosOf(categoryID).length);

    // If the category where the todo is being added is not rendered, stop...
    if (Renderer.getCurrentContentID() !== categoryID) return

    // ...otherwise, reorganize the category, render the newly created Todo,
    // and update the dataset.index property of all rendered Todo DOM elements
    Organizer.organize(categoryID);
    triggerTodoRendering(todo);
    Organizer.getTodosOf(categoryID).forEach(todo => Renderer.updateTodoIndex(todo.get('id'), todo.get('index')));

}

function triggerTodoRendering(todo) {

    // First, render the initial Todo DOM element that contains only the title
    Renderer.renderTodoElement(todo.get('id'), todo.get('index'), todo.get('title'));

    // If the todo has other additional properties, besides the title...
    if (todo.hasAdditionalInfo()) {

        // ...render an expand button that allows the user to request the rendering of additional info
        Renderer.renderTodoElementExpander(todo.get('id'));

        // If the todo has a priority property, ask the Renderer to color the completedStatusInput to reflect the current priority
        todo.get('priority') && Renderer.colorTodoCompletedStatusSpan(todo.get('id'), todo.get('priority'));
        // If the todo has a dueDate, render a miniDueDate element on it;
        todo.get('dueDate') && Renderer.renderTodoAdditionalFeature(todo.get('id'), 'miniDueDate', formatDate(todo.get('dueDate')));

    };

    todo.get('filteredOut') && Renderer.markTodoAsFiltered('out', todo.get('id'));

}

export function handleTodoExpandRequest(todoID) {

    const todo = Organizer.getTodo(todoID);

    if (Renderer.isVisible(todoID) && todo.hasAdditionalInfo()) {

        Renderer.renderTodoAdditionalInfo(todoID);
        todo.get('description') && requestRenderFor('description');
        todo.get('priority') && requestRenderFor('priority');
        todo.get('dueDate') && requestRenderFor('dueDate');
        todo.get('categoryID') && requestRenderFor('categoryName');

        function requestRenderFor(feature) { Renderer.renderTodoAdditionalFeature(todoID, feature, todo.get(feature)) };

    }

}

function toggleTodoExpandFeature(todo) {

    if (!Renderer.isVisible(todo.get('id'))) return;
    if (todo.hasAdditionalInfo() && !Renderer.isTodoExpanderVisible(todo.get('id'))) return Renderer.renderTodoElementExpander(todo.get('id'));
    if (!todo.hasAdditionalInfo() && Renderer.isTodoExpanderVisible(todo.get('id'))) removeTodoExpandFeature(todo);

}

function removeTodoExpandFeature(todo) {

    if (!Renderer.isVisible(todo.get('id'))) return;
    Renderer.deleteTodoElementExpander(todo.get('id'));

    if (!Renderer.isAdditionalInfoVisible(todo.get('id'))) return;
    // If the Todo has its additionalInfo rendered, also delete 
    // it along with the expand button...
    Renderer.deleteTodoAdditionalInfo(todo.get('id'));
    // ...but make sure that the todo shrink animation that is usually 
    // triggered by the user when clicking the expand button still works
    Renderer.dispatchTransitionEndEvent(todo.get('id'));

}

export function toggleTodoCompletedStatus(todoID) {

    const todo = Organizer.getTodo(todoID);
    Organizer.toggleCompletedStatus(todo);

    if (!Renderer.isVisible(todoID)) return

    todo.get('completedStatus') ?
        Renderer.updateTodoElementCompletedStatus(todoID, 'completed') :
        Renderer.updateTodoElementCompletedStatus(todoID, 'uncompleted');

    // If the current filter method is 'completed' or 'uncompleted', 
    // update the location of the Todo based on its new completed status value
    (getCurrentFilterMethod() == 'completed' || getCurrentFilterMethod() == 'uncompleted') && manipulateTodoLocation(todoID);

}

export function scanAndDeleteTodo(todoID) {

    // Run the todo through the scanTodo function for it to be removed from 
    // all locations using the deleteTodo function
    const todo = Organizer.getTodo(todoID);
    scanTodo(todo, deleteTodo);

}

function deleteTodo(todo, categoryID) {

    Organizer.removeTodo(todo, categoryID);
    Renderer.updateCategoryTodosCount(categoryID, Organizer.getTodosOf(categoryID).length);
    if (Renderer.getCurrentContentID() !== categoryID) return;

    // If the content is visible, reorganize the category, delete the rendered Todo element,
    // and update the index of all remaining rendered todos to reflect the indexes of the todos 
    // held by the reorganized category
    Organizer.organize(categoryID);
    Renderer.deleteTodoElement(todo.get('id'));
    Organizer.getTodosOf(categoryID).forEach(todo => Renderer.updateTodoIndex(todo.get('id'), todo.get('index')))

}

// Helper functions
function getCurrentSortingMethod() { return Organizer.getCategory(Renderer.getCurrentContentID()).getCurrentSortingMethod() }
function getCurrentFilterMethod() { return Organizer.getCategory(Renderer.getCurrentContentID()).getCurrentFilterMethod() }
export function lowercaseFirstLetter(word) { return word.charAt(0).toLowerCase() + word.slice(1) };
export function capitalizeFirstLetter(word) { return word.charAt(0).toUpperCase() + word.slice(1) };

export function formatDate(date) {

    // See 'date-fns' JavaScript library documentation for more information regarding the methods used within this function
    if (!date) return '';
    if (differenceInDays(parseISO(date), new Date()) < 1) { return intlFormatDistance(parseISO(date), new Date(), { unit: 'day' }) };
    if (differenceInDays(parseISO(date), new Date()) >= 1 && isThisWeek(parseISO(date), { weekStartsOn: 1 })) { return lowercaseFirstLetter(format(parseISO(date), 'EEEE')) };
    if (differenceInDays(parseISO(date), new Date()) >= 1 && !isThisWeek(parseISO(date), { weekStartsOn: 1 }) && isThisMonth(parseISO(date))) { return lowercaseFirstLetter(format(parseISO(date), 'E d')) };
    if (!isThisMonth(parseISO(date))) { return format(parseISO(date), 'd MMM') };

}

function checkDateInterval(type, dueDate) {

    const today = new Date();
    // Ensures that date comparisons are not affected by hours, minutes, or seconds
    today.setHours(0, 0, 0, 0);

    const types = {

        // If dueDate is lower than today...
        'overdue': function () { return format(dueDate, 'MM/dd/yyyy') < format(new Date(), 'MM/dd/yyyy') },
        // If dueDate is equal to today...
        'today': function () { return isEqual(dueDate, today) },
        // If dueDate is equal to today, or todo is in the future and is due within the next 7 days...
        'this-week': function () { return (isEqual(dueDate, today) || isFuture(dueDate)) && differenceInDays(dueDate, today) <= 7 },

    }

    return types[type]();

}