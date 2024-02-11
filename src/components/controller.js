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

export function deleteAllTodosOfCategory(categoryID) {

    // Go through all the todos of the userCategory and run them through the scanAndDeleteTodo function
    // to remove them from all categories from which they are part of, wiping them from memory
    Organizer.getUserCategory(categoryID).getTodos().forEach(todo => { scanAndDeleteTodo(todo.get('id')) });

}


//
//
// Content management: displaying new content, deleting old content, and 
// sorting and filtering content
// 
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

// Asks the renderer to create a settings dropdown list containing the specified sorting methods
export function handleSortSettingsRequest() {

    const currentCategory = Organizer.getCategory(Renderer.getCurrentContentID());

    // If the current content category is 'Today', do not render the dueDate sorting method, since all 
    // todos have the same date (the current date);
    if (currentCategory.getID() == 'today') return Renderer.renderContentCustomizer('sort', currentCategory.getCurrentSortingMethod(), 'creation-date', 'name', 'priority')
    Renderer.renderContentCustomizer('sort', currentCategory.getCurrentSortingMethod(), 'creation-date', 'name', 'priority', 'due-date');

}

// Asks the renderer to create a settings dropdown list containing the specified filter methods
export function handleFilterSettingsRequest() {

    Renderer.renderContentCustomizer('filter', Organizer.getCategory(Renderer.getCurrentContentID()).getCurrentFilterMethod(), 'no-filter', 'priority-one', 'priority-two', 'priority-three', 'completed', 'uncompleted');

}

export function sortTodos(type, categoryID) {

    // Set the new sorting method
    Organizer.setSortingMethod(categoryID, type);
    if (Renderer.getCurrentContentID() !== categoryID) return
    // Refresh the current content by running deleteContent and then displayNewContent (which reorganizes the category
    // each time it runs)
    deleteContent(categoryID);
    displayNewContent(categoryID);

}

export function filterTodos(type, categoryID) {

    // Set the new filter method
    Organizer.setFilterMethod(categoryID, type);
    if (Renderer.getCurrentContentID() !== categoryID) return
    // Refresh the current content by running deleteContent and then displayNewContent (which reorganizes the category
    // each time it runs)
    deleteContent(categoryID);
    displayNewContent(categoryID);

}

//
//
// Todo management: creating, editing, toggling states, deleting
//
//

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

export function handleEditTodoRequest(todoID, newTitle, newDescription, newPriority, newDueDate, newCategoryID) {

    const todo = Organizer.getTodo(todoID);

    editTodo(todo, 'title', newTitle);
    editTodo(todo, 'description', newDescription);
    editTodo(todo, 'priority', newPriority);
    editTodo(todo, 'dueDate', newDueDate);
    editTodo(todo, 'categoryID', newCategoryID);

    toggleTodoExpandFeature(todo);

}

function editTodo(todo, property, newValue) {

    const oldValue = todo.get(property);

    // If no changes were made, stop
    if (newValue == oldValue) return;
    // If the change is about the Todo's category, call editMethods without  editing the todo with
    // the Organizer.editTodo() function, as the object editing logic is being handled by the
    // editMethods object for the 'category' property
    if (property == 'categoryID') return editMethods[property](todo, newValue, oldValue);

    Organizer.editTodo(todo, property, newValue);
    editMethods[property](todo, todo.get(property), oldValue);

}

function scanForVisualChanges(todo, property, newValue, oldValue) {

    // If there was no value before, render the new value
    if (newValue && !oldValue) return Renderer.renderTodoAdditionalFeature(todo.get('id'), property, newValue);
    // If there was a value before, update it to reflect the new value
    if (newValue && oldValue) return Renderer.updateTodoFeature(todo.get('id'), property, newValue);
    // If there was a value before, and the new value is empty, remove the old value;
    if (!newValue && oldValue) return Renderer.deleteTodoFeature(todo.get('id'), property);

}

const editMethods = {

    'title': function (todo, newTitle) {

        if (!Renderer.isVisible(todo.get('id'))) return;

        Renderer.updateTodoFeature(todo.get('id'), 'title', newTitle);
        // If the the current rendered category is being sorted by the name of its todos,
        // move the Todo DOM element to its new location based on its new name, if applicable
        getCurrentSortingMethod() == 'name' && manipulateTodoLocation(todo.get('id'));

    },

    'description': function (todo, newDescription, oldDescription) {

        Renderer.isAdditionalInfoVisible(todo.get('id')) && scanForVisualChanges(todo, 'description', newDescription, oldDescription,);

    },

    'priority': function (todo, newPriority, oldPriority) {

        if (!Renderer.isVisible(todo.get('id'))) return

        Renderer.colorTodoCompletedStatusSpan(todo.get('id'), newPriority);
        Renderer.isAdditionalInfoVisible(todo.get('id')) && scanForVisualChanges(todo, 'priority', newPriority, oldPriority);
        // If the the current rendered category is being sorted or filtered by the priority of its todos,
        // move the Todo DOM element to its new location based on its new priority, if applicable
        (getCurrentSortingMethod() == 'priority' || /priority.*/.test(getCurrentFilterMethod())) && manipulateTodoLocation(todo.get('id'));

    },

    'dueDate': function (todo, newDueDate, oldDueDate) {

        // If the todo was marked as overdue, and then its dueDate was changed by the user, mark it as due, 
        // since the dueDate input does not allow for the date to be set in the past
        const oldOverdueStatus = todo.get('overdueStatus');
        oldOverdueStatus && Organizer.editTodo(todo, 'overdueStatus', false);
        Organizer.editTodo(todo, 'miniDueDate', formatDate(newDueDate));

        // Scan and add or remove the todo from 'today' and 'this-week' devCategories based on their new dueDate property
        scanAndMove('today', todo);
        scanAndMove('this-week', todo);

        if (!Renderer.isVisible(todo.get('id'))) return;

        oldOverdueStatus && Renderer.markTodoAsDue(todo.get('id'));
        scanForVisualChanges(todo, 'miniDueDate', todo.get('miniDueDate'), formatDate(oldDueDate));
        Renderer.isAdditionalInfoVisible(todo.get('id')) && scanForVisualChanges(todo, 'dueDate', newDueDate, oldDueDate);
        // If the the current rendered category is being sorted or filtered by the dueDate of its todos,
        // move the Todo DOM element to its new location based on its new dueDate, if applicable
        getCurrentSortingMethod() == 'due-date' && manipulateTodoLocation(todo.get('id'));

    },

    'categoryID': function (todo, newCategoryID, oldCategoryID) {

        // If the newCategoryID can not be found, stop
        if (newCategoryID && !Organizer.getUserCategory(newCategoryID)) return;

        const oldCategoryName = todo.get('categoryName');
        // If there is a newCategoryID, find the Category that has the ID and get its name
        const newCategoryName = newCategoryID ? Organizer.getUserCategory(newCategoryID).getName() : '';

        // If there is a new category selected by the user, and the Todo does not already have a category,
        // add it to the newCategory. Otherwise, if the todo already has a category, change it to the new one
        if (newCategoryID) { !oldCategoryID ? add() : change() };
        // If there is no newCategory selected, remove the already existing category
        if (!newCategoryID && oldCategoryID) { remove() };

        function add() {

            todo.set('categoryID', newCategoryID);
            todo.set('categoryName', newCategoryName);
            addTodo(todo, newCategoryID);

        }

        function remove() {

            todo.set('categoryID', '');
            todo.set('categoryName', '');
            deleteTodo(todo, oldCategoryID);

        }

        function change() {

            remove();
            add();

        }

        Renderer.isAdditionalInfoVisible(todo.get('id')) && scanForVisualChanges(todo, 'categoryID', newCategoryName, oldCategoryName);

    },

}

function scanAndMove(devCategory, todo) {

    // scanAndMove deals with moving to or removing the todos from the two devCategories that have their
    // logic based on dueDate: 'today' and 'next 7 days'.
    const parsedDueDate = parseISO(todo.get('dueDate'));
    // If the dueDate was changed, move the Todo based on its new dueDate
    // If the dueDate was removed, remove the Todo from where it was previously located
    todo.get('dueDate') ? move() : remove();

    function move() {

        // If the devCategory does not already have the Todo, and the Todo's new dueDate is compatible with the devCategory,
        // add the Todo to the devCategory.
        // Otherwise, if the devCategory already has the Todo, and the Todo's new dueDate is no longer compatible with the devCategory,
        // remove the Todo from the devCategory
        !Organizer.hasTodo(devCategory, todo.get('id'))
            ? checkDateInterval(devCategory, parsedDueDate) && addTodo(todo, devCategory)
            : !checkDateInterval(devCategory, parsedDueDate) && deleteTodo(todo, devCategory);

    }

    // If devCategory has the todo, remove it
    function remove() { Organizer.hasTodo(devCategory, todo.get('id')) && deleteTodo(todo, devCategory) }

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

function manipulateTodoLocation(todoID) {

    const todo = Organizer.getTodo(todoID);
    // Get the latest index;
    const oldIndex = todo.get('index');

    // Reorganize the current category that is rendered
    Organizer.organize(Renderer.getCurrentContentID());

    // If the new todo index is bigger than the old todo index, move the Todo DOM element down.
    // Otherwise, move the Todo DOM element up
    todo.get('index') > oldIndex
        ? Renderer.moveTodoElement(todo.get('id'), todo.get('index') + 1)
        : Renderer.moveTodoElement(todo.get('id'), todo.get('index'));

    todo.get('filteredOut') ? Renderer.markTodoAsFiltered('out', todoID) : Renderer.markTodoAsFiltered('in', todoID);
    // Update the index of all rendered todos to reflect the indexes of the todos held by the reorganized category
    Organizer.getTodosOf(Renderer.getCurrentContentID()).forEach((todo) => Renderer.updateTodoIndex(todo.get('id'), todo.get('index')));

}

//
//
// Modal management: add todo, edit todo, add category, confirm deletion of todo, 
// confirm deletion of category, and confirm deletion of category + all containing todos
//
//

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
export function handleTodoModalRequest(callLocation) {

    const todo = Organizer.getTodo(callLocation);
    const category = Organizer.getCategory(callLocation);

    if (todo) return Renderer.renderTodoModal('edit-todo', [todo.get('title'), todo.get('description'), todo.get('priority'), todo.get('dueDate'), todo.get('categoryID'), todo.get('categoryName'), todo.get('id')]);

    Organizer.getUserCategory(callLocation)
        ? Renderer.renderTodoModal('user-category', [category.getID(), category.getName()])
        : Renderer.renderTodoModal(callLocation);

}

// Asks the Renderer to create the categories dropdown list and then fills it with all existing UserCategories.
// Is being called when the user clicks the custom input for selecting the todo's category
export function handleCategoriesDropdownRequest() {

    Renderer.renderCategoriesDropdownList()
    Organizer.getUserCategories().forEach(category => Renderer.renderCategorySelectItem(category.getID(), category.getName()))

}

export function searchTodos(coordinates) {

    if (!Renderer.isSearchBarOpen()) return;

    // Get the results array
    const results = Organizer.search(coordinates);
    // Refresh the rendered results
    Renderer.deleteAllAnchorTodoElements();

    results.forEach((todo) => {

        Renderer.renderAnchorTodoElement(todo.item.get('id'), todo.item.get('title'));
        todo.item.get('completedStatus') && Renderer.markAnchorTodoElementAsCompleted(todo.item.get('id'));

    })

}

export function handleShowTodoLocationRequest(todoID) {

    const todo = Organizer.getTodo(todoID);

    // If the Todo can not be found in the current rendered category,
    // change the content to 'All todos' devCategory, then highlight the Todo element
    !Renderer.isVisible(todoID) && handleDisplayContentRequest('all-todos');
    Renderer.highlightTodoElement(todoID);
    // If the Todo element has additionalInfo, and it is not yet visible,
    // and the todo is not filtered out (user input is disabled), also expand its additionalInfo
    if (todo.hasAdditionalInfo() && !todo.get('filteredOut') && !Renderer.isAdditionalInfoVisible(todoID)) handleTodoExpandRequest(todoID);

}

// Asks the Renderer to render a deleteTodo or deleteCategory modal
// and passes the todo or category info
export function handleDeleteRequest(type, ID) {

    const methods = {
        // If the user is trying to delete a todo, provide the todoTitle property
        'todo': function () {

            const todo = Organizer.getTodo(ID);
            Renderer.renderDeleteModal(type, ID, todo.get('title'));

        },
        // If the user is trying to delete a category, provide the categoryName property,
        // and whether or not it contains any todos. If the category has todos, an additional
        // checkbox will be rendered that allows the user to specify whether the containing todos
        // should also be deleted
        'category': function () {

            const category = Organizer.getUserCategory(ID);
            const hasTodos = category.getTodos().length > 0;
            Renderer.renderDeleteModal(type, ID, category.getName(), hasTodos);

        },

    }

    methods[type]();

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