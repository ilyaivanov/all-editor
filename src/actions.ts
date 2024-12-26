import { state } from "./index";
import {
    forEachChildBFS,
    isRoot,
    isSameOrParentOf,
    item,
    Item,
} from "./tree/tree";
import {
    getItemAbove,
    getItemBelow,
    getItemToSelectAfterRemovingSelected,
} from "./selection";
import {
    Edit,
    editTree,
    redoLastChange,
    undoLastChange,
    changes,
} from "./undoRedo";
import { moveSelectedItem } from "./movement";
import { clampOffset } from "./scroll";
import { assignAttributes, loadFromFile, saveToFile } from "./persistance.file";
import { saveItemsToLocalStorage } from "./persistance.storage";
import { handleModalKey, showModal } from "./shitcode/searchModal";
import { quickSearchKeyPress, showQuickSearch } from "./shitcode/quickSearch";
import { pause, play, resume } from "./player/youtubePlayer";
import { loadNextPage, loadItem } from "./player/loading";
import {
    hideVideo,
    onBrightnessChanged,
    onPlayerModeChanged,
    showVideo,
} from "./player/player";

function doesHandlerMatch(
    e: KeyboardEvent,
    h: (typeof normalModeHandlers)[number]
) {
    return (
        h.key == e.code &&
        !!h.shift == !!e.shiftKey &&
        !!h.ctrl == !!e.ctrlKey &&
        !!h.alt == !!e.altKey &&
        !!h.meta == !!e.metaKey
    );
}

export async function handleKeyPress(e: KeyboardEvent) {
    if (e.metaKey && e.code == "KeyR") return;

    if (state.searchModal.focusOn != "unfocus") {
        handleModalKey(state, e);
    } else if (state.quickSearch.isActive) {
        quickSearchKeyPress(state, e);
    } else if (state.mode == "normal") {
        const handler = normalModeHandlers.find((h) => doesHandlerMatch(e, h));
        if (handler) {
            if (handler.noDef) e.preventDefault();

            await handler.fn();
        } else if (
            e.code.startsWith("Digit") &&
            e.altKey &&
            !e.metaKey &&
            !e.ctrlKey &&
            !e.shiftKey
        ) {
            const val = Number.parseInt(e.code.substring("Digit".length)) / 10;
            if (val == 0) state.brightness = state.brightness == 0 ? 1 : 0;
            else state.brightness = val;
            onBrightnessChanged(state.brightness);
        }
    } else {
        const handler = insertModeHandlers.find((h) => doesHandlerMatch(e, h));
        if (handler) await handler.fn();
        else if (e.key.length == 1) insertStr(e.key);
    }
}

export function onWheel(e: WheelEvent) {
    state.scrollOffset = clampOffset(state.scrollOffset + e.deltaY);
}

const insertModeHandlers = [
    { key: "Escape", fn: exitRename },
    { key: "Backspace", fn: removeCharFromLeft },
    { key: "Enter", fn: breakItem },

    { key: "KeyJ", fn: () => moveSelectedItem(state, "down"), alt: true },
    { key: "KeyK", fn: () => moveSelectedItem(state, "up"), alt: true },
    { key: "KeyL", fn: () => moveSelectedItem(state, "right"), alt: true },
    { key: "KeyH", fn: () => moveSelectedItem(state, "left"), alt: true },

    { key: "KeyV", fn: pasteSelectedItem, meta: true },
    { key: "KeyC", fn: copySelectedItem, meta: true },
];

const normalModeHandlers = [
    { key: "KeyJ", fn: () => jumpToSibling("down"), ctrl: true },
    { key: "KeyK", fn: () => jumpToSibling("up"), ctrl: true },
    { key: "KeyH", fn: () => jumpToSibling("left"), ctrl: true },
    { key: "KeyL", fn: () => jumpToSibling("right"), ctrl: true },

    { key: "KeyQ", fn: closeAll },
    { key: "KeyE", fn: openAll },

    { key: "KeyP", fn: () => showModal(state), meta: true, noDef: true },
    { key: "KeyF", fn: () => showQuickSearch(state), meta: true, noDef: true },

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
    // { key: "KeyX", fn: removeCurrentChar },
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
    { key: "KeyP", fn: () => (state.showPerf = !state.showPerf), alt: true },

    //player
    { key: "Space", fn: onSpacePress },
    { key: "KeyZ", fn: playPrev },
    { key: "KeyX", fn: togglePlay },
    { key: "KeyC", fn: playNext },

    { key: "KeyC", fn: extractChannel, alt: true, shift: true },

    { key: "KeyV", fn: pasteSelectedItem, meta: true },
    { key: "KeyC", fn: copySelectedItem, meta: true },

    { key: "KeyV", fn: toggleVideoVisibility },

    {
        key: "KeyM",
        fn: () => {
            state.playerMode =
                state.playerMode == "fullscreen" ? "small" : "fullscreen";
            onPlayerModeChanged(state.playerMode);
        },
        meta: true,
        noDef: true,
    },
];

function toggleVideoVisibility() {
    state.isVideoHidden = !state.isVideoHidden;
    if (state.isVideoHidden) hideVideo();
    else showVideo();
}

async function pasteSelectedItem() {
    let textToPaste = await navigator.clipboard.readText();
    textToPaste = textToPaste.replace("\n", "");
    insertStr(textToPaste);
}

async function copySelectedItem() {
    await navigator.clipboard.writeText(state.selectedItem.title);
    // showMessage(textToCopy);
}

function extractChannel() {
    const { selectedItem } = state;
    if (selectedItem.channelId && selectedItem.channelTitle) {
        const channelItem = item(selectedItem.channelTitle);
        channelItem.channelId = selectedItem.channelId;
        const context = selectedItem.parent.children;
        const index = context.indexOf(selectedItem);

        context.splice(index, 0, channelItem);
        channelItem.parent = selectedItem.parent;

        state.selectedItem = channelItem;
    }
}

function onSpacePress() {
    if (state.selectedItem.videoId) playItem(state.selectedItem);
    else if (state.selectedItem.nextPageToken) loadNextPage(state.selectedItem);
}

function playItem(item: Item) {
    if (item.videoId) {
        state.itemPlaying = item;
        play(item.videoId);
        state.playerState = "play";
    }
}
function togglePlay() {
    if (state.playerState == "pause") {
        state.playerState = "play";
        resume();
    } else {
        state.playerState = "pause";
        pause();
    }
}

function playNext() {
    if (state.itemPlaying) {
        const below = getItemBelow(state, state.itemPlaying);
        if (below) playItem(below);
    }
}
function playPrev() {
    if (state.itemPlaying) {
        const below = getItemAbove(state.itemPlaying);
        if (below) playItem(below);
    }
}

function closeAll() {
    const closeEdits: Edit[] = [];
    forEachChildBFS(state.selectedItem, (i) => {
        if (i.isOpen) closeEdits.push(changes.closeItem(i));
    });
    if (state.selectedItem)
        closeEdits.push(changes.closeItem(state.selectedItem));

    editTree(state, closeEdits);
}

function openAll() {
    const openEdits: Edit[] = [];
    forEachChildBFS(state.selectedItem, (i) => {
        if (!i.isOpen && i.children.length > 0)
            openEdits.push(changes.openItem(i));
    });
    if (state.selectedItem)
        openEdits.push(changes.openItem(state.selectedItem));

    editTree(state, openEdits);
}

function jumpToSibling(direction: "up" | "down" | "left" | "right") {
    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    if (direction == "down") {
        if (index < context.length - 1) changeSelected(context[index + 1]);
    } else if (direction == "up") {
        if (index > 0) changeSelected(context[index - 1]);
    } else if (direction == "left") {
        changeSelected(state.selectedItem.parent);
    } else if (direction == "right") {
        if (state.selectedItem.children.length > 0) {
            if (state.focused != state.selectedItem) {
                editTree(state, changes.openItem(state.selectedItem));
            }
            changeSelected(state.selectedItem.children[0]);
        }
    }
}
function exitRename() {
    assignAttributes(state.selectedItem.title, state.selectedItem);

    if (state.isItemAddedBeforeInsertMode) {
        state.isItemAddedBeforeInsertMode = false;
        saveItemsToLocalStorage(state);
    } else {
        editTree(
            state,
            changes.renameWithOld(
                state.selectedItem,
                state.selectedItem.title,
                state.selectedItemTitleBeforeInsertMode
            )
        );
    }
    state.mode = "normal";
}

function breakItem() {
    const left = state.selectedItem.title.slice(0, state.position);
    const right = state.selectedItem.title.slice(state.position);

    const editToAdd = createEditForAddingItemAfterSelected();
    editToAdd.item.title = right;
    if (state.mode == "insert") state.isItemAddedBeforeInsertMode = true;

    editTree(state, [changes.rename(state.selectedItem, left), editToAdd]);
    changeSelected(editToAdd.item);
}
function createEditForAddingItemAfterSelected(): Edit {
    const newItem = item("");
    if (state.selectedItem == state.focused) {
        state.selectedItem.isOpen = true;
        return changes.add(newItem, state.selectedItem, 0, state);
    }
    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);
    return changes.add(newItem, state.selectedItem.parent, index + 1, state);
}

function addItemBelow() {
    if (state.selectedItem == state.focused) return addItemInside();
    const context = state.selectedItem.parent.children;
    const index = context.indexOf(state.selectedItem);

    const parent = state.selectedItem.parent;
    const edit = changes.add(item(""), parent, index + 1, state);
    editTree(state, edit);
    changeSelected(edit.item);
}

function addItemInside() {
    state.selectedItem.isOpen = true;
    const edit = changes.add(item(""), state.selectedItem, 0, state);
    editTree(state, edit);
    changeSelected(edit.item);
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

    const itemToSelectNext = getItemToSelectAfterRemovingSelected(
        state.selectedItem
    );
    editTree(state, changes.remove(state.selectedItem, itemToSelectNext));
}

export function changeSelected(item: Item | undefined) {
    if (item && isSameOrParentOf(state.focused, item) && !isRoot(item)) {
        if (state.selectedItem != item) state.position = 0;
        state.selectedItem = item;
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
        editTree(state, changes.closeItem(selectedItem));
    } else if (!isRoot(selectedItem.parent)) {
        changeSelected(selectedItem.parent);
    }
}

function goRight() {
    const { selectedItem } = state;
    if (!selectedItem.isOpen && selectedItem.children.length > 0) {
        editTree(state, changes.openItem(selectedItem));
    } else if (selectedItem.children.length > 0)
        changeSelected(selectedItem.children[0]);
    else if (selectedItem.nextPageToken) {
        loadNextPage(state.selectedItem);
    } else if (
        (selectedItem.playlistId ||
            (selectedItem.channelId && !selectedItem.videoId)) &&
        !selectedItem.isLoading
    ) {
        loadItem(selectedItem);
    }
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
export function removeChar(str: string, at: number) {
    return str.slice(0, at) + str.slice(at + 1);
}

function insertStr(str: string) {
    const { selectedItem, position } = state;
    selectedItem.title = insertStrAt(selectedItem.title, str, position);
    state.position += str.length;
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
