import { state } from ".";
import { isRoot, item, Item } from "./tree/tree";
import {
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "./selection";

export function handleKeyPress(e: KeyboardEvent) {
    if (e.metaKey && e.code == "KeyR") return;

    if (state.mode == "normal") {
        const handler = normalModeHandlers.find(
            (h) =>
                h.key == e.code &&
                !!h.shift === e.shiftKey &&
                !!h.ctrl == e.ctrlKey
        );
        if (handler) handler.fn();
    } else {
        if (e.code == "Escape") state.mode = "normal";
        else if (e.code == "Backspace") {
            removeCharFromLeft();
        } else insertStr(e.key);
    }
}

const normalModeHandlers = [
    { key: "KeyA", fn: moveCursorLeft },
    { key: "KeyF", fn: moveCursorRight },
    { key: "KeyW", fn: goToNextWord },
    { key: "KeyB", fn: goToPrevWord },
    { key: "KeyJ", fn: goDown },
    { key: "KeyK", fn: goUp },
    { key: "KeyH", fn: goLeft },
    { key: "KeyL", fn: goRight },
    { key: "KeyI", fn: () => (state.mode = "insert") },
    { key: "Backspace", fn: removeCharFromLeft },
    { key: "KeyX", fn: removeCurrentChar },
    { key: "KeyO", fn: addItemBelow },
    { key: "KeyO", fn: addItemAbove, shift: true },
    { key: "KeyO", fn: addItemInside, ctrl: true },
    { key: "KeyR", fn: replaceTitle },
    { key: "KeyD", fn: removeSelectedItem },
];

function replaceTitle() {
    state.selectedItem.title = "";
    state.mode = "insert";
}

function removeSelectedItem() {
    const next = getItemToSelectAfterRemovingSelected(state.selectedItem);
    const context = state.selectedItem.parent.children;
    context.splice(context.indexOf(state.selectedItem), 1);

    if (next) state.selectedItem = next;
}

function addItemBelow() {
    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    const newItem = item("");
    newItem.parent = state.selectedItem.parent;
    context.splice(index + 1, 0, newItem);
    changeSelected(newItem);
    state.mode = "insert";
}
function addItemAbove() {
    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    const newItem = item("");
    newItem.parent = state.selectedItem.parent;
    context.splice(index, 0, newItem);
    changeSelected(newItem);
    state.mode = "insert";
}
function addItemInside() {
    state.selectedItem.isOpen = true;
    const newItem = item("");
    state.selectedItem.children.unshift(newItem);
    newItem.parent = state.selectedItem;
    changeSelected(newItem);
    state.mode = "insert";
}

function changeSelected(item: Item | undefined) {
    if (item) {
        state.selectedItem = item;
        state.position = 0;
    }
}

function removeCharFromLeft() {
    state.selectedItem.title = removeChar(
        state.selectedItem.title,
        state.position - 1
    );
    state.position--;
}

function removeCurrentChar() {
    if (state.position < state.selectedItem.title.length) {
        state.selectedItem.title = removeChar(
            state.selectedItem.title,
            state.position
        );
    }
}

function moveCursorLeft() {
    state.position--;
    if (state.position < 0) {
        goUp();
        state.position = state.selectedItem.title.length;
    }
}

function moveCursorRight() {
    state.position++;
    if (state.position > state.selectedItem.title.length) {
        goDown();
    }
}

function goLeft() {
    const { selectedItem } = state;
    if (selectedItem.isOpen) selectedItem.isOpen = false;
    else if (!isRoot(selectedItem.parent)) {
        changeSelected(selectedItem.parent);
    }
}

function goRight() {
    const { selectedItem } = state;
    if (!selectedItem.isOpen && selectedItem.children.length > 0)
        selectedItem.isOpen = true;
    else if (selectedItem.children.length > 0)
        changeSelected(selectedItem.children[0]);
}

function goDown() {
    changeSelected(getItemBelow(state, state.selectedItem));
}
function goUp() {
    changeSelected(getItemAbove(state.selectedItem));
}

function insertStrAt(str: string, ch: string, at: number) {
    return str.slice(0, at) + ch + str.slice(at);
}
function removeChar(str: string, at: number) {
    return str.slice(0, at) + str.slice(at + 1);
}

function insertStr(str: string) {
    const { selectedItem, position } = state;
    selectedItem.title = insertStrAt(selectedItem.title, str, position);
    state.position++;
}

function goToNextWord() {
    state.position = jumpWordForward(state.selectedItem.title, state.position);
}

function goToPrevWord() {
    state.position = jumpWordBack(state.selectedItem.title, state.position);
}

const whitespaceChars = [" ", "\n", ":", ".", "(", ")"];
function jumpWordBack(code: string, letterIndex: number): number {
    if (letterIndex <= 0) return 0;

    let i = letterIndex - 1;

    while (i > 0 && whitespaceChars.includes(code[i])) i--;

    while (i > 0 && !whitespaceChars.includes(code[i - 1])) i--;

    return i;
}

function jumpWordForward(code: string, letterIndex: number): number {
    if (letterIndex >= code.length) return code.length;

    let i = letterIndex;
    while (i < code.length && !whitespaceChars.includes(code[i])) i++;

    while (i < code.length && whitespaceChars.includes(code[i])) i++;

    return i;
}
