import { state } from "./index";
import { isRoot, isSameOrParentOf, item, Item } from "./tree/tree";
import {
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "./selection";
import { Edit, editTree, redoLastChange, undoLastChange } from "./undoRedo";
import { moveSelectedItem } from "./movement";
import { clampOffset } from "./scroll";
import { loadFromFile, saveToFile } from "./persistance.file";
import { saveItemsToLocalStorage } from "./persistance.storage";

export async function handleKeyPress(e: KeyboardEvent) {
    if (e.metaKey && e.code == "KeyR") return;

    if (state.mode == "normal") {
        const handler = normalModeHandlers.find(
            (h) =>
                h.key == e.code &&
                !!h.shift == !!e.shiftKey &&
                !!h.ctrl == !!e.ctrlKey &&
                !!h.alt == !!e.altKey &&
                !!h.meta == !!e.metaKey
        );
        if (handler) {
            if (handler.noDef) e.preventDefault();

            await handler.fn();
        }
    } else {
        //TODO extract these into data driven events
        if (e.code == "Escape") {
            if (state.isItemAddedBeforeInsertMode) {
                state.isItemAddedBeforeInsertMode = false;
                saveItemsToLocalStorage(state);
            } else {
                editTree(state, {
                    type: "change",
                    item: state.selectedItem,
                    prop: "title",
                    newValue: state.selectedItem.title,
                    oldValue: state.selectedItemTitleBeforeInsertMode,
                });
            }
            state.mode = "normal";
        } else if (e.code == "Backspace") {
            removeCharFromLeft();
        } else if (e.code == "Enter") {
            breakItem();
        } else if (e.key.length == 1) insertStr(e.key);
    }
}

export function onWheel(e: WheelEvent) {
    state.scrollOffset = clampOffset(state.scrollOffset + e.deltaY);
}

const normalModeHandlers = [
    { key: "KeyJ", fn: () => jumpToSibling("down"), ctrl: true },
    { key: "KeyK", fn: () => jumpToSibling("up"), ctrl: true },
    { key: "KeyH", fn: () => jumpToSibling("left"), ctrl: true },
    { key: "KeyL", fn: () => jumpToSibling("right"), ctrl: true },

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
    { key: "KeyO", fn: addItemBelowAndStartEdit },
    { key: "KeyO", fn: addItemAboveAndStartEdit, shift: true },
    { key: "KeyO", fn: addItemInsideAndStartEdit, ctrl: true },
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

    { key: "KeyS", fn: () => saveToFile(state.root), meta: true, noDef: true },
    { key: "KeyL", fn: loadRootFromFile, meta: true, noDef: true },

    { key: "Enter", fn: breakItem },
];

function jumpToSibling(direction: "up" | "down" | "left" | "right") {
    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    if (direction == "down") {
        if (index < context.length - 1) changeSelected(context[index + 1]);
    } else if (direction == "up") {
        if (index > 0) changeSelected(context[index - 1]);
    } else if (direction == "left") {
        if (isSameOrParentOf(state.focused, state.selectedItem.parent)) {
            changeSelected(state.selectedItem.parent);
        }
    } else if (direction == "right") {
        if (state.selectedItem.children.length > 0) {
            if (state.focused != state.selectedItem) {
                editTree(state, {
                    type: "change",
                    item: state.selectedItem,
                    prop: "isOpen",
                    newValue: true,
                    oldValue: false,
                });
            }
            changeSelected(state.selectedItem.children[0]);
        }
    }
}

function renameEdit(item: Item, newName: string): Edit {
    return {
        type: "change",
        item,
        prop: "title",
        oldValue: item.title,
        newValue: newName,
    };
}
function breakItem() {
    const left = state.selectedItem.title.slice(0, state.position);
    const right = state.selectedItem.title.slice(state.position);

    const editToAdd = createEditForAddingItemAfterSelected();
    editToAdd.item.title = right;
    if (state.mode == "insert") state.isItemAddedBeforeInsertMode = true;

    editTree(state, [renameEdit(state.selectedItem, left), editToAdd]);
    changeSelected(editToAdd.item);
}
function createEditForAddingItemAfterSelected(): Edit {
    const newItem = item("");
    if (state.selectedItem == state.focused) {
        state.selectedItem.isOpen = true;
        return {
            type: "add",
            item: newItem,
            parent: state.selectedItem,
            position: 0,
            selectedAtMoment: state.selectedItem,
        };
    }
    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    return {
        type: "add",
        item: newItem,
        parent: state.selectedItem.parent,
        position: index + 1,
        selectedAtMoment: state.selectedItem,
    };
}

function addItemBelow() {
    if (state.selectedItem == state.focused) return addItemInside();
    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    const newItem = item("");
    editTree(state, {
        type: "add",
        item: newItem,
        parent: state.selectedItem.parent,
        position: index + 1,
        selectedAtMoment: state.selectedItem,
    });
    changeSelected(newItem);
}

function addItemInside() {
    state.selectedItem.isOpen = true;
    const newItem = item("");
    editTree(state, {
        type: "add",
        item: newItem,
        parent: state.selectedItem,
        position: 0,
        selectedAtMoment: state.selectedItem,
    });
    changeSelected(newItem);
}

function addItemBelowAndStartEdit() {
    addItemBelow();
    state.isItemAddedBeforeInsertMode = true;
    state.mode = "insert";
}

function addItemAboveAndStartEdit() {
    if (state.selectedItem == state.focused) return addItemInsideAndStartEdit();

    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    const newItem = item("");
    newItem.parent = state.selectedItem.parent;
    context.splice(index, 0, newItem);
    changeSelected(newItem);
    state.isItemAddedBeforeInsertMode = true;
    state.mode = "insert";
}

function addItemInsideAndStartEdit() {
    addItemInside();
    state.isItemAddedBeforeInsertMode = true;
    state.mode = "insert";
}

async function loadRootFromFile() {
    const fileRoot = await loadFromFile();
    if (fileRoot) {
        state.root = fileRoot;
        state.selectedItem = state.root.children[0];
        state.focused = fileRoot;
        state.changeHistory = [];
        state.views = [];
    }
}

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
        item: state.selectedItem,
        position: index,
        itemToSelectNext,
    });
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
    if (selectedItem.isOpen && state.focused != state.selectedItem) {
        editTree(state, {
            type: "change",
            item: selectedItem,
            prop: "isOpen",
            newValue: false,
            oldValue: true,
        });
        // selectedItem.isOpen = false;
    } else if (!isRoot(selectedItem.parent)) {
        changeSelected(selectedItem.parent);
    }
}

function goRight() {
    const { selectedItem } = state;
    if (!selectedItem.isOpen && selectedItem.children.length > 0) {
        editTree(state, {
            type: "change",
            item: selectedItem,
            prop: "isOpen",
            newValue: true,
            oldValue: false,
        });
    } else if (selectedItem.children.length > 0)
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
