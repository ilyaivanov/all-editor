import { render } from "..";
import { handleKeyPress } from "../actions";
import { SLEEP, TEXT_SPEED } from "./tests";

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

    createItemAfterSelected: async () => pressKey("O"),
    createItemBeforeSelected: async () => pressKey("O", { shift: true }),

    enterInsertMode: async () => pressKey("I"),
    replaceTitle: async () => pressKey("R"),

    moveCursorLeft: async () => pressKey("A"),
    moveCursorRight: async () => pressKey("F"),

    jumpWordForward: async () => pressKey("W"),
    jumpWordBack: async () => pressKey("B"),

    focusOnSelected: async () => pressKey("M"),
    focusOnParent: async () => pressKey("M", { shift: true }),

    deleteSelected: async () => pressKey("D"),

    enterText: async function enterText(text: string) {
        for (const ch of text) await pressKey(ch, { delay: TEXT_SPEED });
    },
    enterTextAndExit: async function enterTextAndExit(text: string) {
        await actions.enterText(text);
        await pressKey("Escape");
    },
};

async function pressKey(
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
