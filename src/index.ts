import { handleKeyPress, onWheel } from "./actions";
import { onResize } from "./utils/canvas";
import { runTests } from "./tests/tests";
import { data, Item } from "./tree/tree";
import { Edit } from "./undoRedo";
import { buildViews, show, View } from "./view";
import { scrollToSelectedItem } from "./scroll";

onResize();

window.addEventListener("resize", () => {
    onResize();
    render();
});

export type Mode = "normal" | "insert";

export const state = {
    position: 0,
    root: data,
    selectedItem: data.children[0],
    mode: "normal" as Mode,

    selectedItemTitleBeforeInsertMode: "",
    isItemAddedBeforeInsertMode: false,
    changeHistory: [] as Edit[],
    currentChange: -1,

    views: [] as View[],

    pageHeight: 0,
    scrollOffset: 0,
};

export type V2 = { x: number; y: number };
export type AppState = typeof state;

export function render() {
    buildViews(state);
    show(state);
}

window.addEventListener("keydown", (e) => {
    const selectedItemBefore = state.selectedItem;
    handleKeyPress(e);
    buildViews(state);

    if (selectedItemBefore != state.selectedItem) scrollToSelectedItem(state);

    show(state);
});

window.addEventListener("wheel", (e) => {
    onWheel(e);
    render();
});

const url = new URL(location.toString());
if (url.searchParams.get("test") != null) {
    runTests();
} else {
    render();
}
