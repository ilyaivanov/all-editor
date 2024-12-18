import { data, Item } from "./root";
import { getItemAbove, getItemBelow, isRoot } from "./selection";
import { show } from "./view";

const canvas = document.createElement("canvas");
let ctx = canvas.getContext("2d")!;
document.body.appendChild(canvas);

let scale = 0;
let view = { x: 0, y: 0 };

function onResize() {
    scale = window.devicePixelRatio || 1;
    ctx.imageSmoothingEnabled = false;

    view.x = window.innerWidth;
    view.y = window.innerHeight;

    canvas.style.width = view.x + "px";
    canvas.style.height = view.y + "px";

    canvas.width = view.x * scale;
    canvas.height = view.y * scale;

    ctx.scale(scale, scale);
}

onResize();

window.addEventListener("resize", () => {
    onResize();
    render();
});

type Mode = "normal" | "insert";

const state = {
    position: 0,
    root: data,
    selectedItem: data.children[0],
    mode: "normal" as Mode,
};

export type V2 = { x: number; y: number };
export type AppState = typeof state;

function render() {
    show(ctx, state, view);
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

function changeSelected(item: Item) {
    state.selectedItem = item;
    state.position = 0;
}

function goDown() {
    const next = getItemBelow(state, state.selectedItem);
    console.log(next);

    if (next) changeSelected(next);
}
function goUp() {
    const next = getItemAbove(state.selectedItem);
    if (next) changeSelected(next);
}

window.addEventListener("keydown", (e) => {
    const { selectedItem, mode, position } = state;
    if (mode == "normal") {
        if (e.code == "KeyF") {
            state.position++;
            if (state.position > state.selectedItem.title.length) {
                goDown();
            }
        }
        if (e.code == "KeyB") {
            state.position = jumpWordBack(selectedItem.title, position);
        }
        if (e.code == "KeyW") {
            state.position = jumpWordForward(selectedItem.title, position);
        }
        if (e.code == "KeyK") {
            goUp();
        }
        if (e.code == "KeyJ") {
            goDown();
        }
        if (e.code == "KeyA") {
            state.position--;
            if (state.position < 0) {
                goUp();
                state.position = state.selectedItem.title.length;
            }
        }

        if (e.code == "KeyH") {
            if (selectedItem.isOpen) selectedItem.isOpen = false;
            else if (!isRoot(selectedItem.parent)) {
                changeSelected(selectedItem.parent);
            }
        }

        if (e.code == "KeyL") {
            if (selectedItem.children.length > 0) selectedItem.isOpen = true;
        }

        if (e.code == "KeyI") {
            state.mode = "insert";
        }
    } else {
        if (e.code == "Escape") state.mode = "normal";
        else {
            const { title } = selectedItem;
            selectedItem.title = insertStrAt(title, e.key, position);
            state.position++;
        }
    }
    render();
});

render();

function insertStrAt(str: string, ch: string, at: number) {
    return str.slice(0, at) + ch + str.slice(at);
}
