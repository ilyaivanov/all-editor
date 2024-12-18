import { state } from ".";
import { isRoot, Item } from "./tree/tree";
import { getItemAbove, getItemBelow } from "./selection";

export function handleKeyPress(e: KeyboardEvent) {
    if (state.mode == "normal") {
        const handler = normalModeHandlers.find((h) => "Key" + h.key == e.code);
        if (handler) handler.fn();
    } else {
        if (e.code == "Escape") state.mode = "normal";
        else insertStr(e.key);
    }
}

const normalModeHandlers = [
    { key: "A", fn: moveCursorLeft },
    { key: "F", fn: moveCursorRight },
    { key: "W", fn: goToNextWord },
    { key: "B", fn: goToPrevWord },
    { key: "J", fn: goDown },
    { key: "K", fn: goUp },
    { key: "H", fn: goLeft },
    { key: "L", fn: goRight },
    { key: "I", fn: () => (state.mode = "insert") },
];

function changeSelected(item: Item | undefined) {
    if (item) {
        state.selectedItem = item;
        state.position = 0;
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
