import { handleKeyPress } from "./actions";
import { onResize } from "./canvas";
import { data } from "./tree/tree";
import { show } from "./view";

onResize();

window.addEventListener("resize", () => {
    onResize();
    render();
});

type Mode = "normal" | "insert";

export const state = {
    position: 0,
    root: data,
    selectedItem: data.children[0],
    mode: "normal" as Mode,
};

export type V2 = { x: number; y: number };
export type AppState = typeof state;

function render() {
    show(state);
}

window.addEventListener("keydown", (e) => {
    handleKeyPress(e);
    render();
});

render();
