import { v4 as uuidv4 } from 'uuid';
import icons from './icons.js';

export function createElementWithClass(type, className) {

    const element = document.createElement(type);
    element.classList.add(className);
    return element;

}

export function createElementWithID(type, id) {

    const element = document.createElement(type);
    element.id = id;
    return element;

}

function createNamedButton(name, svg, ID) {

    const button = createElementWithClass('button', 'named-button');

    if (ID) button.id = ID;

    if (svg) {

        const icon = createElementWithClass('span', 'icon')
        icon.innerHTML = svg;
        button.appendChild(icon);

        const buttonName = createElementWithClass('span', 'button-name');
        buttonName.textContent = name;
        button.appendChild(buttonName);

        return button;

    }

    button.textContent = name;
    return button;

}

function createIconButton(ariaLabel, svg, ID) {

    const button = createElementWithClass('button', 'icon-button');
    button.innerHTML = svg;
    button.setAttribute('aria-label', ariaLabel);
    if (ID) button.id = ID;
    return button;

}

// Used for toggling the visibility of user categories and for toggling the additional info
// of todo items.
export function createExpandButton(ariaLabel) {

    const button = createIconButton(ariaLabel, icons['expander']);
    button.classList.add('expand-button');
    return button;

}

export function createSettingsButton(ariaLabel) {

    const container = createElementWithClass('div', 'settings-container');

    const button = createIconButton(ariaLabel, icons['settings']);
    button.classList.add('settings-button');
    container.appendChild(button);
    return container;

}

// Creates the buttons that are inserted into the settingsList DOM element after it is dynamically created on user input
export function createSettingItem(name, className, ID) {

    const li = document.createElement('li');

    const button = createNamedButton(name);
    if (ID) button.dataset.id = ID;
    if (className) button.classList.add(className);
    if (name == 'Delete') button.classList.add('delete');
    li.appendChild(button);

    return li;

}

// Creates an input container containing a label and its corresponding input.
// Accepts additional ...attrs arguments if setAttribute needs to be called
export function createInput(name, className, ID, type, ...attrs) {

    const inputContainer = createElementWithClass('div', 'input-container');
    inputContainer.classList.add(className);
    const [additionalAttributes] = attrs;

    const label = document.createElement('label');
    label.textContent = name;
    label.setAttribute('for', ID);
    inputContainer.appendChild(label);

    const input = createElementWithID('input', ID);
    input.setAttribute('type', type);
    input.setAttribute('name', name);
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('autocapitalize', 'off');

    for (const attribute in additionalAttributes) {

        input.setAttribute(`${attribute}`, `${additionalAttributes[attribute]}`)

    }

    inputContainer.appendChild(input);

    return inputContainer;

}


// Creates the main header of the webpage
export function createHeader(title) {

    const header = document.createElement('header');

    const headerTopSide = createElementWithID('div', 'header-top-side');
    header.appendChild(headerTopSide);

    const h1 = createElementWithID('h1', 'app-title');
    h1.textContent = title;
    headerTopSide.appendChild(h1);

    return header;

}

export function createMenuButton() { return createIconButton('Hide menu', icons['menu'], 'menu-button') }

export function createAddTodoButton() {

    const li = document.createElement('li');
    const button = createNamedButton('Add todo', icons['add'], 'add-todo');
    button.setAttribute('aria-label', 'Add todo')
    li.appendChild(button);

    return li;

}

export function createSearchButton() {

    const li = document.createElement('li');
    const button = createNamedButton('Search', icons['search'], 'search');
    button.setAttribute('aria-label', 'Search todos');
    li.appendChild(button);
    return li;

}

// Creates the part of the navigation that holds the number of user categories. 
// The button to add a user category, the list of user categories, and a toggler to hide and 
// show the user categories are also inserted into this element after creation
export function createUserNavbar() {

    const userNavbar = createElementWithID('div', 'user-nav');

    const userNavbarHeader = createElementWithID('div', 'user-nav-header');
    userNavbar.appendChild(userNavbarHeader);

    const h2 = createElementWithID('h2', 'user-nav-title')
    h2.textContent = 'Categories';
    userNavbarHeader.appendChild(h2);

    const categoriesCounter = createElementWithID('div', 'categories-counter');
    userNavbarHeader.appendChild(categoriesCounter);

    return userNavbar;

}

export function createDevCategoryButton(name, ID) {

    const li = document.createElement('li');

    const button = createNamedButton(name, icons[ID], ID);
    button.classList.add('todo-holder');
    button.setAttribute('aria-label', name);
    li.appendChild(button);

    // The number of todos in the category
    const todosCounter = createElementWithClass('span', 'todos-count');
    button.appendChild(todosCounter)

    return li;

}

export function createUserCategoryButton(name, ID) {

    const li = document.createElement('li');

    const button = createNamedButton(name, icons['category']);
    button.classList.add('todo-holder');
    button.dataset.id = ID;
    button.setAttribute('aria-label', name);
    li.appendChild(button);

    // The number of todos in the category
    const todosCounter = createElementWithClass('span', 'todos-count');
    button.appendChild(todosCounter)

    // On click, it creates a setting list that allows category renaming and deleting
    const settingsButton = createSettingsButton('Edit category');
    li.appendChild(settingsButton)

    return li;

}

export function createContentHeader() {

    const contentHeaderContainer = createElementWithClass('div', 'content-header-container');
    const contentHeader = createElementWithClass('header', 'content-header');
    contentHeaderContainer.appendChild(contentHeader);
    return contentHeaderContainer;

}

export function createContentSortSetting() {

    const container = createElementWithClass('div', 'customize-settings-container');

    const button = createIconButton('Sort todos', icons['sort']);
    button.classList.add('sort-category-button');
    container.appendChild(button);
    return container;

}

export function createContentFilterSetting() {

    const container = createElementWithClass('div', 'customize-settings-container');

    const button = createIconButton('Filter todos', icons['filter']);
    button.classList.add('filter-category-button');
    container.appendChild(button);
    return container;
}


export function createCustomizeSettingsList() {

    const container = createElementWithClass('div', 'dropdown-list-container');
    const title = createElementWithClass('h4', 'dropdown-list-title');
    container.appendChild(title);
    const ul = createElementWithClass('ul', 'dropdown-list');
    container.appendChild(ul);
    return container;
}

export function createTodoItem(ID, index, title) {

    const todoItem = createElementWithClass('li', 'todo-item');
    // Turns the todoItem into a focusable element
    todoItem.setAttribute('tabindex', '0');
    todoItem.classList.add('todo-item');
    todoItem.dataset.id = ID;
    todoItem.dataset.index = index;

    const todoInfo = createElementWithClass('div', 'todo-info');
    todoItem.appendChild(todoInfo);

    // Creates a UUIDV to be used as the ID of the completedStatusInput, to ensure that
    // the input's ID is not repeated throughout the webpage when multiple todos are created
    const uuidv = uuidv4();

    const completedStatusLabel = createElementWithClass('label', 'todo-completed-status');
    completedStatusLabel.textContent = 'The todo has been completed'
    completedStatusLabel.setAttribute('for', uuidv);
    todoInfo.appendChild(completedStatusLabel);

    const completedStatusInput = createElementWithID('input', uuidv);
    completedStatusInput.setAttribute('type', 'checkbox');
    completedStatusInput.setAttribute('name', 'todoCompletedStatus');
    completedStatusLabel.appendChild(completedStatusInput);

    // Creates a span for CSS styling purposes
    const completedStatusSpan = document.createElement('span');
    completedStatusLabel.appendChild(completedStatusSpan);

    const todoTitle = createElementWithClass('h3', 'todo-title');
    todoInfo.appendChild(todoTitle)
    todoTitle.textContent = title;

    const todoSettingsButton = createSettingsButton('Edit todo');
    todoInfo.appendChild(todoSettingsButton);

    return todoItem;

}

// Creates the specified todo additional feature
export function createTodoAdditionalFeature(feature, value) {

    const methods = {

        'miniDueDate': function () {

            const miniDueDate = createElementWithClass('div', 'todo-mini-due-date');
            miniDueDate.textContent = value;
            return miniDueDate;

        },

        'description': function () {

            const descriptionContainer = createElementWithClass('div', 'todo-description');

            const descriptionParagraph = createElementWithClass('p', 'todo-description-paragraph');
            descriptionParagraph.textContent = value;
            descriptionContainer.appendChild(descriptionParagraph);

            return descriptionContainer;

        },

        'priority': function () {

            const priorityContainer = createElementWithClass('div', `todo-priority-${value}`);

            const priorityTitle = createElementWithClass('div', 'info-holder-title');
            priorityTitle.textContent = 'Priority';
            priorityContainer.appendChild(priorityTitle);

            const priorityValue = createElementWithClass('div', 'info-holder-value');
            priorityValue.textContent = value;
            priorityContainer.appendChild(priorityValue);

            return priorityContainer;

        },

        'dueDate': function () {

            const dueDateContainer = createElementWithClass('div', `todo-due-date`);

            const dueDateTitle = createElementWithClass('div', 'info-holder-title');
            dueDateTitle.textContent = 'Due Date';
            dueDateContainer.appendChild(dueDateTitle);

            const dueDateValue = createElementWithClass('div', 'info-holder-value');
            dueDateValue.textContent = value;
            dueDateContainer.appendChild(dueDateValue);

            return dueDateContainer;

        },

        'categoryID': function () {

            const categoryContainer = createElementWithClass('div', `todo-category`);

            const categoryTitle = createElementWithClass('div', 'info-holder-title');
            categoryTitle.textContent = 'Category';
            categoryContainer.appendChild(categoryTitle);

            const categoryValue = createElementWithClass('div', 'info-holder-value');
            categoryValue.textContent = value;
            categoryContainer.appendChild(categoryValue);

            return categoryContainer;

        },

        'categoryName': function () { return this['categoryID']() },

    }

    return methods[feature]();

}

// Located at the end of the todos list of each content container.
// To not be confused with the addTodoButton located in the main header.
export function createAddButton(ariaLabel) {

    const button = createIconButton(ariaLabel, icons['add']);
    button.classList.add('add-button');
    return button

}

export function createModal() {

    const modal = createElementWithID('div', 'modal');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog')
    return modal;

}

// Creates the close and submit/delete buttons of modals
function createModalActions(type) {

    const buttonsContainer = createElementWithClass('div', 'modal-actions');

    const closeButton = createNamedButton('Cancel');
    closeButton.classList.add('close-modal');
    closeButton.setAttribute('type', 'button');
    buttonsContainer.appendChild(closeButton);

    const methods = {

        'submit': function () {

            const submitButton = createNamedButton('Add');
            submitButton.classList.add('submit-modal');
            buttonsContainer.appendChild(submitButton);

        },

        'delete': function () {

            const deleteButton = createNamedButton('Delete');
            deleteButton.classList.add('confirm-delete-button');
            buttonsContainer.appendChild(deleteButton);

        }

    }

    methods[type]();

    return buttonsContainer;

}

// Used when rendering the todo & category modals
export function createFormModal(legendText, className) {

    const form = createElementWithClass('form', className);

    const fieldset = document.createElement('fieldset');
    form.appendChild(fieldset);

    const legend = document.createElement('legend');
    legend.textContent = legendText;
    fieldset.appendChild(legend);

    const modalActions = createModalActions('submit');
    form.appendChild(modalActions);

    return form;

}

// Retrieves user input for todo title and todo description
export function createTextArea(name, className, ID, ...attrs) {

    const inputContainer = createElementWithClass('div', 'input-container');
    inputContainer.classList.add(className)
    const [additionalAttributes] = attrs;

    const label = document.createElement('label');
    label.textContent = name;
    label.setAttribute('for', ID);
    inputContainer.appendChild(label);

    const input = createElementWithID('textarea', ID);
    input.setAttribute('name', name);
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('autocapitalize', 'off');

    for (const attribute in additionalAttributes) {

        input.setAttribute(`${attribute}`, `${additionalAttributes[attribute]}`)

    }

    inputContainer.appendChild(input);

    return inputContainer;

}

// Creates a custom fieldset area that contains three checkboxes representing the three priority options (1, 2, and 3);
export function createPrioritiesFieldset() {

    const prioritiesFieldset = createElementWithClass('fieldset', 'priorities-fieldset');

    const prioritiesLegend = createElementWithClass('legend', 'priorities-legend');
    prioritiesLegend.textContent = 'Priority';
    prioritiesFieldset.appendChild(prioritiesLegend);

    const priorityOne = createCheckboxInput('priority-one', 'priority', '1', 'Priority 1');
    prioritiesFieldset.appendChild(priorityOne);

    const priorityTwo = createCheckboxInput('priority-two', 'priority', '2', 'Priority 2');
    prioritiesFieldset.appendChild(priorityTwo);

    const priorityThree = createCheckboxInput('priority-three', 'priority', '3', 'Priority 3');
    prioritiesFieldset.appendChild(priorityThree);

    return prioritiesFieldset;

}

function createCheckboxInput(ID, name, value, textContent) {

    const inputContainer = createElementWithClass('div', `${name}-container`);

    const input = createElementWithID('input', ID);
    input.setAttribute('type', 'checkbox');
    input.setAttribute('name', name);
    input.setAttribute('value', value);
    inputContainer.appendChild(input);

    const label = document.createElement('label');
    label.setAttribute('for', ID);
    label.textContent = textContent;
    inputContainer.appendChild(label);

    return inputContainer;

}

// Simulates an input by creating a button that opens a list of all user categories on click
export function createCategoryInput() {

    const inputContainer = createElementWithClass('div', 'input-container');
    inputContainer.classList.add('category');

    const button = createNamedButton('Category');
    button.classList.add('categories-dropdown-button');
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'Todo category: none. Click this button to select a category for this todo')
    inputContainer.appendChild(button);

    return inputContainer;

}

// Custom dropdown list containing existing user categories
export function createCategoriesDropdown() {

    const categoriesDropdown = createElementWithClass('div', 'categories-dropdown');
    categoriesDropdown.classList.add('visible');

    const categoriesDropdownTitle = createElementWithClass('h4', 'categories-dropdown-title');
    categoriesDropdownTitle.setAttribute('tabindex', '0');
    categoriesDropdownTitle.textContent = 'No categories created';
    categoriesDropdown.appendChild(categoriesDropdownTitle);

    const categoriesDropdownList = createElementWithClass('ul', 'categories-dropdown-list');
    categoriesDropdown.appendChild(categoriesDropdownList);
    return categoriesDropdown;

}

export function createCategorySelectItem(ID, name) {

    const li = document.createElement('li');

    const button = createNamedButton(name, icons['category']);
    button.dataset.id = ID;
    button.classList.add('category-select-item');
    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', `Category: ${name}`)
    li.appendChild(button);

    return li;

}

// Creates an icon only button containing an "X";
// Used for deleting Due Date and Category input values
export function createClearButton(ariaLabel, className) {

    const clearButton = createIconButton(ariaLabel, icons['close']);
    clearButton.classList.add(className);
    clearButton.setAttribute('type', 'button');
    return clearButton;

}

// Creates the Search todo modal
export function createTodosSearcher() {

    const todosSearcher = createElementWithID('div', 'search-container');

    const searchBar = createInput('Todo title', 'title', 'todos-searcher', 'search', { placeholder: "Search todos" });
    todosSearcher.appendChild(searchBar)

    const searchResultsList = createElementWithID('ul', 'search-results-list');
    todosSearcher.appendChild(searchResultsList);

    return todosSearcher;

}

// Creates an anchor that sends the user to the todo's location when clicked, 
// similar to how normal anchor elements send the user to a specific link;
export function createAnchorTodoItem(ID, title) {

    const anchorTodoItem = createElementWithClass('li', 'anchor-todo-item');
    anchorTodoItem.dataset.id = ID;

    const anchor = document.createElement('a');
    anchor.setAttribute('href', '');
    anchorTodoItem.appendChild(anchor);

    const todoInfo = createElementWithClass('div', 'todo-info');
    anchor.appendChild(todoInfo);

    const todoTitle = createElementWithClass('h3', 'todo-title');
    todoTitle.textContent = title;
    todoInfo.appendChild(todoTitle);

    return anchorTodoItem;

}

// Used for requesting user confirmation regarding the deletion of:
// 1. A todo;
// 2. A category;
// 3. A category and all its containing todos
export function createDeleteModal() {

    const deleteModal = createElementWithClass('div', 'delete-modal');
    const deleteModalPara = createElementWithClass('p', 'delete-modal-paragraph');
    deleteModal.appendChild(deleteModalPara);

    const modalActions = createModalActions('delete');
    deleteModal.appendChild(modalActions);

    return deleteModal;

}

// Custom toggle checkbox for selecting whether deleting a category should also delete its containing todos;
export function createDeleteTodosCheckbox() {

    const deleteTodosContainer = createElementWithClass('div', 'delete-todos-checkbox');
    deleteTodosContainer.textContent = 'Also delete containing todos';

    const deleteTodosLabel = document.createElement('label');
    deleteTodosLabel.textContent = 'Delete containing todos';
    deleteTodosLabel.setAttribute('for', 'delete-todos');
    deleteTodosContainer.appendChild(deleteTodosLabel);

    const deleteTodosInput = createElementWithID('input', 'delete-todos');
    deleteTodosInput.setAttribute('type', 'checkbox');
    deleteTodosInput.setAttribute('name', 'deleteContainingTodos');
    deleteTodosLabel.appendChild(deleteTodosInput);

    const span = document.createElement('span');
    deleteTodosLabel.appendChild(span);

    return deleteTodosContainer;

}