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