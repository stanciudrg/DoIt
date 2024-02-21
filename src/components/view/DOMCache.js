import * as Creator from "./creator";
// Keeps a reference of initial, static DOM elements that are rendered on init()
// Allows for quicker DOM traversal and editing, reduces the number of DOM lookups
export const DOMCache = {
    body: document.querySelector("body"),
    modal: Creator.createModal(),
    header: Creator.createHeader("Do It"),
    // Used to disable user input and add a grey background behind header
    // in mobile mode
    headerOverlay: Creator.createElementWithClass("div", "header-overlay"),
    menuButton: Creator.createMenuButton(),
    nav: document.createElement("nav"),
    devNavbar: Creator.createElementWithID("div", "dev-nav"),
    // !! devNavbarList holds devCategoryButtons that have an ID ('all-todos, 'today', 'this-week'). userNavbarList (defined below) holds userCategoryButtons that do not
    // have an ID but they have a dataset.id attribute, since the categoryID property
    // of userCategory objects is a uuid number that is not always compatible with selectors
    // and creates the need of additional code to be written in order to fix the compatibility
    // issue
    devNavbarList: Creator.createElementWithID("ul", "dev-nav-list"),
    addTodoButton: Creator.createAddTodoButton(),
    searchButton: Creator.createSearchButton(),
    userNavbar: Creator.createUserNavbar(),
    addCategoryButton: Creator.createAddButton("Add category"),
    expandCategoriesButton: Creator.createExpandButton("Hide user categories"),
    userNavbarList: Creator.createElementWithID("ul", "user-nav-list"),
    main: document.createElement("main"),
    contentHeader: Creator.createContentHeader(),
    contentTitle: Creator.createElementWithClass("h2", "content-title"),
    contentSettings: Creator.createElementWithClass("div", "content-settings"),
    sortSetting: Creator.createContentSortSetting(),
    filterSetting: Creator.createContentFilterSetting(),
    content: Creator.createElementWithClass("div", "content"),
    contentAddButton: Creator.createAddButton("Add todo"),
    footer: document.createElement("footer"),
    // Media query used for turning the app into mobile mode
    mobileVersion: window.matchMedia("(max-width: 750px), (max-height: 400px)"),
  };
  
  // Object used to store a reference to the existing developer and user categories ID's and the current DOM content being rendered.
  // Each time a category is created, a new property bearing its ID is added to categoriesContent object.
  // Each time a category is deleted, its corresponding property is deleted from the categoriesContent object properties.
  // Each time the user requests for the content of a category to be rendered, a todosList DOM element is created and assigned
  // to its corresponding property on the categoriesContent object, then it is inserted into the DOM.
  // If there was a previous category content being rendered, the todosList DOM is removed from the DOM tree,
  // released from memory, re-created on the new property, and re-attached on the DOM.
  // This system prevents memory leaks from detached DOM elements by keeping DOM element reference to a minimum and
  // by removing the old DOM element from the DOM tree and freeing it from memory each time a new content rendering request is made
export const categoriesContent = {};