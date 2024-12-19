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

// export let data: Item =  item(
//     "Root",
//     Array.from(new Array(10)).map((_, i) => item("Item " + (i + 1)))
// );

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
