import { state } from ".";
import { isRoot, isSameOrParentOf, item, Item } from "./tree/tree";
import {
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "./selection";
import { editTree, redoLastChange, undoLastChange } from "./undoRedo";
import { moveSelectedItem } from "./movement";
import { clampOffset } from "./scroll";

export function handleKeyPress(e: KeyboardEvent) {
    if (e.metaKey && e.code == "KeyR") return;

    if (state.mode == "normal") {
        const handler = normalModeHandlers.find(
            (h) =>
                h.key == e.code &&
                !!h.shift == !!e.shiftKey &&
                !!h.ctrl == !!e.ctrlKey &&
                !!h.alt == !!e.altKey
        );
        if (handler) handler.fn();
    } else {
        if (e.code == "Escape") {
            if (state.isItemAddedBeforeInsertMode) {
                state.isItemAddedBeforeInsertMode = false;
            } else {
                editTree(state, {
                    type: "rename",
                    item: {
                        item: state.selectedItem,
                        newTitle: state.selectedItem.title,
                        oldTitle: state.selectedItemTitleBeforeInsertMode,
                    },
                });
            }
            state.mode = "normal";
        } else if (e.code == "Backspace") {
            removeCharFromLeft();
        } else if (e.key.length == 1) insertStr(e.key);
    }
}

export function onWheel(e: WheelEvent) {
    state.scrollOffset = clampOffset(state.scrollOffset + e.deltaY);
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
    { key: "KeyI", fn: enterInsertMode },
    { key: "Backspace", fn: removeCharFromLeft },
    { key: "KeyX", fn: removeCurrentChar },
    { key: "KeyO", fn: addItemBelow },
    { key: "KeyO", fn: addItemAbove, shift: true },
    { key: "KeyO", fn: addItemInside, ctrl: true },
    { key: "KeyR", fn: replaceTitle },
    { key: "KeyD", fn: removeSelectedItem },
    { key: "KeyU", fn: () => undoLastChange(state) },
    { key: "KeyU", fn: () => redoLastChange(state), shift: true },

    { key: "KeyJ", fn: () => moveSelectedItem(state, "down"), alt: true },
    { key: "KeyK", fn: () => moveSelectedItem(state, "up"), alt: true },
    { key: "KeyL", fn: () => moveSelectedItem(state, "right"), alt: true },
    { key: "KeyH", fn: () => moveSelectedItem(state, "left"), alt: true },

    { key: "KeyM", fn: focusOnSelected },
    { key: "KeyM", fn: focusOnParent, shift: true },
];

function focusOnSelected() {
    state.focused = state.selectedItem;
}

function focusOnParent() {
    state.focused = state.focused.parent;
}

function enterInsertMode() {
    state.selectedItemTitleBeforeInsertMode = state.selectedItem.title;
    state.mode = "insert";
}

function replaceTitle() {
    state.selectedItemTitleBeforeInsertMode = state.selectedItem.title;
    state.selectedItem.title = "";
    state.mode = "insert";
}

function removeSelectedItem() {
    if (state.selectedItem == state.focused) return;

    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    const itemToSelectNext = getItemToSelectAfterRemovingSelected(
        state.selectedItem
    );
    editTree(state, {
        type: "remove",
        item: { item: state.selectedItem, position: index },
        itemToSelectNext,
    });
}

function addItemBelow() {
    if (state.selectedItem == state.focused) return addItemInside();

    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    const newItem = item("");
    editTree(state, {
        type: "add",
        item: {
            item: newItem,
            parent: state.selectedItem.parent,
            position: index + 1,
            selectedAtMoment: state.selectedItem,
        },
    });
    changeSelected(newItem);
    state.isItemAddedBeforeInsertMode = true;
    state.mode = "insert";
}

function addItemAbove() {
    if (state.selectedItem == state.focused) return addItemInside();

    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    const newItem = item("");
    newItem.parent = state.selectedItem.parent;
    context.splice(index, 0, newItem);
    changeSelected(newItem);
    state.isItemAddedBeforeInsertMode = true;
    state.mode = "insert";
}

function addItemInside() {
    state.selectedItem.isOpen = true;
    const newItem = item("");
    state.selectedItem.children.unshift(newItem);
    newItem.parent = state.selectedItem;
    changeSelected(newItem);
    state.isItemAddedBeforeInsertMode = true;
    state.mode = "insert";
}

export function changeSelected(item: Item | undefined) {
    if (item && isSameOrParentOf(state.focused, item)) {
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
    if (state.position > 0) {
        state.position--;
    } else {
        const itemBefore = state.selectedItem;
        goUp();
        if (itemBefore != state.selectedItem)
            state.position = state.selectedItem.title.length;
    }
}

function moveCursorRight() {
    if (state.position <= state.selectedItem.title.length) {
        state.position++;
        if (state.position > state.selectedItem.title.length) {
            const itemBefore = state.selectedItem;
            goDown();
            if (itemBefore != state.selectedItem) state.position = 0;
            else state.position = state.selectedItem.title.length;
        }
    }
}

function goLeft() {
    const { selectedItem } = state;
    if (selectedItem.isOpen && state.focused != state.selectedItem)
        selectedItem.isOpen = false;
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
