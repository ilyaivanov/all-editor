import { initialState, render, state } from "./../index";
import { createRoot, Item, item } from "../tree/tree";
import { tests } from "./expect";

export { actions } from "./actions";
export { expect } from "./expect";

export const TEXT_SPEED = 20;
export const SLEEP = 20;
// export const SLEEP = 200;

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

import "./all-tests";

export function test(label: string, fn: () => void) {
    tests.push({ label, fn, isPrimary: false, isIgnored: false });
}
export function ftest(label: string, fn: () => void) {
    tests.push({ label, fn, isPrimary: true, isIgnored: false });
}
export function xtest(label: string, fn: () => void) {
    tests.push({ label, fn, isPrimary: false, isIgnored: true });
}

export async function runAllTests() {
    let isRunningOnlyPrimary = !!tests.find((t) => t.isPrimary);

    let ignored = 0;
    for (const test of tests) {
        try {
            const { fn, isPrimary, isIgnored } = test;
            if (isIgnored || (isRunningOnlyPrimary && !isPrimary)) {
                ignored++;
            } else {
                await fn();
            }
        } catch (e: any) {
            if (e instanceof Error)
                e.message = `'${test.label}' failed with ${e.message}`;
            throw e;
        }
    }

    if (ignored > 0) console.log(`Ignored ${ignored} tests`);
}
