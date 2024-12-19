import { handleKeyPress } from "./actions";
import { onResize } from "./canvas";
import { runTests } from "./tests/tests";
import { data } from "./tree/tree";
import { Edit } from "./undoRedo";
import { show } from "./view";

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
};

export type V2 = { x: number; y: number };
export type AppState = typeof state;

export function render() {
    show(state);
}

window.addEventListener("keydown", (e) => {
    handleKeyPress(e);
    render();
});

const url = new URL(location.toString());
if (url.searchParams.get("test") != null) {
    runTests();
} else {
    render();
}
