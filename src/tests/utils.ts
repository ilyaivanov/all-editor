import { Mode, render, state } from "..";
import { changeSelected, handleKeyPress } from "../actions";
import { item } from "../tree/tree";
import { SLEEP, TEXT_SPEED } from "./tests";

export function init(items: string[]) {
    const children = items.map((v) => item(v));
    state.root = item("root", children);
    state.changeHistory = [];
    state.currentChange = -1;
    state.isItemAddedBeforeInsertMode = false;
    state.position = 0;
    state.selectedItemTitleBeforeInsertMode = "";

    changeSelected(state.root.children[0]);
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
    if (titles.length != state.root.children.length)
        console.trace(
            `Expected root items to be ${titles.length}, but was ${state.root.children.length}`
        );

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
    options?: { delay?: number; shift?: boolean }
) {
    await sleep(options?.delay);
    const fullKeys = ["Escape"];
    const code = fullKeys.includes(letter) ? letter : "Key" + letter;
    handleKeyPress({ code, key: letter, shiftKey: options?.shift } as any);
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
