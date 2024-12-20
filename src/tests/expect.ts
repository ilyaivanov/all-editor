import { state } from "..";
import { findItem, Item } from "../tree/tree";

export const expect = {
    isTrue: function isTrue(val: boolean, msg?: string) {
        if (!val) console.trace(msg);
    },

    item: function expectItem(
        title: string,
        predicate: (item: Item) => boolean,
        msg: string | ((item: Item) => string)
    ) {
        const item = findItem(state.root, (i) => i.title == title);
        if (!item) throw new Error(`Can't find ${title}`);

        if (!predicate(item)) {
            const m = typeof msg == "string" ? msg : msg(item);
            throw new Error(m);
        }
    },

    noHistory: function expectNoHistory() {
        if (state.changeHistory.length != 0)
            console.trace(
                `Expected no history, but it had ${state.changeHistory.length} entrues`
            );
    },
    selectedItem: function expectSelectedItem(title: string) {
        if (state.selectedItem.title != title)
            console.trace(
                `Expect selected item ${title}, but was ${state.selectedItem.title}`
            );
    },
    cursorPosition: function expectCursorPosition(pos: number) {
        if (state.position != pos)
            console.trace(
                `Expect cursor position at ${pos}, but was ${state.position}`
            );
    },
    arrayEqual: function arrayEqual<T>(a: T[], b: T[]) {
        let res = "";
        if (a.length !== b.length) {
            res = `Array lengths differ: expected ${b.length}, received ${a.length}`;
        } else {
            for (let i = 0; i < a.length; i++) {
                if (a[i] != b[i]) {
                    res += `${i}. ${a[i]} expected ${b[i]}\n`;
                }
            }
        }

        if (res.length > 0) console.trace(res);
    },

    viewsCount: function expectViewsCount(count: number) {
        if (state.views.length != count)
            console.trace(
                `Expect number of views to be ${count}, but was ${state.views.length}`
            );
    },

    children: function expectChildren(title: string, children: string[]) {
        const item = findItem(state.root, (i) => i.title == title);
        if (!item) {
            console.trace(`Can't find '${title}'`);
        } else {
            expect.arrayEqual(
                item.children.map((i) => i.title),
                children
            );
        }
    },
};
