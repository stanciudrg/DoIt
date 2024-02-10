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

