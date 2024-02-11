import * as Creator from './creator.js';
import * as focusTrap from 'focus-trap';

// Keeps a reference of initial, static DOM elements that are rendered on init()
// Allows for quicker DOM traversal and editing, reduces the number of DOM lookups
const DOMCache = {

    body: document.querySelector('body'),
    modal: Creator.createModal(),
    header: Creator.createHeader('Do It'),
    // Used to disable user input and add a grey background behind header
    // in mobile mode
    headerOverlay: Creator.createElementWithClass('div', 'header-overlay'),
    menuButton: Creator.createMenuButton(),
    nav: document.createElement('nav'),
    devNavbar: Creator.createElementWithID('div', 'dev-nav'),
    // !! devNavbarList holds devCategoryButtons that have an ID ('all-todos, 'today', 'this-week'). userNavbarList (defined below) holds userCategoryButtons that do not
    // have an ID but they have a dataset.id attribute, since the categoryID property
    // of userCategory objects is a uuid number that is not always compatible with selectors
    // and creates the need of additional code to be written in order to fix the compatibility
    // issue
    devNavbarList: Creator.createElementWithID('ul', 'dev-nav-list'),
    addTodoButton: Creator.createAddTodoButton(),
    searchButton: Creator.createSearchButton(),
    userNavbar: Creator.createUserNavbar(),
    addCategoryButton: Creator.createAddButton('Add category'),
    expandCategoriesButton: Creator.createExpandButton('Hide user categories'),
    userNavbarList: Creator.createElementWithID('ul', 'user-nav-list'),
    main: document.createElement('main'),
    contentHeader: Creator.createContentHeader(),
    contentTitle: Creator.createElementWithClass('h2', 'content-title'),
    contentSettings: Creator.createElementWithClass('div', 'content-settings'),
    sortSetting: Creator.createContentSortSetting(),
    filterSetting: Creator.createContentFilterSetting(),
    content: Creator.createElementWithClass('div', 'content'),
    contentAddButton: Creator.createAddButton('Add todo'),
    footer: document.createElement('footer'),
    // Media query used for turning the app into mobile mode
    mobileVersion: window.matchMedia("(max-width: 750px), (max-height: 400px)"),

}

// Object used to store a reference to the existing developer and user categories ID's and the current DOM content being rendered.
// Each time a category is created, a new property bearing its ID is added to categoriesContent object.
// Each time a category is deleted, its corresponding property is deleted from the categoriesContent object properties.
// Each time the user requests for the content of a category to be rendered, a todosList DOM element is created and assigned
// to its corresponding property on the categoriesContent object, then it is inserted into the DOM.
// If there was a previous category content being rendered, the todosList DOM is removed from the DOM tree,
// released from memory, re-created on the new property, and re-attached on the DOM.
// This system prevents memory leaks from detached DOM elements by keeping DOM element reference to a minimum and
// by removing the old DOM element from the DOM tree and freeing it from memory each time a new content rendering request is made
const categoriesContent = {};


//
//
// Nav buttons management: creating, rendering, deleting, renaming, toggling classes
//
//


function showNavbar() {

    DOMCache.menuButton.setAttribute('aria-label', 'Hide menu')
    DOMCache.nav.style.visibility = 'visible';

    if (hasClass(DOMCache.header, 'hidden')) {

        removeClass(DOMCache.header, 'hidden');
        removeClass(DOMCache.body, 'header-hidden');
        removeClass(DOMCache.menuButton, 'selected');

    }

    addClass(DOMCache.header, 'visible');
    if (!hasClass(DOMCache.header, 'mobile')) return;

    // If mobile, disable scrolling and add a grey overlay behind header that prevents user input
    disableScrolling();
    DOMCache.headerOverlay.style.display = 'initial';
    addClass(DOMCache.headerOverlay, 'visible');

    // Remove the eventListener that triggered this function until
    // the header is closed to prevent conflicts in case the user
    // clicks the menuButton again
    DOMCache.menuButton.removeEventListener('click', toggleNavbar);
    DOMCache.header.addEventListener('click', mobileHeaderActions);
    DOMCache.headerOverlay.addEventListener('click', closeNavbar);
    // Add a new eventListener on the mobileVersion media query to close the navbar
    // in case the window exits mobile mode
    DOMCache.mobileVersion.addEventListener('change', closeNavbar);

    // Traps TAB focusing within the header
    const trap = focusTrap.createFocusTrap(DOMCache.header, {
        initialFocus: () => false,
        allowOutsideClick: () => true,
        escapeDeactivates: () => false,
        returnFocusOnDeactivate: () => true,
    });
    trap.activate();

    function mobileHeaderActions(e) {

        const userCategoryButton = e.target.closest('.todo-holder');

        // If the user is currently editing a user category button, and clicks the name input,
        // do not close the header
        if (find(userCategoryButton, '.input-container')) return;
        if (userCategoryButton) closeNavbar();
        // The click behavior of menuButton is now reversed to close the navbar instead of opening it
        if (e.target == DOMCache.menuButton) closeNavbar();
        if (e.target.closest('#search')) closeNavbar();

    }

    function closeNavbar() {

        // Deactivate the focus trap
        trap.deactivate();
        // Attach the eventListener that triggers this function back on the menuButton
        DOMCache.menuButton.addEventListener('click', toggleNavbar);
        // Remove events to prevent memory leaks and other unwanted behavior
        DOMCache.header.removeEventListener('click', mobileHeaderActions);
        DOMCache.headerOverlay.removeEventListener('click', closeNavbar);
        DOMCache.mobileVersion.removeEventListener('change', closeNavbar);

        // Closing the navbar will also enable scrolling, unless
        // the navbar was closed due to the searchbar being opened, which is also supposed
        // to keep the scrolling disabled, since it is a modal.
        if (!find(DOMCache.modal, '#search-container')) enableScrolling();
        if (DOMCache.mobileVersion.matches) hideNavbar();

        // Ensures that the transition works by waiting for it to finish before changing
        // other properties that do not transition their state
        DOMCache.headerOverlay.addEventListener('transitionend', remove);
        removeClass(DOMCache.headerOverlay, 'visible');

        function remove() {

            if (!hasClass(DOMCache.headerOverlay, 'visible')) DOMCache.headerOverlay.style.display = 'none';
            DOMCache.headerOverlay.removeEventListener('transitionend', remove);

        }

    }

}

function hideNavbar() {

    DOMCache.menuButton.setAttribute('aria-label', 'Show menu');
    if (hasClass(DOMCache.header, 'hidden')) DOMCache.nav.style.visibility = 'hidden';

    // Ensures that the transition works by waiting for it to finish before changing
    // other properties that do not transition their state
    DOMCache.header.addEventListener('transitionend', remove);

    if (hasClass(DOMCache.header, 'visible')) removeClass(DOMCache.header, 'visible');
    addClass(DOMCache.header, 'hidden');
    addClass(DOMCache.body, 'header-hidden');
    addClass(DOMCache.nav, 'header-hidden');
    addClass(DOMCache.menuButton, 'selected');

    function remove() {

        if (hasClass(DOMCache.header, 'hidden')) DOMCache.nav.style.visibility = 'hidden';
        DOMCache.header.removeEventListener('transitionend', remove);

    }

}

function toggleNavbar(e) {

    e.stopImmediatePropagation();
    hasClass(DOMCache.header, 'hidden') ? showNavbar() : hideNavbar();

}

export function selectNewCategoryButton(categoryID) {

    // Is either a devCategory button that has an ID, or a userCategory button that has a 
    // dataset.id. Looks for a devCategory first since they are only three ('All todos', 
    // 'Today', 'Next 7 days');
    const newButton = find(DOMCache.devNavbarList, `[id="${categoryID}"]`) || find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
    addClass(getParentOf(newButton), 'selected');

}

export function unselectOldCategoryButton() { removeClass(find(DOMCache.nav, '.selected'), 'selected') }

export function updateCategoryTodosCount(categoryID, todosCount) {

    // Is either a devCategory button that has an ID, or a userCategory button that has a 
    // dataset.id. Looks for a devCategory first since they are only three ('All todos', 
    // 'Today', 'Next 7 days');
    const category = find(DOMCache.devNavbarList, `[id="${categoryID}"]`) || find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
    const todosCounter = find(category, '.todos-count');
    updateTextContent(todosCounter, todosCount);

}

export function updateUserCategoriesCount(categoriesCount) {

    updateTextContent(find(DOMCache.userNavbar, '#categories-counter'), categoriesCount);

}

function toggleUserCategoriesList() {

    hasClass(DOMCache.expandCategoriesButton, 'expanded')
        ? DOMCache.expandCategoriesButton.setAttribute('aria-label', 'Hide user categories')
        : DOMCache.expandCategoriesButton.setAttribute('aria-label', 'Show user categories');

    toggleClass(DOMCache.expandCategoriesButton, 'expanded');

    if (hasClass(DOMCache.userNavbarList, 'hidden')) {

        DOMCache.userNavbarList.style.removeProperty('display');
        removeClass(DOMCache.userNavbarList, 'hidden');
        return;

    }

    // Ensures that the animation works by waiting for it to finish before changing
    // other properties that do not transition their state
    DOMCache.userNavbarList.addEventListener('animationend', remove);
    addClass(DOMCache.userNavbarList, 'hidden');

    function remove() {

        if (hasClass(DOMCache.userNavbarList, 'hidden')) DOMCache.userNavbarList.style.display = 'none';
        DOMCache.userNavbarList.removeEventListener('animationend', remove);

    }

}

function sendDisplayContentRequest() {

    const categoryID = this.id || this.dataset.id;
    // * Controller.handleDisplayContentRequest(categoryID);

}

export function renderDevCategoryButton(categoryName, categoryID) {

    const devCategoryButton = Creator.createDevCategoryButton(categoryName, categoryID);
    find(devCategoryButton, 'button').addEventListener('click', sendDisplayContentRequest);

    render(DOMCache.devNavbarList, devCategoryButton);
    // Create an empty property with the same name as the categoryID on the categoriesContent object.
    categoriesContent[categoryID] = '';

}

export function renderUserCategoryButton(categoryName, categoryID) {

    const userCategoryButton = Creator.createUserCategoryButton(categoryName, categoryID);

    render(DOMCache.userNavbarList, userCategoryButton);
    categoriesContent[categoryID] = '';

}

function handleUserCategoryClickEvents(e) {

    const li = e.target.closest('li');
    const userCategoryButton = find(li, '.todo-holder');

    if (!li) return;
    if (find(userCategoryButton, '.input-container')) return;

    if (hasClass(e.target, 'settings-button')) {

        e.stopImmediatePropagation();
        return renderUserCategorySettings(userCategoryButton.dataset.id);

    }

    // bind is used because devCategory buttons have the sendDisplayContentRequest
    // function attached directly on themselves, therefore providing a 'this' value.
    // userCategory button click events, on the other hand, are handled by their ancestor,
    // thus the userCategory buttons are manually provided as 'this'
    sendDisplayContentRequest.bind(userCategoryButton)();

}


function renderUserCategorySettings(categoryID) {

    const userCategoryButton = find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
    const userCategorySettingsButton = find(getParentOf(userCategoryButton), '.settings-button');

    // * renderSettings(userCategoryButton, userCategorySettingsButton, 'Rename', renderUserCategoryRenameInput, 'Delete', Controller.handleDeleteRequest, 'category');

}

function renderUserCategoryRenameInput(categoryID) {

    const userCategoryButton = find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
    const userCategoryButtonName = find(userCategoryButton, '.button-name');
    const userCategorySettingsButton = find(getParentOf(userCategoryButton), '.settings-button');

    // * renderRenameInput(userCategoryButton, userCategoryButtonName, userCategorySettingsButton, Controller.renameCategory);

}

export function renameUserCategoryButton(categoryID, newName) {

    updateTextContent(find(find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`), '.button-name'), newName);

}

export function deleteUserCategoryButton(categoryID) {

    const button = find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`);
    // For accessibility reasons, user category buttons are stored into a li element
    getParentOf(button).remove();

    // Delete the property with the same name as the categoryID from the categoriesContent object
    delete categoriesContent[categoryID];

}

//
//
// Content management: rendering, editing and deleting
//
//

// Renders the settings button when the current category that has it's content rendered is editable (it's a userCategory)
export function renderContentSettingsButton() {

    const contentSettingsButton = Creator.createSettingsButton('Edit category');
    contentSettingsButton.addEventListener('click', renderContentSettings);
    render(DOMCache.contentSettings, contentSettingsButton);

}

// Deletes the settings button when the current category that has it's content rendered is non-editable (it's a devCategory);
export function deleteContentSettingsButton() {

    const editContentTitleButton = find(DOMCache.contentSettings, '.settings-container');
    editContentTitleButton.removeEventListener('click', renderContentSettings);
    editContentTitleButton.remove();

}

function renderContentSettings(e) {

    e.stopImmediatePropagation()
    const contentSettingsButton = find(DOMCache.contentHeader, '.settings-button');

    // Removes the event listener that leads to this function being run to prevent conflicts with the
    // function that will be called inside the renderSettings() function whenever the user will click back
    // on the settingsButton that triggers this entire event chain
    contentSettingsButton.removeEventListener('click', renderContentSettings);
    // * renderSettings(DOMCache.content, contentSettingsButton, 'Rename', renderRenameContentTitleInput, 'Delete', Controller.handleDeleteRequest, 'category');
    // After the renderSettings function is finished, and the user closed the settingsList, re-attach the event listener
    contentSettingsButton.addEventListener('click', renderContentSettings);

}

function renderRenameContentTitleInput() {

    const contentTitle = find(DOMCache.contentHeader, '.content-title');
    const contentSettingsButton = find(DOMCache.contentHeader, '.settings-button');

    // * renderRenameInput(DOMCache.content, contentTitle, contentSettingsButton, Controller.renameCategory);

}

export function renameContentTitle(categoryName) { updateTextContent(DOMCache.contentTitle, categoryName) };

// Type can be either 'sort' or 'filter',
// Current setting is the current sortingMethod or currentFilter method
// ...settingNames are the available sorting or filter methods for the current category that is being rendered
export function renderContentCustomizer(type, currentSetting, ...settingNames) {

    // By default, clicking a similar button (settings opener) prevents this instance of hideByClickOutside function from firing, which is responsible
    // for hiding the current settings list. This results in two settings lists being visible in the same time, which is not desired in 
    // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
    // is attached) solves this issue.
    document.dispatchEvent(new Event('click'));

    // Get either the sort-category-button or the filter-category-button
    const location = find(DOMCache.contentSettings, `.${type}-category-button`);
    addClass(location, 'focused')

    const types = {

        'sort': {

            removeEventListener: function () { location.removeEventListener('click', sendSortSettingsRequest) },
            addEventListener: function () { location.addEventListener('click', sendSortSettingsRequest) },
            applySetting: function (settingType) { Controller.sortTodos(settingType, getCurrentContentID()) },

        },

        'filter': {

            removeEventListener: function () { location.removeEventListener('click', sendFilterSettingsRequest) },
            addEventListener: function () { location.addEventListener('click', sendFilterSettingsRequest) },
            applySetting: function (settingType) { Controller.filterTodos(settingType, getCurrentContentID()) },

        }

    }

    // Removes the event listener that leads to this function being run to prevent conflicts with the
    // new behavior defined within this function, which states that clicking the settingsButton
    // deletes the filter or sorting methods list instead of rendering it

    types[type].removeEventListener();
    location.addEventListener('click', deleteSettings);

    const dropdownListContainer = Creator.createCustomizeSettingsList();
    const dropdownListTitle = find(dropdownListContainer, '.dropdown-list-title');
    const dropdownList = find(dropdownListContainer, '.dropdown-list');
    dropdownList.addEventListener('click', handleSettingItemsClickEvents);

    type == 'sort'
        ? updateTextContent(dropdownListTitle, `${Controller.capitalizeFirstLetter(type)} by`)
        : updateTextContent(dropdownListTitle, `${Controller.capitalizeFirstLetter(type)}`)

    // Render the dropdownListContainer in the parent of the button that triggers the event to prevent accessibility
    // errors when nesting div elements into button elements
    render(getParentOf(location), dropdownListContainer);

    function handleSettingItemsClickEvents(e) {

        if (hasClass(e.target, 'named-button')) {

            applySetting(e.target.dataset.id);
            deleteSettings(e);

        }

    }

    // Render a sorting or filter method button into the settingsList for each settingName
    for (const settingName of settingNames) {

        const settingItem = Creator.createSettingItem(Controller.capitalizeFirstLetter(settingName.split('-').join(' ')), `${type}-todos`, settingName);
        if (find(settingItem, 'button').dataset.id == currentSetting) addClass(find(settingItem, 'button'), 'selected');
        render(dropdownList, settingItem);

    }

    document.addEventListener('click', deleteByClickOutside);
    function deleteByClickOutside(e) { if (getParentOf(e.target) !== dropdownList) deleteSettings(e) };

    document.addEventListener('keyup', deleteByKeyboard);
    function deleteByKeyboard(e) { if (e.key == 'Escape') { deleteSettings(e) } };

    // Trap TAB focus within settingsList
    const trap = focusTrap.createFocusTrap(dropdownList, {
        allowOutsideClick: () => true,
        escapeDeactivates: () => false,
    });
    trap.activate();


    function deleteSettings(e) {

        e.stopImmediatePropagation();
        trap.deactivate();

        // Remove event listeners to prevent memory leaks and other unwanted behavior
        location.removeEventListener('click', deleteSettings);
        dropdownList.removeEventListener('click', handleSettingItemsClickEvents)

        document.removeEventListener('click', deleteByClickOutside);
        document.removeEventListener('keyup', deleteByKeyboard);

        // Re-attach  the event listener that leads to this function being run
        types[type].addEventListener();

        // Remove the settingsList from the DOM;
        dropdownListContainer.remove();
        removeClass(location, 'focused')


    }

    function applySetting(settingType) { types[type].applySetting(settingType) };

}

function sendSortSettingsRequest(e) {

    e.stopImmediatePropagation();
    // * Controller.handleSortSettingsRequest();

}

function sendFilterSettingsRequest(e) {

    e.stopImmediatePropagation();
    // * Controller.handleFilterSettingsRequest();

}

// Notifies the user whether the current content is being sorted or filtered
export function markContentCustomizeSetting(type, state) {

    const methods = {

        'sort': function () { state ? addClass(DOMCache.sortSetting, `sortingOn`) : removeClass(DOMCache.sortSetting, `sortingOn`) },
        'filter': function () { state ? addClass(DOMCache.filterSetting, `filterOn`) : removeClass(DOMCache.filterSetting, `filterOn`) }

    }

    methods[type]();

}

//
//
// Todo management: rendering, deleting, editing, renaming, toggling classes
//
//

export function renderTodoElement(todoID, index, todoTitle) {

    const todoItem = Creator.createTodoItem(todoID, index, todoTitle);
    // Insert the todoItem at the passed index to ensure that Todo DOM elements
    // and Todo objects are organized in the same order based on their category sorting or filtering methods
    categoriesContent[getCurrentContentID()].insertBefore(todoItem, find(categoriesContent[getCurrentContentID()], `[data-index="${index}"]`))

}

// Function run by the Controller after organizing a category that is currently being rendered.
// Refreshes the index of Todo DOM elements to mirror the index property of Todo objects
export function updateTodoIndex(todoID, index) {

    find(categoriesContent[getCurrentContentID()], `[data-id="${todoID}"]`).dataset.index = index;

}

export function moveTodoElement(todoID, index) {

    // Moves a Todo DOM element at a specified index. Used by the Controller
    // whenever editing a Todo property changes its order relative to its siblings in case
    // a sorting or filter method is being used by the category
    const currentContent = categoriesContent[getCurrentContentID()];
    const todoElement = find(currentContent, `[data-id="${todoID}"]`);
    currentContent.insertBefore(todoElement, find(currentContent, `[data-index="${index}"]`))

}

export function deleteTodoElement(todoID) {

    const todoElement = find(categoriesContent[getCurrentContentID()], `[data-id="${todoID}"]`);
    todoElement.remove();

}

function renderTodoSettings(todoID) {

    const todoElement = find(categoriesContent[getCurrentContentID()], `[data-id="${todoID}"]`);
    const todoSettingsButton = find(todoElement, '.settings-button');

    // * renderSettings(todoElement, todoSettingsButton, 'Edit', Controller.handleTodoModalRequest, 'Delete', Controller.handleDeleteRequest, 'todo')

}


// Adds a button on the Todo DOM element that allows the user to render additional information
// about the Todo.
export function renderTodoElementExpander(todoID) {

    const todoItem = find(categoriesContent[getCurrentContentID()], `[data-id="${todoID}"]`);
    const todoExpander = Creator.createExpandButton('Show todo additional info');
    render(todoItem, todoExpander);

}

// Inserts a container at the end of the Todo DOM element that contains additional information (eg. priority, dueDate, category);
export function renderTodoAdditionalInfo(todoID) {

    const todoElement = find(DOMCache.main, `[data-id="${todoID}"]`);
    const todoElementExpander = find(todoElement, '.expand-button');
    todoElementExpander.setAttribute('aria-label', 'Hide todo additional info')
    const todoAdditionalInfo = Creator.createElementWithClass('div', 'todo-additional-info');

    todoElement.insertBefore(todoAdditionalInfo, todoElementExpander);
    addClass(todoElement, 'expanded');

}

export function deleteTodoAdditionalInfo(todoID) {

    const todoElement = find(DOMCache.main, `[data-id="${todoID}"]`);
    const todoElementExpander = find(todoElement, '.expand-button');
    if (todoElementExpander) todoElementExpander.setAttribute('aria-label', 'Show todo additional info');
    // Ensures that the animation works by waiting for it to finish before changing
    // other properties that do not transition their state
    todoElement.addEventListener('animationend', deleteAdditionalInfo);
    removeClass(todoElement, 'expanded');

    function deleteAdditionalInfo() {

        if (!hasClass(todoElement, 'expanded')) find(todoElement, '.todo-additional-info').remove()
        todoElement.removeEventListener('animationend', deleteAdditionalInfo);

    };

}

// Deletes the todoElementExpander when the Todo DOM element no longer contains any additional info
// that can be rendered
export function deleteTodoElementExpander(todoID) {

    const todoItem = find(categoriesContent[getCurrentContentID()], `[data-id="${todoID}"]`);
    const todoExpander = find(todoItem, '.expand-button');
    todoExpander.remove();

}

//
//
// Controller assist functions
//
//

export function isSearchBarOpen() { return find(DOMCache.modal, '#search-container') };
export function isVisible(ID) { return find(DOMCache.content, `[data-id="${ID}"]`) };
export function isAdditionalInfoVisible(todoID) { return find(find(DOMCache.main, `[data-id="${todoID}"]`), '.todo-additional-info') };
export function isTodoExpanderVisible(todoID) { return find(find(categoriesContent[getCurrentContentID()], `[data-id= "${todoID}"]`), '.expand-button') };
export function getCurrentContentID() { return DOMCache.content.dataset.id; }

//
//
// Helper functions
//
//

// The location parameter is the containing element of the settings button, and can be one of the following:
// 1. A userCategory button
// 2. The 'content' container itself
// 3. A todo item
// At this point, only these three locations have a settings button
// The callLocation is the button that triggers the event that leads to this function
// editSettingName is the name of the first setting, which is either 'Edit' in case of Todos or 'Rename' in case of categories.
// editFunction is the function that is run when the user clicks the editSettingButton
// deleteSettingsName is the name of the second setting, which is 'Delete' in all cases
// deleteFunction is the function that is run when the user clicks the deleteSettingButton
// deleteType specifies whether the user is trying to delete a category or a todo
function renderSettings(location, callLocation, editSettingName, editFunction, deleteSettingName, deleteFunction, deleteType) {

    // By default, clicking another settings button prevents this instance of hideByClickOutside function from firing, which is responsible
    // for hiding the current settings list. This leads to two settings lists being rendered in the same time, which is not desired in 
    // this particular case. Manually creating and firing a click event on the document element (the same element on which the hideByClickOutside function
    // is attached) solves this issue.
    document.dispatchEvent(new Event('click'));

    addClass(callLocation, 'focused');
    // If the user clicks back on the button that lead to this function, delete the rendered settings
    callLocation.addEventListener('click', deleteSettings);

    const settingsList = Creator.createElementWithClass('ul', 'settings-list');
    // Render the settingsList in the parent of the button that triggers the event to prevent accessibility
    // errors when nesting ul elements into button elements
    render(getParentOf(callLocation), settingsList);

    // If the settingsList is being rendered outside the current viewport, change its positioning
    if (isOutOfBounds('bottom', settingsList, 100)) addClass(settingsList, 'top-positioned');

    const editButton = Creator.createSettingItem(editSettingName);
    editButton.addEventListener('click', edit);
    render(settingsList, editButton);

    const deleteButton = Creator.createSettingItem(deleteSettingName);
    deleteButton.addEventListener('click', remove);
    render(settingsList, deleteButton);

    document.addEventListener('click', deleteByClickOutside);
    function deleteByClickOutside(e) { if (getParentOf(e.target) !== settingsList) deleteSettings(e) };

    document.addEventListener('keyup', deleteByKeyboard);
    function deleteByKeyboard(e) { if (e.key == 'Escape') { deleteSettings(e) } };

    // Trap TAB focusing within the settingsList
    const trap = focusTrap.createFocusTrap(settingsList, {
        allowOutsideClick: () => true,
        escapeDeactivates: () => false,
    });
    trap.activate();

    function deleteSettings(e) {

        e.stopImmediatePropagation();
        trap.deactivate();

        // Remove events to prevent memory leaks and other unwanted behavior
        callLocation.removeEventListener('click', deleteSettings);

        editButton.removeEventListener('click', edit);
        deleteButton.removeEventListener('click', remove);

        document.removeEventListener('keyup', deleteByKeyboard);
        document.removeEventListener('click', deleteByClickOutside);

        // Remove the settingsList from the DOM
        settingsList.remove();
        removeClass(callLocation, 'focused');

    }

    function edit(e) {

        e.stopImmediatePropagation();
        deleteSettings(e);
        // Run the passed editFunction using the UUIDV of the element, which is either a category button or a todo element
        editFunction(location.dataset.id);

    }

    function remove(e) {

        e.stopImmediatePropagation();
        deleteSettings(e);
        // Run the passed deleteFunction using the UUIDV of the element (which can be either a category button or a todo element)
        deleteFunction(deleteType, location.dataset.id);

    }

}

// Location is the element that will contain the renameInput,
// nameContainer is the element that holds the current name and will be replaced with the renameInput,
// callLocation is the button that lead to this function, and action is the function
// that should be run after the new name is submitted
function renderRenameInput(location, nameContainer, callLocation, action) {

    // Create a text input field using Creator
    const renameField = Creator.createInput('New category name', 'name', 'category-edit-field', 'text');

    const renameInput = find(renameField, 'input');
    renameInput.addEventListener('focus', focusOnInput);
    renameInput.addEventListener('mousedown', preventPropagation);

    document.addEventListener('mousedown', clickAction);
    document.addEventListener('keydown', keyboardActions);

    replace(renameField, nameContainer);
    updateInputValue(renameInput, nameContainer.textContent);
    applyFocus(renameInput);

    // Trap TAB focusing within the renameField
    const trap = focusTrap.createFocusTrap(renameField, {
        allowOutsideClick: () => true,
        escapeDeactivates: () => false,
        setReturnFocus: () => callLocation,
    });
    trap.activate();

    function applyChanges() {

        discardChanges();
        action(location.dataset.id, renameInput.value.trim());

    }

    function discardChanges() {

        trap.deactivate()
        // Remove events to prevent memory leaks and other unwanted behavior
        removeEvents();
        enableInput(DOMCache.body);
        replace(nameContainer, renameField);

    }

    function removeEvents() {

        renameInput.removeEventListener('focus', focusOnInput);
        renameInput.removeEventListener('mousedown', preventPropagation);
        document.removeEventListener('mousedown', clickAction);
        document.removeEventListener('keydown', keyboardActions);

    }

    function preventPropagation(e) { e.stopImmediatePropagation() };
    // Discard changes if user tries to submit an empty field
    function clickAction() { renameInput.value.trim().length == 0 ? discardChanges() : applyChanges() };

    function keyboardActions(e) {
        // Discard changes if user tries to submit an empty field
        if (e.key == 'Enter') return renameInput.value.trim().length == 0 ? discardChanges() : applyChanges();
        if (e.key == 'Escape') return discardChanges();

    }

    function focusOnInput() {

        disableInput(DOMCache.body);
        enableInput(renameInput);

    }

}

// The checkBounds function determines whether the element position needs to be changed 
// as a result of it leaking out of the viewport, and changes its position using CSS classes;

function disableScrolling() {
    const html = document.querySelector('html');
    // Add right padding to the HTML element of the DOM that is equal to the width of the scrollbar,
    // to prevent the usual layout shift when the scrollbar appears and disappears
    html.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`
    addClass(html, 'overlay-over');
}

function enableScrolling() {
    const html = document.querySelector('html');
    // Remove the right padding added by disableScrolling function
    html.style.removeProperty('padding')
    removeClass(html, 'overlay-over');
}

function checkBounds(element, breakpoint) {
    if (hasClass(element, 'top-positioned')) removeClass(element, 'top-positioned');
    if (hasClass(element, 'center-positioned')) removeClass(element, 'center-positioned');

    if (isOutOfBounds('bottom', element, breakpoint)) addClass(element, 'top-positioned');

    if (hasClass(element, 'top-positioned') && isOutOfBounds('top', element)) {
        removeClass(element, 'top-positioned');
        addClass(element, 'center-positioned');
    }
}

function isOutOfBounds(position, element, breakpoint) {
    // Get the element's position relative to the viewport
    const elementBound = element.getBoundingClientRect();
    // Get the top/y value of the element
    const elementY = elementBound.y;
    // Get the actual height of the HTML document
    const clientHeight = document.querySelector('html').clientHeight;

    const methods = {
        'top': function () { return elementY < 0 },
        'bottom': function () { return clientHeight - elementY < breakpoint },
    }
    return methods[position]();
}

function render(target, ...elements) { for (const element of elements) { if (!target.contains(element)) target.appendChild(element) } };
function find(element, identifier) { if (element && identifier) return element.querySelector(identifier) };
function findAll(element, identifier) { return element.querySelectorAll(identifier) };
function getParentOf(element) { return element.parentElement };
function hasClass(element, className) { return element.classList.contains(className) };
function addClass(element, className) { element.classList.add(className) };
function removeClass(element, className) { element.classList.remove(className) };
function toggleClass(element, className) { element.classList.toggle(className) };
function updateInputValue(target, inputValue) { target.value = inputValue };
function applyFocus(element) { element.focus() };

function updateTextContent(target, text) {
    if (text == 0) return target.textContent = '';
    target.textContent = text;
}

function replace(newElement, element) {
    const parent = element.parentElement;
    parent.replaceChild(newElement, element);
}

function enableInput(element) {
    element.style.pointerEvents = 'auto';
    element.style.touchEvents = 'auto';
}

function disableInput(element) {
    element.style.pointerEvents = 'none';
    element.style.touchEvents = 'none';
}

function enableButton(button) {
    button.disabled = false;
    button.removeAttribute('tabindex');
}

function disableButton(button) {
    button.disabled = true;
    button.setAttribute('tabindex', '-1');
}