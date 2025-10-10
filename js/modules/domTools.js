/**
 * Create an element with optional attributes, classes, and children.
 * @param {string} tag - HTML tag name.
 * @param {Object} [options] - Configuration object.
 * @param {Object} [options.attrs] - Key‑value pairs for attributes.
 * @param {string|string[]} [options.classes] - One class or array of classes.
 * @param {Node|Node[]} [options.children] - child nodes or strings.
 * @returns {HTMLElement}
 */
export function createEl(tag, options = {}) {
    const el = document.createElement(tag);

    // Support data-* attributes via options.data: { foo: 'bar' } -> data-foo="bar"
    //createEl('div', { data: { id: 42, role: 'admin' } });
    // -> <div data-id="42" data-role="admin"></div>
    if (options.data) {
        options.attrs = { ...(options.attrs || {}) };
        for (const [k, v] of Object.entries(options.data)) {
            // Convert camelCase keys to kebab-case for attribute names (optional)
            const attrName = 'data-' + k.replace(/([A-Z])/g, '-$1').toLowerCase();
            options.attrs[attrName] = String(v);
        }
    }


    if (options.attrs) {
        for (const [k, v] of Object.entries(options.attrs)) {
            el.setAttribute(k, v);
        }
    }

    if (options.classes) {
        // Accept a string, an array, or a mixed list.
        const classList = Array.isArray(options.classes)
            ? options.classes
            : typeof options.classes === 'string'
                ? options.classes.split(/\s+/)   // split on whitespace
                : [];

        // Filter out empty entries that can appear after split
        const clean = classList.filter(Boolean);
        el.classList.add(...clean);
    }

    if (options.children) {
        const kids = Array.isArray(options.children) ? options.children : [options.children];
        kids.forEach(child => {
            if (typeof child === 'string') {
                el.appendChild(document.createTextNode(child));
            } else {
                el.appendChild(child);
            }
        });
    }

    return el;
}

/**
 * Convenience wrappers for common tags.
 * Each wrapper forwards the optional `options` object to `createEl`.
 */
export const h1 = (text, options = {}) => createEl('h1', { ...options, children: text });
export const h2 = (text, options = {}) => createEl('h2', { ...options, children: text });
export const h3 = (text, options = {}) => createEl('h3', { ...options, children: text });
export const h4 = (text, options = {}) => createEl('h4', { ...options, children: text });
export const h5 = (text, options = {}) => createEl('h5', { ...options, children: text });
export const h6 = (text, options = {}) => createEl('h6', { ...options, children: text });

export const p  = (text, options = {}) => createEl('p',  { ...options, children: text });
export const span = (text, options = {}) => createEl('span', { ...options, children: text });
export const strong = (text, options = {}) => createEl('strong', { ...options, children: text });
export const div = (options = {}, ...children) => createEl('div', { ...options, children });

export const button = (text, options = {}) => createEl('button', { ...options, children: text });
export const link = (text, options = {}) => createEl('a', { ...options, children: text });
// a('Google', { attrs: { href: 'https://google.com', target: '_blank', rel: 'noopener noreferrer' }, classes: 'link' });


/**
 * Append one or more children to a parent element.
 * @param {HTMLElement} parent
 * @param {Node|Node[]} children
 */
export function appendTo(parent, children) {
    const nodes = Array.isArray(children) ? children : [children];
    nodes.forEach(node => parent.appendChild(node));
}

/**
 * Remove all children from an element.
 * @param {HTMLElement} el
 */
export function clearChildren(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
}

/**
 * Insert an element before a reference node.
 * @param {HTMLElement} newNode
 * @param {HTMLElement} referenceNode
 */
export function insertBefore(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode);
}

/**
 * Replace an existing element with a new one.
 * @param {HTMLElement} newNode
 * @param {HTMLElement} oldNode
 */
export function replaceEl(newNode, oldNode) {
    oldNode.parentNode.replaceChild(newNode, oldNode);
}

//#region EXAMPLES

/*

const box = createEl('div', {
    classes: 'card',
    children: 'Hello world!'
});
document.body.appendChild(box);

// 2. Nested structure
const list = createEl('ul', {
    classes: ['list', 'compact'],
    children: [
        createEl('li', { children: 'Item 1' }),
        createEl('li', { children: 'Item 2' })
    ]
});
appendTo(document.body, list);

// 3. Clear and repopulate
clearChildren(box);
appendTo(box, [
    createEl('h2', { children: 'Title' }),
    createEl('p', { children: 'New content.' })
]);


// Create a <section> with an id and two classes
const section = createEl('section', {
    attrs: { id: 'main-section' },          // id attribute
    classes: ['container', 'theme-dark'],   // one or more classes
    children: [
        createEl('h1', { children: 'Dashboard' })
    ]
});

const btn = createEl('button', {
    attrs: { id: 'saveBtn', type: 'button' },
    classes: 'primary',
    children: 'Save'
});

*/

//#endregion