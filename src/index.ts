import { handleKeyPress, onWheel } from "./actions";
import { onResize } from "./utils/canvas";
import { createRoot, data } from "./tree/tree";
import { Edit } from "./undoRedo";
import { buildViews, show, View } from "./view";
import { scrollToSelectedItem } from "./scroll";
import { runAllTests } from "./tests/tests";

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
    mode: "normal" as Mode,

    selectedItemTitleBeforeInsertMode: "",
    isItemAddedBeforeInsertMode: false,
    isRunningTests: false,
    changeHistory: [] as Edit[],
    currentChange: -1,

    views: [] as View[],

    pageHeight: 0,
    drawableCanvasHeight: 0,
    scrollOffset: 0,
};

export const state = {
    ...initialState,
    root: data,
    focused: data,
    selectedItem: data.children[0],
};

onResize();

//@ts-expect-error
window.state = state;

export type V2 = { x: number; y: number };
export type AppState = typeof initialState;

export function render() {
    buildViews(state);
    show(state);
}

window.addEventListener("keydown", async (e) => {
    await handleKeyPress(e);
    buildViews(state);

    scrollToSelectedItem(state);

    show(state);
});

window.addEventListener("wheel", (e) => {
    onWheel(e);
    render();
});

const url = new URL(location.toString());
if (url.searchParams.get("test") != null) {
    runAllTests();
} else {
    render();
}
