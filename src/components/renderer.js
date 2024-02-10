import * as Creator from './creator.js';

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