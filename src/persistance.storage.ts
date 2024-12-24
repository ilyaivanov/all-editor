import { AppState } from "./index";
import { Item } from "./tree/tree";

const localStorageKey = "all-editor:items";
export function loadItemsFromLocalStorage(): Item | undefined {
    const saved = localStorage.getItem(localStorageKey);
    if (saved) {
        const root: Item = JSON.parse(saved);
        root.parent = root;

        const stack = [root];
        while (stack.length > 0) {
            const parent = stack.pop()!;
            for (const child of parent.children) {
                child.parent = parent;
                stack.push(child);
            }
        }

        return root;
    } else return undefined;
}

function replacer(key: keyof Item, value: unknown) {
    if (key == "parent") return undefined;
    if (key == "nextPageForItem") return undefined;
    else return value;
}

export function saveItemsToLocalStorage(state: AppState) {
    if (state.isRunningTests) return;

    console.log("Saving to local storage");

    const serialized = JSON.stringify(state.root, (key, value) =>
        replacer(key as keyof Item, value)
    );

    localStorage.setItem(localStorageKey, serialized);
}

export type UserSettings = {
    itemTitleFocused: string;
    itemTitleSelected: string;
    offset: number;
};
const localStorageSettingsKey = "all-editor:settings";
export function saveUserSettings(settings: UserSettings) {
    localStorage.setItem(localStorageSettingsKey, JSON.stringify(settings));
}

export function loadUserSettings(): UserSettings | undefined {
    const res = localStorage.getItem(localStorageSettingsKey);
    if (res) return JSON.parse(res);
    else return undefined;
}
