import { initialState, Mode, render, state } from "..";
import { handleKeyPress } from "../actions";
import { createRoot, Item, item } from "../tree/tree";
import { SLEEP, TEXT_SPEED } from "./tests";

export { expect } from "./expect";
export function init(items: string[]) {
    const children = items.map((v) => item(v));
    initWithItems(children);
}

export function initWithItems(items: Item[]) {
    const root = createRoot(items);
    Object.assign(state, initialState);

    state.changeHistory = [];
    state.views = [];

    state.isRunningTests = true;
    state.root = root;
    state.focused = root;
    state.selectedItem = state.root.children[0];

    render();
}

export function checkSelected(title: string) {
    if (state.selectedItem.title != title)
        console.trace(
            `Expected item '${title}' to be selected. But was '${state.selectedItem.title}'`
        );
}

export function checkMode(mode: Mode) {
    if (state.mode != mode)
        console.trace(`Expected mode '${mode}'. But was '${state.mode}'`);
}

export function checkRootItems(titles: string[]) {
    if (titles.length != state.root.children.length) {
        console.trace(
            `Expected root items to be ${titles.length}, but was ${state.root.children.length}`
        );
        return;
    }

    const errors: string[] = [];
    for (let i = 0; i < titles.length; i += 1) {
        if (state.root.children[i].title != titles[i])
            errors.push(
                `${state.root.children[i].title} <<<< should be '${titles[i]}'`
            );
    }

    if (errors.length > 0) console.trace(errors.join("\n"));
}

export async function pressKey(
    letter: string,
    options?: { delay?: number; shift?: boolean; alt?: boolean }
) {
    await sleep(options?.delay);
    const fullKeys = ["Escape"];
    const code = fullKeys.includes(letter) ? letter : "Key" + letter;
    handleKeyPress({
        code,
        key: letter,
        shiftKey: options?.shift,
        altKey: options?.alt,
    } as any);
    render();
}

async function sleep(time = SLEEP) {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export async function enterText(text: string) {
    for (const ch of text) await pressKey(ch, { delay: TEXT_SPEED });
}
export async function enterTextAndExit(text: string) {
    await enterText(text);
    await pressKey("Escape");
}

export const actions = {
    goLeft: async () => pressKey("H"),
    goDown: async () => pressKey("J"),
    goUp: async () => pressKey("K"),
    goRight: async () => pressKey("L"),

    moveUp: async (delay?: number) => pressKey("K", { alt: true, delay }),
    moveDown: async (delay?: number) => pressKey("J", { alt: true, delay }),
    moveRight: async (delay?: number) => pressKey("L", { alt: true, delay }),
    moveLeft: async (delay?: number) => pressKey("H", { alt: true, delay }),

    removeSelected: async () => pressKey("D"),

    undo: async () => pressKey("U"),
    redo: async () => pressKey("U", { shift: true }),

    moveCursorLeft: async () => pressKey("A"),
    moveCursorRight: async () => pressKey("F"),

    jumpWordForward: async () => pressKey("W"),
    jumpWordBack: async () => pressKey("B"),

    focusOnSelected: async () => pressKey("M"),
    focusOnParent: async () => pressKey("M", { shift: true }),
};
