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

export let data: Item = item("Root", [
    item("One", [
        item("One 1", [item("One 1.1"), item("One 1.2"), item("One 1.3")]),
        item("One 2"),
        item("One 3"),
    ]),
    item("Two"),
    item("Three"),
    item("Four"),
]);

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
