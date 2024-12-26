import { buildViews, show, View } from "./view";
import { handleKeyPress, onWheel } from "./actions";
import { canvas, onResize } from "./utils/canvas";
import { createRoot, findByTitle, item, Item } from "./tree/tree";
import { Edit } from "./undoRedo";
import { scrollToSelectedItem } from "./scroll";
import {
    loadItemsFromLocalStorage,
    loadUserSettings,
    saveUserSettings,
} from "./persistance.storage";
import { searchInit } from "./shitcode/searchModal";
import { quickSearchState } from "./shitcode/quickSearch";
import { createPlayerElem, PlayerMode } from "./player/player";
import { addEntry, drawPerformance } from "./shitcode/perfMonitor";

window.addEventListener("resize", () => {
    onResize();

    render();
});

export type Mode = "normal" | "insert";

const empty = createRoot([]);
empty.title = "EMPTY_ROOT";

export const initialState = {
    position: 0,
    root: empty,
    focused: empty,
    selectedItem: empty,
    itemPlaying: undefined as Item | undefined,
    mode: "normal" as Mode,

    selectedItemTitleBeforeInsertMode: "",
    isItemAddedBeforeInsertMode: false,
    isRunningTests: false,
    changeHistory: [] as Edit[][],
    currentChange: -1,

    views: [] as View[],

    pageHeight: 0,
    drawableCanvasHeight: 0,
    scrollOffset: 0,

    searchModal: searchInit,
    quickSearch: quickSearchState,

    isVideoHidden: false,
    playerTimeLabel: "",
    playerTimeSeconds: -1,
    playerState: "pause" as "play" | "pause",
    playerMode: "small" as PlayerMode,
    brightness: 1,

    showPerf: false,

    isSelectingFont: false,
};

const rootIfNoStored = createRoot([
    item("Ambient", [
        item("Carbon Based Lifeforms", [
            item("album 1"),
            item("album 2"),
            item("album 3"),
        ]),
        item("Sync24", [
            item("album 1"),
            item("album 2"),
            item("album 3"),
            item("album 4"),
        ]),
        item("Koan", [
            item("album 1"),
            item("album 2"),
            item("album 3"),
            item("album 4"),
            item("album 5"),
            item("album 6"),
        ]),
    ]),
    item("Electro", [item("Drum"), item("And"), item("Bass")]),
    item("Piano", [item("David Nevue"), item("Isaac Shepard")]),
]);

const data: Item = loadItemsFromLocalStorage() || rootIfNoStored;

export const state = { ...initialState };

const userSettings = loadUserSettings() || {
    itemTitleFocused: "",
    itemTitleSelected: "",
    offset: 0,
};

let itemToFocus = data;
let itemToSelect = data.children[0];

if (userSettings.itemTitleFocused.length > 0) {
    const itemFound = findByTitle(data, userSettings.itemTitleFocused);
    if (itemFound) itemToFocus = itemFound;

    const itemSelected = findByTitle(data, userSettings.itemTitleSelected);
    if (itemSelected) itemToSelect = itemSelected;
}
state.root = data;
state.focused = itemToFocus;
state.selectedItem = itemToSelect;
state.scrollOffset = userSettings ? userSettings.offset : 0;

onResize();

//@ts-expect-error
window.state = state;

export type V2 = { x: number; y: number };
export type AppState = typeof initialState;

export function render() {
    const start = performance.now();
    buildViews(state);
    show(state);
    addEntry(performance.now() - start);

    if (state.showPerf) drawPerformance();
}

function updateUserSettings() {
    //TODO: use item ids instead of titles, but I don't want to clutter text files
    // is it ok to erase User Settings when loading from a file
    // do I have another option? maybe maybe not. scrikk ad other and foo 23
    const needToUpdate =
        userSettings.itemTitleFocused != state.focused.title ||
        userSettings.itemTitleSelected != state.selectedItem.title ||
        userSettings.offset != state.scrollOffset;

    if (needToUpdate) {
        userSettings.itemTitleFocused = state.focused.title;
        userSettings.itemTitleSelected = state.selectedItem.title;
        userSettings.offset = state.scrollOffset;

        saveUserSettings(userSettings);
    }
}

window.addEventListener("keydown", async (e) => {
    const start = performance.now();
    await handleKeyPress(e);
    buildViews(state);

    scrollToSelectedItem(state);
    updateUserSettings();

    const renderStart = performance.now();
    show(state);
    const now = performance.now();
    addEntry(now - renderStart, renderStart - start);
    if (state.showPerf) drawPerformance();
});

window.addEventListener("wheel", (e) => {
    const start = performance.now();
    onWheel(e);
    show(state);
    addEntry(performance.now() - start);

    if (state.showPerf) drawPerformance();
});

const url = new URL(location.toString());
if (process.env.DEBUG && url.searchParams.get("test") != null) {
    const { runAllTests } = require("./tests/tests");
    runAllTests();
} else {
    render();
}

document.body.appendChild(createPlayerElem());
document.body.appendChild(canvas);
