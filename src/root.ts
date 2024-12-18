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
