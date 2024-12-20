import { sample } from "./data.root";

export type Item = {
    parent: Item;
    title: string;
    children: Item[];
    isOpen: boolean;
};

export function item(title: string, children: Item[] = []): Item {
    const res: Item = {
        title,
        children,
        parent: undefined!,
        isOpen: children.length > 0,
    };
    res.parent = res;
    children.forEach((c) => (c.parent = res));
    return res;
}

export let data: Item = sample;

// export let data: Item = item("Root", [
//     item("Ambient", [
//         item("Carbon Based Lifeforms", [
//             item("album 1"),
//             item("album 2"),
//             item("album 3"),
//         ]),
//         item("Sync24", [
//             item("album 1"),
//             item("album 2"),
//             item("album 3"),
//             item("album 4"),
//         ]),
//         item("Koan", [
//             item("album 1"),
//             item("album 2"),
//             item("album 3"),
//             item("album 4"),
//             item("album 5"),
//             item("album 6"),
//         ]),
//     ]),
//     item("Electro", [item("Drum"), item("And"), item("Bass")]),
//     item("Piano", [item("David Nevue"), item("Isaac Shepard")]),
// ]);

export function isRoot(item: Item) {
    return item.parent == item;
}

export const getFollowingSibling = (item: Item): Item | undefined =>
    getRelativeSibling(item, (currentIndex) => currentIndex + 1);

export const getPreviousSibling = (item: Item): Item | undefined =>
    getRelativeSibling(item, (currentIndex) => currentIndex - 1);

export const getRelativeSibling = (
    item: Item,
    getNextItemIndex: (itemIndex: number) => number
): Item | undefined => {
    const context = item.parent?.children;
    if (context) {
        const index = context.indexOf(item);
        return context[getNextItemIndex(index)];
    }
};

export const isLast = (item: Item): boolean => !getFollowingSibling(item);

export const getLastNestedItem = (item: Item): Item => {
    if (item.isOpen && item.children) {
        const { children } = item;
        return getLastNestedItem(children[children.length - 1]);
    }
    return item;
};

export function removeItem(item: Item) {
    if (item.parent) {
        const context = item.parent.children;
        context.splice(context.indexOf(item), 1);
        if (item.parent.children.length == 0) item.parent.isOpen = false;
    }
}

export function addItemAt(parent: Item, child: Item, index: number) {
    parent.children.splice(index, 0, child);
    child.parent = parent;

    //TODO: should tree open the item? Or is it a UI thing/
    parent.isOpen = true;
}

export function findItem(root: Item, predicate: (item: Item) => boolean) {
    const stack = [...root.children];
    while (stack.length > 0) {
        const item = stack.pop()!;

        if (predicate(item)) return item;

        if (item.children.length > 0) stack.push(...item.children);
    }
}

export function isSameOrParentOf(parent: Item, child: Item) {
    let runningParent = child;
    while (!isRoot(runningParent)) {
        if (runningParent == parent) return true;

        runningParent = runningParent.parent;
    }

    if (runningParent == parent) return true;

    return false;
}

export function getPathToParent(item: Item) {
    const res = [];
    while (!isRoot(item)) {
        res.push(item);
        item = item.parent;
    }
    return res;
}
